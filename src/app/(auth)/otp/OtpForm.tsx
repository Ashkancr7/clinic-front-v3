"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Leaf,
  MessageSquare,
  ShieldCheck,
  Pencil,
  RotateCcw,
  ArrowRight,
} from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";

const CODE_LENGTH = 5;
const RESEND_SECONDS = 120;

export default function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();

  const phone = searchParams.get("phone") ?? "";

  const [digits, setDigits] = useState<string[]>(
    Array(CODE_LENGTH).fill("")
  );
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const code = digits.join("");

  function updateDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "");

    if (!clean) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    const chars = clean.split("");

    setDigits((prev) => {
      const next = [...prev];
      let cursor = index;
      for (const ch of chars) {
        if (cursor >= CODE_LENGTH) break;
        next[cursor] = ch;
        cursor += 1;
      }
      const focusIndex = Math.min(cursor, CODE_LENGTH - 1);
      requestAnimationFrame(() => inputsRef.current[focusIndex]?.focus());
      return next;
    });

    setError(null);
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
      setDigits((prev) => {
        const next = [...prev];
        next[index - 1] = "";
        return next;
      });
    }

    if (e.key === "ArrowLeft" && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (e.key === "ArrowRight" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "Enter") {
      handleVerify();
    }
  }

  async function handleVerify() {
    if (code.length < CODE_LENGTH) {
      setError("کد را کامل وارد کنید");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      router.push("/select-clinic");
    } catch (e) {
      setError(e instanceof Error ? e.message : "کد نامعتبر است");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (secondsLeft > 0 || resending) return;

    setResending(true);
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
        throw new Error(data.message || "ارسال مجدد ناموفق بود");
      }

      setDigits(Array(CODE_LENGTH).fill(""));
      setSecondsLeft(RESEND_SECONDS);
      inputsRef.current[0]?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ارسال مجدد ناموفق بود");
    } finally {
      setResending(false);
    }
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeLabel = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-50 px-5 py-10 transition-colors duration-300 dark:bg-[#111827]"
    >
      {/* Logo */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light/15 dark:bg-primary/15">
          <Leaf className="h-8 w-8 text-primary dark:text-primary-light" />
        </div>

        <div className="text-center leading-tight">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Beauty Clinic CRM
          </h1>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            پلتفرم مدیریت کلینیک‌های زیبایی
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-6 text-gray-900 shadow-sm transition-colors duration-300 sm:p-8 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-100 dark:shadow-none">
        {/* Icon badge */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light/15 dark:bg-primary/15">
          <MessageSquare className="h-7 w-7 text-primary dark:text-primary-light" />
        </div>

        <h2 className="text-center text-xl font-bold text-gray-900 dark:text-white">
          تایید کد ورود
        </h2>

        <p className="mx-auto mt-2 max-w-[85%] text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          کد ۵ رقمی ارسال‌شده به
          <span
            dir="ltr"
            className="mx-1 font-medium text-gray-700 dark:text-gray-200"
          >
            {phone}
          </span>
          را وارد کنید
        </p>

        <Link
          href="/login"
          className="mx-auto mt-2 flex w-fit items-center gap-1 text-xs font-medium text-primary-dark transition hover:underline dark:text-primary-light"
        >
          <Pencil className="h-3 w-3" />
          ویرایش شماره موبایل
        </Link>

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-xs text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Code inputs */}
        <div
          dir="ltr"
          className="mt-7 flex items-center justify-center gap-2 sm:gap-3"
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              value={digit}
              onChange={(e) => updateDigit(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`h-12 w-11 rounded-2xl border text-center text-lg font-semibold outline-none transition sm:h-14 sm:w-12 ${
                digit
                  ? "border-primary bg-primary-light/10 text-primary-dark dark:border-primary-light dark:bg-primary/10 dark:text-primary-light"
                  : "border-gray-200 bg-gray-50/50 text-gray-800 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-100"
              } focus:border-primary focus:ring-4 focus:ring-primary/10`}
            />
          ))}
        </div>

        {/* Verify button */}
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading || code.length < CODE_LENGTH}
          className="mt-7 w-full rounded-2xl bg-primary py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-dark hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "در حال بررسی..." : "تایید و ورود"}
        </button>

        {/* Resend */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          {secondsLeft > 0 ? (
            <span>
              ارسال مجدد کد تا{" "}
              <span dir="ltr" className="font-medium text-gray-600 dark:text-gray-300">
                {timeLabel}
              </span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="flex items-center gap-1.5 font-medium text-primary-dark transition hover:underline disabled:opacity-50 dark:text-primary-light"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {resending ? "در حال ارسال..." : "ارسال مجدد کد"}
            </button>
          )}
        </div>

        {/* Security note */}
        <div className="mt-6 flex items-center justify-center gap-2 rounded-full border border-primary/10 bg-primary-light/15 px-4 py-2 text-center text-[11px] text-primary-dark dark:border-primary/20 dark:bg-primary/10 dark:text-primary-light">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span>این کد فقط تا ۲ دقیقه اعتبار دارد و محرمانه است</span>
        </div>
      </div>

      {/* Back link */}
      <Link
        href="/login"
        className="flex items-center gap-1 text-xs text-gray-400 transition hover:text-primary-dark dark:text-gray-500 dark:hover:text-primary-light"
      >
        <ArrowRight className="h-3.5 w-3.5" />
        بازگشت به صفحه ورود
      </Link>
    </div>
  );
}