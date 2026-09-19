import { apiClient } from "./client";

/**
 * =========================================================
 * توجه
 * =========================================================
 *
 * شِیپ اکثر endpointهای این فایل روی بک‌اند واقعی (api.hessjr.com)
 * تست و تأیید شده. دو مورد هنوز تأیید نشده‌اند و flexible مونده‌اند:
 * - آیتم‌های پرشده‌ی `expiring_soon` و `by_plan` در subscriptions
 *   (روی دیتای تست خالی بودن)
 * - `reports/audit-logs` و `reports/export`
 *
 * برای این دو مورد، interfaceها یک index signature دارند تا اگر
 * اسم فیلدی فرق داشت type-error ندهد؛ UI هم با fallback («—»)
 * رندر می‌کند.
 */

interface LaravelEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface LaravelPaginator<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

function unwrapItem<T>(res: unknown): T {
  if (
    res &&
    typeof res === "object" &&
    "data" in (res as Record<string, unknown>)
  ) {
    return (res as { data: unknown }).data as T;
  }

  return res as T;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  currentPage: number;
  lastPage: number;
  perPage: number;
}

function unwrapPaginated<T>(res: unknown): PaginatedResult<T> {
  const inner = unwrapItem<unknown>(res);

  if (
    inner &&
    typeof inner === "object" &&
    Array.isArray((inner as LaravelPaginator<T>).data)
  ) {
    const p = inner as LaravelPaginator<T>;

    return {
      items: p.data,
      total: p.total ?? p.data.length,
      currentPage: p.current_page ?? 1,
      lastPage: p.last_page ?? 1,
      perPage: p.per_page ?? p.data.length,
    };
  }

  if (Array.isArray(inner)) {
    return {
      items: inner as T[],
      total: (inner as T[]).length,
      currentPage: 1,
      lastPage: 1,
      perPage: (inner as T[]).length,
    };
  }

  return { items: [], total: 0, currentPage: 1, lastPage: 1, perPage: 0 };
}

function buildQuery(
  params: Record<string, string | number | undefined | null>
) {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      qs.set(key, String(value));
    }
  });

  const s = qs.toString();
  return s ? `?${s}` : "";
}

/* ============================================================
 * Dashboard  —  GET /super-admin/dashboard
 * ============================================================ */

export interface DashboardOverview {
  clinics: {
    total: number;
    by_status: Record<string, number>;
    new_last_30_days: number;
  };
  subscriptions: {
    by_status: Record<string, number>;
    expiring_in_30_days: number;
    without_subscription: number;
  };
  users: {
    staff: number;
    patients: number;
  };
  activity_last_30_days: {
    appointments: number;
    completed_visits: number;
    sms_sent: number;
  };
  clinic_revenue_last_30_days: number;
}

/* ============================================================
 * Dashboard Alerts  —  GET /super-admin/dashboard/alerts
 * ============================================================ */

export interface UsageMetric {
  used: number;
  limit: number | null;
  is_unlimited: boolean;
  usage_percent: number;
  over_limit: boolean;
}

export interface DashboardAlertClinic {
  clinic_id: string;
  clinic_name: string;
  status?: "active" | "inactive" | "suspended";
  plan_name?: string;
  subscription_status?: string;
  users: UsageMetric;
  storage_mb: UsageMetric;
  sms_this_month: UsageMetric;
}

/** فهرست متریک‌هایی که یک کلینیک از سقفشان عبور کرده، به فارسی. */
export function overLimitLabels(clinic: DashboardAlertClinic): string[] {
  const labels: string[] = [];

  if (clinic.users?.over_limit) labels.push("کاربران");
  if (clinic.storage_mb?.over_limit) labels.push("فضای ذخیره‌سازی");
  if (clinic.sms_this_month?.over_limit) labels.push("پیامک");

  return labels;
}

/* ============================================================
 * جدول مقایسه‌ای کلینیک‌ها  —  GET /super-admin/reports/clinics
 * ============================================================ */

export interface ClinicReportRow {
  clinic_id: string;
  name: string;
  slug?: string;
  specialty?: string | null;
  status?: "active" | "inactive" | "suspended";
  created_at?: string;
  staff_count?: number;
  patient_count?: number;
  appointment_count?: number;
  completed_visit_count?: number;
  total_revenue?: number;
  plan_name?: string | null;
  subscription_status?: string | null;
  subscription_expires_at?: string | null;
  [key: string]: unknown;
}

/* ============================================================
 * وضعیت اشتراک‌ها  —  GET /super-admin/reports/subscriptions
 * ============================================================ */

export interface SubscriptionPlanCount {
  plan_id?: string;
  plan_name?: string;
  count?: number;
  [key: string]: unknown;
}

export interface SubscriptionExpiringRow {
  clinic_id?: string;
  clinic_name?: string;
  plan_name?: string;
  expires_at?: string;
  days_remaining?: number;
  [key: string]: unknown;
}

export interface SubscriptionsReport {
  by_status: Record<string, number>;
  by_plan: SubscriptionPlanCount[];
  expiring_soon: SubscriptionExpiringRow[];
  estimated_monthly_revenue: number;
}

/* ============================================================
 * مصرف کلینیک‌ها  —  GET /super-admin/reports/usage
 * ============================================================ */

export interface UsageReportRow {
  clinic_id: string;
  clinic_name: string;
  status?: "active" | "inactive" | "suspended";
  plan_name?: string;
  subscription_status?: string;
  users: UsageMetric;
  storage_mb: UsageMetric;
  sms_this_month: UsageMetric;
}

/* ============================================================
 * درآمد  —  GET /super-admin/reports/revenue
 * ============================================================ */

export interface RevenueByClinicRow {
  clinic_id: string;
  clinic_name: string;
  total_amount: number;
  payment_count?: number;
}

export interface RevenueReport {
  total_revenue: number;
  // مقادیر by_method به‌صورت رشته‌ی اعشاری از بک‌اند می‌آید (مثلاً "3500000.00")
  by_method: Record<string, string | number>;
  by_clinic: RevenueByClinicRow[];
  outstanding_balance?: number;
}

/* ============================================================
 * پذیرش ماژول‌ها  —  GET /super-admin/reports/modules
 * ============================================================ */

export interface ModuleAdoptionRow {
  module_key: string;
  enabled_clinics: number;
  configured_clinics?: number;
  adoption_percent: number;
}

/* ============================================================
 * گزارش پیامک  —  GET /super-admin/reports/sms
 * ============================================================ */

export interface SmsByClinicRow {
  clinic_id: string;
  clinic_name: string;
  total_count: number;
  delivered_count: number;
  failed_count: number;
}

export interface SmsReport {
  by_status: Record<string, number>;
  by_clinic: SmsByClinicRow[];
}

/* ============================================================
 * روند رشد  —  GET /super-admin/reports/growth
 *
 * توجه: پاسخ سه نقشه‌ی جدا (clinics / patients / completed_visits)
 * برمی‌گرداند که کلیدشان "YYYY-MM" است، و ممکن است ماه‌های هر
 * نقشه با هم یکی نباشند (فقط ماه‌هایی که رکورد داشته‌اند برمی‌گردند).
 * ============================================================ */

export interface GrowthReport {
  from?: string;
  clinics: Record<string, number>;
  patients: Record<string, number>;
  completed_visits: Record<string, number>;
}

export interface GrowthPoint {
  month: string;
  clinics: number;
  patients: number;
  completed_visits: number;
}

/** سه نقشه‌ی جداگانه‌ی growth را در یک آرایه‌ی مرتب و یکدست ادغام می‌کند. */
export function mergeGrowthPoints(
  report: GrowthReport | undefined
): GrowthPoint[] {
  if (!report) return [];

  const months = new Set<string>([
    ...Object.keys(report.clinics ?? {}),
    ...Object.keys(report.patients ?? {}),
    ...Object.keys(report.completed_visits ?? {}),
  ]);

  return Array.from(months)
    .sort()
    .map((month) => ({
      month,
      clinics: report.clinics?.[month] ?? 0,
      patients: report.patients?.[month] ?? 0,
      completed_visits: report.completed_visits?.[month] ?? 0,
    }));
}

/** برچسب فارسی برای یک کلید ماه به شکل "YYYY-MM"، با رقم فارسی. */
export function formatGrowthMonth(month: string): string {
  const [year, m] = month.split("-");
  if (!year || !m) return month;
  return `${m}/${year.slice(2)}`.replace(
    /\d/g,
    (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]
  );
}

/* ============================================================
 * لاگ عملیات حساس  —  GET /super-admin/reports/audit-logs
 * (شِیپ دقیق هنوز تأیید نشده — flexible نگه داشته شده)
 * ============================================================ */

export interface AuditLogRow {
  id: string;
  clinic_id?: string | null;
  clinic_name?: string;
  user_id?: number | null;
  user_name?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
  [key: string]: unknown;
}

export type ReportExportType =
  | "clinics"
  | "subscriptions"
  | "usage"
  | "revenue"
  | "modules"
  | "sms"
  | "audit-logs";

export const superAdminReportsApi = {
  getDashboard: async () => {
    const res = await apiClient<LaravelEnvelope<DashboardOverview>>(
      "/super-admin/dashboard"
    );
    return unwrapItem<DashboardOverview>(res);
  },

  getDashboardAlerts: async (
    status?: "active" | "inactive" | "suspended"
  ) => {
    const res = await apiClient<LaravelEnvelope<DashboardAlertClinic[]>>(
      `/super-admin/dashboard/alerts${buildQuery({ status })}`
    );
    return unwrapItem<DashboardAlertClinic[]>(res) ?? [];
  },

  getClinicsReport: async (
    params: {
      clinic_id?: string;
      status?: string;
      per_page?: number;
    } = {}
  ) => {
    const res = await apiClient<unknown>(
      `/super-admin/reports/clinics${buildQuery(params)}`
    );
    return unwrapPaginated<ClinicReportRow>(res);
  },

  getSubscriptionsReport: async (
    params: { status?: string; days?: number } = {}
  ) => {
    const res = await apiClient<unknown>(
      `/super-admin/reports/subscriptions${buildQuery(params)}`
    );
    return unwrapItem<SubscriptionsReport>(res);
  },

  getUsageReport: async (
    params: {
      clinic_id?: string;
      status?: string;
      per_page?: number;
    } = {}
  ) => {
    const res = await apiClient<unknown>(
      `/super-admin/reports/usage${buildQuery(params)}`
    );
    return unwrapPaginated<UsageReportRow>(res);
  },

  getRevenueReport: async (
    params: { from?: string; to?: string; clinic_id?: string } = {}
  ) => {
    const res = await apiClient<unknown>(
      `/super-admin/reports/revenue${buildQuery(params)}`
    );
    return unwrapItem<RevenueReport>(res);
  },

  getModulesReport: async () => {
    const res = await apiClient<unknown>(`/super-admin/reports/modules`);
    return unwrapItem<ModuleAdoptionRow[]>(res) ?? [];
  },

  getSmsReport: async (
    params: { from?: string; to?: string; clinic_id?: string } = {}
  ) => {
    const res = await apiClient<unknown>(
      `/super-admin/reports/sms${buildQuery(params)}`
    );
    return unwrapItem<SmsReport>(res);
  },

  getGrowthReport: async (params: { months?: number } = {}) => {
    const res = await apiClient<unknown>(
      `/super-admin/reports/growth${buildQuery(params)}`
    );
    return unwrapItem<GrowthReport>(res);
  },

  getAuditLogs: async (
    params: {
      clinic_id?: string;
      user_id?: number;
      action?: string;
      entity_type?: string;
      from?: string;
      to?: string;
      per_page?: number;
    } = {}
  ) => {
    const res = await apiClient<unknown>(
      `/super-admin/reports/audit-logs${buildQuery(params)}`
    );
    return unwrapPaginated<AuditLogRow>(res);
  },

  // این endpoint فایل CSV برمی‌گرداند، نه JSON.
  exportReport: async (payload: {
    report_type: ReportExportType;
    from?: string;
    to?: string;
    clinic_id?: string;
  }) => {
    const res = await fetch("/api/proxy/super-admin/reports/export", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/csv, application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);

      throw new Error(
        body?.error?.message ??
          body?.message ??
          `خطا در دریافت خروجی: ${res.status}`
      );
    }

    const blob = await res.blob();

    const disposition = res.headers.get("Content-Disposition") ?? "";
    const match = /filename="?([^"]+)"?/.exec(disposition);
    const filename = match?.[1] ?? `${payload.report_type}-report.csv`;

    return { blob, filename };
  },
};

/** یک بلاب (مثلاً CSV) را در مرورگر دانلود می‌کند. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}
