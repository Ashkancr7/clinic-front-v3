"use client";

import { use } from "react";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import {
  Wallet,
  Receipt,
  FileText,
  Hourglass,
  Banknote,
  CreditCard,
  Globe,
  Plus,
} from "lucide-react";

import { getInvoices, getPayments } from "@/lib/api/finance";
import { getFinanceReport } from "@/lib/api/reports";
import { queryKeys } from "@/lib/query/keys";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, PAYMENT_METHOD_LABEL, formatToman } from "@/lib/finance-labels";

export default function FinanceDashboardPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);

  const { data: report } = useQuery({
    queryKey: ["finance", clinicSlug, "report"],
    queryFn: () => getFinanceReport(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: queryKeys.finance.invoices(clinicSlug),
    queryFn: () => getInvoices(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: queryKeys.finance.payments(clinicSlug),
    queryFn: () => getPayments(clinicSlug),
    enabled: !!clinicSlug,
  });

  const invoiceCount = invoices.length;
  const avgInvoice = invoiceCount > 0 ? invoices.reduce((s, i) => s + i.totalAmount, 0) / invoiceCount : 0;

  const topDebtors = invoices
    .filter((inv) => (inv.status === "issued" || inv.status === "partially_paid") && inv.remainingAmount > 0)
    .sort((a, b) => b.remainingAmount - a.remainingAmount)
    .slice(0, 5);

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.paidAt ?? 0).getTime() - new Date(a.paidAt ?? 0).getTime())
    .slice(0, 8);

  const methodCards = report
    ? [
        { icon: Banknote, label: "نقدی", amount: report.byMethod.cash },
        { icon: CreditCard, label: "کارتخوان", amount: report.byMethod.pos },
        { icon: Globe, label: "آنلاین", amount: report.byMethod.online },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <Wallet className="h-5 w-5 text-primary-dark dark:text-primary-light" /> امور مالی
        </h1>

        <Link
          href={`/clinic/${clinicSlug}/finance/invoices`}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" /> فاکتور جدید
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-secondary-purple/40 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {invoiceCount.toLocaleString("fa-IR")}
          </div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500">تعداد فاکتورها</div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-secondary-pink/40 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300">
            <Receipt className="h-4.5 w-4.5" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">{formatToman(avgInvoice)}</div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500">میانگین مبلغ هر فاکتور</div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary-light/20 text-primary-dark dark:bg-primary/15 dark:text-primary">
            <Wallet className="h-4.5 w-4.5" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {report ? formatToman(report.totalRevenue) : "—"}
          </div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500">درآمد دریافت‌شده</div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-danger dark:bg-red-500/15 dark:text-red-300">
            <Hourglass className="h-4.5 w-4.5" />
          </div>
          <div className="text-lg font-bold text-danger dark:text-red-300">
            {report ? formatToman(report.outstandingBalance) : "—"}
          </div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500">باقی‌مانده وصول‌نشده</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Top debtors */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">بدهکاران برتر</h3>
            <Link
              href={`/clinic/${clinicSlug}/finance/debts`}
              className="text-[11px] text-primary-dark hover:underline dark:text-primary-light"
            >
              مشاهده همه بدهی‌ها
            </Link>
          </div>

          {invoicesLoading ? (
            <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</p>
          ) : topDebtors.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">بدهی وصول‌نشده‌ای وجود ندارد.</p>
          ) : (
            <div className="space-y-2">
              {topDebtors.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/clinic/${clinicSlug}/finance/invoices/${inv.id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-100 p-2.5 text-xs transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                >
                  <div>
                    <div className="font-medium text-gray-700 dark:text-gray-200">{inv.patientName ?? "—"}</div>
                    <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] ${INVOICE_STATUS_TONE[inv.status]}`}>
                      {INVOICE_STATUS_LABEL[inv.status]}
                    </span>
                  </div>
                  <span className="font-medium text-danger dark:text-red-300">
                    {formatToman(inv.remainingAmount)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Payment methods */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-bold text-gray-800 dark:text-gray-200">تفکیک روش پرداخت</h3>

          {!report ? (
            <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</p>
          ) : (
            <div className="space-y-3">
              {methodCards.map((m) => (
                <div key={m.label} className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300">
                    <m.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">{m.label}</div>
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                    {formatToman(m.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">آخرین تراکنش‌ها</h3>
          <Link
            href={`/clinic/${clinicSlug}/finance/receipts`}
            className="text-[11px] text-primary-dark hover:underline dark:text-primary-light"
          >
            مشاهده همه دریافت‌ها
          </Link>
        </div>

        {paymentsLoading ? (
          <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</p>
        ) : recentPayments.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">تراکنشی ثبت نشده است.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 dark:border-gray-800 dark:text-gray-500">
                  <th className="py-2 font-medium">بیمار</th>
                  <th className="py-2 font-medium">روش</th>
                  <th className="py-2 font-medium">مبلغ</th>
                  <th className="py-2 font-medium">شماره فاکتور</th>
                  <th className="py-2 font-medium">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2.5 font-medium text-gray-700 dark:text-gray-200">
                      {p.patientName ?? "—"}
                    </td>
                    <td className="py-2.5 text-gray-500 dark:text-gray-400">{PAYMENT_METHOD_LABEL[p.method]}</td>
                    <td className="py-2.5 text-gray-700 dark:text-gray-200">{formatToman(p.amount)}</td>
                    <td className="py-2.5 text-gray-500 dark:text-gray-400" dir="ltr">
                      {p.invoiceNumber ?? "—"}
                    </td>
                    <td className="py-2.5 text-gray-500 dark:text-gray-400">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString("fa-IR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
