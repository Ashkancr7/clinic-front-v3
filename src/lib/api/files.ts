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

export type FileType = "image" | "document" | "video" | "signature" | "other";
export type FileAccessLevel = "private" | "patient_visible" | "internal";
export type ImageType = "before" | "after" | "during" | "other";

export interface ClinicFile {
  id: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  fileType: FileType;
  accessLevel: FileAccessLevel;
}

function mapClinicFile(f: Record<string, unknown>): ClinicFile {
  return {
    id: String(f.id ?? ""),
    originalName: (f.original_name as string | undefined) ?? "",
    mimeType: (f.mime_type as string | undefined) ?? "",
    fileSize: Number(f.file_size ?? 0),
    fileType: (f.file_type as FileType) ?? "other",
    accessLevel: (f.access_level as FileAccessLevel) ?? "private",
  };
}

// --- آپلود فایل عمومی کنترل‌شده ---
export async function uploadFile(
  clinicSlug: string,
  file: File,
  fileType: FileType,
  accessLevel: FileAccessLevel
): Promise<ClinicFile> {
  const form = new FormData();
  form.append("file", file);
  form.append("file_type", fileType);
  form.append("access_level", accessLevel);

  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>("/files/upload", {
    method: "POST",
    body: form,
    clinicSlug,
  });
  return mapClinicFile(unwrapObject<Record<string, unknown>>(res));
}

// --- دریافت لینک امن و زمان‌دار برای دانلود فایل (۳۰ دقیقه اعتبار) ---
export async function getFileSignedUrl(clinicSlug: string, fileId: string): Promise<string | null> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/files/${fileId}/signed-url`,
    { clinicSlug }
  );
  const data = unwrapObject<Record<string, unknown>>(res);
  return (data.url as string | undefined) ?? (data.signed_url as string | undefined) ?? null;
}

// --- حذف نرم فایل ---
export async function deleteFile(clinicSlug: string, fileId: string) {
  return apiClient(`/files/${fileId}`, { method: "DELETE", clinicSlug });
}

export interface PatientImage {
  id: string;
  patientId: string;
  visitId: string | null;
  visitServiceId: string | null;
  fileId: string;
  imageType: ImageType;
  bodyArea: string | null;
  angle: string | null;
  isVisibleToPatient: boolean;
  allowedForReport: boolean;
  marketingConsent: boolean;
  file: ClinicFile | null;
}

function mapPatientImage(p: Record<string, unknown>): PatientImage {
  const file = p.file as Record<string, unknown> | undefined;
  return {
    id: String(p.id ?? ""),
    patientId: String(p.patient_id ?? ""),
    visitId: (p.visit_id as string | null) ?? null,
    visitServiceId: (p.visit_service_id as string | null) ?? null,
    fileId: String(p.file_id ?? ""),
    imageType: (p.image_type as ImageType) ?? "other",
    bodyArea: (p.body_area as string | null) ?? null,
    angle: (p.angle as string | null) ?? null,
    isVisibleToPatient: Boolean(p.is_visible_to_patient),
    allowedForReport: Boolean(p.allowed_for_report),
    marketingConsent: Boolean(p.marketing_consent),
    file: file ? mapClinicFile(file) : null,
  };
}

// --- گالری تصاویر قبل/بعد بیمار (برای مقایسه) ---
export async function getPatientImages(
  clinicSlug: string,
  patientId: string,
  visibleOnly?: boolean
): Promise<PatientImage[]> {
  const query = visibleOnly ? "?visible_only=true" : "";
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/patients/${patientId}/images${query}`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapPatientImage);
}

// --- فایل‌ها و تصاویر جلسه ---
export async function getVisitFiles(clinicSlug: string, visitId: string): Promise<PatientImage[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/visits/${visitId}/files`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapPatientImage);
}

export interface AddVisitFilePayload {
  file_id: string;
  image_type: ImageType;
  body_area?: string;
  angle?: string;
  is_visible_to_patient?: boolean;
  allowed_for_report?: boolean;
  marketing_consent?: boolean;
}

// --- افزودن فایل/تصویر آپلودشده به جلسه ---
export async function addVisitFile(
  clinicSlug: string,
  visitId: string,
  payload: AddVisitFilePayload
): Promise<PatientImage> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/visits/${visitId}/files`,
    { method: "POST", body: JSON.stringify(payload), clinicSlug }
  );
  return mapPatientImage(unwrapObject<Record<string, unknown>>(res));
}