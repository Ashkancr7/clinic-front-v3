"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { KeyRound, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

import { changePassword } from "@/lib/api/session";
import { ApiError } from "@/lib/api/client";

export default function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  // اگر با پرچم اجباری اینجا رسیده (نه با انتخاب خودش)، next پر است
  const isForced = Boolean(next);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("همه‌ی فیلدها را پر کنید");
      return;
    }
    if (newPassword.length < 8) {
      setError("رمز جدید باید حداقل ۸ کاراکتر باشد");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("تکرار رمز جدید با رمز جدید یکسان نیست");
      return;
    }
    if (newPassword === currentPassword) {
      setError("رمز جدید نباید با رمز فعلی یکسان باشد");
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      router.push(next || "/select-clinic");
    } catch (e) {
      if (e instanceof ApiError && e.code === "INVALID_CURRENT_PASSWORD") {
        setError("رمز فعلی وارد شده اشتباه است.");
      } else {
        setError(e instanceof Error ? e.message : "تغییر رمز ناموفق بود");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-5 py-10 text-gray-900 transition-colors duration-300 dark:bg-[#111827] dark:text-gray-100"
    >
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light/15 dark:bg-primary/15">
          <KeyRound className="h-8 w-8 text-primary dark:text-primary-light" />
        </div>
        <div className="text-center leading-tight">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">تغییر رمز عبور</h1>
          <p className="mt-1 max-w-xs text-xs text-gray-400 dark:text-gray-500">
            {isForced
              ? "رمز فعلی شما توسط مدیر سیستم تعیین شده است. لطفاً پیش از ادامه، یک رمز جدید انتخاب کنید."
              : "رمز عبور خود را به‌روزرسانی کنید."}
          </p>
        </div>
      </div>

      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-colors duration-300 sm:p-8 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
        {error && (
          <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">
              رمز عبور فعلی
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
              <input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                dir="ltr"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-3 pr-9 text-sm outline-none transition focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-100"
                placeholder="رمز فعلی"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">
              رمز عبور جدید
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                dir="ltr"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-3 pr-9 text-sm outline-none transition focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-100"
                placeholder="حداقل ۸ کاراکتر"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">
              تکرار رمز عبور جدید
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
              <input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                dir="ltr"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-3 pr-9 text-sm outline-none transition focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-100"
                placeholder="تکرار رمز جدید"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords((s) => !s)}
            className="flex items-center gap-1.5 text-xs text-gray-400 transition hover:text-primary-dark dark:text-gray-500 dark:hover:text-primary-light"
          >
            {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPasswords ? "پنهان‌کردن رمزها" : "نمایش رمزها"}
          </button>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-primary py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-dark hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "در حال ثبت..." : "ثبت رمز جدید"}
        </button>

        <div className="mt-5 flex items-center gap-2 rounded-full border border-primary/10 bg-primary-light/15 px-4 py-2 text-center text-[11px] text-primary-dark dark:border-primary/20 dark:bg-primary/10 dark:text-primary-light">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span>بعد از تغییر رمز، سایر نشست‌های شما روی دستگاه‌های دیگر خارج می‌شوند.</span>
        </div>
      </div>
    </div>
  );
}
