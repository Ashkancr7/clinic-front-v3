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

export type ConsentTemplateStatus = "draft" | "active" | "inactive";
export type ConsentVersionStatus = "draft" | "active" | "archived";

export interface ConsentVersion {
  id: string;
  templateId: string;
  versionNumber: number;
  content: string;
  status: ConsentVersionStatus;
}

function mapConsentVersion(v: Record<string, unknown>): ConsentVersion {
  return {
    id: String(v.id ?? ""),
    templateId: String(v.consent_template_id ?? ""),
    versionNumber: Number(v.version_number ?? 0),
    content: (v.content as string | undefined) ?? "",
    status: (v.status as ConsentVersionStatus) ?? "draft",
  };
}

export interface ConsentTemplate {
  id: string;
  title: string;
  serviceId: string | null;
  serviceName: string | null;
  status: ConsentTemplateStatus;
  versions: ConsentVersion[];
}

function mapConsentTemplate(t: Record<string, unknown>): ConsentTemplate {
  const service = t.service as Record<string, unknown> | undefined;
  const versionsRaw = (t.versions as Record<string, unknown>[]) ?? [];
  return {
    id: String(t.id ?? ""),
    title: (t.title as string | undefined) ?? "",
    serviceId: (t.service_id as string | null) ?? null,
    serviceName: (service?.name as string | undefined) ?? null,
    status: (t.status as ConsentTemplateStatus) ?? "draft",
    versions: versionsRaw.map(mapConsentVersion),
  };
}

// --- لیست قالب‌های رضایت‌نامه (به‌همراه نسخه‌ها) ---
export async function getConsentTemplates(clinicSlug: string): Promise<ConsentTemplate[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    "/consents/templates",
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapConsentTemplate);
}

// --- جزئیات یک قالب رضایت‌نامه ---
export async function getConsentTemplateDetail(clinicSlug: string, templateId: string): Promise<ConsentTemplate> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/consents/templates/${templateId}`,
    { clinicSlug }
  );
  return mapConsentTemplate(unwrapObject<Record<string, unknown>>(res));
}

export interface CreateConsentTemplatePayload {
  title: string;
  service_id?: string;
  content: string;
  activate?: boolean;
}

// --- ایجاد قالب رضایت‌نامه (به‌همراه نسخه اول) ---
export async function createConsentTemplate(
  clinicSlug: string,
  payload: CreateConsentTemplatePayload
): Promise<ConsentTemplate> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    "/consents/templates",
    { method: "POST", body: JSON.stringify(payload), clinicSlug }
  );
  return mapConsentTemplate(unwrapObject<Record<string, unknown>>(res));
}

export interface UpdateConsentTemplatePayload {
  title?: string;
  service_id?: string | null;
}

// --- ویرایش اطلاعات قالب (فقط عنوان/سرویس؛ محتوا فقط از طریق نسخه جدید تغییر می‌کند) ---
export async function updateConsentTemplate(
  clinicSlug: string,
  templateId: string,
  payload: UpdateConsentTemplatePayload
): Promise<ConsentTemplate> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/consents/templates/${templateId}`,
    { method: "PATCH", body: JSON.stringify(payload), clinicSlug }
  );
  return mapConsentTemplate(unwrapObject<Record<string, unknown>>(res));
}

// --- لیست نسخه‌های یک قالب رضایت‌نامه ---
export async function getConsentVersions(clinicSlug: string, templateId: string): Promise<ConsentVersion[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/consents/templates/${templateId}/versions`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapConsentVersion);
}

export interface CreateConsentVersionPayload {
  content: string;
  activate?: boolean;
}

// --- ایجاد نسخه جدید رضایت‌نامه (نسخه قبلی هرگز تغییر نمی‌کند) ---
export async function createConsentVersion(
  clinicSlug: string,
  templateId: string,
  payload: CreateConsentVersionPayload
): Promise<ConsentVersion> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/consents/templates/${templateId}/versions`,
    { method: "POST", body: JSON.stringify(payload), clinicSlug }
  );
  return mapConsentVersion(unwrapObject<Record<string, unknown>>(res));
}

export interface SignPatientConsentPayload {
  consent_version_id: string;
  service_id?: string;
  accepted: boolean;
}

// --- ثبت امضای رضایت‌نامه برای یک بیمار (توسط کلینیک) ---
export async function signPatientConsent(
  clinicSlug: string,
  patientId: string,
  payload: SignPatientConsentPayload
) {
  return apiClient(`/patients/${patientId}/consents/sign`, {
    method: "POST",
    body: JSON.stringify(payload),
    clinicSlug,
  });
}

export interface SignedPatientConsent {
  id: string;
  templateTitle: string | null;
  versionNumber: number | null;
  serviceId: string | null;
  accepted: boolean;
  signedAt: string | null;
}

function mapSignedPatientConsent(c: Record<string, unknown>): SignedPatientConsent {
  const version = c.consent_version as Record<string, unknown> | undefined;
  const template = version?.template as Record<string, unknown> | undefined;
  return {
    id: String(c.id ?? ""),
    templateTitle: (template?.title as string | undefined) ?? null,
    versionNumber: version?.version_number != null ? Number(version.version_number) : null,
    serviceId: (c.service_id as string | null) ?? null,
    accepted: Boolean(c.accepted),
    signedAt: (c.signed_at as string | null) ?? null,
  };
}

// --- لیست رضایت‌نامه‌های امضاشده توسط یک بیمار (نمای کلینیک) ---
export async function getPatientSignedConsents(
  clinicSlug: string,
  patientId: string
): Promise<SignedPatientConsent[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/patients/${patientId}/consents`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapSignedPatientConsent);
}
