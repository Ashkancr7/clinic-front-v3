
"use client";

import {
  Bell,
  MessageSquare,
  UserPlus,
  Users,
  MessageCircle,
  CreditCard,
  Briefcase,
  ArrowUp,
  ArrowDown,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  ChevronLeft,
  ChevronDown,
  Images,
  CalendarClock,
  FolderCog,
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
import { queryKeys } from "@/lib/query/keys";

// KPI هایی که هنوز endpoint ندارند
const STATIC_KPIS = [
  {
    icon: Users,
    tone: "text-primary-dark bg-primary-light/20 dark:text-primary-light dark:bg-primary/10",
    label: "کاربران فعال",
    value: "۳,۲۸۶",
    trend: "+۱۵٪",
    trendUp: true,
    trendLabel: "نسبت به ماه گذشته",
  },
  {
    icon: MessageCircle,
    tone: "text-purple-600 bg-secondary-purple/40 dark:text-purple-300 dark:bg-purple-500/10",
    label: "مصرف پیامک (ماه جاری)",
    value: "۱۸۴,۶۵۰",
    trend: "-۴٪",
    trendUp: false,
    trendLabel: "نسبت به ماه گذشته",
    progress: 60,
    progressTone: "bg-purple-400 dark:bg-purple-500",
  },
  {
    icon: CreditCard,
    tone: "text-pink-600 bg-secondary-pink/50 dark:text-pink-300 dark:bg-pink-500/10",
    label: "اشتراک‌های فعال",
    value: "۲۴",
    caption: "از کل ۳۲ اشتراک",
    progress: 75,
    progressTone: "bg-pink-400 dark:bg-pink-500",
    progressRight: "۷۵٪",
  },
];

const CHART_POINTS = [
  { month: "دی", value: 12 },
  { month: "بهمن", value: 16 },
  { month: "اسفند", value: 20 },
  { month: "فروردین", value: 27 },
  { month: "اردیبهشت", value: 30 },
  { month: "خرداد", value: 35 },
];

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
  },
  {
    icon: BarChart3,
    tone: "text-pink-600 bg-secondary-pink/40 dark:text-pink-300 dark:bg-pink-500/10",
    title: "گزارش‌های مالی",
    desc: "مشاهده گزارش مالی کلینیک‌ها",
  },
  {
    icon: LayoutGrid,
    tone: "text-blue-600 bg-secondary-blue/40 dark:text-blue-300 dark:bg-blue-500/10",
    title: "مدیریت ماژول‌ها",
    desc: "فعال‌سازی و تنظیم ماژول‌ها",
  },
  {
    icon: FolderPlus,
    tone: "text-purple-600 bg-secondary-purple/40 dark:text-purple-300 dark:bg-purple-500/10",
    title: "ایجاد اشتراک",
    desc: "ساخت اشتراک برای کلینیک",
  },
  {
    icon: Plus,
    tone: "text-primary-dark bg-primary-light/20 dark:text-primary-light dark:bg-primary/10",
    title: "افزودن کلینیک جدید",
    desc: "ثبت کلینیک جدید در سیستم",
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

export default function SuperAdminDashboardPage() {
  const maxValue = Math.max(...CHART_POINTS.map((p) => p.value));
  const chartW = 320;
  const chartH = 120;
  const stepX = chartW / (CHART_POINTS.length - 1);

  const coords = CHART_POINTS.map((p, i) => ({
    x: i * stepX,
    y: chartH - (p.value / (maxValue + 5)) * chartH,
  }));

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");

  const [search, setSearch] = useState("");

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

  return (
    <div className="space-y-6">

      {/* آیکون‌های بالای صفحه */}
      <div className="flex items-center justify-end gap-3">
        <button className="relative rounded-full border border-gray-200 bg-white p-2.5 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800">
          <Bell className="h-4 w-4 text-gray-500 dark:text-gray-300" />

          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] text-white">
            ۱
          </span>
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

        {STATIC_KPIS.map((kpi) => (
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

            {kpi.progress !== undefined ? (
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className={`h-full rounded-full ${kpi.progressTone}`}
                    style={{ width: `${kpi.progress}%` }}
                  />
                </div>

                <div className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                  {kpi.progressRight ?? kpi.caption}
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-1 text-xs">
                <span
                  className={`flex items-center gap-0.5 font-medium ${
                    kpi.trendUp
                      ? "text-primary-dark dark:text-primary-light"
                      : "text-danger dark:text-red-400"
                  }`}
                >
                  {kpi.trendUp ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {kpi.trend}
                </span>

                <span className="text-gray-400 dark:text-gray-500">
                  {kpi.trendLabel}
                </span>
              </div>
            )}
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

      {/* رویدادها / Storage / نمودار */}
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

        {/* Storage */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            مصرف فضای ذخیره‌سازی
          </h3>

          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
            کل فضای استفاده‌شده از سیستم
          </p>

          <div className="my-4 flex justify-center">
            <div
              className="relative flex h-28 w-28 items-center justify-center rounded-full"
              style={{
                background:
                  "conic-gradient(#0EA5A4 0 24%, #374151 24% 100%)",
              }}
            >
              <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white dark:bg-gray-900">
                <span className="text-lg font-bold text-gray-800 dark:text-white">
                  ۲۴٪
                </span>

                <span className="text-[9px] text-gray-400 dark:text-gray-500">
                  از ۵۰۰ گیگابایت
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <span className="h-2 w-2 rounded-full bg-primary" />
                فضای استفاده‌شده
              </span>

              <span className="text-gray-700 dark:text-gray-300">
                ۱۲۰ گیگابایت
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <span className="h-2 w-2 rounded-full bg-gray-200 dark:bg-gray-700" />
                فضای باقی‌مانده
              </span>

              <span className="text-gray-700 dark:text-gray-300">
                ۳۸۰ گیگابایت
              </span>
            </div>
          </div>

          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-xs text-primary transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-primary-light dark:hover:bg-gray-800">
            <FolderCog className="h-4 w-4" />
            مدیریت فضای ذخیره‌سازی
          </button>
        </div>

        {/* نمودار */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 transition-colors dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              روند رشد کلینیک‌ها
            </h3>

            <button className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
              ۶ ماه اخیر
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

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

            {CHART_POINTS.map((p, i) => (
              <text
                key={p.month}
                x={coords[i].x}
                y={chartH + 16}
                fontSize="8"
                fill="#9CA3AF"
                textAnchor="middle"
              >
                {p.month}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* دسترسی سریع */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-gray-800 dark:text-gray-200">
          دسترسی سریع
        </h3>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.title}
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
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
