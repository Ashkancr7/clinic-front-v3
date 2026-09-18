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

// --- قالب‌ها ---
export interface SmsTemplate {
  id: string;
  title: string;
  templateKey: string;
  content: string;
  variables: string[] | null;
  isActive: boolean;
}

function mapTemplate(t: Record<string, unknown>): SmsTemplate {
  return {
    id: String(t.id ?? ""),
    title: String(t.title ?? ""),
    templateKey: String(t.template_key ?? ""),
    content: String(t.content ?? ""),
    variables: (t.variables as string[] | null) ?? null,
    isActive: Boolean(t.is_active),
  };
}

export async function getSmsTemplates(clinicSlug: string): Promise<SmsTemplate[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>("/sms/templates", {
    clinicSlug,
  });
  return unwrapList<Record<string, unknown>>(res).map(mapTemplate);
}

// دریافت جزئیات تازه‌ی یک قالب (GET /sms/templates/{template})
// برخلاف getSmsTemplates که آیتم را از لیست کش‌شده می‌گیرد، این تابع همیشه
// آخرین نسخه‌ی قالب را از سرور می‌خواند — مثلاً قبل از باز کردن فرم ویرایش،
// تا اگر کاربر/تب دیگری قالب را تغییر داده باشد، فرم با داده‌ی قدیمی باز نشود.
export async function getSmsTemplate(clinicSlug: string, templateId: string): Promise<SmsTemplate> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/sms/templates/${templateId}`,
    { clinicSlug }
  );
  return mapTemplate(unwrapObject<Record<string, unknown>>(res));
}

export interface CreateTemplatePayload {
  title: string;
  template_key: string;
  content: string;
  variables?: string[];
  is_active?: boolean;
}

export async function createSmsTemplate(clinicSlug: string, payload: CreateTemplatePayload) {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>("/sms/templates", {
    method: "POST",
    body: JSON.stringify(payload),
    clinicSlug,
  });
  return mapTemplate(unwrapObject<Record<string, unknown>>(res));
}

export async function updateSmsTemplate(clinicSlug: string, templateId: string, payload: Partial<CreateTemplatePayload>) {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/sms/templates/${templateId}`,
    { method: "PATCH", body: JSON.stringify(payload), clinicSlug }
  );
  return mapTemplate(unwrapObject<Record<string, unknown>>(res));
}

export async function testSmsTemplate(clinicSlug: string, templateId: string, phone: string) {
  return apiClient(`/sms/templates/${templateId}/test`, {
    method: "POST",
    body: JSON.stringify({ phone }),
    clinicSlug,
  });
}

// --- قوانین اتوماسیون ---
export type TriggerEvent = "appointment_reminder" | "appointment_created" | "appointment_cancelled" | "birthday" | "post_service_followup";

export interface AutomationRule {
  id: string;
  templateId: string;
  templateTitle: string;
  triggerEvent: TriggerEvent;
  offsetMinutes: number | null;
  isActive: boolean;
}

function mapRule(r: Record<string, unknown>): AutomationRule {
  const template = r.template as Record<string, unknown> | undefined;
  return {
    id: String(r.id ?? ""),
    templateId: String(r.template_id ?? ""),
    templateTitle: (template?.title as string | undefined) ?? "—",
    triggerEvent: (r.trigger_event as TriggerEvent) ?? "appointment_reminder",
    offsetMinutes: r.offset_minutes != null ? Number(r.offset_minutes) : null,
    isActive: Boolean(r.is_active),
  };
}

export async function getAutomationRules(clinicSlug: string): Promise<AutomationRule[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    "/sms/automation-rules",
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapRule);
}

export interface CreateRulePayload {
  template_id: string;
  trigger_event: TriggerEvent;
  offset_minutes?: number;
  is_active?: boolean;
}

export async function createAutomationRule(clinicSlug: string, payload: CreateRulePayload) {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    "/sms/automation-rules",
    { method: "POST", body: JSON.stringify(payload), clinicSlug }
  );
  return mapRule(unwrapObject<Record<string, unknown>>(res));
}

export async function updateAutomationRule(clinicSlug: string, ruleId: string, payload: Partial<CreateRulePayload>) {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/sms/automation-rules/${ruleId}`,
    { method: "PATCH", body: JSON.stringify(payload), clinicSlug }
  );
  return mapRule(unwrapObject<Record<string, unknown>>(res));
}

// --- پیامک‌های ارسال‌شده ---
export interface SmsMessageItem {
  id: string;
  phone: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
}

function mapMessage(m: Record<string, unknown>): SmsMessageItem {
  return {
    id: String(m.id ?? ""),
    phone: String(m.phone ?? ""),
    content: String(m.content ?? ""),
    status: String(m.status ?? ""),
    scheduledAt: (m.scheduled_at as string | null) ?? null,
    sentAt: (m.sent_at as string | null) ?? null,
  };
}

export async function getSmsMessages(clinicSlug: string): Promise<SmsMessageItem[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>("/sms/messages", {
    clinicSlug,
  });
  return unwrapList<Record<string, unknown>>(res).map(mapMessage);
}

export interface SendSmsPayload {
  phone: string;
  content: string;
  patient_id?: string;
}

export async function sendSmsNow(clinicSlug: string, payload: SendSmsPayload) {
  return apiClient("/sms/send", { method: "POST", body: JSON.stringify(payload), clinicSlug });
}

export async function scheduleSms(clinicSlug: string, payload: SendSmsPayload & { scheduled_at: string }) {
  return apiClient("/sms/schedule", { method: "POST", body: JSON.stringify(payload), clinicSlug });
}