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

export type VisitStatus = "draft" | "in_progress" | "completed" | "locked" | "cancelled";

export interface ClinicVisitService {
  id: string;
  serviceId: string;
  serviceOptionId: string | null;
  doctorUserId: number;
  description: string | null;
  resultNote: string | null;
  serviceName: string | null;
}

export interface ClinicVisit {
  id: string;
  patientId: string;
  doctorUserId: number;
  doctorName: string | null;
  visitDate: string;
  status: VisitStatus;
  clinicalSummary: string | null;
  internalNote: string | null;
  patientRecommendation: string | null;
  nextVisitRecommendedAt: string | null;
  lockedAt: string | null;
  services: ClinicVisitService[];
}

function mapVisitService(vs: Record<string, unknown>): ClinicVisitService {
  const service = vs.service as Record<string, unknown> | undefined;
  return {
    id: String(vs.id ?? ""),
    serviceId: String(vs.service_id ?? ""),
    serviceOptionId: (vs.service_option_id as string | null) ?? null,
    doctorUserId: Number(vs.doctor_user_id ?? 0),
    description: (vs.description as string | null) ?? null,
    resultNote: (vs.result_note as string | null) ?? null,
    serviceName: (service?.name as string | undefined) ?? null,
  };
}

function mapVisit(v: Record<string, unknown>): ClinicVisit {
  const doctor = (v.doctor ?? v.doctor_user) as Record<string, unknown> | undefined;
  const servicesRaw = (v.services as Record<string, unknown>[]) ?? [];
  return {
    id: String(v.id ?? ""),
    patientId: String(v.patient_id ?? ""),
    doctorUserId: Number(v.doctor_user_id ?? 0),
    doctorName: (doctor?.full_name as string | undefined) ?? null,
    visitDate: String(v.visit_date ?? ""),
    status: (v.status as VisitStatus) ?? "draft",
    clinicalSummary: (v.clinical_summary as string | null) ?? null,
    internalNote: (v.internal_note as string | null) ?? null,
    patientRecommendation: (v.patient_recommendation as string | null) ?? null,
    nextVisitRecommendedAt: (v.next_visit_recommended_at as string | null) ?? null,
    lockedAt: (v.locked_at as string | null) ?? null,
    services: servicesRaw.map(mapVisitService),
  };
}

// --- لیست جلسات درمان یک بیمار ---
export async function getPatientVisits(clinicSlug: string, patientId: string): Promise<ClinicVisit[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/patients/${patientId}/visits`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapVisit);
}

// --- جزئیات یک جلسه ---
export async function getVisitDetail(clinicSlug: string, visitId: string): Promise<ClinicVisit> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/visits/${visitId}`,
    { clinicSlug }
  );
  return mapVisit(unwrapObject<Record<string, unknown>>(res));
}

export interface CreateVisitPayload {
  patient_id: string;
  doctor_user_id: number;
  visit_date: string;
  clinical_summary?: string;
  internal_note?: string;
  patient_recommendation?: string;
}

// --- ایجاد جلسه درمان جدید ---
export async function createVisit(clinicSlug: string, payload: CreateVisitPayload): Promise<ClinicVisit> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>("/visits", {
    method: "POST",
    body: JSON.stringify(payload),
    clinicSlug,
  });
  return mapVisit(unwrapObject<Record<string, unknown>>(res));
}

// --- ویرایش جلسه (فقط پیش از قفل‌شدن) ---
export async function updateVisit(
  clinicSlug: string,
  visitId: string,
  payload: Partial<CreateVisitPayload>
): Promise<ClinicVisit> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/visits/${visitId}`,
    { method: "PATCH", body: JSON.stringify(payload), clinicSlug }
  );
  return mapVisit(unwrapObject<Record<string, unknown>>(res));
}

// --- نهایی‌کردن جلسه ---
export async function completeVisit(clinicSlug: string, visitId: string) {
  return apiClient(`/visits/${visitId}/complete`, { method: "POST", clinicSlug });
}

// --- قفل‌کردن جلسه (غیرقابل‌برگشت) ---
export async function lockVisit(clinicSlug: string, visitId: string): Promise<ClinicVisit> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/visits/${visitId}/lock`,
    { method: "POST", clinicSlug }
  );
  return mapVisit(unwrapObject<Record<string, unknown>>(res));
}

// --- ثبت توصیه قابل‌نمایش برای بیمار ---
export async function addVisitRecommendation(clinicSlug: string, visitId: string, recommendation: string) {
  return apiClient(`/visits/${visitId}/recommendations`, {
    method: "POST",
    body: JSON.stringify({ recommendation }),
    clinicSlug,
  });
}

// --- ثبت نوبت پیگیری پیشنهادی ---
export async function setVisitFollowUp(clinicSlug: string, visitId: string, nextVisitRecommendedAt: string) {
  return apiClient(`/visits/${visitId}/follow-up`, {
    method: "POST",
    body: JSON.stringify({ next_visit_recommended_at: nextVisitRecommendedAt }),
    clinicSlug,
  });
}

// --- بررسی رضایت‌نامه‌های لازم برای جلسه ---
// نکته: ساختار دقیق پاسخ در اسپک مشخص نشده؛ خام برگردانده می‌شود تا فراخوان خودش تفسیر کند.
export async function checkVisitConsents(clinicSlug: string, visitId: string): Promise<Record<string, unknown>> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/visits/${visitId}/consents/check`,
    { clinicSlug }
  );
  return unwrapObject<Record<string, unknown>>(res);
}

export interface AddVisitServicePayload {
  service_id: string;
  service_option_id?: string;
  doctor_user_id: number;
  description?: string;
  result_note?: string;
}

// --- افزودن خدمت به جلسه ---
export async function addServiceToVisit(
  clinicSlug: string,
  visitId: string,
  payload: AddVisitServicePayload
): Promise<ClinicVisitService> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/visits/${visitId}/services`,
    { method: "POST", body: JSON.stringify(payload), clinicSlug }
  );
  return mapVisitService(unwrapObject<Record<string, unknown>>(res));
}

export interface VisitServiceBodyPoint {
  id: string;
  visitServiceId: string;
  bodyRegion: string | null;
  coordinates: Record<string, unknown> | null;
  shotType: string | null;
  note: string | null;
}

function mapBodyPoint(p: Record<string, unknown>): VisitServiceBodyPoint {
  return {
    id: String(p.id ?? ""),
    visitServiceId: String(p.visit_service_id ?? ""),
    bodyRegion: (p.body_region as string | null) ?? null,
    coordinates: (p.coordinates as Record<string, unknown> | null) ?? null,
    shotType: (p.shot_type as string | null) ?? null,
    note: (p.note as string | null) ?? null,
  };
}

// --- لیست نقاط ثبت‌شده روی مدل بدن برای یک خدمتِ جلسه ---
export async function getVisitServiceBodyPoints(
  clinicSlug: string,
  visitServiceId: string
): Promise<VisitServiceBodyPoint[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/visit-services/${visitServiceId}/body-points`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapBodyPoint);
}

export interface CreateBodyPointPayload {
  body_region?: string;
  coordinates?: Record<string, unknown>;
  shot_type?: string;
  note?: string;
}

// --- ثبت یک نقطه‌ی درمان روی مدل سه‌بعدی بدن ---
export async function addVisitServiceBodyPoint(
  clinicSlug: string,
  visitServiceId: string,
  payload: CreateBodyPointPayload
): Promise<VisitServiceBodyPoint> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/visit-services/${visitServiceId}/body-points`,
    { method: "POST", body: JSON.stringify(payload), clinicSlug }
  );
  return mapBodyPoint(unwrapObject<Record<string, unknown>>(res));
}
