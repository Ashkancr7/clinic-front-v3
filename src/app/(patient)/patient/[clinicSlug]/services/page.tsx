"use client";

import { use, useMemo, useState } from "react";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import {
  Search,
  CalendarPlus,
  Sparkles,
  Info,
  ClipboardList,
} from "lucide-react";

import { PatientHeader } from "@/components/layout/PatientHeader";

import { getPatientAppointments } from "@/lib/api/patient-portal";
import { queryKeys } from "@/lib/query/keys";

// نکته: بک‌اند در حال حاضر GET /services را فقط برای نقش staff مجاز می‌کند
// (برای نقش بیمار 403 می‌دهد — دقیقاً همان محدودیتی که در فرم «درخواست نوبت
// جدید» صفحه‌ی نوبت‌ها هم مستند شده). پس امکان نمایش کاتالوگ کامل خدمات با
// قیمت/توضیحات به بیمار وجود ندارد؛ در عوض این صفحه خدماتی را نشان می‌دهد
// که پیش‌تر برای همین بیمار ثبت شده — تا وقتی بک‌اند یک endpoint عمومی
// مخصوص پرتال بیمار (مثلاً GET /patient-portal/services) اضافه کند.

function formatJalaliDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function ServicesPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);

  const [search, setSearch] = useState("");

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: queryKeys.patientPortal.appointments(clinicSlug),
    queryFn: () => getPatientAppointments(clinicSlug),
    enabled: !!clinicSlug,
  });

  const services = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; count: number; lastVisit: string }
    >();

    for (const a of appointments) {
      if (!a.serviceId) continue;
      const existing = map.get(a.serviceId);
      if (existing) {
        existing.count += 1;
        if (new Date(a.startTime) > new Date(existing.lastVisit)) {
          existing.lastVisit = a.startTime;
        }
      } else {
        map.set(a.serviceId, {
          id: a.serviceId,
          name: a.serviceName,
          count: 1,
          lastVisit: a.startTime,
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
    );
  }, [appointments]);

  const filtered = services.filter((s) => s.name.includes(search.trim()));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent">
      <PatientHeader clinicSlug={clinicSlug} />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              خدمات من
            </h1>

            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              خدماتی که پیش‌تر برای شما در این کلینیک ثبت شده
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <span>{filtered.length.toLocaleString("fa-IR")}</span>
            <span>خدمت</span>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            فهرست کامل خدمات و قیمت‌های کلینیک فعلاً در پرتال بیمار در دسترس
            نیست. اینجا فقط خدماتی نشان داده می‌شود که پیش‌تر برایتان نوبت ثبت
            شده — برای هر درخواست دیگر با پذیرش کلینیک تماس بگیرید یا نوبت
            جدید درخواست کنید.
          </span>
        </div>

        {/* Search */}
        {services.length > 0 && (
          <div className="flex h-11 items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 transition focus-within:border-primary/40 dark:border-white/10 dark:bg-white/[0.06] sm:w-72">
            <Search className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-500" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی خدمت..."
              className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-300 dark:text-gray-200 dark:placeholder:text-gray-500"
            />
          </div>
        )}

        {isLoading && (
          <div className="py-14 text-center text-xs text-gray-400 dark:text-gray-500">
            در حال بارگذاری...
          </div>
        )}

        {/* Services */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((service) => (
              <div
                key={service.id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow hover:shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.08]"
              >
                <div className="flex h-24 items-center justify-center bg-gradient-to-br from-primary-light/60 to-primary-light/20 dark:opacity-90">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <Sparkles className="h-6 w-6 text-white/90" />
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {service.name}
                  </div>

                  <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
                    {service.count.toLocaleString("fa-IR")} بار قبلاً رزرو شده
                    · آخرین بار {formatJalaliDate(service.lastVisit)}
                  </p>

                  <div className="flex items-center justify-end border-t border-gray-50 pt-3 dark:border-white/10">
                    <Link
                      href={`/patient/${clinicSlug}/appointments?service=${service.id}&open=1`}
                      className="flex items-center gap-1.5 rounded-lg bg-primary-light/15 px-3 py-2 text-[11px] font-medium text-primary-dark transition hover:bg-primary-light/25 dark:bg-primary-light/10 dark:text-primary-light dark:hover:bg-primary-light/20"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                      درخواست نوبت مجدد
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty: no matches for search */}
        {!isLoading && services.length > 0 && filtered.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white py-14 text-center dark:border-white/10 dark:bg-white/[0.06]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light/10">
              <Search className="h-5 w-5 text-primary-light" />
            </div>

            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              خدمتی پیدا نشد
            </p>

            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              عبارت جستجوی دیگری را امتحان کنید
            </p>
          </div>
        )}

        {/* Empty: no service history at all */}
        {!isLoading && services.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white py-14 text-center dark:border-white/10 dark:bg-white/[0.06]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light/10">
              <ClipboardList className="h-5 w-5 text-primary-light" />
            </div>

            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              هنوز خدمتی برای شما ثبت نشده
            </p>

            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              برای شروع، یک نوبت جدید درخواست دهید.
            </p>

            <Link
              href={`/patient/${clinicSlug}/appointments`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white transition hover:bg-primary-dark dark:bg-primary/90 dark:hover:bg-primary"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              درخواست نوبت جدید
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
