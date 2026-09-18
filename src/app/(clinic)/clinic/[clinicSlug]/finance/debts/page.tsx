"use client";

import { use } from "react";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import { Hourglass } from "lucide-react";

import { getInvoices } from "@/lib/api/finance";
import { queryKeys } from "@/lib/query/keys";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, formatToman } from "@/lib/finance-labels";

export default function DebtsPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);

  const {
    data: invoices = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.finance.invoices(clinicSlug),
    queryFn: () => getInvoices(clinicSlug),
    enabled: !!clinicSlug,
  });

  const debts = invoices
    .filter((inv) => (inv.status === "issued" || inv.status === "partially_paid") && inv.remainingAmount > 0)
    .sort((a, b) => b.remainingAmount - a.remainingAmount);

  const totalOutstanding = debts.reduce((sum, inv) => sum + inv.remainingAmount, 0);

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
        <Hourglass className="h-5 w-5 text-primary-dark dark:text-primary-light" /> بدهی‌ها
      </h1>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="text-[11px] text-gray-400 dark:text-gray-500">مجموع بدهی وصول‌نشده</div>
        <div className="mt-1 text-lg font-bold text-danger dark:text-red-300">
          {formatToman(totalOutstanding)}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</p>
        ) : error ? (
          <p className="py-10 text-center text-xs text-danger dark:text-red-300">دریافت اطلاعات ناموفق بود.</p>
        ) : debts.length === 0 ? (
          <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">بدهی وصول‌نشده‌ای وجود ندارد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 dark:border-gray-800 dark:text-gray-500">
                  <th className="py-2 font-medium">شماره فاکتور</th>
                  <th className="py-2 font-medium">بیمار</th>
                  <th className="py-2 font-medium">مبلغ کل</th>
                  <th className="py-2 font-medium">باقی‌مانده</th>
                  <th className="py-2 font-medium">وضعیت</th>
                  <th className="py-2 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-3 text-gray-700 dark:text-gray-200" dir="ltr">
                      {inv.invoiceNumber ?? "—"}
                    </td>
                    <td className="py-3 text-gray-700 dark:text-gray-200">{inv.patientName ?? "—"}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">{formatToman(inv.totalAmount)}</td>
                    <td className="py-3 font-medium text-danger dark:text-red-300">
                      {formatToman(inv.remainingAmount)}
                    </td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] ${INVOICE_STATUS_TONE[inv.status]}`}>
                        {INVOICE_STATUS_LABEL[inv.status]}
                      </span>
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/clinic/${clinicSlug}/finance/invoices/${inv.id}`}
                        className="text-primary-dark hover:underline dark:text-primary-light"
                      >
                        ثبت پرداخت
                      </Link>
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
