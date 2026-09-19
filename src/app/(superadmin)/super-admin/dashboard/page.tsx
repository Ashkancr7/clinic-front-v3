
"use client";

import {
  Bell,
  MessageSquare,
  UserPlus,
  Users,
  Activity,
  CreditCard,
  Briefcase,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  ChevronLeft,
  Images,
  CalendarClock,
  AlertTriangle,
  Plus,
  FolderPlus,
  LayoutGrid,
  BarChart3,
  Settings,
  Headset,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";

import { superAdminApi, type Clinic } from "@/lib/api/super-admin";
import { superAdminReportsApi } from "@/lib/api/super-admin-reports";
import { queryKeys } from "@/lib/query/keys";

// این‌ها هنوز endpoint اختصاصی ندارند؛ فعلاً به‌عنوان placeholder نمایشی هستند
const EVENTS = [
  {
    icon: Briefcase,
    tone: "bg-primary-light/20 text-primary-dark dark:bg-primary/10 dark:text-primary-light",
    text: "کلینیک آرامش اشتراک خود را تمدید کرد.",
    time: "۱۰:۱۵",
  },
  {
    icon: UserPlus,
    tone: "bg-primary-light/20 text-primary-dark dark:bg-primary/10 dark:text-primary-light",
    text: "کاربر جدید در کلینیک رویان ثبت‌نام کرد.",
    time: "۰۹:۴۷",
  },
  {
    icon: MessageSquare,
    tone: "bg-secondary-pink/40 text-pink-600 dark:bg-pink-500/10 dark:text-pink-300",
    text: "مصرف پیامک کلینیک بهار از ۸۰٪ عبور کرد.",
    time: "دیروز ۱۶:۳۰",
  },
  {
    icon: Headset,
    tone: "bg-secondary-purple/40 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300",
    text: "درخواست پشتیبانی جدید از کلینیک نیکو",
    time: "دیروز ۱۴:۱۰",
  },
];

const QUICK_ACTIONS = [
  {
    icon: Settings,
    tone: "text-gray-500 bg-gray-100 dark:text-gray-300 dark:bg-gray-800",
    title: "تنظیمات سیستم",
    desc: "تنظیمات عمومی سامانه",
    href: "/super-admin/settings",
  },
  {
    icon: BarChart3,
    tone: "text-pink-600 bg-secondary-pink/40 dark:text-pink-300 dark:bg-pink-500/10",
    title: "گزارش‌های مالی",
    desc: "مشاهده گزارش مالی کلینیک‌ها",
    href: "/super-admin/transactions",
  },
  {
    icon: LayoutGrid,
    tone: "text-blue-600 bg-secondary-blue/40 dark:text-blue-300 dark:bg-blue-500/10",
    title: "مدیریت ماژول‌ها",
    desc: "فعال‌سازی و تنظیم ماژول‌ها",
    href: "/super-admin/modules",
  },
  {
    icon: FolderPlus,
    tone: "text-purple-600 bg-secondary-purple/40 dark:text-purple-300 dark:bg-purple-500/10",
    title: "ایجاد اشتراک",
    desc: "ساخت اشتراک برای کلینیک",
    href: "/super-admin/plans",
  },
  {
    icon: Plus,
    tone: "text-primary-dark bg-primary-light/20 dark:text-primary-light dark:bg-primary/10",
    title: "افزودن کلینیک جدید",
    desc: "ثبت کلینیک جدید در سیستم",
    href: "/super-admin/clinics",
  },
];

const STATUS_LABELS: Record<
  Clinic["status"],
  { label: string; tone: string }
> = {
  active: {
    label: "فعال",
    tone: "text-primary-dark dark:text-primary-light",
  },
  inactive: {
    label: "غیرفعال",
    tone: "text-gray-400 dark:text-gray-500",
  },
  suspended: {
    label: "معلق",
    tone: "text-danger dark:text-red-400",
  },
};

// عدد را فرمت فارسی می‌کند، یا اگر مقدار نامشخص بود «—» برمی‌گرداند
function fmt(n: number | undefined | null) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString("fa-IR");
}

export default function SuperAdminDashboardPage() {
  const [search, setSearch] = useState("");

  // ============================================================
  // کلینیک‌ها
  // ============================================================

  const {
    data: clinics = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.superAdmin.clinics.list(),
    queryFn: superAdminApi.getClinics,
  });

  const filteredClinics = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return clinics;

    return clinics.filter(
      (clinic) =>
        clinic.name.toLowerCase().includes(keyword) ||
        (clinic.phone ?? "").includes(keyword) ||
        STATUS_LABELS[clinic.status].label.includes(keyword)
    );
  }, [clinics, search]);

  const previewClinics = filteredClinics.slice(0, 5);

  const clinicsKpi = {
    icon: Briefcase,
    tone: "text-primary-dark bg-primary-light/20 dark:text-primary-light dark:bg-primary/10",
    label: "تعداد کلینیک‌ها",
    value: clinics.length.toLocaleString("fa-IR"),
  };

  // ============================================================
  // داشبورد کلی (GET /super-admin/dashboard)
  // ============================================================

  const {
    data: overview,
    isLoading: overviewLoading,
  } = useQuery({
    queryKey: queryKeys.superAdminReports.dashboard(),
    queryFn: superAdminReportsApi.getDashboard,
  });

  const KPIS = [
    {
      icon: Users,
      tone: "text-primary-dark bg-primary-light/20 dark:text-primary-light dark:bg-primary/10",
      label: "کاربران سیستم",
      value: overviewLoading
        ? "…"
        : fmt(
            (overview?.active_users_count as number | undefined) ??
              (overview?.users_count as number | undefined)
          ),
    },
    {
      icon: Activity,
      tone: "text-purple-600 bg-secondary-purple/40 dark:text-purple-300 dark:bg-purple-500/10",
      label: "فعالیت ۳۰ روز اخیر",
      value: overviewLoading
        ? "…"
        : fmt(overview?.recent_activity_count as number | undefined),
    },
    {
      icon: CreditCard,
      tone: "text-pink-600 bg-secondary-pink/50 dark:text-pink-300 dark:bg-pink-500/10",
      label: "اشتراک‌های فعال",
      value: overviewLoading
        ? "…"
        : fmt(overview?.active_subscriptions_count as number | undefined),
      caption:
        overview?.subscriptions_count !== undefined
          ? `از کل ${fmt(overview.subscriptions_count as number)} اشتراک`
          : undefined,
    },
  ];

  // ============================================================
  // هشدارهای عبور از سقف پلن (GET /super-admin/dashboard/alerts)
  // ============================================================

  const {
    data: alerts = [],
    isLoading: alertsLoading,
    error: alertsError,
  } = useQuery({
    queryKey: queryKeys.superAdminReports.dashboardAlerts(),
    queryFn: () => superAdminReportsApi.getDashboardAlerts(),
  });

  // ============================================================
  // روند رشد کلینیک‌ها (GET /super-admin/reports/growth)
  // ============================================================

  const { data: growth = [] } = useQuery({
    queryKey: queryKeys.superAdminReports.growthReport(6),
    queryFn: () => superAdminReportsApi.getGrowthReport({ months: 6 }),
  });

  const chartW = 320;
  const chartH = 120;

  const growthValues = growth.map(
    (g) => (g.clinics_count as number | undefined) ?? 0
  );
  const maxValue = Math.max(1, ...growthValues);
  const stepX =
    growth.length > 1 ? chartW / (growth.length - 1) : chartW;

  const coords = growth.map((g, i) => ({
    x: i * stepX,
    y:
      chartH -
      (((g.clinics_count as number | undefined) ?? 0) /
        (maxValue + Math.ceil(maxValue * 0.15) + 1)) *
        chartH,
  }));

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");

  return (
    <div className="space-y-6">

      {/* آیکون‌های بالای صفحه */}
      <div className="flex items-center justify-end gap-3">
        <button className="relative rounded-full border border-gray-200 bg-white p-2.5 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800">
          <Bell className="h-4 w-4 text-gray-500 dark:text-gray-300" />

          {alerts.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] text-white">
              {alerts.length > 9 ? "۹+" : fmt(alerts.length)}
            </span>
          )}
        </button>

        <button className="rounded-full border border-gray-200 bg-white p-2.5 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800">
          <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-300" />
        </button>

        <button className="rounded-full border border-gray-200 bg-white p-2.5 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800">
          <UserPlus className="h-4 w-4 text-gray-500 dark:text-gray-300" />
        </button>
      </div>

      {/* خوش‌آمدگویی */}
      <div className="flex items-center">
        <Image
          src="/image/user.PNG"
          alt="User"
          width={70}
          height={70}
          unoptimized
          className="rounded-full object-cover"
        />

        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
            سلام سوپرادمین!
          </h1>

          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-light/30 text-[10px] text-primary-dark dark:bg-primary/10 dark:text-primary-light">
              ✓
            </span>
            مدیریت کلینیک‌ها و اشتراک‌ها در یک نگاه
          </p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-gray-100 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {kpi.label}
              </span>

              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${kpi.tone}`}
              >
                <kpi.icon className="h-4 w-4" />
              </div>
            </div>

            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {kpi.value}
            </div>

            <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              {kpi.caption ?? "به‌صورت زنده از سرور"}
            </div>
          </div>
        ))}

        {/* تعداد کلینیک‌ها */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {clinicsKpi.label}
            </span>

            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${clinicsKpi.tone}`}
            >
              <clinicsKpi.icon className="h-4 w-4" />
            </div>
          </div>

          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {isLoading ? "…" : clinicsKpi.value}
          </div>

          <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
            {error ? "خطا در دریافت آمار" : "به‌صورت زنده از سرور"}
          </div>
        </div>
      </div>

      {/* جدول کلینیک‌ها */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-gray-900">

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            کلینیک‌ها
          </h2>

          <div className="flex items-center gap-2">

            <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 transition-colors dark:border-gray-700 dark:bg-gray-950 sm:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجوی نام یا تلفن کلینیک..."
                className="w-full bg-transparent text-xs text-gray-600 outline-none placeholder:text-gray-300 dark:text-gray-200 dark:placeholder:text-gray-600"
              />

              <Search className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600" />
            </div>

            <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              فیلتر
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            در حال بارگذاری...
          </div>
        )}

        {error && (
          <div className="py-10 text-center text-sm text-danger dark:text-red-400">
            خطا در دریافت لیست کلینیک‌ها
          </div>
        )}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-right text-xs">

              <thead>
                <tr className="border-b border-gray-100 text-gray-400 dark:border-gray-800 dark:text-gray-500">
                  <th className="py-2 font-medium">نام کلینیک</th>
                  <th className="py-2 font-medium">مدیر</th>
                  <th className="py-2 font-medium">اشتراک</th>
                  <th className="py-2 font-medium">وضعیت</th>
                  <th className="py-2 font-medium">پرداخت بعدی</th>
                  <th className="py-2 font-medium">ماژول‌های فعال</th>
                  <th className="py-2 font-medium">کاربران فعال</th>
                  <th className="py-2 font-medium">عملیات</th>
                </tr>
              </thead>

              <tbody>
                {previewClinics.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-50 transition-colors hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-gray-800/40"
                  >
                    <td className="py-3">
                      <Link
                        href={`/super-admin/clinics/${c.id}`}
                        className="flex items-center gap-2"
                      >
                        <Image
                          src="/image/user.PNG"
                          alt="User"
                          width={30}
                          height={30}
                          unoptimized
                          className="rounded-full object-cover"
                        />

                        <div>
                          <div className="font-medium text-gray-800 hover:text-primary-dark dark:text-gray-200 dark:hover:text-primary-light">
                            {c.name}
                          </div>

                          <div
                            className="text-[10px] text-gray-400 dark:text-gray-500"
                            dir="ltr"
                          >
                            {c.phone ?? "-"}
                          </div>
                        </div>
                      </Link>
                    </td>

                    <td className="py-3 text-gray-300 dark:text-gray-700">
                      —
                    </td>

                    <td className="py-3 text-gray-300 dark:text-gray-700">
                      —
                    </td>

                    <td className="py-3">
                      <span
                        className={`flex items-center gap-1 ${
                          STATUS_LABELS[c.status].tone
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {STATUS_LABELS[c.status].label}
                      </span>
                    </td>

                    <td className="py-3 text-gray-300 dark:text-gray-700">
                      —
                    </td>

                    <td className="py-3">
                      <div className="flex items-center gap-1 text-gray-200 dark:text-gray-700">
                        <Images className="h-3.5 w-3.5" />
                        <CalendarClock className="h-3.5 w-3.5" />
                        <MessageSquare className="h-3.5 w-3.5" />
                        <Users className="h-3.5 w-3.5" />
                      </div>
                    </td>

                    <td className="py-3 text-gray-300 dark:text-gray-700">
                      —
                    </td>

                    <td className="py-3">
                      <button className="rounded-lg border border-gray-200 p-1.5 text-gray-400 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-500 dark:hover:bg-gray-800">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {previewClinics.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-sm text-gray-400 dark:text-gray-500"
                    >
                      موردی یافت نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-col-reverse items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-500 sm:flex-row">
          <span>
            نمایش {previewClinics.length.toLocaleString("fa-IR")} از{" "}
            {filteredClinics.length.toLocaleString("fa-IR")} کلینیک
          </span>

          <Link
            href="/super-admin/clinics"
            className="flex items-center gap-1 text-primary-dark dark:text-primary-light"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            مشاهده همه کلینیک‌ها
          </Link>
        </div>
      </div>

      {/* رویدادها / هشدارهای پلن / نمودار */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* رویدادها */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-200">
            رویدادهای اخیر سیستم
          </h3>

          <div className="space-y-4">
            {EVENTS.map((e, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${e.tone}`}
                  >
                    <e.icon className="h-3.5 w-3.5" />
                  </div>

                  <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                    {e.text}
                  </p>
                </div>

                <span className="shrink-0 whitespace-nowrap text-[10px] text-gray-300 dark:text-gray-600">
                  {e.time}
                </span>
              </div>
            ))}
          </div>

          <button className="mt-4 flex items-center gap-1 text-xs text-primary-dark dark:text-primary-light">
            <ChevronLeft className="h-3.5 w-3.5" />
            مشاهده همه رویدادها
          </button>
        </div>

        {/* هشدارهای عبور از سقف پلن */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            کلینیک‌های نزدیک سقف پلن
          </h3>

          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
            کلینیک‌هایی که از محدودیت پلن خود عبور کرده‌اند
          </p>

          <div className="mt-4 space-y-3">
            {alertsLoading && (
              <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
                در حال بارگذاری...
              </div>
            )}

            {alertsError && (
              <div className="py-6 text-center text-xs text-danger dark:text-red-400">
                خطا در دریافت هشدارها
              </div>
            )}

            {!alertsLoading && !alertsError && alerts.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
                فعلاً هیچ کلینیکی از سقف پلن عبور نکرده.
              </div>
            )}

            {alerts.slice(0, 4).map((alertClinic, i) => (
              <Link
                key={alertClinic.id ?? i}
                href={
                  alertClinic.id
                    ? `/super-admin/clinics/${alertClinic.id}`
                    : "/super-admin/clinics"
                }
                className="flex items-start gap-2.5"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>

                <div>
                  <p className="text-xs font-medium leading-relaxed text-gray-700 dark:text-gray-200">
                    {alertClinic.name ?? "کلینیک نامشخص"}
                  </p>

                  <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                    {Array.isArray(alertClinic.exceeded_limits) &&
                    alertClinic.exceeded_limits.length > 0
                      ? alertClinic.exceeded_limits.join("، ")
                      : "عبور از سقف پلن"}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/super-admin/usage"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-xs text-primary transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-primary-light dark:hover:bg-gray-800"
          >
            مشاهده گزارش مصرف
          </Link>
        </div>

        {/* نمودار */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              روند رشد کلینیک‌ها
            </h3>

            <span className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-500 dark:border-gray-700 dark:text-gray-400">
              ۶ ماه اخیر
            </span>
          </div>

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
                points={linePoints}
                fill="none"
                stroke="#0EA5A4"
                strokeWidth="2.5"
              />

              {coords.map((c, i) => (
                <circle
                  key={i}
                  cx={c.x}
                  cy={c.y}
                  r="3"
                  fill="#0EA5A4"
                />
              ))}

              {growth.map((g, i) => (
                <text
                  key={`${g.month}-${i}`}
                  x={coords[i].x}
                  y={chartH + 16}
                  fontSize="8"
                  fill="#9CA3AF"
                  textAnchor="middle"
                >
                  {g.month ?? ""}
                </text>
              ))}
            </svg>
          )}
        </div>
      </div>

      {/* دسترسی سریع */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-gray-800 dark:text-gray-200">
          دسترسی سریع
        </h3>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.title}
              href={a.href}
              className="flex flex-col items-start gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-right transition-all hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${a.tone}`}
              >
                <a.icon className="h-4 w-4" />
              </div>

              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                {a.title}
              </div>

              <div className="text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
                {a.desc}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
