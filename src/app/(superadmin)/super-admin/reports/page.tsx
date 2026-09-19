"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Download,
  TrendingUp,
  Percent,
  Layers,
  Clock,
  Loader2,
} from "lucide-react";

import { superAdminApi } from "@/lib/api/super-admin";
import {
  superAdminReportsApi,
  downloadBlob,
  type ReportExportType,
} from "@/lib/api/super-admin-reports";
import { queryKeys } from "@/lib/query/keys";

const MODULE_LABELS: Record<string, string> = {
  appointments: "نوبت‌دهی",
  chat: "چت",
  consents: "رضایت‌نامه‌ها",
  files: "فایل‌ها و تصاویر",
  finance: "مالی",
  intake: "فرم پذیرش",
  patients: "مراجعین",
  reports: "گزارش‌ها",
  services: "خدمات",
  sms: "پیامک",
  video: "تماس تصویری",
  visits: "جلسات درمان",
};

const PLAN_COLORS = ["#0EA5A4", "#DDD6FE", "#FBCFE8", "#93C5FD", "#FDE68A"];

const EXPORT_OPTIONS: { value: ReportExportType; label: string }[] = [
  { value: "revenue", label: "درآمد" },
  { value: "clinics", label: "کلینیک‌ها" },
  { value: "subscriptions", label: "اشتراک‌ها" },
  { value: "usage", label: "مصرف" },
  { value: "modules", label: "ماژول‌ها" },
  { value: "sms", label: "پیامک" },
  { value: "audit-logs", label: "لاگ عملیات" },
];

function fmt(n: number | undefined | null) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString("fa-IR");
}

function fmtToman(n: number | undefined | null) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `${n.toLocaleString("fa-IR")} تومان`;
}

export default function ReportsPage() {
  const chartW = 320;
  const chartH = 120;

  const [exportType, setExportType] =
    useState<ReportExportType>("revenue");
  const [isExporting, setIsExporting] = useState(false);

  // ============================================================
  // کلینیک‌ها (برای مخرج درصدها)
  // ============================================================

  const { data: clinics = [] } = useQuery({
    queryKey: queryKeys.superAdmin.clinics.list(),
    queryFn: superAdminApi.getClinics,
  });

  // ============================================================
  // درآمد (GET /super-admin/reports/revenue)
  // ============================================================

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: queryKeys.superAdminReports.revenueReport(),
    queryFn: () => superAdminReportsApi.getRevenueReport(),
  });

  // ============================================================
  // روند رشد ۶ ماه اخیر (GET /super-admin/reports/growth)
  // ============================================================

  const { data: growth = [] } = useQuery({
    queryKey: queryKeys.superAdminReports.growthReport(6),
    queryFn: () => superAdminReportsApi.getGrowthReport({ months: 6 }),
  });

  const patientCoords = useMemo(() => {
    const values = growth.map(
      (g) => (g.patients_count as number | undefined) ?? 0
    );
    const max = Math.max(1, ...values);
    const stepX = growth.length > 1 ? chartW / (growth.length - 1) : chartW;

    return growth.map((g, i) => ({
      x: i * stepX,
      y:
        chartH -
        (((g.patients_count as number | undefined) ?? 0) /
          (max + Math.ceil(max * 0.15) + 1)) *
          chartH,
    }));
  }, [growth]);

  const growthRatePercent = useMemo(() => {
    if (growth.length < 2) return undefined;

    const last = (growth[growth.length - 1]?.clinics_count as number) ?? 0;
    const prev = (growth[growth.length - 2]?.clinics_count as number) ?? 0;

    if (!prev) return undefined;

    return Math.round(((last - prev) / prev) * 100);
  }, [growth]);

  // ============================================================
  // وضعیت اشتراک‌ها (GET /super-admin/reports/subscriptions)
  // ============================================================

  const { data: subscriptions } = useQuery({
    queryKey: queryKeys.superAdminReports.subscriptionsReport(),
    queryFn: () => superAdminReportsApi.getSubscriptionsReport(),
  });

  const planDistribution = useMemo(() => {
    const byPlan = subscriptions?.by_plan ?? {};
    const total = Object.values(byPlan).reduce((sum, v) => sum + v, 0);

    return {
      total,
      items: Object.entries(byPlan).map(([label, value], i) => ({
        label,
        value,
        tone: PLAN_COLORS[i % PLAN_COLORS.length],
      })),
    };
  }, [subscriptions]);

  // ============================================================
  // پذیرش ماژول‌ها (GET /super-admin/reports/modules)
  // ============================================================

  const { data: moduleUsage = [] } = useQuery({
    queryKey: queryKeys.superAdminReports.modulesReport(),
    queryFn: superAdminReportsApi.getModulesReport,
  });

  const topModule = useMemo(() => {
    if (moduleUsage.length === 0) return undefined;

    return moduleUsage.reduce((best, m) =>
      (m.active_clinics_count ?? 0) > (best.active_clinics_count ?? 0)
        ? m
        : best
    );
  }, [moduleUsage]);

  // ============================================================
  // جدول مقایسه‌ای کلینیک‌ها (GET /super-admin/reports/clinics)
  // ============================================================

  const { data: clinicsReport } = useQuery({
    queryKey: queryKeys.superAdminReports.clinicsReport({ per_page: 100 }),
    queryFn: () => superAdminReportsApi.getClinicsReport({ per_page: 100 }),
  });

  const topClinicsByRevenue = useMemo(() => {
    const rows = clinicsReport?.items ?? [];

    return [...rows]
      .sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))
      .slice(0, 5);
  }, [clinicsReport]);

  // ============================================================
  // خروجی CSV
  // ============================================================

  async function handleExport() {
    setIsExporting(true);

    try {
      const { blob, filename } = await superAdminReportsApi.exportReport({
        report_type: exportType,
      });

      downloadBlob(blob, filename);
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error ? err.message : "خطا در دریافت خروجی گزارش"
      );
    } finally {
      setIsExporting(false);
    }
  }

  const KPIS = [
    {
      icon: TrendingUp,
      tone: "text-primary-dark bg-primary-light/20 dark:text-primary-light dark:bg-primary/10",
      label: "درآمد کلینیک‌ها",
      value: revenueLoading ? "…" : fmtToman(revenue?.total),
    },
    {
      icon: Percent,
      tone: "text-purple-600 bg-secondary-purple/40 dark:text-purple-300 dark:bg-purple-500/10",
      label: "رشد ماهانه کلینیک‌ها",
      value:
        growthRatePercent === undefined
          ? "—"
          : `${growthRatePercent > 0 ? "+" : ""}${fmt(growthRatePercent)}٪`,
    },
    {
      icon: Layers,
      tone: "text-blue-600 bg-secondary-blue/40 dark:text-blue-300 dark:bg-blue-500/10",
      label: "پرمصرف‌ترین ماژول",
      value: topModule
        ? MODULE_LABELS[topModule.module_key] ??
          topModule.module_label ??
          topModule.module_key
        : "—",
    },
    {
      icon: Clock,
      tone: "text-danger bg-red-50 dark:text-red-400 dark:bg-red-500/10",
      label: "اشتراک‌های نزدیک انقضا",
      value: fmt(subscriptions?.expiring_soon?.length),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
            گزارش‌ها
          </h1>

          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            تحلیل درآمد، رشد کلینیک‌ها و مصرف ماژول‌ها
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={exportType}
            onChange={(e) =>
              setExportType(e.target.value as ReportExportType)
            }
            className="
              rounded-xl border border-gray-200 bg-white
              px-3 py-2 text-xs text-gray-600
              dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300
            "
          >
            {EXPORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                خروجی {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="
              flex items-center gap-2 rounded-xl
              border border-gray-200 bg-white
              px-4 py-2 text-xs text-gray-600
              transition-colors
              hover:bg-gray-50
              disabled:cursor-not-allowed disabled:opacity-60
              dark:border-gray-700
              dark:bg-gray-800
              dark:text-gray-300
              dark:hover:bg-gray-750
            "
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            دانلود CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="
              rounded-2xl
              border border-gray-100
              bg-white p-4
              transition-colors
              dark:border-gray-800
              dark:bg-gray-900
            "
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${k.tone}`}
            >
              <k.icon className="h-4 w-4" />
            </div>

            <div className="text-base font-bold text-gray-900 dark:text-white">
              {k.value}
            </div>

            <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {k.label}
            </div>
          </div>
        ))}
      </div>

      {/* Growth + Plan Distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Patients Growth Chart */}
        <div
          className="
            rounded-2xl
            border border-gray-100
            bg-white p-5
            dark:border-gray-800
            dark:bg-gray-900
          "
        >
          <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">
            روند رشد بیماران (۶ ماه اخیر)
          </h3>

          {growth.length === 0 ? (
            <div className="flex h-[120px] items-center justify-center text-xs text-gray-400 dark:text-gray-500">
              داده‌ای برای نمایش وجود ندارد.
            </div>
          ) : (
            <svg
              viewBox={`-10 0 ${chartW + 20} ${chartH + 25}`}
              className="w-full"
            >
              <polyline
                points={patientCoords.map((c) => `${c.x},${c.y}`).join(" ")}
                fill="none"
                stroke="#0EA5A4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {patientCoords.map((c, i) => (
                <circle key={i} cx={c.x} cy={c.y} r="3" fill="#0EA5A4" />
              ))}

              {growth.map((m, i) => (
                <text
                  key={`${m.month}-${i}`}
                  x={patientCoords[i].x}
                  y={chartH + 16}
                  fontSize="8"
                  fill="#9CA3AF"
                  textAnchor="middle"
                >
                  {m.month ?? ""}
                </text>
              ))}
            </svg>
          )}
        </div>

        {/* Plan Distribution */}
        <div
          className="
            rounded-2xl
            border border-gray-100
            bg-white p-5
            dark:border-gray-800
            dark:bg-gray-900
          "
        >
          <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">
            توزیع کلینیک‌ها بر اساس پلن
          </h3>

          {planDistribution.items.length === 0 ? (
            <div className="flex h-28 items-center justify-center text-xs text-gray-400 dark:text-gray-500">
              داده‌ای برای نمایش وجود ندارد.
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <div
                  className="flex h-28 w-28 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(${planDistribution.items
                      .map((p, i, arr) => {
                        const before = arr
                          .slice(0, i)
                          .reduce((s, x) => s + x.value, 0);
                        const start =
                          (before / planDistribution.total) * 100;
                        const end =
                          ((before + p.value) / planDistribution.total) *
                          100;
                        return `${p.tone} ${start}% ${end}%`;
                      })
                      .join(", ")})`,
                  }}
                >
                  <div
                    className="
                      flex h-20 w-20 items-center justify-center
                      rounded-full
                      bg-white
                      text-sm font-bold text-gray-800
                      dark:bg-gray-900 dark:text-white
                    "
                  >
                    {fmt(planDistribution.total)}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs">
                {planDistribution.items.map((p) => (
                  <div
                    key={p.label}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: p.tone }}
                      />
                      {p.label}
                    </span>

                    <span className="text-gray-700 dark:text-gray-200">
                      {fmt(p.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Subscriptions expiring soon */}
        <div
          className="
            rounded-2xl
            border border-gray-100
            bg-white p-5
            dark:border-gray-800
            dark:bg-gray-900
          "
        >
          <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">
            اشتراک‌های نزدیک انقضا
          </h3>

          <div className="space-y-3">
            {(subscriptions?.expiring_soon ?? []).length === 0 && (
              <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
                اشتراکی نزدیک انقضا نیست.
              </div>
            )}

            {(subscriptions?.expiring_soon ?? [])
              .slice(0, 5)
              .map((s, i) => (
                <div
                  key={s.clinic_id ?? i}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-gray-700 dark:text-gray-200">
                      {s.clinic_name ?? "—"}
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">
                      {s.plan_name ?? "—"}
                    </div>
                  </div>

                  <span className="shrink-0 text-gray-500 dark:text-gray-400">
                    {s.days_remaining !== undefined
                      ? `${fmt(s.days_remaining)} روز`
                      : "—"}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Module Usage + Top Clinics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Module Usage */}
        <div
          className="
            rounded-2xl
            border border-gray-100
            bg-white p-5
            dark:border-gray-800
            dark:bg-gray-900
          "
        >
          <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">
            میزان استفاده از ماژول‌ها
          </h3>

          {moduleUsage.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
              داده‌ای برای نمایش وجود ندارد.
            </div>
          ) : (
            <div className="space-y-4">
              {moduleUsage.map((m) => {
                const total = clinics.length || 1;
                const percent = Math.min(
                  100,
                  Math.round(((m.active_clinics_count ?? 0) / total) * 100)
                );

                return (
                  <div key={m.module_key}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-300">
                        {MODULE_LABELS[m.module_key] ??
                          m.module_label ??
                          m.module_key}
                      </span>

                      <span className="text-gray-400 dark:text-gray-500">
                        {fmt(m.active_clinics_count)} کلینیک ({percent}٪)
                      </span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Clinics */}
        <div
          className="
            rounded-2xl
            border border-gray-100
            bg-white p-5
            dark:border-gray-800
            dark:bg-gray-900
          "
        >
          <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">
            پردرآمدترین کلینیک‌ها
          </h3>

          {topClinicsByRevenue.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
              داده‌ای برای نمایش وجود ندارد.
            </div>
          ) : (
            <div className="space-y-3">
              {topClinicsByRevenue.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="
                        flex h-6 w-6 shrink-0
                        items-center justify-center
                        rounded-full
                        bg-primary-light/20
                        text-[10px] font-bold
                        text-primary-dark
                        dark:bg-primary/10
                        dark:text-primary-light
                      "
                    >
                      {(i + 1).toLocaleString("fa-IR")}
                    </span>

                    <div className="min-w-0">
                      <div className="truncate font-medium text-gray-700 dark:text-gray-200">
                        {c.name ?? "—"}
                      </div>

                      <div className="text-[10px] text-gray-400 dark:text-gray-500">
                        {c.plan_name ?? "—"}
                      </div>
                    </div>
                  </div>

                  <span className="shrink-0 text-gray-700 dark:text-gray-200">
                    {fmtToman(c.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
