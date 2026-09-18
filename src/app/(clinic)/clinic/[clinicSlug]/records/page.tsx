"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  SlidersHorizontal,
  FolderHeart,
  ChevronLeft,
  FileText,
  Users,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";

import { getPatients } from "@/lib/api/patients";
import { queryKeys } from "@/lib/query/keys";
import { useDoctorPatientScope } from "@/hooks/use-doctor-patient-scope";
import { LoadingLogo } from "@/components/LoadingLogo";

const STATUS_STYLE: Record<
  string,
  {
    dot: string;
    text: string;
    label: string;
  }
> = {
  active: {
    dot: "bg-primary",
    text: "text-primary-dark dark:text-primary-light",
    label: "فعال",
  },
  inactive: {
    dot: "bg-gray-300 dark:bg-gray-600",
    text: "text-gray-400 dark:text-gray-500",
    label: "غیرفعال",
  },
  archived: {
    dot: "bg-gray-300 dark:bg-gray-600",
    text: "text-gray-400 dark:text-gray-500",
    label: "آرشیو",
  },
};

function formatJalaliDate(iso: string | null | undefined) {
  if (!iso) return "—";

  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return "—";
  }
}

export default function RecordsPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);

  const [search, setSearch] = useState("");

  const {
    data: patients = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.patients.list(clinicSlug, {
      search,
      context: "records",
    }),
    queryFn: () => getPatients(clinicSlug, search || undefined),
    enabled: !!clinicSlug,
  });

  const { isDoctor, patientIds: doctorPatientIds, isLoading: scopeLoading } = useDoctorPatientScope(clinicSlug);

  const visiblePatients = useMemo(() => {
    if (!isDoctor || !doctorPatientIds) return patients;
    return patients.filter((p) => doctorPatientIds.has(p.id));
  }, [patients, isDoctor, doctorPatientIds]);

  const stats = useMemo(
    () => ({
      total: visiblePatients.length,
      withVisit: visiblePatients.filter((p) => p.lastVisitAt).length,
    }),
    [visiblePatients]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <FolderHeart className="h-5 w-5 text-primary-dark dark:text-primary-light" />
          پرونده‌ها
        </h1>

        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          دسترسی سریع به پرونده‌ی کامل هر مراجع
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-purple/30 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300">
            <Users className="h-5 w-5" />
          </span>

          <div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500">
              تعداد پرونده‌ها
            </div>

            <div className="text-base font-bold text-gray-900 dark:text-white">
              {isLoading || scopeLoading
                ? "…"
                : `${stats.total.toLocaleString("fa-IR")} پرونده`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light">
            <CheckCircle2 className="h-5 w-5" />
          </span>

          <div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500">
              دارای سابقه‌ی مراجعه
            </div>

            <div className="text-base font-bold text-gray-900 dark:text-white">
              {isLoading || scopeLoading
                ? "…"
                : `${stats.withVisit.toLocaleString("fa-IR")} پرونده`}
            </div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
        {/* Search & Filter */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 sm:w-72 dark:border-white/10 dark:bg-white/[0.04] dark:focus-within:border-primary-light/50 dark:focus-within:ring-primary-light/10">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی نام، کد پرونده یا کد ملی..."
              className="w-full bg-transparent text-xs text-gray-600 outline-none placeholder:text-gray-300 dark:text-gray-200 dark:placeholder:text-gray-600"
            />

            <Search className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600" />
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            فیلتر
          </button>
        </div>

        {/* Loading */}
        {(isLoading || scopeLoading) && (
          <div className="py-10">
            <LoadingLogo />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 py-10 text-center text-sm text-danger dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            خطا در دریافت پرونده‌ها
          </div>
        )}

        {/* List */}
        {!isLoading && !scopeLoading && !error && (
          <div className="space-y-3">
            {visiblePatients.length > 0 ? (
              visiblePatients.map((p) => {
                const status = p.status
                  ? STATUS_STYLE[p.status]
                  : null;

                return (
                  <Link
                    key={p.id}
                    href={`/clinic/${clinicSlug}/patients/${p.id}`}
                    className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 transition-all hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm dark:border-white/[0.07] dark:bg-white/[0.025] dark:hover:border-white/15 dark:hover:bg-white/[0.07]"
                  >
                    {/* Patient */}
                    <div className="flex min-w-0 items-center gap-3">
                      <Image
                        src="/image/user.PNG"
                        alt="User"
                        width={36}
                        height={36}
                        unoptimized
                        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-gray-100 dark:ring-white/10"
                      />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                            {p.firstName} {p.lastName}
                          </span>

                          {status && (
                            <span
                              className={`flex shrink-0 items-center gap-1 text-[10px] ${status.text}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                              />
                              {status.label}
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">
                          {p.patientCode ?? "—"}
                          <span className="mx-1">·</span>
                          آخرین مراجعه:{" "}
                          {formatJalaliDate(p.lastVisitAt)}
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <span className="mr-3 hidden shrink-0 items-center gap-1 text-[11px] text-primary-dark transition-colors group-hover:text-primary sm:flex dark:text-primary-light dark:group-hover:text-primary-light">
                      <FileText className="h-3.5 w-3.5" />
                      مشاهده پرونده
                      <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                    </span>

                    {/* Mobile Arrow */}
                    <ChevronLeft className="mr-2 h-4 w-4 shrink-0 text-gray-300 sm:hidden dark:text-gray-600" />
                  </Link>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-10 text-center text-sm text-gray-400 dark:border-white/10 dark:bg-white/[0.025] dark:text-gray-500">
                پرونده‌ای یافت نشد.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}