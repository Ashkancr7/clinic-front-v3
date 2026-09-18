"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  Leaf,
  Lock,
  MessageSquare,
  User,
  Eye,
  EyeOff,
  Zap,
  ShieldCheck,
  Database,
  Globe,
  Moon,
  Sun,
} from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";

const SIDE_FEATURES = [
  {
    icon: Database,
    tone:
      "text-pink-500 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/10",
    title: "اطلاعات رمزنگاری‌شده",
    desc: "کلیه داده‌های شما با بالاترین سطح رمزنگاری و امنیت ذخیره می‌شوند",
  },
  {
    icon: ShieldCheck,
    tone:
      "text-primary-dark dark:text-primary-light bg-primary-light/15 dark:bg-primary/10",
    title: "امنیت پیشرفته",
    desc: "حفاظت از اطلاعات با رمزنگاری پیشرفته و استانداردهای امنیتی",
  },
  {
    icon: Zap,
    tone:
      "text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10",
    title: "دسترسی سریع",
    desc: "ورود آسان و سریع به تمام امکانات سیستم در هر زمان و مکان",
  },
];

const FOOTER_LINKS = [
  "قوانین و مقررات",
  "سیاست حریم خصوصی",
  "پشتیبانی",
  "تماس با ما",
];

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<"password" | "otp">(
    "password"
  );

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStaffLogin() {
    if (!phone || !password) {
      setError("شماره موبایل و رمز عبور را وارد کنید");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          password,
          rememberMe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "ورود ناموفق بود");
      }

      const nextPath =
        data.user.user_type === "super_admin"
          ? "/super-admin/clinics"
          : data.clinics?.length === 1
            ? `/clinic/${data.clinics[0].slug}/dashboard`
            : "/select-clinic";

      // رمز اولیه‌ای که یکی دیگر (سوپرادمین موقع ساخت کلینیک، یا مدیر کلینیک موقع
      // دعوت کارمند) تعیین کرده؛ کاربر باید قبل از هر کار دیگری آن را عوض کند
      if (data.must_change_password) {
        router.push(`/change-password?next=${encodeURIComponent(nextPath)}`);
      } else {
        router.push(nextPath);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "ورود ناموفق بود");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpRequest() {
    if (!phone) {
      setError("شماره موبایل را وارد کنید");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "ارسال کد ناموفق بود");
      }

      router.push(`/otp?phone=${encodeURIComponent(phone)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ارسال کد ناموفق بود");
    } finally {
      setLoading(false);
    }
  }

  const handleTabChange = (tab: "password" | "otp") => {
    setActiveTab(tab);
    setError(null);
  };

  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-[#111827] dark:text-gray-100"
    >
      <div className="grid flex-1 lg:grid-cols-2">
        {/* بخش فرم ورود */}
        <div className="flex min-h-[100dvh] flex-col items-center justify-start bg-white px-5 pt-10 transition-colors duration-300 sm:pt-14 lg:pt-16 dark:bg-[#111827]">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light/15 dark:bg-primary/15">
              <Leaf className="h-8 w-8 text-primary dark:text-primary-light" />
            </div>

            <div className="text-center leading-tight">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Beauty Clinic CRM
              </h1>

              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                پلتفرم مدیریت کلینیک‌های زیبایی
              </p>
            </div>
          </div>

          {/* Login Card */}
          <div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-5 text-gray-900 shadow-sm transition-colors duration-300 sm:p-8 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-100 dark:shadow-none">
            {/* Tabs */}
            <div className="mb-7 flex border-b border-gray-100 text-xs dark:border-white/10 sm:text-sm">
              <button
                type="button"
                onClick={() => handleTabChange("password")}
                className={`flex flex-1 items-center justify-center gap-2 pb-3 font-medium transition-colors ${
                  activeTab === "password"
                    ? "border-b-2 border-primary text-primary-dark dark:text-primary-light"
                    : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                }`}
              >
                <Lock className="h-4 w-4" />
                ورود با رمز عبور
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("otp")}
                className={`flex flex-1 items-center justify-center gap-2 pb-3 font-medium transition-colors ${
                  activeTab === "otp"
                    ? "border-b-2 border-primary text-primary-dark dark:text-primary-light"
                    : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                ورود با کد تایید
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Phone */}
            <label className="mb-2 block text-sm text-gray-600 dark:text-gray-300">
              شماره موبایل
            </label>

            <div className="mb-5 flex min-h-14 items-center rounded-2xl border border-gray-200 bg-gray-50/50 px-4 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 dark:border-white/10 dark:bg-white/[0.03]">
              <User className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-500" />

              <input
                type="text"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09XXXXXXXXX"
                dir="ltr"
                className="w-full bg-transparent px-3 text-left text-sm text-gray-800 outline-none placeholder:text-gray-300 dark:text-gray-100 dark:placeholder:text-gray-600"
              />
            </div>

            {/* Password Tab */}
            {activeTab === "password" && (
              <>
                <label className="mb-2 block text-sm text-gray-600 dark:text-gray-300">
                  رمز عبور
                </label>

                <div className="mb-4 flex min-h-14 items-center rounded-2xl border border-gray-200 bg-gray-50/50 px-4 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 dark:border-white/10 dark:bg-white/[0.03]">
                  <Lock className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-500" />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleStaffLogin();
                      }
                    }}
                    placeholder="رمز عبور خود را وارد کنید"
                    className="w-full bg-transparent px-3 text-sm text-gray-800 outline-none placeholder:text-gray-300 dark:text-gray-100 dark:placeholder:text-gray-600"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="shrink-0 text-gray-300 transition hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300"
                    aria-label={
                      showPassword
                        ? "مخفی کردن رمز عبور"
                        : "نمایش رمز عبور"
                    }
                  >
                    {showPassword ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="mb-6 flex items-center justify-between text-xs">
                  <label className="flex cursor-pointer items-center gap-2 text-gray-500 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 accent-primary dark:border-white/20"
                    />

                    مرا به خاطر بسپار
                  </label>

                  <a
                    href="#forgot"
                    className="text-primary-dark transition hover:underline dark:text-primary-light"
                  >
                    رمز عبور را فراموش کرده‌اید؟
                  </a>
                </div>

                <button
                  type="button"
                  onClick={handleStaffLogin}
                  disabled={loading}
                  className="w-full rounded-2xl bg-primary py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-dark hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "در حال ورود..." : "ورود به حساب کاربری"}
                </button>
              </>
            )}

            {/* OTP Tab */}
            {activeTab === "otp" && (
              <>
                <div className="mb-5 rounded-xl bg-primary-light/10 p-3 text-xs leading-6 text-gray-500 dark:bg-primary/10 dark:text-gray-400">
                  کد تایید به شماره موبایل واردشده ارسال خواهد شد.
                </div>

                <button
                  type="button"
                  onClick={handleOtpRequest}
                  disabled={loading}
                  className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <MessageSquare className="h-4 w-4" />

                  {loading
                    ? "در حال ارسال..."
                    : "دریافت کد تایید پیامکی"}
                </button>
              </>
            )}

            {/* Password Alternative */}
            {activeTab === "password" && (
              <>
                <div className="my-6 flex items-center gap-3 text-xs text-gray-300 dark:text-gray-600">
                  <div className="h-px flex-1 bg-gray-100 dark:bg-white/10" />
                  یا
                  <div className="h-px flex-1 bg-gray-100 dark:bg-white/10" />
                </div>

                <button
                  type="button"
                  onClick={() => handleTabChange("otp")}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-primary/50 text-sm font-medium text-primary-dark transition hover:bg-primary-light/10 dark:border-primary/40 dark:text-primary-light dark:hover:bg-primary/10"
                >
                  <MessageSquare className="h-4 w-4" />
                  ورود با کد تایید پیامکی
                </button>
              </>
            )}

            {/* Register */}
            <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
              حساب کاربری ندارید؟
              <Link
                href="/patient/demo-clinic/intake"
                className="mr-1 font-medium text-primary-dark transition hover:underline dark:text-primary-light"
              >
                ثبت‌نام کنید
              </Link>
            </p>
          </div>
        </div>

        {/* بخش سمت چپ / معرفی */}
        <div className="relative hidden overflow-hidden bg-gradient-to-bl from-primary-light/20 via-white to-gray-50 px-12 py-14 transition-colors duration-300 lg:flex lg:flex-col dark:from-primary/10 dark:via-[#111827] dark:to-[#0b1120]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.7),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.03),transparent_40%)]" />

          <div className="relative z-10">
            <h2 className="max-w-md text-3xl font-extrabold leading-tight text-gray-900 dark:text-white">
              دسترسی امن و سریع
              <br />
              به مدیریت{" "}
              <span className="text-primary-dark dark:text-primary-light">
                کلینیک
              </span>{" "}
              شما
            </h2>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              با Beauty Clinic CRM، همه ابزارهای موردنیاز کلینیک‌های زیبایی در
              یک سیستم یکپارچه و هوشمند در دسترس شماست.
            </p>

            <Image
              src="/image/login.PNG"
              alt="نمای داشبورد و پنل مدیریت کلینیک"
              width={800}
              height={800}
              unoptimized
              priority
              className="mx-auto mt-4 w-full max-w-lg object-contain"
            />

            {/* Features */}
            <div className="mt-8 grid grid-cols-3 gap-4 rounded-2xl border border-white/50 bg-white/70 p-5 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
              {SIDE_FEATURES.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="rounded-xl px-2 py-2 text-center transition hover:bg-white/50 dark:hover:bg-white/[0.03]"
                  >
                    <div
                      className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${feature.tone}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                      {feature.title}
                    </div>

                    <p className="mt-1 text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
                      {feature.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Security */}
            <div className="mt-5 flex items-center justify-center gap-2 rounded-full border border-primary/10 bg-primary-light/15 px-4 py-2 text-center text-xs text-primary-dark dark:border-primary/20 dark:bg-primary/10 dark:text-primary-light">
              <Lock className="h-3.5 w-3.5 shrink-0" />

              <span>
                اطلاعات شما نزد ما امن است و به هیچ عنوان در اختیار شخص ثالث
                قرار نمی‌گیرد.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-5 py-6 text-xs text-gray-400 transition-colors duration-300 sm:px-8 md:px-12 dark:border-white/10 dark:bg-[#111827] dark:text-gray-500">
        <div className="flex flex-col items-center gap-5 md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
            <Image
              src="/image/loginflower.PNG"
              alt="Beauty Clinic CRM"
              width={80}
              height={40}
              className="w-16 dark:opacity-90 sm:w-20"
            />

            <p className="text-center leading-5">
              © Beauty Clinic CRM
              <br className="sm:hidden" /> ۱۴۰۳ تمام حقوق محفوظ است.
            </p>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-center">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link}
                href="#"
                className="transition hover:text-primary-dark dark:hover:text-primary-light"
              >
                {link}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "dark" ? "تم روشن" : "تم تیره"}
              aria-label={
                theme === "dark"
                  ? "فعال کردن تم روشن"
                  : "فعال کردن تم تیره"
              }
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-primary hover:text-primary dark:border-white/15 dark:text-gray-300 dark:hover:border-primary-light dark:hover:text-primary-light"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* Language */}
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-full border border-gray-200 px-4 text-gray-500 transition hover:border-primary hover:text-primary dark:border-white/15 dark:text-gray-300 dark:hover:border-primary-light dark:hover:text-primary-light"
            >
              <Globe className="h-4 w-4" />
              فارسی
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}