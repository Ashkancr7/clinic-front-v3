
"use client";

import { useMemo, useState } from "react";

import {
  Search,
  SlidersHorizontal,
  Download,
  Wallet,
  TrendingUp,
  XCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Landmark,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const TRANSACTIONS = [
  {
    id: "TRX-10248",
    clinic: "کلینیک زیبایی آرامش",
    type: "renewal",
    method: "کارت بانکی",
    amount: "۹,۸۰۰,۰۰۰",
    date: "۱۴۰۳/۰۴/۱۵ - ۱۰:۱۵",
    status: "success",
  },
  {
    id: "TRX-10247",
    clinic: "مرکز پوست و مو رویان",
    type: "subscription",
    method: "درگاه اینترنتی",
    amount: "۴,۵۰۰,۰۰۰",
    date: "۱۴۰۳/۰۴/۱۵ - ۰۹:۴۷",
    status: "success",
  },
  {
    id: "TRX-10246",
    clinic: "کلینیک لیزر ماهرخ",
    type: "renewal",
    method: "کارت بانکی",
    amount: "۱,۹۰۰,۰۰۰",
    date: "۱۴۰۳/۰۴/۱۴ - ۱۶:۳۰",
    status: "failed",
  },
  {
    id: "TRX-10245",
    clinic: "مرکز جوانسازی بهار",
    type: "subscription",
    method: "درگاه اینترنتی",
    amount: "۹,۸۰۰,۰۰۰",
    date: "۱۴۰۳/۰۴/۱۴ - ۱۴:۱۰",
    status: "pending",
  },
  {
    id: "TRX-10244",
    clinic: "کلینیک زیبایی نیکو",
    type: "renewal",
    method: "کارت بانکی",
    amount: "۴,۵۰۰,۰۰۰",
    date: "۱۴۰۳/۰۴/۱۳ - ۱۱:۰۵",
    status: "success",
  },
  {
    id: "TRX-10243",
    clinic: "کلینیک دل‌آرام",
    type: "refund",
    method: "کیف پول",
    amount: "۱,۹۰۰,۰۰۰-",
    date: "۱۴۰۳/۰۴/۱۲ - ۰۸:۲۰",
    status: "success",
  },
  {
    id: "TRX-10242",
    clinic: "رویای زیبا",
    type: "subscription",
    method: "درگاه اینترنتی",
    amount: "۹,۸۰۰,۰۰۰",
    date: "۱۴۰۳/۰۴/۱۰ - ۱۹:۴۰",
    status: "success",
  },
];

const TYPE_FILTERS = [
  { value: "all", label: "همه انواع" },
  { value: "subscription", label: "پرداخت اشتراک" },
  { value: "renewal", label: "تمدید اشتراک" },
  { value: "refund", label: "بازگشت وجه" },
];

const STATUS_STYLES: Record<
  string,
  {
    label: string;
    tone: string;
    icon: typeof CheckCircle2;
  }
> = {
  success: {
    label: "موفق",
    tone: "text-primary-dark dark:text-primary-light",
    icon: CheckCircle2,
  },
  pending: {
    label: "در انتظار",
    tone: "text-warning dark:text-yellow-400",
    icon: Clock,
  },
  failed: {
    label: "ناموفق",
    tone: "text-danger dark:text-red-400",
    icon: XCircle,
  },
};

const TYPE_STYLES: Record<
  string,
  {
    label: string;
    tone: string;
  }
> = {
  subscription: {
    label: "پرداخت اشتراک",
    tone: "bg-primary-light/20 text-primary-dark dark:bg-primary/15 dark:text-primary-light",
  },
  renewal: {
    label: "تمدید اشتراک",
    tone: "bg-secondary-blue/40 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  },
  refund: {
    label: "بازگشت وجه",
    tone: "bg-secondary-pink/40 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400",
  },
};

const STATS = [
  {
    icon: Wallet,
    tone: "text-primary-dark bg-primary-light/20 dark:bg-primary/15 dark:text-primary-light",
    label: "درآمد این ماه",
    value: "۴۸۶,۰۰۰,۰۰۰ تومان",
  },
  {
    icon: TrendingUp,
    tone: "text-purple-600 bg-secondary-purple/40 dark:bg-purple-500/15 dark:text-purple-400",
    label: "تعداد تراکنش‌ها",
    value: "۱۴۸",
  },
  {
    icon: CheckCircle2,
    tone: "text-primary-dark bg-primary-light/20 dark:bg-primary/15 dark:text-primary-light",
    label: "تراکنش‌های موفق",
    value: "۱۳۹",
  },
  {
    icon: XCircle,
    tone: "text-danger bg-red-50 dark:bg-red-500/10 dark:text-red-400",
    label: "تراکنش‌های ناموفق",
    value: "۹",
  },
];

export default function TransactionsPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredTransactions = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return TRANSACTIONS.filter((transaction) => {
      const matchType =
        typeFilter === "all" || transaction.type === typeFilter;

      const matchSearch =
        keyword === "" ||
        transaction.id.toLowerCase().includes(keyword) ||
        transaction.clinic.toLowerCase().includes(keyword) ||
        transaction.method.toLowerCase().includes(keyword) ||
        transaction.amount.includes(keyword);

      return matchType && matchSearch;
    });
  }, [search, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
            تراکنش‌ها
          </h1>

          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            تاریخچه‌ی کامل پرداخت‌ها و تراکنش‌های مالی سامانه
          </p>
        </div>

        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08]"
        >
          <Download className="h-4 w-4" />
          خروجی اکسل
        </button>
      </div>

      {/* Stats */}
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
      </div>

      {/* Transactions */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 transition-colors dark:border-white/10 dark:bg-white/[0.03] lg:w-80">
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-500" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی شناسه تراکنش یا نام کلینیک..."
              className="w-full bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-300 dark:text-gray-200 dark:placeholder:text-gray-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 outline-none transition-colors focus:border-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300"
            >
              {TYPE_FILTERS.map((filter) => (
                <option
                  key={filter.value}
                  value={filter.value}
                  className="bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-200"
                >
                  {filter.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              فیلتر بیشتر
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 dark:border-white/[0.07] dark:text-gray-500">
                <th className="py-2 font-medium">شناسه تراکنش</th>
                <th className="py-2 font-medium">کلینیک</th>
                <th className="py-2 font-medium">نوع</th>
                <th className="py-2 font-medium">روش پرداخت</th>
                <th className="py-2 font-medium">مبلغ (تومان)</th>
                <th className="py-2 font-medium">تاریخ</th>
                <th className="py-2 font-medium">وضعیت</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.map((transaction) => {
                const StatusIcon =
                  STATUS_STYLES[transaction.status].icon;

                const isRefund = transaction.type === "refund";

                return (
                  <tr
                    key={transaction.id}
                    className="border-b border-gray-50 transition-colors hover:bg-gray-50/60 dark:border-white/[0.05] dark:hover:bg-white/[0.03]"
                  >
                    <td
                      className="py-3 font-medium text-gray-700 dark:text-gray-300"
                      dir="ltr"
                    >
                      {transaction.id}
                    </td>

                    <td className="py-3 text-gray-700 dark:text-gray-300">
                      {transaction.clinic}
                    </td>

                    <td className="py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] ${TYPE_STYLES[transaction.type].tone}`}
                      >
                        {TYPE_STYLES[transaction.type].label}
                      </span>
                    </td>

                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5">
                        {transaction.method === "کیف پول" ? (
                          <Wallet className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                        ) : transaction.method === "کارت بانکی" ? (
                          <CreditCard className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                        ) : (
                          <Landmark className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                        )}

                        {transaction.method}
                      </span>
                    </td>

                    <td
                      className={`py-3 font-medium ${
                        isRefund
                          ? "text-danger dark:text-red-400"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {transaction.amount}
                    </td>

                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {transaction.date}
                    </td>

                    <td className="py-3">
                      <span
                        className={`flex items-center gap-1 ${STATUS_STYLES[transaction.status].tone}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />

                        {STATUS_STYLES[transaction.status].label}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-sm text-gray-400 dark:text-gray-500"
                  >
                    موردی یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-5 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            نمایش{" "}
            {filteredTransactions.length.toLocaleString("fa-IR")} از{" "}
            {TRANSACTIONS.length.toLocaleString("fa-IR")} تراکنش
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled
              className="rounded-lg border border-gray-200 p-1.5 text-gray-400 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-gray-600 dark:hover:bg-white/[0.05]"
              aria-label="صفحه قبلی"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            {[1, 2, 3].map((page) => (
              <button
                type="button"
                key={page}
                className={`h-7 w-7 rounded-lg text-xs transition ${
                  page === 1
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.06]"
                }`}
              >
                {page.toLocaleString("fa-IR")}
              </button>
            ))}

            <button
              type="button"
              className="rounded-lg border border-gray-200 p-1.5 text-gray-400 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-500 dark:hover:bg-white/[0.05]"
              aria-label="صفحه بعدی"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

