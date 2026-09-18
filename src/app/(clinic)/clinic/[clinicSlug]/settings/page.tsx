"use client";

import { use, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  Settings2,
  Clock3,
  FileText,
  Bell,
  Save,
  Upload,
  CreditCard,
  CheckCircle2,
} from "lucide-react";

import { getCurrentSubscription } from "@/lib/api/subscription";
import { queryKeys } from "@/lib/query/keys";

const TABS = [
  { key: "general", label: "عمومی", icon: Settings2 },
  { key: "hours", label: "ساعات کاری", icon: Clock3 },
  { key: "forms", label: "فرم‌ها و رضایت‌نامه‌ها", icon: FileText },
  { key: "notifications", label: "اطلاع‌رسانی", icon: Bell },
  { key: "subscription", label: "اشتراک", icon: CreditCard },
];

const WEEK_DAYS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
];

export default function ClinicSettingsPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);
  const [tab, setTab] = useState("general");
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: queryKeys.subscription.current(clinicSlug),
    queryFn: () => getCurrentSubscription(clinicSlug),
    enabled: !!clinicSlug && tab === "subscription",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          تنظیمات کلینیک
        </h1>

        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          اطلاعات عمومی، ساعات کاری و تنظیمات فرم‌ها
        </p>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 lg:flex-row-reverse">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible">
          {TABS.map((t) => {
            const Icon = t.icon;

            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-colors ${
                  tab === t.key
                    ? "bg-primary-light/15 font-medium text-primary-dark dark:bg-primary/15 dark:text-primary-light"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Main panel */}
        <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
          {/* General */}
          {tab === "general" && (
            <div className="space-y-5">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                اطلاعات عمومی کلینیک
              </h2>

              {/* Logo */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    لوگو
                  </span>
                </div>

                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Upload className="h-3.5 w-3.5" />
                  آپلود لوگوی کلینیک
                </button>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="نام کلینیک"
                  defaultValue="کلینیک زیبایی آرامش"
                />

                <Field
                  label="شماره تماس"
                  defaultValue="021-88880000"
                  dir="ltr"
                />

                <Field
                  label="آدرس"
                  defaultValue="تهران، ولیعصر، بالاتر از ونک"
                  className="sm:col-span-2"
                />
              </div>
            </div>
          )}

          {/* Working hours */}
          {tab === "hours" && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                ساعات کاری هفتگی
              </h2>

              <div className="space-y-2">
                {WEEK_DAYS.map((day) => (
                  <div
                    key={day}
                    className="flex flex-col gap-3 rounded-xl border border-gray-100 p-3 text-xs transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:hover:bg-gray-800/50"
                  >
                    <span className="w-20 shrink-0 text-gray-700 dark:text-gray-200">
                      {day}
                    </span>

                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        defaultValue="09:00"
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-gray-700 outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                      />

                      <span className="text-gray-400 dark:text-gray-500">
                        تا
                      </span>

                      <input
                        type="time"
                        defaultValue="20:00"
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-gray-700 outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                      />
                    </div>

                    <label className="flex cursor-pointer items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <input
                        type="checkbox"
                        defaultChecked={day !== "جمعه"}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800"
                      />

                      باز
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forms */}
          {tab === "forms" && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                فرم‌ها و رضایت‌نامه‌ها
              </h2>

              <p className="text-xs leading-6 text-gray-400 dark:text-gray-500">
                فرم پذیرش و رضایت‌نامه‌های هر خدمت از اینجا مدیریت می‌شوند.
              </p>

              <button
                type="button"
                className="rounded-xl bg-primary-light/15 px-4 py-2 text-xs font-medium text-primary-dark transition-colors hover:bg-primary-light/25 dark:bg-primary/15 dark:text-primary-light dark:hover:bg-primary/20"
              >
                رفتن به فرم‌ساز پذیرش و رضایت‌نامه‌ها ←
              </button>
            </div>
          )}

          {/* Notifications */}
          {tab === "notifications" && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                تنظیمات اطلاع‌رسانی
              </h2>

              <ToggleRow
                title="اطلاع‌رسانی ایمیلی"
                desc="ایمیل برای رویدادهای مهم کلینیک"
                checked={emailNotif}
                onChange={setEmailNotif}
              />

              <ToggleRow
                title="اطلاع‌رسانی پیامکی"
                desc="پیامک برای هشدارهای فوری"
                checked={smsNotif}
                onChange={setSmsNotif}
              />
            </div>
          )}

          {/* Subscription */}
          {tab === "subscription" && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                اشتراک کلینیک
              </h2>

              {subscriptionLoading ? (
                <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">
                  در حال بارگذاری...
                </p>
              ) : !subscription ? (
                <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">
                  اطلاعات اشتراک در دسترس نیست.
                </p>
              ) : (
                <>
                  <div className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-base font-bold text-gray-800 dark:text-gray-100">
                          {subscription.plan?.name ?? "بدون پلن"}
                        </div>
                        <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          {subscription.plan
                            ? `${subscription.plan.price.toLocaleString("fa-IR")} تومان / ${
                                subscription.plan.billing_cycle === "monthly" ? "ماهانه" : "سالانه"
                              }`
                            : ""}
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] ${
                          subscription.status === "active"
                            ? "bg-primary-light/20 text-primary-dark dark:bg-primary/15 dark:text-primary-light"
                            : subscription.status === "trial"
                              ? "bg-amber-50 text-warning dark:bg-amber-500/10 dark:text-amber-300"
                              : "bg-red-50 text-danger dark:bg-red-500/10 dark:text-red-300"
                        }`}
                      >
                        {subscription.status === "active"
                          ? "فعال"
                          : subscription.status === "trial"
                            ? "دوره‌ی آزمایشی"
                            : subscription.status === "expired"
                              ? "منقضی‌شده"
                              : "لغوشده"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                      <div>
                        <div className="text-gray-400 dark:text-gray-500">شروع اشتراک</div>
                        <div className="mt-1 text-gray-700 dark:text-gray-200">
                          {subscription.startedAt
                            ? new Date(subscription.startedAt).toLocaleDateString("fa-IR")
                            : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 dark:text-gray-500">پایان اشتراک</div>
                        <div className="mt-1 text-gray-700 dark:text-gray-200">
                          {subscription.expiresAt
                            ? new Date(subscription.expiresAt).toLocaleDateString("fa-IR")
                            : "نامحدود"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {subscription.plan && (
                    <div className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                      <h3 className="mb-3 text-xs font-bold text-gray-700 dark:text-gray-200">
                        محدودیت‌های پلن
                      </h3>
                      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                        <PlanLimit
                          label="حداکثر کاربران"
                          value={subscription.plan.max_users}
                        />
                        <PlanLimit
                          label="فضای فایل (مگابایت)"
                          value={subscription.plan.max_file_storage_mb}
                        />
                        <PlanLimit
                          label="پیامک در ماه"
                          value={subscription.plan.max_sms_per_month}
                        />
                      </div>

                      {subscription.plan.included_modules &&
                        subscription.plan.included_modules.length > 0 && (
                          <div className="mt-4">
                            <div className="mb-2 text-[11px] text-gray-400 dark:text-gray-500">
                              ماژول‌های شامل این پلن
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {subscription.plan.included_modules.map((m) => (
                                <span
                                  key={m}
                                  className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600 dark:bg-white/10 dark:text-gray-300"
                                >
                                  <CheckCircle2 className="h-3 w-3 text-primary-dark dark:text-primary-light" />
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  <p className="text-[11px] text-gray-300 dark:text-gray-600">
                    برای تغییر یا ارتقای پلن، با پشتیبانی تماس بگیرید.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Save */}
          {tab !== "subscription" && (
            <div className="mt-8 flex justify-end border-t border-gray-100 pt-5 dark:border-gray-800">
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
              >
                <Save className="h-4 w-4" />
                ذخیره تغییرات
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- */
/* PlanLimit */
/* ---------------------------------- */

function PlanLimit({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl bg-gray-50 p-2.5 dark:bg-white/[0.04]">
      <div className="text-gray-400 dark:text-gray-500">{label}</div>
      <div className="mt-0.5 font-medium text-gray-700 dark:text-gray-200">
        {value == null ? "نامحدود" : value.toLocaleString("fa-IR")}
      </div>
    </div>
  );
}

/* ---------------------------------- */
/* Field */
/* ---------------------------------- */

function Field({
  label,
  defaultValue,
  dir = "rtl",
  className = "",
}: {
  label: string;
  defaultValue?: string;
  dir?: "ltr" | "rtl";
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs text-gray-600 dark:text-gray-400">
        {label}
      </label>

      <input
        type="text"
        defaultValue={defaultValue}
        dir={dir}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-700 outline-none transition-colors placeholder:text-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-600 dark:focus:border-primary"
      />
    </div>
  );
}

/* ---------------------------------- */
/* Toggle */
/* ---------------------------------- */

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
      <div>
        <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
          {title}
        </div>

        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
          {desc}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked
            ? "bg-primary"
            : "bg-gray-200 dark:bg-gray-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
            checked ? "right-0.5" : "right-5"
          }`}
        />
      </button>
    </div>
  );
}