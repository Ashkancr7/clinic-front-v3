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

export type IntakeSubmissionStatus = "draft" | "submitted" | "needs_review" | "verified" | "rejected";

export interface IntakeSubmission {
  id: string;
  patientId: string;
  formId: string;
  status: IntakeSubmissionStatus;
  submittedData: Record<string, unknown>;
  submittedAt: string | null;
  reviewedAt: string | null;
}

function mapSubmission(s: Record<string, unknown>): IntakeSubmission {
  return {
    id: String(s.id ?? ""),
    patientId: String(s.patient_id ?? ""),
    formId: String(s.form_id ?? ""),
    status: (s.status as IntakeSubmissionStatus) ?? "submitted",
    submittedData: (s.submitted_data as Record<string, unknown>) ?? {},
    submittedAt: (s.submitted_at as string | null) ?? null,
    reviewedAt: (s.reviewed_at as string | null) ?? null,
  };
}

// --- لیست فرم‌های ثبت‌شده توسط بیماران (فیلتر اختیاری بر اساس وضعیت) ---
export async function getIntakeSubmissions(
  clinicSlug: string,
  status?: IntakeSubmissionStatus
): Promise<IntakeSubmission[]> {
  const query = status ? `?status=${status}` : "";
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/intake/submissions${query}`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapSubmission);
}

// --- جزئیات یک فرم ثبت‌شده ---
export async function getIntakeSubmissionDetail(clinicSlug: string, submissionId: string): Promise<IntakeSubmission> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/intake/submissions/${submissionId}`,
    { clinicSlug }
  );
  return mapSubmission(unwrapObject<Record<string, unknown>>(res));
}

export type IntakeReviewStatus = "verified" | "rejected" | "needs_review";

// --- تایید یا رد فرم توسط کلینیک ---
export async function reviewIntakeSubmission(
  clinicSlug: string,
  submissionId: string,
  status: IntakeReviewStatus
): Promise<IntakeSubmission> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/intake/submissions/${submissionId}/review`,
    { method: "PATCH", body: JSON.stringify({ status }), clinicSlug }
  );
  return mapSubmission(unwrapObject<Record<string, unknown>>(res));
}
