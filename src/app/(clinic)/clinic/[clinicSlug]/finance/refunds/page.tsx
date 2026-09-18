"use client";

import { use } from "react";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import { Undo2 } from "lucide-react";

import { getPayments } from "@/lib/api/finance";
import { queryKeys } from "@/lib/query/keys";
import { PAYMENT_METHOD_LABEL, formatToman } from "@/lib/finance-labels";

export default function RefundsPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);

  const {
    data: payments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.finance.payments(clinicSlug, "refunded"),
    queryFn: () => getPayments(clinicSlug, "refunded"),
    enabled: !!clinicSlug,
  });

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
        <Undo2 className="h-5 w-5 text-primary-dark dark:text-primary-light" /> بازپرداخت‌ها
      </h1>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="text-[11px] text-gray-400 dark:text-gray-500">مجموع بازپرداخت‌ها</div>
        <div className="mt-1 text-lg font-bold text-purple-600 dark:text-purple-300">
          {formatToman(total)}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</p>
        ) : error ? (
          <p className="py-10 text-center text-xs text-danger dark:text-red-300">دریافت اطلاعات ناموفق بود.</p>
        ) : payments.length === 0 ? (
          <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">بازپرداختی ثبت نشده است.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 dark:border-gray-800 dark:text-gray-500">
                  <th className="py-2 font-medium">بیمار</th>
                  <th className="py-2 font-medium">شماره فاکتور</th>
                  <th className="py-2 font-medium">مبلغ</th>
                  <th className="py-2 font-medium">روش</th>
                  <th className="py-2 font-medium">یادداشت</th>
                  <th className="py-2 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-3 text-gray-700 dark:text-gray-200">{p.patientName ?? "—"}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400" dir="ltr">
                      {p.invoiceNumber ?? "—"}
                    </td>
                    <td className="py-3 font-medium text-purple-600 dark:text-purple-300">
                      {formatToman(p.amount)}
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">{PAYMENT_METHOD_LABEL[p.method]}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">{p.notes ?? "—"}</td>
                    <td className="py-3">
                      <Link
                        href={`/clinic/${clinicSlug}/finance/invoices/${p.invoiceId}`}
                        className="text-primary-dark hover:underline dark:text-primary-light"
                      >
                        مشاهده فاکتور
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
