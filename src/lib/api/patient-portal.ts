import { apiClient } from "./client";

interface LaravelEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === "object") {
    const outer = res as Record<string, unknown>;
    if (Array.isArray(outer.data)) return outer.data as T[];
    if (outer.data && typeof outer.data === "object") {
      const inner = outer.data as Record<string, unknown>;
      if (Array.isArray(inner.data)) return inner.data as T[];
    }
  }
  return [];
}

function unwrapObject<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in (res as Record<string, unknown>)) {
    return (res as { data: unknown }).data as T;
  }
  return res as T;
}

/**
 * اولین مقدار معتبر (رشته یا عدد) را به صورت string برمی‌گرداند.
 * علت وجودش: بک‌اند برای شناسه‌ی بیمار همیشه کلید `id` را نمی‌فرستد و
 * بسته به endpoint ممکن است `patient_id` یا `uuid` باشد؛ همچنین اگر id
 * عددی باشد `as string` قبلی باعث می‌شد مقدار غیررشته‌ای به query برود.
 */
function pickId(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim() !== "") return c;
    if (typeof c === "number" && Number.isFinite(c)) return String(c);
  }
  return null;
}

// --- خلاصه داشبورد بیمار — فرمت واقعی تأیید شده ---
export interface PatientVisitService {
  description: string | null;
  serviceName: string;
}

export interface PatientVisit {
  id: string;
  visitDate: string;
  status: string;
  clinicalSummary: string | null;
  patientRecommendation: string | null;
  services: PatientVisitService[];
}

export interface PatientDashboardSummary {
  id: string | null;
  fullName: string | null;
  completedVisitsCount: number;
  pastAppointmentsCount: number;
  visibleImagesCount: number;
  signedConsentsCount: number;
  nextAppointment: PatientAppointment | null;
  recentVisits: PatientVisit[];
}

function mapPatientVisit(v: Record<string, unknown>): PatientVisit {
  const servicesRaw = (v.services as Record<string, unknown>[]) ?? [];
  return {
    id: String(v.id ?? ""),
    visitDate: String(v.visit_date ?? ""),
    status: String(v.status ?? ""),
    clinicalSummary: (v.clinical_summary as string | null | undefined) ?? null,
    patientRecommendation: (v.patient_recommendation as string | null | undefined) ?? null,
    services: servicesRaw.map((vs) => {
      const service = vs.service as Record<string, unknown> | undefined;
      return {
        description: (vs.description as string | null | undefined) ?? null,
        serviceName: (service?.name as string | undefined) ?? "-",
      };
    }),
  };
}

export async function getPatientDashboardSummary(clinicSlug: string): Promise<PatientDashboardSummary> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    "/patient-portal/dashboard",
    { clinicSlug }
  );
  const data = unwrapObject<Record<string, unknown>>(res);
  const patient = (data.patient as Record<string, unknown>) ?? {};

  const nextAppointmentRaw = data.next_appointment as Record<string, unknown> | null;
  const recentVisitsRaw = (data.recent_visits as Record<string, unknown>[]) ?? [];

  // شناسه‌ی بیمار ممکن است زیر کلیدهای مختلفی بیاید یا اصلاً در پاسخ داشبورد
  // نباشد (PatientResource آن را expose نکند). آخرین fallback، شناسه‌ی روی
  // خود نوبت بعدی است که همیشه patient_id دارد.
  const patientId = pickId(
    patient.id,
    patient.patient_id,
    patient.uuid,
    data.patient_id,
    nextAppointmentRaw?.patient_id
  );

  return {
    id: patientId,
    fullName: (patient.full_name as string | undefined) ?? null,
    completedVisitsCount: Number(data.completed_visits_count ?? 0),
    pastAppointmentsCount: Number(data.past_appointments_count ?? 0),
    visibleImagesCount: Number(data.visible_images_count ?? 0),
    signedConsentsCount: Number(data.signed_consents_count ?? 0),
    nextAppointment: nextAppointmentRaw ? mapPatientAppointment(nextAppointmentRaw) : null,
    recentVisits: recentVisitsRaw.map(mapPatientVisit),
  };
}

// --- نوبت‌های بیمار — فرمت واقعی تأیید شده (paginator داخل envelope) ---
export interface PatientAppointment {
  id: string;
  /** شناسه‌ی پرونده‌ی بیمار — برای endpointهایی مثل /invoices?patient_id= لازم است */
  patientId: string | null;
  serviceId: string;
  startTime: string;
  endTime: string;
  serviceName: string;
  doctorName: string;
  status: string;
  appointmentType: string;
  notes: string | null;
  cancellationReason: string | null;
}

function mapPatientAppointment(a: Record<string, unknown>): PatientAppointment {
  const service = a.service as Record<string, unknown> | undefined;
  const doctor = a.doctor as Record<string, unknown> | undefined;
  const patient = a.patient as Record<string, unknown> | undefined;
  return {
    id: String(a.id ?? ""),
    patientId: pickId(a.patient_id, patient?.id),
    serviceId: String(service?.id ?? a.service_id ?? ""),
    startTime: String(a.start_time ?? ""),
    endTime: String(a.end_time ?? ""),
    serviceName: (service?.name as string | undefined) ?? "-",
    doctorName: (doctor?.full_name as string | undefined) ?? "-",
    status: String(a.status ?? ""),
    appointmentType: String(a.appointment_type ?? "in_person"),
    notes: (a.notes as string | null | undefined) ?? null,
    cancellationReason: (a.cancellation_reason as string | null | undefined) ?? null,
  };
}

export async function getPatientAppointments(clinicSlug: string): Promise<PatientAppointment[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    "/patient-portal/appointments",
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapPatientAppointment);
}

export interface RequestAppointmentPayload {
  serviceId: string;
  startTime: string; // ISO, e.g. new Date(...).toISOString()
  notes?: string;
}

export async function requestPatientAppointment(
  clinicSlug: string,
  payload: RequestAppointmentPayload
): Promise<PatientAppointment> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>>>("/patient-portal/appointments", {
    clinicSlug,
    method: "POST",
    body: JSON.stringify({
      service_id: payload.serviceId,
      start_time: payload.startTime,
      notes: payload.notes ?? "",
    }),
  });
  // پاسخ POST فلت است (بدون nested service/doctor)، پس مپینگ کامل نمی‌کنیم
  const data = unwrapObject<Record<string, unknown>>(res);
  return {
    id: String(data.id ?? ""),
    patientId: pickId(data.patient_id),
    serviceId: String(data.service_id ?? payload.serviceId ?? ""),
    startTime: String(data.start_time ?? ""),
    endTime: String(data.end_time ?? ""),
    serviceName: "-",
    doctorName: "-",
    status: String(data.status ?? "pending"),
    appointmentType: "in_person",
    notes: (data.notes as string | null | undefined) ?? null,
    cancellationReason: null,
  };
}

// --- تصاویر قبل/بعد مجاز برای نمایش به بیمار — هر رکورد یک تصویر است (before یا after) ---
export interface PatientGalleryImage {
  id: string;
  patientId: string | null;
  imageType: "before" | "after" | string;
  bodyArea: string | null;
  createdAt: string | null;
  visitServiceId: string | null;
  // توجه: بک‌اند فقط storage_key می‌دهد نه یک URL قابل نمایش مستقیم؛
  // تا معلوم شدن endpoint سرو فایل، این فیلد را نمی‌توان مستقیم در <img> استفاده کرد
  fileStorageKey: string | null;
}

export async function getPatientImages(clinicSlug: string): Promise<PatientGalleryImage[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    "/patient-portal/images",
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map((img) => {
    const file = img.file as Record<string, unknown> | undefined;
    return {
      id: String(img.id ?? ""),
      patientId: pickId(img.patient_id),
      imageType: (img.image_type as string | undefined) ?? "before",
      bodyArea: (img.body_area as string | undefined) ?? null,
      createdAt: (img.created_at as string | null) ?? null,
      visitServiceId: (img.visit_service_id as string | null | undefined) ?? null,
      fileStorageKey: (file?.storage_key as string | undefined) ?? null,
    };
  });
}

/** تصاویر before/after مربوط به یک visit_service را کنار هم جفت می‌کند برای نمایش در گالری */
export function groupImagesByVisitService(images: PatientGalleryImage[]) {
  const groups = new Map<string, { before?: PatientGalleryImage; after?: PatientGalleryImage }>();
  for (const img of images) {
    const key = img.visitServiceId ?? img.id;
    const entry = groups.get(key) ?? {};
    if (img.imageType === "before") entry.before = img;
    else if (img.imageType === "after") entry.after = img;
    groups.set(key, entry);
  }
  return Array.from(groups.entries()).map(([key, pair]) => ({ key, ...pair }));
}

// --- رضایت‌نامه‌های امضاشده — فرمت واقعی تأیید شده ---
export interface PatientConsentItem {
  id: string;
  patientId: string | null;
  title: string;
  content: string | null;
  signedAt: string | null;
  accepted: boolean;
}

export async function getPatientConsents(clinicSlug: string): Promise<PatientConsentItem[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    "/patient-portal/consents",
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map((c) => {
    const version = c.version as Record<string, unknown> | undefined;
    const template = version?.template as Record<string, unknown> | undefined;
    return {
      id: String(c.id ?? ""),
      patientId: pickId(c.patient_id),
      title: (template?.title as string | undefined) ?? "رضایت‌نامه",
      content: (version?.content as string | undefined) ?? null,
      signedAt: (c.signed_at as string | null) ?? null,
      accepted: Boolean(c.accepted),
    };
  });
}

// --- کلینیک‌هایی که بیمار در آن‌ها پرونده دارد — فرمت واقعی تأیید شده ---
export interface PatientClinicMembership {
  slug: string;
  name: string;
  logoUrl: string | null;
  brandColor: string | null;
  status: string;
}

export async function getPatientClinics(): Promise<PatientClinicMembership[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    "/patient-portal/clinics"
  );
  return unwrapList<Record<string, unknown>>(res).map((m) => {
    const clinic = m.clinic as Record<string, unknown> | undefined;
    return {
      slug: (clinic?.slug as string | undefined) ?? "",
      name: (clinic?.name as string | undefined) ?? "-",
      logoUrl: (clinic?.logo_url as string | null | undefined) ?? null,
      brandColor: (clinic?.brand_color as string | null | undefined) ?? null,
      status: (m.status as string | undefined) ?? "active",
    };
  });
}

// --- گفتگوهای بیمار با کلینیک ---
// توجه: در تست واقعی، آرایه خالی برگشت (بیمار هنوز پیامی نداشته)، پس شکل دقیق یک
// گفتگوی غیرخالی هنوز تأیید نشده؛ این مپینگ محافظه‌کارانه با fallback نوشته شده.
export interface PatientConversation {
  id: string;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export async function getPatientConversations(clinicSlug: string): Promise<PatientConversation[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    "/patient-portal/conversations",
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map((c) => ({
    id: String(c.id ?? ""),
    lastMessageBody: (c.last_message_body as string | undefined) ?? (c.body as string | undefined) ?? null,
    lastMessageAt: (c.last_message_at as string | null | undefined) ?? (c.created_at as string | null | undefined) ?? null,
    unreadCount: Number(c.unread_count ?? 0),
  }));
}

// --- ارسال پیام — فرمت واقعی تأیید شده: فقط body لازم است، گفتگو خودکار ساخته می‌شود ---
export interface SentPatientMessage {
  id: string;
  conversationId: string;
  body: string;
  status: string;
}

// --- فاکتورهای بیمار — فقط فاکتورهای صادرشده برمی‌گردند؛ پیش‌نویس و ابطال‌شده هرگز
// نمایش داده نمی‌شوند (سمت بک‌اند فیلتر شده‌اند). در payments فقط پرداخت موفق/برگشتی می‌آید. ---
export type PatientInvoiceStatus = "issued" | "partially_paid" | "paid" | "refunded";
export type PatientPaymentMethod = "cash" | "pos" | "online" | "credit";
export type PatientPaymentStatus = "successful" | "refunded";

export interface PatientInvoiceListItem {
  id: string;
  invoiceNumber: string | null;
  status: PatientInvoiceStatus;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  createdAt: string | null;
}

function mapPatientInvoiceListItem(inv: Record<string, unknown>): PatientInvoiceListItem {
  return {
    id: String(inv.id ?? ""),
    invoiceNumber: (inv.invoice_number as string | null | undefined) ?? null,
    status: (inv.status as PatientInvoiceStatus) ?? "issued",
    totalAmount: Number(inv.total_amount ?? 0),
    paidAmount: Number(inv.paid_amount ?? 0),
    remainingAmount: Number(inv.remaining_amount ?? 0),
    createdAt: (inv.created_at as string | null | undefined) ?? null,
  };
}

export async function getPatientInvoices(clinicSlug: string): Promise<PatientInvoiceListItem[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    "/patient-portal/invoices",
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapPatientInvoiceListItem);
}

export interface PatientInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
}

function mapPatientInvoiceItem(i: Record<string, unknown>): PatientInvoiceItem {
  return {
    id: String(i.id ?? ""),
    description: (i.description as string | undefined) ?? "",
    quantity: Number(i.quantity ?? 1),
    unitPrice: Number(i.unit_price ?? 0),
    discountAmount: Number(i.discount_amount ?? 0),
    taxAmount: Number(i.tax_amount ?? 0),
    totalAmount: Number(i.total_amount ?? 0),
  };
}

export interface PatientInvoicePayment {
  id: string;
  amount: number;
  method: PatientPaymentMethod;
  status: PatientPaymentStatus;
  paidAt: string | null;
}

function mapPatientInvoicePayment(p: Record<string, unknown>): PatientInvoicePayment {
  return {
    id: String(p.id ?? ""),
    amount: Number(p.amount ?? 0),
    method: (p.method as PatientPaymentMethod) ?? "cash",
    status: (p.status as PatientPaymentStatus) ?? "successful",
    paidAt: (p.paid_at as string | null | undefined) ?? null,
  };
}

export interface PatientInvoiceDetail extends PatientInvoiceListItem {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  items: PatientInvoiceItem[];
  payments: PatientInvoicePayment[];
}

function mapPatientInvoiceDetail(inv: Record<string, unknown>): PatientInvoiceDetail {
  const itemsRaw = (inv.items as Record<string, unknown>[]) ?? [];
  const paymentsRaw = (inv.payments as Record<string, unknown>[]) ?? [];
  return {
    ...mapPatientInvoiceListItem(inv),
    subtotal: Number(inv.subtotal ?? 0),
    discountTotal: Number(inv.discount_total ?? 0),
    taxTotal: Number(inv.tax_total ?? 0),
    items: itemsRaw.map(mapPatientInvoiceItem),
    payments: paymentsRaw.map(mapPatientInvoicePayment),
  };
}

export async function getPatientInvoiceDetail(
  clinicSlug: string,
  invoiceId: string
): Promise<PatientInvoiceDetail> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/patient-portal/invoices/${invoiceId}`,
    { clinicSlug }
  );
  return mapPatientInvoiceDetail(unwrapObject<Record<string, unknown>>(res));
}

export async function sendPatientMessage(clinicSlug: string, body: string): Promise<SentPatientMessage> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>>>("/patient-portal/conversations/messages", {
    clinicSlug,
    method: "POST",
    body: JSON.stringify({ body }),
  });
  const data = unwrapObject<Record<string, unknown>>(res);
  return {
    id: String(data.id ?? ""),
    conversationId: String(data.conversation_id ?? ""),
    body: String(data.body ?? ""),
    status: String(data.status ?? "sent"),
  };
}