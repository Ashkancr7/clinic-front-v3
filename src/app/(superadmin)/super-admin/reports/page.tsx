"use client";

import {
  Download,
  ChevronDown,
  TrendingUp,
  Percent,
  Layers,
  UserMinus,
  Images,
  CalendarClock,
  MessageSquare,
  Users,
  Video,
} from "lucide-react";

const KPIS = [
  {
    icon: TrendingUp,
    tone: "text-primary-dark bg-primary-light/20 dark:text-primary-light dark:bg-primary/10",
    label: "درآمد سال جاری",
    value: "۵,۲۴۰,۰۰۰,۰۰۰ تومان",
  },
  {
    icon: Percent,
    tone: "text-purple-600 bg-secondary-purple/40 dark:text-purple-300 dark:bg-purple-500/10",
    label: "میانگین رشد ماهانه",
    value: "۱۲٪+",
  },
  {
    icon: Layers,
    tone: "text-blue-600 bg-secondary-blue/40 dark:text-blue-300 dark:bg-blue-500/10",
    label: "پرمصرف‌ترین ماژول",
    value: "نوبت‌دهی هوشمند",
  },
  {
    icon: UserMinus,
    tone: "text-danger bg-red-50 dark:text-red-400 dark:bg-red-500/10",
    label: "نرخ ریزش مشتری",
    value: "۲.۱٪",
  },
];

const REVENUE_MONTHS = [
  { month: "دی", value: 320 },
  { month: "بهمن", value: 360 },
  { month: "اسفند", value: 340 },
  { month: "فروردین", value: 410 },
  { month: "اردیبهشت", value: 450 },
  { month: "خرداد", value: 486 },
];

const PLAN_DISTRIBUTION = [
  { label: "پلن حرفه‌ای", value: 12, tone: "#0EA5A4" },
  { label: "پلن استاندارد", value: 14, tone: "#DDD6FE" },
  { label: "پلن پایه", value: 6, tone: "#FBCFE8" },
];

const MODULE_USAGE = [
  {
    icon: CalendarClock,
    label: "نوبت‌دهی هوشمند",
    percent: 92,
  },
  {
    icon: Users,
    label: "پرونده مرکزی بیمار",
    percent: 84,
  },
  {
    icon: MessageSquare,
    label: "چت و پیام‌ها",
    percent: 71,
  },
  {
    icon: Images,
    label: "عکس‌های قبل و بعد",
    percent: 63,
  },
  {
    icon: Video,
    label: "تماس تصویری",
    percent: 38,
  },
];

const TOP_CLINICS = [
  {
    name: "کلینیک زیبایی آرامش",
    revenue: "۹۸,۰۰۰,۰۰۰",
    plan: "پلن حرفه‌ای",
  },
  {
    name: "مرکز جوانسازی بهار",
    revenue: "۹۸,۰۰۰,۰۰۰",
    plan: "پلن حرفه‌ای",
  },
  {
    name: "رویای زیبا",
    revenue: "۹۸,۰۰۰,۰۰۰",
    plan: "پلن حرفه‌ای",
  },
  {
    name: "مرکز پوست و مو رویان",
    revenue: "۵۴,۰۰۰,۰۰۰",
    plan: "پلن استاندارد",
  },
  {
    name: "کلینیک زیبایی نیکو",
    revenue: "۵۴,۰۰۰,۰۰۰",
    plan: "پلن استاندارد",
  },
];

export default function ReportsPage() {
  const chartW = 320;
  const chartH = 120;

  const maxVal = Math.max(...REVENUE_MONTHS.map((m) => m.value));

  const stepX = chartW / (REVENUE_MONTHS.length - 1);

  const coords = REVENUE_MONTHS.map((m, i) => ({
    x: i * stepX,
    y: chartH - (m.value / (maxVal + 60)) * chartH,
  }));

  const linePoints = coords
    .map((c) => `${c.x},${c.y}`)
    .join(" ");

  const total = PLAN_DISTRIBUTION.reduce(
    (sum, p) => sum + p.value,
    0
  );

  let cumulative = 0;

  const gradientParts = PLAN_DISTRIBUTION.map((p) => {
    const start = (cumulative / total) * 100;

    cumulative += p.value;

    const end = (cumulative / total) * 100;

    return `${p.tone} ${start}% ${end}%`;
  }).join(", ");

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
          <button
            className="
              flex items-center gap-1.5 rounded-xl
              border border-gray-200 bg-white
              px-3 py-2 text-xs text-gray-600
              transition-colors
              hover:bg-gray-50
              dark:border-gray-700
              dark:bg-gray-800
              dark:text-gray-300
              dark:hover:bg-gray-750
            "
          >
            ۶ ماه اخیر

            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          <button
            className="
              flex items-center gap-2 rounded-xl
              border border-gray-200 bg-white
              px-4 py-2 text-xs text-gray-600
              transition-colors
              hover:bg-gray-50
              dark:border-gray-700
              dark:bg-gray-800
              dark:text-gray-300
              dark:hover:bg-gray-750
            "
          >
            <Download className="h-3.5 w-3.5" />

            دانلود گزارش
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

      {/* Revenue + Plan Distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue Chart */}
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
            روند درآمد (میلیون تومان)
          </h3>

          <svg
            viewBox={`-10 0 ${chartW + 20} ${chartH + 25}`}
            className="w-full"
          >
            <polyline
              points={linePoints}
              fill="none"
              stroke="#0EA5A4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
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

            {REVENUE_MONTHS.map((m, i) => (
              <text
                key={m.month}
                x={coords[i].x}
                y={chartH + 16}
                fontSize="8"
                fill="#9CA3AF"
                textAnchor="middle"
              >
                {m.month}
              </text>
            ))}
          </svg>
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

          <div className="flex justify-center">
            <div
              className="flex h-28 w-28 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(${gradientParts})`,
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
                {total.toLocaleString("fa-IR")}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 text-xs">
            {PLAN_DISTRIBUTION.map((p) => (
              <div
                key={p.label}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: p.tone,
                    }}
                  />

                  {p.label}
                </span>

                <span className="text-gray-700 dark:text-gray-200">
                  {p.value.toLocaleString("fa-IR")}
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

          <div className="space-y-4">
            {MODULE_USAGE.map((m) => (
              <div key={m.label}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <m.icon className="h-3.5 w-3.5 text-primary-dark dark:text-primary-light" />

                    {m.label}
                  </span>

                  <span className="text-gray-400 dark:text-gray-500">
                    {m.percent}٪
                  </span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${m.percent}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
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

          <div className="space-y-3">
            {TOP_CLINICS.map((c, i) => (
              <div
                key={c.name}
                className="
                  flex items-center justify-between
                  gap-3 text-xs
                "
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
                      {c.name}
                    </div>

                    <div className="text-[10px] text-gray-400 dark:text-gray-500">
                      {c.plan}
                    </div>
                  </div>
                </div>

                <span className="shrink-0 text-gray-700 dark:text-gray-200">
                  {c.revenue} تومان
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}