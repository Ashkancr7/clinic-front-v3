"use client";

import { use } from "react";

import { useQuery } from "@tanstack/react-query";

import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";

import { PatientHeader } from "@/components/layout/PatientHeader";
import { getPatientConsents } from "@/lib/api/patient-portal";
import { queryKeys } from "@/lib/query/keys";

function formatJalaliDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}

export default function PatientConsentsPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);

  const {
    data: consents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.patientPortal.consents(clinicSlug),
    queryFn: () => getPatientConsents(clinicSlug),
    enabled: !!clinicSlug,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent">
      <PatientHeader clinicSlug={clinicSlug} />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">رضایت‌نامه‌های من</h1>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            رضایت‌نامه‌هایی که تاکنون در این کلینیک امضا کرده‌اید
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">در حال بارگذاری...</p>
          ) : error ? (
            <p className="py-10 text-center text-sm text-danger dark:text-red-300">
              دریافت رضایت‌نامه‌ها ناموفق بود.
            </p>
          ) : consents.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
              هنوز رضایت‌نامه‌ای برای شما ثبت نشده است.
            </p>
          ) : (
            <div className="space-y-3">
              {consents.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-gray-100 p-4 dark:border-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          c.accepted
                            ? "bg-primary-light/20 text-primary-dark dark:bg-primary/15 dark:text-primary-light"
                            : "bg-red-50 text-danger dark:bg-red-500/10 dark:text-red-300"
                        }`}
                      >
                        {c.accepted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {c.title}
                        </div>
                        <div className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                          {c.accepted ? "امضا شده" : "رد شده"} در {formatJalaliDate(c.signedAt)}
                        </div>
                      </div>
                    </div>

                    <ShieldCheck className="h-4 w-4 shrink-0 text-gray-200 dark:text-gray-700" />
                  </div>

                  {c.content && (
                    <p className="mt-3 max-h-24 overflow-y-auto rounded-lg bg-gray-50 p-2.5 text-[11px] leading-relaxed text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
                      {c.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
