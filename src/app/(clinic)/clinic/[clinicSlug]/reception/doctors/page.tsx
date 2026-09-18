"use client";

import { use } from "react";

import { useQuery } from "@tanstack/react-query";

import Link from "next/link";
import Image from "next/image";

import { Stethoscope, Phone, CalendarClock } from "lucide-react";

import { getMyAssignedDoctors } from "@/lib/api/staff";
import { queryKeys } from "@/lib/query/keys";

export default function ReceptionDoctorsPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);

  const {
    data: doctors = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.staff.myAssignedDoctors(clinicSlug),
    queryFn: () => getMyAssignedDoctors(clinicSlug),
    enabled: !!clinicSlug,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">پزشکان</h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          پزشکانی که برای پذیرش و نوبت‌دهی به شما تخصیص داده شده‌اند
        </p>
      </div>

      {isLoading && (
        <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
          در حال بارگذاری...
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 py-4 text-center text-xs text-danger dark:bg-red-500/10 dark:text-red-300">
          خطا در دریافت لیست پزشکان
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-sm dark:border-white/10 dark:bg-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                <Image
                  src="/image/user.PNG"
                  alt={d.doctorName}
                  width={44}
                  height={44}
                  unoptimized
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {d.doctorName}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500" dir="ltr">
                    {d.doctorPhone || "—"}
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[9px] ${
                    d.isActive
                      ? "bg-primary-light/20 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light"
                      : "bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500"
                  }`}
                >
                  {d.isActive ? "فعال" : "غیرفعال"}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/clinic/${clinicSlug}/calendar`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-light/15 py-2 text-[11px] text-primary-dark transition hover:bg-primary-light/25 dark:bg-primary-light/10 dark:text-primary-light dark:hover:bg-primary-light/20"
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  مشاهده نوبت‌ها
                </Link>

                {d.doctorPhone && (
                  <a
                    href={`tel:${d.doctorPhone}`}
                    aria-label="تماس با پزشک"
                    className="flex items-center justify-center rounded-lg border border-gray-200 px-3 text-gray-400 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-500 dark:hover:bg-white/10"
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}

          {doctors.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 py-12 text-gray-300 dark:border-white/10 dark:text-gray-600">
              <Stethoscope className="h-8 w-8" />
              <p className="text-sm">هنوز پزشکی به شما تخصیص داده نشده است.</p>
              <p className="text-[11px]">برای تخصیص پزشک با مدیر کلینیک تماس بگیرید.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
