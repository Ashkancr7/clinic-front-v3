
"use client";

import { useState } from "react";

import {
  Settings2,
  Bell,
  ShieldCheck,
  CreditCard,
  Globe,
  Save,
  Upload,
} from "lucide-react";

const TABS = [
  { key: "general", label: "عمومی", icon: Settings2 },
  { key: "notifications", label: "اطلاع‌رسانی", icon: Bell },
  { key: "security", label: "امنیت", icon: ShieldCheck },
  { key: "billing", label: "پرداخت", icon: CreditCard },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div className="space-y-6">
      {/* هدر صفحه */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
          تنظیمات سیستم
        </h1>

        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          تنظیمات عمومی، امنیتی و پرداخت سامانه
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row-reverse">
        {/* تب‌ها */}
        <div className="flex gap-2 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible">
          {TABS.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-primary-light/15 font-medium text-primary-dark dark:bg-primary/10 dark:text-primary"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* محتوای تب */}
        <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {/* عمومی */}
          {activeTab === "general" && (
            <div className="space-y-5">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                اطلاعات عمومی سامانه
              </h2>

              <div>
                <label className="mb-1.5 block text-xs text-gray-600 dark:text-gray-300">
                  لوگوی سامانه
                </label>

                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-xl border border-gray-100 bg-gray-100 dark:border-gray-800 dark:bg-gray-800" />

                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    آپلود لوگوی جدید
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="نام سامانه"
                  defaultValue="Beauty Clinic CRM"
                />

                <TextField
                  label="ایمیل پشتیبانی"
                  defaultValue="support@beautyclinic.ir"
                  dir="ltr"
                />

                <TextField
                  label="شماره تماس پشتیبانی"
                  defaultValue="021-12345678"
                  dir="ltr"
                />

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                    <Globe className="h-3.5 w-3.5" />
                    زبان پیش‌فرض
                  </label>

                  <select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-700 outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    <option>فارسی</option>
                    <option>English</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* اطلاع‌رسانی */}
          {activeTab === "notifications" && (
            <div className="space-y-5">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                تنظیمات اطلاع‌رسانی
              </h2>

              <ToggleRow
                title="اطلاع‌رسانی ایمیلی"
                desc="ارسال ایمیل برای رویدادهای مهم سیستم (تمدید اشتراک، خطاها و ...)"
                checked={emailNotif}
                onChange={setEmailNotif}
              />

              <ToggleRow
                title="اطلاع‌رسانی پیامکی"
                desc="ارسال پیامک برای هشدارهای فوری و بحرانی"
                checked={smsNotif}
                onChange={setSmsNotif}
              />
            </div>
          )}

          {/* امنیت */}
          {activeTab === "security" && (
            <div className="space-y-5">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                امنیت حساب
              </h2>

              <ToggleRow
                title="ورود دومرحله‌ای (2FA)"
                desc="برای ورود سوپرادمین‌ها، علاوه بر رمز عبور، کد پیامکی هم درخواست شود"
                checked={twoFactor}
                onChange={setTwoFactor}
              />

              <TextField
                label="مدت‌زمان انقضای نشست (دقیقه)"
                defaultValue="60"
                dir="ltr"
              />
            </div>
          )}

          {/* پرداخت */}
          {activeTab === "billing" && (
            <div className="space-y-5">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                تنظیمات پرداخت
              </h2>

              <div>
                <label className="mb-1.5 block text-xs text-gray-600 dark:text-gray-300">
                  درگاه پرداخت پیش‌فرض
                </label>

                <select className="w-full max-w-xs rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-700 outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  <option>زرین‌پال</option>
                  <option>آی‌دی‌پی</option>
                  <option>پی‌پینگ</option>
                </select>
              </div>

              <TextField
                label="پیش‌شماره فاکتور"
                defaultValue="INV-1403-"
                dir="ltr"
              />
            </div>
          )}

          {/* دکمه ذخیره */}
          <div className="mt-8 flex justify-end border-t border-gray-100 pt-5 dark:border-gray-800">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              <Save className="h-4 w-4" />
              ذخیره تغییرات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- کامپوننت‌های کمکی ---------- */

function TextField({
  label,
  defaultValue,
  dir = "rtl",
}: {
  label: string;
  defaultValue?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-gray-600 dark:text-gray-300">
        {label}
      </label>

      <input
        type="text"
        defaultValue={defaultValue}
        dir={dir}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-700 outline-none transition-colors placeholder:text-gray-300 focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-600"
      />
    </div>
  );
}

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
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
          {title}
        </div>

        <p className="mt-0.5 text-xs leading-5 text-gray-400 dark:text-gray-500">
          {desc}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          checked
            ? "bg-primary"
            : "bg-gray-200 dark:bg-gray-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
            checked ? "right-0.5" : "right-5"
          }`}
        />
      </button>
    </div>
  );
}
``
