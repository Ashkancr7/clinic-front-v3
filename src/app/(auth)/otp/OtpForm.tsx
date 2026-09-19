"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const phone = searchParams.get("phone") ?? "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    if (!code) {
      setError("کد را وارد کنید");
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
      setError(
        e instanceof Error ? e.message : "کد نامعتبر است"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-center justify-center px-5"
    >
      <div className="glass-content w-full max-w-sm rounded-3xl p-6 text-gray-900">
        <h1 className="mb-2 text-xl font-bold text-gray-900">
          تایید کد ورود
        </h1>

        <p className="mb-6 text-sm text-gray-500">
          کد ارسال‌شده به {phone} را وارد کنید
        </p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">
            {error}
          </p>
        )}

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="کد ۵ رقمی"
          className="mb-4 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary"
        />

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? "در حال بررسی..." : "تایید و ورود"}
        </button>
      </div>
    </div>
  );
}