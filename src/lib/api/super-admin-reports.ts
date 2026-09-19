import { apiClient } from "./client";

/**
 * =========================================================
 * توجه مهم
 * =========================================================
 *
 * اسپک OpenAPI برای همه‌ی endpointهای زیر (داشبورد سوپرادمین و
 * گزارش‌های پلتفرم) فقط description دارد و schema دقیق پاسخ
 * مشخص نشده است.
 *
 * فیلدهای interfaceهای زیر بر اساس نام‌گذاری snake_case رایج
 * در بقیه‌ی پروژه حدس زده شده‌اند. هر آبجکت یک index signature
 * دارد تا اگر بک‌اند واقعی اسم فیلد متفاوتی برگرداند، چیزی
 * type-error ندهد و UI بتواند با fallback رندر کند.
 *
 * وقتی پاسخ واقعی بک‌اند را دیدی و اسم فیلدی فرق داشت،
 * کافی‌ست همین‌جا اصلاح کنی؛ بقیه‌ی کد تغییر نمی‌خواهد.
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
 * Dashboard
 * ============================================================ */

export interface DashboardOverview {
  clinics_count?: number;
  active_clinics_count?: number;
  inactive_clinics_count?: number;
  suspended_clinics_count?: number;
  subscriptions_count?: number;
  active_subscriptions_count?: number;
  trial_subscriptions_count?: number;
  users_count?: number;
  patients_count?: number;
  recent_activity_count?: number;
  [key: string]: unknown;
}

export interface DashboardAlertClinic {
  id: string;
  name?: string;
  status?: "active" | "inactive" | "suspended";
  plan_name?: string;
  usage_percent?: number;
  exceeded_limits?: string[];
  [key: string]: unknown;
}

/* ============================================================
 * Reports
 * ============================================================ */

export interface ClinicReportRow {
  id: string;
  name?: string;
  status?: "active" | "inactive" | "suspended";
  plan_name?: string;
  users_count?: number;
  patients_count?: number;
  appointments_count?: number;
  visits_count?: number;
  revenue?: number;
  [key: string]: unknown;
}

export interface SubscriptionReportRow {
  clinic_id?: string;
  clinic_name?: string;
  plan_id?: string;
  plan_name?: string;
  status?: "trial" | "active" | "expired" | "cancelled";
  started_at?: string;
  expires_at?: string | null;
  days_remaining?: number;
  [key: string]: unknown;
}

export interface SubscriptionsReport {
  by_plan?: Record<string, number>;
  by_status?: Record<string, number>;
  expiring_soon?: SubscriptionReportRow[];
  [key: string]: unknown;
}

export interface UsageReportRow {
  clinic_id?: string;
  clinic_name?: string;
  plan_name?: string;
  users_used?: number;
  users_limit?: number | null;
  storage_used_mb?: number;
  storage_limit_mb?: number | null;
  sms_used?: number;
  sms_limit?: number | null;
  [key: string]: unknown;
}

export interface RevenueReportRow {
  clinic_id?: string;
  clinic_name?: string;
  total_amount?: number;
  [key: string]: unknown;
}

export interface RevenueReport {
  total?: number;
  by_clinic?: RevenueReportRow[];
  by_method?: Record<string, number>;
  [key: string]: unknown;
}

export interface ModuleAdoptionRow {
  module_key: string;
  module_label?: string;
  active_clinics_count?: number;
  [key: string]: unknown;
}

export interface SmsReportRow {
  clinic_id?: string;
  clinic_name?: string;
  sent_count?: number;
  delivered_count?: number;
  failed_count?: number;
  [key: string]: unknown;
}

export interface SmsReport {
  by_status?: Record<string, number>;
  by_clinic?: SmsReportRow[];
  [key: string]: unknown;
}

export interface GrowthReportRow {
  month?: string;
  clinics_count?: number;
  patients_count?: number;
  visits_count?: number;
  [key: string]: unknown;
}

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
  // --- داشبورد کلی پلتفرم ---
  getDashboard: async () => {
    const res = await apiClient<
      LaravelEnvelope<DashboardOverview> | DashboardOverview
    >("/super-admin/dashboard");

    return unwrapItem<DashboardOverview>(res);
  },

  // --- کلینیک‌هایی که از سقف پلن عبور کرده‌اند ---
  getDashboardAlerts: async (
    status?: "active" | "inactive" | "suspended"
  ) => {
    const res = await apiClient<
      | LaravelEnvelope<DashboardAlertClinic[]>
      | DashboardAlertClinic[]
    >(`/super-admin/dashboard/alerts${buildQuery({ status })}`);

    return unwrapItem<DashboardAlertClinic[]>(res) ?? [];
  },

  // --- جدول مقایسه‌ای کلینیک‌ها ---
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

  // --- وضعیت اشتراک‌ها ---
  getSubscriptionsReport: async (
    params: { status?: string; days?: number } = {}
  ) => {
    const res = await apiClient<unknown>(
      `/super-admin/reports/subscriptions${buildQuery(params)}`
    );

    return unwrapItem<SubscriptionsReport>(res);
  },

  // --- مصرف کاربر/فایل/پیامک در برابر سقف پلن ---
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

  // --- درآمد کلینیک‌ها از پرداخت بیماران ---
  getRevenueReport: async (
    params: { from?: string; to?: string; clinic_id?: string } = {}
  ) => {
    const res = await apiClient<unknown>(
      `/super-admin/reports/revenue${buildQuery(params)}`
    );

    return unwrapItem<RevenueReport>(res);
  },

  // --- پذیرش ماژول‌ها در کلینیک‌ها ---
  getModulesReport: async () => {
    const res = await apiClient<unknown>(`/super-admin/reports/modules`);

    return unwrapItem<ModuleAdoptionRow[]>(res) ?? [];
  },

  // --- گزارش پیامک کل پلتفرم ---
  getSmsReport: async (
    params: { from?: string; to?: string; clinic_id?: string } = {}
  ) => {
    const res = await apiClient<unknown>(
      `/super-admin/reports/sms${buildQuery(params)}`
    );

    return unwrapItem<SmsReport>(res);
  },

  // --- روند رشد ماهانه ---
  getGrowthReport: async (params: { months?: number } = {}) => {
    const res = await apiClient<unknown>(
      `/super-admin/reports/growth${buildQuery(params)}`
    );

    return unwrapItem<GrowthReportRow[]>(res) ?? [];
  },

  // --- لاگ سراسری عملیات حساس ---
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

  // --- خروجی CSV یک گزارش ---
  // این endpoint فایل CSV برمی‌گرداند نه JSON، پس نمی‌توانیم
  // از apiClient معمولی (که همیشه res.json() می‌کند) استفاده کنیم.
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

/**
 * کمک‌تابع برای دانلود بلاب CSV در مرورگر.
 */
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
