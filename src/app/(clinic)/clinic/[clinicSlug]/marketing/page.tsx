"use client";

import {
  Plus,
  Send,
  Percent,
  Users,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";

const STATS = [
  {
    icon: Send,
    tone:
      "text-primary-dark dark:text-primary-light bg-primary-light/20 dark:bg-primary/10",
    label: "کمپین‌های فعال",
    value: "۳",
  },
  {
    icon: Users,
    tone:
      "text-purple-600 dark:text-purple-300 bg-secondary-purple/40 dark:bg-purple-500/10",
    label: "مخاطبان رسیده",
    value: "۱,۸۴۰",
  },
  {
    icon: Percent,
    tone:
      "text-pink-600 dark:text-pink-300 bg-secondary-pink/40 dark:bg-pink-500/10",
    label: "کدهای تخفیف فعال",
    value: "۵",
  },
  {
    icon: TrendingUp,
    tone:
      "text-blue-600 dark:text-blue-300 bg-secondary-blue/40 dark:bg-blue-500/10",
    label: "نرخ تبدیل",
    value: "۱۲٪",
  },
];

const CAMPAIGNS = [
  {
    name: "تخفیف تابستانه بوتاکس",
    type: "پیامکی",
    audience: "۶۴۰ نفر",
    status: "فعال",
    statusTone:
      "bg-primary-light/20 text-primary-dark dark:bg-primary/10 dark:text-primary-light",
  },
  {
    name: "کد تخفیف اولین مراجعه",
    type: "لینک اختصاصی",
    audience: "نامحدود",
    status: "فعال",
    statusTone:
      "bg-primary-light/20 text-primary-dark dark:bg-primary/10 dark:text-primary-light",
  },
  {
    name: "یادآوری مراجعین غیرفعال",
    type: "پیامکی",
    audience: "۳۲۰ نفر",
    status: "زمان‌بندی‌شده",
    statusTone:
      "bg-amber-50 text-warning dark:bg-amber-500/10 dark:text-amber-300",
  },
  {
    name: "کمپین نوروزی",
    type: "پیامکی + ایمیل",
    audience: "۱,۲۰۰ نفر",
    status: "پایان‌یافته",
    statusTone:
      "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
  },
];

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            بازاریابی
          </h1>

          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            کمپین‌ها، کدهای تخفیف و جذب مجدد مراجعین
          </p>
        </div>

        <button
          type="button"
          className="
            flex items-center justify-center gap-2
            rounded-xl
            bg-primary
            px-5 py-2.5
            text-sm font-medium text-white
            transition
            hover:bg-primary-dark
            focus:outline-none
            focus:ring-2
            focus:ring-primary/30
          "
        >
          <Plus className="h-4 w-4" />
          کمپین جدید
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="
                flex items-center gap-3
                rounded-2xl
                border border-gray-100
                bg-white
                p-4
                transition-colors
                dark:border-white/10
                dark:bg-gray-900/60
              "
            >
              <div
                className={`
                  flex h-11 w-11 shrink-0
                  items-center justify-center
                  rounded-full
                  ${stat.tone}
                `}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>

                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Campaigns */}
      <div
        className="
          rounded-2xl
          border border-gray-100
          bg-white
          p-5
          dark:border-white/10
          dark:bg-gray-900/60
        "
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
            کمپین‌ها
          </h2>

          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {CAMPAIGNS.length.toLocaleString("fa-IR")} کمپین
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 dark:border-white/10 dark:text-gray-500">
                <th className="py-2 font-medium">نام کمپین</th>
                <th className="py-2 font-medium">نوع</th>
                <th className="py-2 font-medium">مخاطبان</th>
                <th className="py-2 font-medium">وضعیت</th>
                <th className="py-2 font-medium">عملیات</th>
              </tr>
            </thead>

            <tbody>
              {CAMPAIGNS.map((campaign) => (
                <tr
                  key={campaign.name}
                  className="
                    border-b
                    border-gray-50
                    transition-colors
                    hover:bg-gray-50/60
                    dark:border-white/5
                    dark:hover:bg-white/[0.03]
                  "
                >
                  <td className="py-3 font-medium text-gray-800 dark:text-gray-100">
                    {campaign.name}
                  </td>

                  <td className="py-3 text-gray-500 dark:text-gray-400">
                    {campaign.type}
                  </td>

                  <td className="py-3 text-gray-500 dark:text-gray-400">
                    {campaign.audience}
                  </td>

                  <td className="py-3">
                    <span
                      className={`
                        inline-flex
                        rounded-full
                        px-2.5
                        py-1
                        text-[11px]
                        ${campaign.statusTone}
                      `}
                    >
                      {campaign.status}
                    </span>
                  </td>

                  <td className="py-3">
                    <button
                      type="button"
                      aria-label={`عملیات کمپین ${campaign.name}`}
                      className="
                        rounded-lg
                        border border-gray-200
                        p-1.5
                        text-gray-400
                        transition-colors
                        hover:border-gray-300
                        hover:text-gray-700
                        dark:border-white/10
                        dark:text-gray-500
                        dark:hover:border-white/20
                        dark:hover:text-gray-200
                      "
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}