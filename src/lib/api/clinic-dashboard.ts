import { apiClient } from "./client";

export interface ClinicModule {
  id: string;
  clinic_id: string;
  module_key: string;
  is_enabled: boolean;
  config: Record<string, unknown> | null;
}

interface LaravelEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// فرمت واقعی و تأییدشده‌ی /dashboard/clinic — فقط داده‌ی «امروز» می‌دهد،
// نه ماهانه، و شامل درآمد نیست.
export interface ClinicDashboardSummary {
  appointmentsToday: number | null;
  newPatientsToday: number | null;
  servicesPerformedToday: number | null;
  returnRatePercent: number | null;
}

function unwrapObject<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in (res as Record<string, unknown>)) {
    return (res as { data: unknown }).data as T;
  }
  return res as T;
}

export async function getClinicDashboard(clinicSlug: string): Promise<ClinicDashboardSummary> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>>>("/dashboard/clinic", { clinicSlug });
  const data = unwrapObject<Record<string, unknown>>(res);

  const toNumber = (v: unknown): number | null => (typeof v === "number" ? v : v != null ? Number(v) : null);

  return {
    appointmentsToday: toNumber(data.todays_appointments),
    newPatientsToday: toNumber(data.new_patients_today),
    servicesPerformedToday: toNumber(data.services_performed_today),
    returnRatePercent: toNumber(data.return_rate_percent),
  };
}

// --- ماژول‌های فعال کلینیک (برای چک "آیا ماژول مالی فعال است؟") ---
export async function getClinicModules(clinicSlug: string): Promise<ClinicModule[]> {
  const res = await apiClient<LaravelEnvelope<ClinicModule[]> | ClinicModule[]>("/clinics/current/modules", {
    clinicSlug,
  });
  if (Array.isArray(res)) return res;
  const data = (res as LaravelEnvelope<ClinicModule[]>)?.data;
  return Array.isArray(data) ? data : [];
}

// نکته: کلید دقیق ماژول مالی هنوز تأیید نشده (فقط نمونه‌ی "chat" در اسپک آمده).
// هر ماژولی که کلیدش شامل "financ" یا "invoic" یا "payment" باشد، ماژول مالی
// در نظر گرفته می‌شود — این حدس باید با کلید واقعی تأیید شود.
export function isFinanceModuleEnabled(modules: ClinicModule[]): boolean {
  return modules.some((m) => /financ|invoic|payment/i.test(m.module_key) && m.is_enabled);
}

// --- فعال/غیرفعال کردن یک ماژول توسط خود مدیر کلینیک ---
// PATCH /clinics/current/modules/{moduleKey}
// توجه: این عملیات مستقل از تغییر ماژول توسط SuperAdmin است (که مسیر جدای
// /super-admin/clinics/{clinic}/modules/{moduleKey} را دارد و فراتر از
// محدودیت پلن عمل می‌کند). این endpoint فقط برای خودِ کلینیک است و طبق
// اسپک ممکن است به دلیل محدودیت پلن با خطای 403 مواجه شود.
export async function updateClinicModule(
  clinicSlug: string,
  moduleKey: string,
  isEnabled: boolean
): Promise<ClinicModule> {
  const res = await apiClient<LaravelEnvelope<ClinicModule> | ClinicModule>(
    `/clinics/current/modules/${moduleKey}`,
    {
      method: "PATCH",
      body: JSON.stringify({ is_enabled: isEnabled }),
      clinicSlug,
    }
  );
  return unwrapObject<ClinicModule>(res);
}

// --- نوبت‌های آینده ---
export interface UpcomingAppointment {
  id: string;
  startTime: string;
  patientName: string;
  serviceName: string;
}

export async function getUpcomingAppointments(clinicSlug: string): Promise<UpcomingAppointment[]> {
  const today = new Date().toISOString().slice(0, 10);
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/appointments?from=${today}&status=confirmed`,
    { clinicSlug }
  );

  const raw = Array.isArray(res) ? res : ((res as LaravelEnvelope<Record<string, unknown>[]>)?.data ?? []);
  const list = Array.isArray(raw) ? raw : ((raw as unknown as { data?: unknown[] })?.data ?? []);

  return (list as Record<string, unknown>[]).map((a) => {
    const patient = a.patient as Record<string, unknown> | undefined;
    const service = a.service as Record<string, unknown> | undefined;
    return {
      id: String(a.id ?? ""),
      startTime: String(a.start_time ?? ""),
      patientName:
        (patient?.first_name && patient?.last_name
          ? `${patient.first_name} ${patient.last_name}`
          : (a.patient_name as string | undefined)) ?? "بیمار",
      serviceName: (service?.name as string | undefined) ?? (a.service_name as string | undefined) ?? "-",
    };
  });
}