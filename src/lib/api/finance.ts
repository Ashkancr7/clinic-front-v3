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

export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "cancelled" | "refunded";
export type PaymentMethod = "cash" | "pos" | "online" | "credit";
export type PaymentStatus = "pending" | "successful" | "failed" | "refunded";

export interface InvoiceItem {
  id: string;
  serviceId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
}

function mapInvoiceItem(i: Record<string, unknown>): InvoiceItem {
  return {
    id: String(i.id ?? ""),
    serviceId: (i.service_id as string | null) ?? null,
    description: (i.description as string | undefined) ?? "",
    quantity: Number(i.quantity ?? 1),
    unitPrice: Number(i.unit_price ?? 0),
    discountAmount: Number(i.discount_amount ?? 0),
    taxAmount: Number(i.tax_amount ?? 0),
    totalAmount: Number(i.total_amount ?? 0),
  };
}

export interface InvoicePayment {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string | null;
  notes: string | null;
}

function mapInvoicePayment(p: Record<string, unknown>): InvoicePayment {
  return {
    id: String(p.id ?? ""),
    amount: Number(p.amount ?? 0),
    method: (p.method as PaymentMethod) ?? "cash",
    status: (p.status as PaymentStatus) ?? "pending",
    paidAt: (p.paid_at as string | null) ?? null,
    notes: (p.notes as string | null) ?? null,
  };
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string | null;
  patientPhone: string | null;
  invoiceNumber: string | null;
  status: InvoiceStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  items: InvoiceItem[];
  payments: InvoicePayment[];
}

function mapInvoice(inv: Record<string, unknown>): Invoice {
  const patient = inv.patient as Record<string, unknown> | undefined;
  const itemsRaw = (inv.items as Record<string, unknown>[]) ?? [];
  const paymentsRaw = (inv.payments as Record<string, unknown>[]) ?? [];
  return {
    id: String(inv.id ?? ""),
    patientId: String(inv.patient_id ?? ""),
    patientName: patient
      ? `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || null
      : null,
    patientPhone: (patient?.phone as string | undefined) ?? null,
    invoiceNumber: (inv.invoice_number as string | null) ?? null,
    status: (inv.status as InvoiceStatus) ?? "draft",
    subtotal: Number(inv.subtotal ?? 0),
    discountTotal: Number(inv.discount_total ?? 0),
    taxTotal: Number(inv.tax_total ?? 0),
    totalAmount: Number(inv.total_amount ?? 0),
    paidAmount: Number(inv.paid_amount ?? 0),
    remainingAmount: Number(inv.remaining_amount ?? 0),
    items: itemsRaw.map(mapInvoiceItem),
    payments: paymentsRaw.map(mapInvoicePayment),
  };
}

export interface GetInvoicesParams {
  status?: string;
  patientId?: string;
}

// --- لیست فاکتورها ---
export async function getInvoices(clinicSlug: string, params: GetInvoicesParams = {}): Promise<Invoice[]> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.patientId) qs.set("patient_id", params.patientId);
  const query = qs.toString();

  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/invoices${query ? `?${query}` : ""}`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapInvoice);
}

// --- جزئیات فاکتور ---
export async function getInvoiceDetail(clinicSlug: string, invoiceId: string): Promise<Invoice> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/invoices/${invoiceId}`,
    { clinicSlug }
  );
  return mapInvoice(unwrapObject<Record<string, unknown>>(res));
}

export interface CreateInvoiceItemPayload {
  service_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  tax_amount?: number;
}

export interface CreateInvoicePayload {
  patient_id: string;
  items: CreateInvoiceItemPayload[];
}

// --- ایجاد فاکتور جدید (پیش‌نویس) ---
export async function createInvoice(clinicSlug: string, payload: CreateInvoicePayload): Promise<Invoice> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>("/invoices", {
    method: "POST",
    body: JSON.stringify(payload),
    clinicSlug,
  });
  return mapInvoice(unwrapObject<Record<string, unknown>>(res));
}

// --- ویرایش فاکتور (فقط پیش از صدور) ---
export async function updateInvoice(
  clinicSlug: string,
  invoiceId: string,
  payload: Partial<CreateInvoicePayload>
): Promise<Invoice> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/invoices/${invoiceId}`,
    { method: "PATCH", body: JSON.stringify(payload), clinicSlug }
  );
  return mapInvoice(unwrapObject<Record<string, unknown>>(res));
}

// --- صدور فاکتور (تخصیص شماره فاکتور) ---
export async function issueInvoice(clinicSlug: string, invoiceId: string): Promise<Invoice> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/invoices/${invoiceId}/issue`,
    { method: "POST", clinicSlug }
  );
  return mapInvoice(unwrapObject<Record<string, unknown>>(res));
}

// --- ابطال فاکتور ---
export async function cancelInvoice(clinicSlug: string, invoiceId: string, reason?: string) {
  return apiClient(`/invoices/${invoiceId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
    clinicSlug,
  });
}

// --- ارسال پیامک فاکتور به بیمار ---
export async function sendInvoiceSms(clinicSlug: string, invoiceId: string) {
  return apiClient(`/invoices/${invoiceId}/send-sms`, { method: "POST", clinicSlug });
}

export interface CreatePaymentPayload {
  amount: number;
  method: PaymentMethod;
  notes?: string;
}

// --- ثبت پرداخت برای یک فاکتور ---
export async function createPayment(
  clinicSlug: string,
  invoiceId: string,
  payload: CreatePaymentPayload
): Promise<InvoicePayment> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/invoices/${invoiceId}/payments`,
    { method: "POST", body: JSON.stringify(payload), clinicSlug }
  );
  return mapInvoicePayment(unwrapObject<Record<string, unknown>>(res));
}

export interface PaymentListItem {
  id: string;
  invoiceId: string;
  invoiceNumber: string | null;
  patientId: string;
  patientName: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string | null;
  notes: string | null;
}

function mapPaymentListItem(p: Record<string, unknown>): PaymentListItem {
  const patient = p.patient as Record<string, unknown> | undefined;
  const invoice = p.invoice as Record<string, unknown> | undefined;
  return {
    id: String(p.id ?? ""),
    invoiceId: String(p.invoice_id ?? ""),
    invoiceNumber: (invoice?.invoice_number as string | null) ?? null,
    patientId: String(p.patient_id ?? ""),
    patientName: patient
      ? `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || null
      : null,
    amount: Number(p.amount ?? 0),
    method: (p.method as PaymentMethod) ?? "cash",
    status: (p.status as PaymentStatus) ?? "pending",
    paidAt: (p.paid_at as string | null) ?? null,
    notes: (p.notes as string | null) ?? null,
  };
}

// --- لیست پرداخت‌ها ---
export async function getPayments(clinicSlug: string, status?: string): Promise<PaymentListItem[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/payments${query}`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapPaymentListItem);
}

// --- ثبت بازپرداخت (رکورد جدا؛ رکورد اصلی تغییر نمی‌کند) ---
export async function refundPayment(
  clinicSlug: string,
  paymentId: string,
  reason?: string
): Promise<InvoicePayment> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/payments/${paymentId}/refund`,
    { method: "POST", body: JSON.stringify({ reason }), clinicSlug }
  );
  return mapInvoicePayment(unwrapObject<Record<string, unknown>>(res));
}
