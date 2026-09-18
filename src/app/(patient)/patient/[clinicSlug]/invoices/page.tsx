"use client";

import { use } from "react";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import { Receipt, ChevronLeft } from "lucide-react";

import { PatientHeader } from "@/components/layout/PatientHeader";
import { getPatientInvoices } from "@/lib/api/patient-portal";
import { queryKeys } from "@/lib/query/keys";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, formatToman } from "@/lib/finance-labels";

function formatJalaliDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}

export default function PatientInvoicesPage({
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
    queryKey: queryKeys.patientPortal.invoices(clinicSlug),
    queryFn: () => getPatientInvoices(clinicSlug),
    enabled: !!clinicSlug,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent">
      <PatientHeader clinicSlug={clinicSlug} />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">فاکتورهای من</h1>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            صورتحساب‌های صادرشده برای شما در این کلینیک
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">در حال بارگذاری...</p>
          ) : error ? (
            <p className="py-10 text-center text-sm text-danger dark:text-red-300">
              دریافت فاکتورها ناموفق بود.
            </p>
          ) : invoices.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
              هنوز فاکتوری برای شما صادر نشده است.
            </p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/patient/${clinicSlug}/invoices/${inv.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-4 transition hover:border-primary/40 hover:bg-gray-50/70 dark:border-white/10 dark:hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light/20 text-primary-dark dark:bg-primary/15 dark:text-primary-light">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-100" dir="ltr">
                        {inv.invoiceNumber ?? "—"}
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                        {formatJalaliDate(inv.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {formatToman(inv.totalAmount)}
                      </div>
                      {inv.remainingAmount > 0 && (
                        <div className="text-[11px] text-danger dark:text-red-300">
                          مانده: {formatToman(inv.remainingAmount)}
                        </div>
                      )}
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${INVOICE_STATUS_TONE[inv.status]}`}
                    >
                      {INVOICE_STATUS_LABEL[inv.status]}
                    </span>

                    <ChevronLeft className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
