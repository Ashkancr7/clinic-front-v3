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

export type IntakeFieldType =
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "date"
  | "yes_no"
  | "file"
  | "signature";

export type IntakeFormStatus = "draft" | "active" | "inactive";

export interface IntakeFormField {
  id: string;
  formId: string;
  fieldKey: string;
  label: string;
  fieldType: IntakeFieldType;
  isRequired: boolean;
  options: string[] | null;
  validationRules: Record<string, unknown> | null;
  /**
   * مثال: { depends_on: "has_allergy", equals: true, then_required: "allergy_description" }
   */
  conditionalRules: Record<string, unknown> | null;
  displayOrder: number;
}

export interface IntakeForm {
  id: string;
  title: string;
  description: string | null;
  status: IntakeFormStatus;
  version: number;
  fields: IntakeFormField[];
}

function mapField(f: Record<string, unknown>): IntakeFormField {
  return {
    id: String(f.id ?? ""),
    formId: String(f.form_id ?? ""),
    fieldKey: String(f.field_key ?? ""),
    label: String(f.label ?? ""),
    fieldType: (f.field_type as IntakeFieldType) ?? "text",
    isRequired: Boolean(f.is_required),
    options: (f.options as string[] | null) ?? null,
    validationRules: (f.validation_rules as Record<string, unknown> | null) ?? null,
    conditionalRules: (f.conditional_rules as Record<string, unknown> | null) ?? null,
    displayOrder: Number(f.display_order ?? 0),
  };
}

function mapForm(f: Record<string, unknown>): IntakeForm {
  const fields = Array.isArray(f.fields) ? (f.fields as Record<string, unknown>[]) : [];
  return {
    id: String(f.id ?? ""),
    title: String(f.title ?? ""),
    description: (f.description as string | null) ?? null,
    status: (f.status as IntakeFormStatus) ?? "draft",
    version: Number(f.version ?? 1),
    fields: fields.map(mapField),
  };
}

// --- لیست فرم‌های پذیرش کلینیک (به‌همراه فیلدها) ---
export async function getIntakeForms(clinicSlug: string): Promise<IntakeForm[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    "/intake/forms",
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapForm);
}

export interface IntakeFieldInput {
  field_key: string;
  label: string;
  field_type: IntakeFieldType;
  is_required?: boolean;
  options?: string[];
  validation_rules?: Record<string, unknown>;
  conditional_rules?: Record<string, unknown>;
  display_order?: number;
}

export interface CreateIntakeFormPayload {
  title: string;
  description?: string;
  fields?: IntakeFieldInput[];
}

// --- ساخت فرم پذیرش جدید ---
export async function createIntakeForm(clinicSlug: string, payload: CreateIntakeFormPayload): Promise<IntakeForm> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    "/intake/forms",
    { method: "POST", body: JSON.stringify(payload), clinicSlug }
  );
  return mapForm(unwrapObject<Record<string, unknown>>(res));
}

/**
 * برای فیلدهایی که از قبل وجود دارند، id را هم بفرستید تا بک‌اند آن‌ها را
 * ویرایش کند نه اینکه دوباره بسازد؛ فیلدهای بدون id به‌عنوان فیلد جدید
 * در نظر گرفته می‌شوند. توجه: این اندپوینت کل آرایه‌ی fields را جایگزین
 * می‌کند، پس هر بار باید فهرست کامل و به‌روز فیلدها ارسال شود.
 */
export interface IntakeFieldUpdateInput extends IntakeFieldInput {
  id?: string;
}

export interface UpdateIntakeFormPayload {
  title: string;
  description?: string;
  fields?: IntakeFieldUpdateInput[];
}

// --- ویرایش فرم پذیرش (عنوان، توضیح و فیلدها) ---
export async function updateIntakeForm(
  clinicSlug: string,
  formId: string,
  payload: UpdateIntakeFormPayload
): Promise<IntakeForm> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/intake/forms/${formId}`,
    { method: "PATCH", body: JSON.stringify(payload), clinicSlug }
  );
  return mapForm(unwrapObject<Record<string, unknown>>(res));
}

// --- انتشار فرم (فعال‌سازی؛ فرم‌های فعال قبلی خودکار غیرفعال می‌شوند) ---
export async function publishIntakeForm(clinicSlug: string, formId: string): Promise<IntakeForm> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/intake/forms/${formId}/publish`,
    { method: "POST", clinicSlug }
  );
  return mapForm(unwrapObject<Record<string, unknown>>(res));
}
