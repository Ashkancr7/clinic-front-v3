"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Info } from "lucide-react";

import { PatientHeader } from "@/components/layout/PatientHeader";
import { getPatientDashboardSummary } from "@/lib/api/patient-portal";
import { queryKeys } from "@/lib/query/keys";

function formatJalaliDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}

export default function MedicalRecordsPage({ params }: { params: Promise<{ clinicSlug: string }> }) {
  const { clinicSlug } = use(params);

  const { data: summary, isLoading } = useQuery({
    queryKey: queryKeys.patientPortal.dashboard(clinicSlug),
    queryFn: () => getPatientDashboardSummary(clinicSlug),
    enabled: !!clinicSlug,
  });

  const visits = summary?.recentVisits ?? [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent">
      <PatientHeader clinicSlug={clinicSlug} />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">پرونده پزشکی من</h1>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">سوابق درمانی، اطلاعات پزشکی و مستندات شما</p>
        </div>

        {/*
          اطلاعات پزشکی پایه — هیچ endpoint ای برای این داده در پرتال بیمار وجود ندارد
          (نه در dashboard، نه در appointments/images/consents). فعلاً placeholder می‌ماند.
          برای واقعی‌شدن این بخش باید از بک‌اند یک endpoint مثل GET /patient-portal/profile
          یا مشابه آن که underlying_conditions / medications / allergies / blood_type را برگرداند، اضافه شود.
        */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">اطلاعات پزشکی پایه</h2>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-[11px] text-gray-400 dark:bg-white/[0.04] dark:text-gray-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>این بخش هنوز به بک‌اند وصل نشده — endpoint مربوطه در پرتال بیمار وجود ندارد.</span>
          </div>
        </div>

        {/* Timeline + Documents */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* تاریخچه درمان — از recent_visits واقعی */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06] lg:col-span-2">
            <h2 className="mb-5 text-sm font-bold text-gray-800 dark:text-gray-100">تاریخچه و یادداشت‌های درمانی</h2>

            {isLoading && <div className="py-6 text-center text-xs text-gray-400">در حال بارگذاری...</div>}

            {!isLoading && visits.length > 0 && (
              <div className="relative space-y-6 border-r-2 border-gray-100 pr-5 dark:border-white/10">
                {visits.map((visit) => (
                  <div key={visit.id} className="relative">
                    <span className="absolute -right-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-primary dark:border-gray-900" />

                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {visit.services.map((s) => s.serviceName).join("، ") || "ویزیت"}
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        {formatJalaliDate(visit.visitDate)}
                      </span>
                    </div>

                    {visit.clinicalSummary && (
                      <p className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        {visit.clinicalSummary}
                      </p>
                    )}

                    {visit.patientRecommendation && (
                      <p className="mt-1 rounded-lg bg-primary-light/10 px-2.5 py-1.5 text-[11px] leading-relaxed text-primary-dark dark:bg-primary-light/5 dark:text-primary-light">
                        توصیه: {visit.patientRecommendation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isLoading && visits.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-300 dark:text-gray-500">ویزیت ثبت‌شده‌ای وجود ندارد.</div>
            )}
          </div>

          {/*
            اسناد پزشکی — endpoint فایل عمومی برای بیمار نداریم (مشابه چیزی که در داشبورد هم گفته بودیم).
            placeholder می‌ماند تا endpoint مربوطه مشخص شود.
          */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
            <h2 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">اسناد پزشکی</h2>
            <div className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-[11px] text-gray-400 dark:bg-white/[0.04] dark:text-gray-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>این بخش هنوز به بک‌اند وصل نشده — endpoint دانلود فایل برای بیمار در لیست موجود نبود.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}