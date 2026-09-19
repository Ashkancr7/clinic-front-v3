"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Search,
  Download,
  Wallet,
  TrendingUp,
  AlertCircle,
  CreditCard,
  Landmark,
  Loader2,
} from "lucide-react";

import { superAdminApi } from "@/lib/api/super-admin";
import {
  superAdminReportsApi,
  downloadBlob,
} from "@/lib/api/super-admin-reports";
import { queryKeys } from "@/lib/query/keys";

const METHOD_LABELS: Record<string, string> = {
  cash: "نقدی",
  pos: "کارت‌خوان",
  online: "درگاه اینترنتی",
  credit: "اعتباری",
};

const METHOD_ICONS: Record<string, typeof Wallet> = {
  cash: Wallet,
  pos: CreditCard,
  online: Landmark,
  credit: CreditCard,
};

function fmtToman(n: number | string | undefined | null) {
  const num = typeof n === "string" ? Number(n) : n;
  if (num === undefined || num === null || Number.isNaN(num)) return "—";
  return `${num.toLocaleString("fa-IR")} تومان`;
}

function fmt(n: number | undefined | null) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString("fa-IR");
}

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // ============================================================
  // کلینیک‌ها (fallback نام در جدول درآمد)
  // ============================================================

  const { data: clinics = [] } = useQuery({
    queryKey: queryKeys.superAdmin.clinics.list(),
    queryFn: superAdminApi.getClinics,
  });

  // ============================================================
  // درآمد کلینیک‌ها (GET /super-admin/reports/revenue)
  // ============================================================

  const { data: revenue, isLoading, error } = useQuery({
    queryKey: queryKeys.superAdminReports.revenueReport({ from, to }),
    queryFn: () =>
      superAdminReportsApi.getRevenueReport({
        from: from || undefined,
        to: to || undefined,
      }),
  });

  const byClinic = revenue?.by_clinic ?? [];
  const byMethod = revenue?.by_method ?? {};

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return byClinic;

    return byClinic.filter((row) =>
      (row.clinic_name ?? "").toLowerCase().includes(keyword)
    );
  }, [byClinic, search]);

  async function handleExport() {
    setIsExporting(true);
    try {
      const { blob, filename } = await superAdminReportsApi.exportReport({
        report_type: "revenue",
        from: from || undefined,
        to: to || undefined,
      });
      downloadBlob(blob, filename);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "خطا در دریافت خروجی");
    } finally {
      setIsExporting(false);
    }
  }

  const STATS = [
    {
      icon: Wallet,
      tone: "text-primary-dark bg-primary-light/20 dark:bg-primary/15 dark:text-primary-light",
      label: "درآمد کل بازه انتخاب‌شده",
      value: isLoading ? "…" : fmtToman(revenue?.total_revenue),
    },
    {
      icon: TrendingUp,
      tone: "text-purple-600 bg-secondary-purple/40 dark:bg-purple-500/15 dark:text-purple-400",
      label: "تعداد کلینیک‌های درآمدزا",
      value: isLoading ? "…" : fmt(byClinic.length),
    },
    {
      icon: AlertCircle,
      tone: "text-danger bg-red-50 dark:bg-red-500/10 dark:text-red-400",
      label: "مانده بدهی",
      value: isLoading ? "…" : fmtToman(revenue?.outstanding_balance),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
            تراکنش‌ها و درآمد
          </h1>

          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            درآمد کلینیک‌ها از پرداخت بیماران، به تفکیک کلینیک و روش پرداخت
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08]"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          خروجی CSV
        </button>
      </div>

      {/* Stats + By Method */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition-colors dark:border-white/10 dark:bg-white/[0.04]"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${stat.tone}`}
            >
              <stat.icon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="truncate text-lg font-bold text-gray-900 dark:text-white">
                {stat.value}
              </div>

              <div className="text-xs text-gray-400 dark:text-gray-500">
                {stat.label}
              </div>
            </div>
          </div>
        ))}

        {Object.entries(byMethod)
          .slice(0, 1)
          .map(([method, amount]) => {
            const Icon = METHOD_ICONS[method] ?? Wallet;

            return (
              <div
                key={method}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition-colors dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary-blue/40 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="truncate text-lg font-bold text-gray-900 dark:text-white">
                    {fmtToman(amount)}
                  </div>

                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    پردرآمدترین روش: {METHOD_LABELS[method] ?? method}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* By method breakdown */}
      {Object.keys(byMethod).length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">
            درآمد به تفکیک روش پرداخت
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Object.entries(byMethod).map(([method, amount]) => {
              const Icon = METHOD_ICONS[method] ?? Wallet;

              return (
                <div
                  key={method}
                  className="flex items-center gap-2.5 rounded-xl border border-gray-100 p-3 text-xs dark:border-gray-800"
                >
                  <Icon className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {METHOD_LABELS[method] ?? method}
                    </div>
                    <div className="font-bold text-gray-800 dark:text-gray-100">
                      {fmtToman(amount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Revenue by clinic */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 transition-colors dark:border-white/10 dark:bg-white/[0.03] lg:w-80">
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-500" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی نام کلینیک..."
              className="w-full bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-300 dark:text-gray-200 dark:placeholder:text-gray-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 outline-none dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300"
            />
            <span className="text-xs text-gray-400">تا</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 outline-none dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300"
            />
          </div>
        </div>

        {isLoading && (
          <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            در حال بارگذاری...
          </div>
        )}

        {error && (
          <div className="py-10 text-center text-sm text-danger dark:text-red-400">
            خطا در دریافت گزارش درآمد
          </div>
        )}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 dark:border-white/[0.07] dark:text-gray-500">
                  <th className="py-2 font-medium">کلینیک</th>
                  <th className="py-2 font-medium">تعداد پرداخت</th>
                  <th className="py-2 font-medium">درآمد (تومان)</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.clinic_id}
                    className="border-b border-gray-50 transition-colors hover:bg-gray-50/60 dark:border-white/[0.05] dark:hover:bg-white/[0.03]"
                  >
                    <td className="py-3 font-medium text-gray-700 dark:text-gray-300">
                      {row.clinic_name ??
                        clinics.find((c) => c.id === row.clinic_id)?.name ??
                        "—"}
                    </td>

                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {fmt(row.payment_count)}
                    </td>

                    <td className="py-3 text-gray-700 dark:text-gray-300">
                      {fmtToman(row.total_amount)}
                    </td>
                  </tr>
                ))}

                {filteredRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
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

        <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          نمایش {fmt(filteredRows.length)} از {fmt(byClinic.length)} کلینیک
        </div>
      </div>
    </div>
  );
}
