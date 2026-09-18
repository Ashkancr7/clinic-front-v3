import { apiClient } from "./client";
import type { IntakeForm } from "./intake-forms";
import type { IntakeSubmissionStatus } from "./intake-submissions";

interface LaravelEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

function unwrapObject<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in (res as Record<string, unknown>)) {
    return (res as { data: unknown }).data as T;
  }
  return res as T;
}

// این سه اندپوینت طبق اسپک نیازی به احراز هویت (Bearer token) ندارند؛
// شناسه‌ی کلینیک هم به‌جای X-Clinic-Slug، مستقیماً در مسیر (slug) می‌آید.
// عمداً clinicSlug را به apiClient پاس نمی‌دهیم چون این اندپوینت‌ها آن هدر را نمی‌خوانند.

export interface PublicIntakeField {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: "text" | "number" | "select" | "multi_select" | "date" | "yes_no" | "file" | "signature";
  isRequired: boolean;
  options: string[] | null;
  validationRules: Record<string, unknown> | null;
  conditionalRules: Record<string, unknown> | null;
  displayOrder: number;
}

export interface PublicIntakeForm {
  id: string;
  title: string;
  description: string | null;
  fields: PublicIntakeField[];
}

function mapPublicForm(f: Record<string, unknown>): PublicIntakeForm {
  const rawFields = Array.isArray(f.fields) ? (f.fields as Record<string, unknown>[]) : [];
  return {
    id: String(f.id ?? ""),
    title: String(f.title ?? ""),
    description: (f.description as string | null) ?? null,
    fields: rawFields.map((rf) => ({
      id: String(rf.id ?? ""),
      fieldKey: String(rf.field_key ?? ""),
      label: String(rf.label ?? ""),
      fieldType: (rf.field_type as PublicIntakeField["fieldType"]) ?? "text",
      isRequired: Boolean(rf.is_required),
      options: (rf.options as string[] | null) ?? null,
      validationRules: (rf.validation_rules as Record<string, unknown> | null) ?? null,
      conditionalRules: (rf.conditional_rules as Record<string, unknown> | null) ?? null,
      displayOrder: Number(rf.display_order ?? 0),
    })),
  };
}

/**
 * دریافت فرم پذیرش فعال کلینیک (بدون نیاز به احراز هویت).
 * اگر فرم فعالی برای این کلینیک تعریف نشده باشد، بک‌اند ۴۰۴ برمی‌گرداند؛
 * این حالت را جدا از خطاهای دیگر مدیریت کنید (مثلاً پیام «فعلاً پذیرش آنلاین فعال نیست»).
 */
export async function getPublicIntakeForm(clinicSlug: string): Promise<PublicIntakeForm> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/public/clinics/${clinicSlug}/intake-form`
  );
  return mapPublicForm(unwrapObject<Record<string, unknown>>(res));
}

export interface SubmitPublicIntakePayload {
  /** کلید = field_key، مقدار = پاسخ بیمار */
  submitted_data: Record<string, unknown>;
  /** اگر true باشد فرم نهایی می‌شود (نیازمند رضایت‌نامه‌ی امضاشده) */
  finalize?: boolean;
  consent_version_id?: string;
  accepted?: boolean;
}

export interface PublicIntakeSubmissionResult {
  id: string;
  status: IntakeSubmissionStatus;
  submittedData: Record<string, unknown>;
}

function mapPublicSubmission(s: Record<string, unknown>): PublicIntakeSubmissionResult {
  return {
    id: String(s.id ?? ""),
    status: (s.status as IntakeSubmissionStatus) ?? "draft",
    submittedData: (s.submitted_data as Record<string, unknown>) ?? {},
  };
}

/**
 * ثبت فرم پذیرش توسط بیمار (بدون نیاز به احراز هویت).
 * خطای ۴۲۲ با کد CONSENT_REQUIRED یعنی رضایت‌نامه‌ی لازم امضا نشده؛
 * خطای ۴۰۴ با کد NO_ACTIVE_FORM یعنی فرم فعالی وجود ندارد.
 */
export async function submitPublicIntake(
  clinicSlug: string,
  payload: SubmitPublicIntakePayload
): Promise<PublicIntakeSubmissionResult> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/public/clinics/${clinicSlug}/intake-submissions`,
    { method: "POST", body: JSON.stringify(payload) }
  );
  return mapPublicSubmission(unwrapObject<Record<string, unknown>>(res));
}

export type UpdatePublicIntakeDraftPayload = Partial<SubmitPublicIntakePayload>;

/**
 * ذخیره‌ی موقت (Draft) یا نهایی‌سازی فرم پذیرشی که قبلاً ساخته شده.
 * خطای ۴۰۹ با کد NOT_DRAFT یعنی این فرم قبلاً نهایی شده و دیگر قابل ویرایش نیست.
 */
export async function updatePublicIntakeDraft(
  submissionId: string,
  payload: UpdatePublicIntakeDraftPayload
): Promise<PublicIntakeSubmissionResult> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/public/intake-submissions/${submissionId}/draft`,
    { method: "PATCH", body: JSON.stringify(payload) }
  );
  return mapPublicSubmission(unwrapObject<Record<string, unknown>>(res));
}
