"use client";

import { use, useState } from "react";

import Link from "next/link";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Clock3,
  Video,
  Filter,
  MoreHorizontal,
} from "lucide-react";

import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import {
  getAppointments,
  getDoctors,
  completeAppointment,
  cancelAppointment,
  toLocalIsoDate,
} from "@/lib/api/appointments";

import { queryKeys } from "@/lib/query/keys";
import { LoadingLogo } from "@/components/LoadingLogo";
import { getCurrentClinicUser } from "@/lib/api/session";

const STATUS_BADGE: Record<string, string> = {
  confirmed:
    "bg-primary-light/20 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light",

  pending:
    "bg-amber-50 text-warning dark:bg-amber-500/10 dark:text-amber-300",

  cancelled:
    "bg-red-50 text-danger dark:bg-red-500/10 dark:text-red-300",

  completed:
    "bg-primary-light/20 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light",

  no_show:
    "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400",

  rescheduled:
    "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "تایید‌شده",
  pending: "در انتظار",
  cancelled: "لغوشده",
  completed: "تکمیل‌شده",
  no_show: "عدم حضور",
  rescheduled: "تغییر زمان",
};

const TYPE_LABEL: Record<string, string> = {
  in_person: "حضوری",
  online: "آنلاین",
  followup: "پیگیری",
};

function getMinutesOfDay(iso: string): number {
  const d = new Date(iso);

  return d.getHours() * 60 + d.getMinutes();
}

function formatTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CalendarPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);

  const [doctorFilter, setDoctorFilter] = useState<number | "all">("all");

  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [selectedDate, setSelectedDate] = useState<DateObject>(
    new DateObject({
      calendar: persian,
      locale: persian_fa,
    })
  );

  const queryClient = useQueryClient();

  const isoDate = toLocalIsoDate(selectedDate.toDate());

  // نقش کاربر جاری را می‌گیریم تا اگر پزشک بود، فیلتر همیشه روی خودش قفل بماند
  // (پزشک نباید بتواند نوبت‌های سایر پزشکان را ببیند؛ فقط منشی/مدیر این دسترسی را دارند)
  const { data: currentUser } = useQuery({
    queryKey: queryKeys.session.currentUser(clinicSlug),
    queryFn: () => getCurrentClinicUser(clinicSlug),
    enabled: !!clinicSlug,
  });

  const isDoctor = currentUser?.roleKey === "doctor";
  const effectiveDoctorFilter = isDoctor ? currentUser?.userId ?? undefined : doctorFilter === "all" ? undefined : doctorFilter;

  const { data: doctors = [] } = useQuery({
    queryKey: queryKeys.appointmentsCalendar.doctors(clinicSlug),
    queryFn: () => getDoctors(clinicSlug),
    // پزشک نیازی به لیست همه‌ی پزشکان ندارد (چون فیلتر برایش قفل است)
    enabled: !!clinicSlug && !isDoctor,
  });

  const {
    data: appointments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.appointmentsCalendar.list(clinicSlug, isoDate, effectiveDoctorFilter),
    queryFn: () =>
      getAppointments(clinicSlug, {
        from: isoDate,
        to: isoDate,
        doctorUserId: effectiveDoctorFilter,
      }),
    // تا وقتی نقش کاربر مشخص نشده، اصلاً درخواست نمی‌زنیم — وگرنه ممکن است برای
    // یک لحظه نوبت‌های همه‌ی پزشکان برای کاربر پزشک لود شود (نشت داده)
    enabled: !!clinicSlug && !!currentUser && (!isDoctor || !!currentUser.userId),
  });



  const completeMutation = useMutation({
    mutationFn: (id: string) => completeAppointment(clinicSlug, id),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["appointments-calendar", clinicSlug],
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      cancelAppointment(clinicSlug, id, "لغو توسط کلینیک"),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["appointments-calendar", clinicSlug],
      }),
  });

  // اصلاح جهت حرکت روزها
  const goToPrevDay = () =>
    setSelectedDate((prev) => new DateObject(prev).subtract(1, "day"));

  const goToNextDay = () =>
    setSelectedDate((prev) => new DateObject(prev).add(1, "day"));

  const goToToday = () =>
    setSelectedDate(
      new DateObject({
        calendar: persian,
        locale: persian_fa,
      })
    );

  const pending = appointments.filter(
    (a) => a.status === "pending"
  );

  const confirmed = appointments.filter(
    (a) => a.status === "confirmed"
  );

  const cancelled = appointments.filter(
    (a) => a.status === "cancelled"
  );

  const sortedAppointments = [...appointments]
    .filter(
      (a) =>
        statusFilter === "all" ||
        a.status === statusFilter
    )
    .sort(
      (a, b) =>
        getMinutesOfDay(a.startTime) -
        getMinutesOfDay(b.startTime)
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            نوبت‌ها
          </h1>

          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            مدیریت تقویم و نوبت‌دهی کلینیک
          </p>
        </div>

        <Link
          href={`/clinic/${clinicSlug}/calendar/new`}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark dark:bg-primary/90 dark:hover:bg-primary"
        >
          <Plus className="h-4 w-4" />
          ثبت نوبت جدید
        </Link>
      </div>

      {/* Date + Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPrevDay}
            aria-label="روز قبل"
            className="rounded-lg border border-gray-200 p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <DatePicker
            value={selectedDate}
            onChange={(val: DateObject | null) => {
              if (val !== null) {
                setSelectedDate(val);
              }
            }}
            calendar={persian}
            locale={persian_fa}
            calendarPosition="bottom-center"
            render={(_, openCalendar) => (
              <button
                type="button"
                onClick={openCalendar}
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/10"
              >
                {selectedDate.format("dddd، DD MMMM YYYY")}
              </button>
            )}
          />

          <button
            type="button"
            onClick={goToNextDay}
            aria-label="روز بعد"
            className="rounded-lg border border-gray-200 p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={goToToday}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
          >
            امروز
          </button>
        </div>

        {/* Filters */}
      
        <div className="flex flex-wrap items-center gap-2">
          {!isDoctor && (
            <select
              value={doctorFilter}
              onChange={(e) =>
                setDoctorFilter(
                  e.target.value === "all"
                    ? "all"
                    : Number(e.target.value)
                )
              }
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 outline-none transition focus:border-primary dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-300"
            >
              <option value="all">همه پزشکان</option>

              {doctors.map((d) => (
                <option key={d.userId} value={d.userId}>
                  {d.fullName}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 outline-none transition focus:border-primary dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-300"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="confirmed">تایید‌شده</option>
            <option value="pending">در انتظار</option>
            <option value="completed">تکمیل‌شده</option>
            <option value="cancelled">لغوشده</option>
            <option value="no_show">عدم حضور</option>
            <option value="rescheduled">تغییر زمان</option>
          </select>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Daily schedule */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-gray-800 dark:text-gray-100">
              <CalendarIcon />
              برنامه‌ی روز
            </h2>

            <span className="rounded-full bg-gray-50 px-2.5 py-1 text-[10px] text-gray-400 dark:bg-white/10 dark:text-gray-400">
              {appointments.length.toLocaleString("fa-IR")} نوبت
            </span>
          </div>

          {isLoading && <LoadingLogo />}

          {error && (
            <div className="py-10 text-center text-sm text-danger dark:text-red-300">
              خطا در دریافت نوبت‌ها
            </div>
          )}

          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <div className="min-w-[680px]">
                {/* Header */}
                <table className="w-full table-fixed text-right text-xs">
                  <colgroup>
                    <col className="w-[13%]" />
                    <col className="w-[20%]" />
                    <col className="w-[18%]" />
                    <col className="w-[18%]" />
                    <col className="w-[12%]" />
                    <col className="w-[12%]" />
                    <col className="w-[7%]" />
                  </colgroup>

                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 dark:border-white/10 dark:text-gray-500">
                      <th className="py-2 font-medium">
                        ساعت
                      </th>

                      <th className="py-2 font-medium">
                        مراجع
                      </th>

                      <th className="py-2 font-medium">
                        خدمت
                      </th>

                      <th className="py-2 font-medium">
                        پزشک
                      </th>

                      <th className="py-2 font-medium">
                        نوع
                      </th>

                      <th className="py-2 font-medium">
                        وضعیت
                      </th>

                      <th className="py-2 font-medium">
                        عملیات
                      </th>
                    </tr>
                  </thead>
                </table>

                {/* Scrollable body */}
                <div className="max-h-[420px] overflow-y-auto">
                  <table className="w-full table-fixed text-right text-xs">
                    <colgroup>
                      <col className="w-[13%]" />
                      <col className="w-[20%]" />
                      <col className="w-[18%]" />
                      <col className="w-[18%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                      <col className="w-[7%]" />
                    </colgroup>

                    <tbody>
                      {sortedAppointments.map((a) => (
                        <tr
                          key={a.id}
                          className="border-b border-gray-50 transition hover:bg-gray-50/60 dark:border-white/5 dark:hover:bg-white/[0.03]"
                        >
                          <td
                            className="whitespace-nowrap py-3 font-medium text-gray-700 dark:text-gray-200"
                            dir="ltr"
                          >
                            {formatTimeLabel(a.startTime)}

                            {a.endTime && (
                              <span className="text-gray-300 dark:text-gray-600">
                                {" "}
                                – {formatTimeLabel(a.endTime)}
                              </span>
                            )}
                          </td>

                          <td className="truncate py-3">
                            <Link
                              href={`/clinic/${clinicSlug}/calendar/${a.id}`}
                              className="font-medium text-gray-800 transition hover:text-primary-dark dark:text-gray-100 dark:hover:text-primary-light"
                            >
                              {a.patientName}
                            </Link>
                          </td>

                          <td className="truncate py-3 text-gray-500 dark:text-gray-400">
                            {a.serviceName}
                          </td>

                          <td className="truncate py-3 text-gray-500 dark:text-gray-400">
                            {a.doctorName}
                          </td>

                          <td className="py-3">
                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              {a.appointmentType ===
                                "online" && (
                                  <Video className="h-3 w-3 shrink-0 text-blue-500" />
                                )}

                              <span className="truncate">
                                {TYPE_LABEL[
                                  a.appointmentType
                                ] ??
                                  a.appointmentType}
                              </span>
                            </span>
                          </td>

                          <td className="py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] ${STATUS_BADGE[a.status] ??
                                "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                                }`}
                            >
                              {STATUS_LABEL[a.status] ??
                                a.status}
                            </span>
                          </td>

                          <td className="py-3">
                            <Link
                              href={`/clinic/${clinicSlug}/calendar/${a.id}`}
                              aria-label="مشاهده جزئیات"
                              className="inline-flex rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-primary-dark dark:hover:bg-white/10 dark:hover:text-primary-light"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}

                      {sortedAppointments.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-10 text-center text-sm text-gray-300 dark:text-gray-600"
                          >
                            نوبتی برای این روز ثبت نشده.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Daily summary */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-800 dark:text-gray-100">
                <Filter className="h-4 w-4 text-primary-dark dark:text-primary-light" />
                خلاصه‌ی روز
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <SummaryRow
                label="کل نوبت‌ها"
                value={appointments.length}
              />

              <SummaryRow
                label="تایید‌شده"
                value={confirmed.length}
                valueClass="text-primary-dark dark:text-primary-light"
              />

              <SummaryRow
                label="در انتظار تایید"
                value={pending.length}
                valueClass="text-warning dark:text-amber-300"
              />

              <SummaryRow
                label="لغوشده"
                value={cancelled.length}
                valueClass="text-danger dark:text-red-300"
              />
            </div>
          </div>

          {/* Pending appointments */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
            <h3 className="mb-3 text-sm font-bold text-gray-800 dark:text-gray-100">
              نوبت‌های در انتظار تایید
            </h3>

            <div className="space-y-3">
              {[...pending]
                .sort(
                  (a, b) =>
                    getMinutesOfDay(a.startTime) -
                    getMinutesOfDay(b.startTime)
                )
                .map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/10">
                        <Clock3 className="h-3.5 w-3.5 text-warning dark:text-amber-300" />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate font-medium text-gray-700 dark:text-gray-200">
                          {a.patientName}{" "}
                          <span className="text-gray-400 dark:text-gray-500">
                            · {formatTimeLabel(a.startTime)}
                          </span>
                        </div>

                        <div className="truncate text-[10px] text-gray-400 dark:text-gray-500">
                          {a.serviceName}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          completeMutation.mutate(a.id)
                        }
                        disabled={
                          completeMutation.isPending
                        }
                        className="rounded-lg bg-primary-light/15 px-2 py-1 text-[10px] text-primary-dark transition hover:bg-primary-light/25 disabled:opacity-50 dark:bg-primary-light/10 dark:text-primary-light dark:hover:bg-primary-light/20"
                      >
                        تایید
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          cancelMutation.mutate(a.id)
                        }
                        disabled={
                          cancelMutation.isPending
                        }
                        className="rounded-lg bg-red-50 px-2 py-1 text-[10px] text-danger transition hover:bg-red-100 disabled:opacity-50 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                      >
                        رد
                      </button>
                    </div>
                  </div>
                ))}

              {pending.length === 0 && (
                <p className="text-xs text-gray-300 dark:text-gray-600">
                  موردی در انتظار تایید نیست.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClass = "text-gray-800 dark:text-gray-200",
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 dark:text-gray-400">
        {label}
      </span>

      <span className={`font-medium ${valueClass}`}>
        {value.toLocaleString("fa-IR")}
      </span>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4 text-primary-dark dark:text-primary-light"
    >
      <rect
        width="18"
        height="18"
        x="3"
        y="4"
        rx="2"
      />

      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}