"use client";

import { use } from "react";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import { ArrowRight, Receipt } from "lucide-react";

import { PatientHeader } from "@/components/layout/PatientHeader";
import { getPatientInvoiceDetail } from "@/lib/api/patient-portal";
import { queryKeys } from "@/lib/query/keys";
import {
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  PAYMENT_METHOD_LABEL,
  formatToman,
} from "@/lib/finance-labels";

function formatJalaliDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}

export default function PatientInvoiceDetailPage({
  params,
}: {
  params: Promise<{ clinicSlug: string; invoiceId: string }>;
}) {
  const { clinicSlug, invoiceId } = use(params);

  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.patientPortal.invoiceDetail(clinicSlug, invoiceId),
    queryFn: () => getPatientInvoiceDetail(clinicSlug, invoiceId),
    enabled: !!clinicSlug && !!invoiceId,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent">
      <PatientHeader clinicSlug={clinicSlug} />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-8">
        <Link
          href={`/patient/${clinicSlug}/invoices`}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 transition hover:text-primary-dark dark:text-gray-500 dark:hover:text-primary-light"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          بازگشت به فاکتورهای من
        </Link>

        {isLoading ? (
          <p className="py-20 text-center text-sm text-gray-400 dark:text-gray-500">در حال بارگذاری...</p>
        ) : error || !invoice ? (
          <p className="py-20 text-center text-sm text-danger dark:text-red-300">
            فاکتور یافت نشد یا دریافت آن ناموفق بود.
          </p>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light/20 text-primary-dark dark:bg-primary/15 dark:text-primary-light">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-gray-900 dark:text-white" dir="ltr">
                      {invoice.invoiceNumber ?? "—"}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      صادرشده در {formatJalaliDate(invoice.createdAt)}
                    </div>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${INVOICE_STATUS_TONE[invoice.status]}`}
                >
                  {INVOICE_STATUS_LABEL[invoice.status]}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCell label="جمع جزء" value={formatToman(invoice.subtotal)} />
                <SummaryCell label="تخفیف" value={formatToman(invoice.discountTotal)} />
                <SummaryCell label="مالیات" value={formatToman(invoice.taxTotal)} />
                <SummaryCell label="مبلغ کل" value={formatToman(invoice.totalAmount)} highlight />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <SummaryCell label="پرداخت‌شده" value={formatToman(invoice.paidAmount)} />
                <SummaryCell
                  label="مانده"
                  value={formatToman(invoice.remainingAmount)}
                  highlight={invoice.remainingAmount > 0}
                  danger={invoice.remainingAmount > 0}
                />
              </div>
            </div>

            {/* اقلام فاکتور */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
              <h2 className="mb-3 text-sm font-bold text-gray-800 dark:text-gray-100">اقلام فاکتور</h2>

              {invoice.items.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">موردی ثبت نشده است.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-right text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/10">
                        <th className="py-2 font-medium text-gray-400 dark:text-gray-500">شرح</th>
                        <th className="py-2 font-medium text-gray-400 dark:text-gray-500">تعداد</th>
                        <th className="py-2 font-medium text-gray-400 dark:text-gray-500">قیمت واحد</th>
                        <th className="py-2 font-medium text-gray-400 dark:text-gray-500">مبلغ نهایی</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-50 dark:border-white/[0.05]">
                          <td className="py-2.5 text-gray-700 dark:text-gray-200">{item.description}</td>
                          <td className="py-2.5 text-gray-500 dark:text-gray-400">
                            {item.quantity.toLocaleString("fa-IR")}
                          </td>
                          <td className="py-2.5 text-gray-500 dark:text-gray-400">{formatToman(item.unitPrice)}</td>
                          <td className="py-2.5 font-medium text-gray-800 dark:text-gray-100">
                            {formatToman(item.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* پرداخت‌ها */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
              <h2 className="mb-3 text-sm font-bold text-gray-800 dark:text-gray-100">پرداخت‌ها</h2>

              {invoice.payments.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
                  هنوز پرداختی برای این فاکتور ثبت نشده است.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {invoice.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-white/10"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {formatToman(p.amount)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                          {PAYMENT_METHOD_LABEL[p.method]} · {formatJalaliDate(p.paidAt)}
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${PAYMENT_STATUS_TONE[p.status]}`}
                      >
                        {PAYMENT_STATUS_LABEL[p.status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  highlight,
  danger,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 text-center dark:bg-white/[0.04]">
      <div
        className={`text-sm font-bold ${
          danger
            ? "text-danger dark:text-red-300"
            : highlight
              ? "text-primary-dark dark:text-primary-light"
              : "text-gray-800 dark:text-gray-100"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">{label}</div>
    </div>
  );
}
