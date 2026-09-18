"use client";

import { use, useMemo, useState } from "react";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import { ChevronRight, ChevronLeft, Clock3, CalendarDays, Loader2 } from "lucide-react";

import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import { getAppointments, getDoctors, toLocalIsoDate, type CalendarAppointment } from "@/lib/api/appointments";
import { queryKeys } from "@/lib/query/keys";

const WEEK_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

const STATUS_BADGE: Record<string, string> = {
  confirmed: "bg-primary-light/20 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light",
  pending: "bg-amber-50 text-warning dark:bg-amber-500/10 dark:text-amber-300",
  cancelled: "bg-red-50 text-danger dark:bg-red-500/10 dark:text-red-300",
  completed: "bg-primary-light/20 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light",
  no_show: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400",
  rescheduled: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "تایید‌شده",
  pending: "در انتظار",
  cancelled: "لغوشده",
  completed: "تکمیل‌شده",
  no_show: "عدم حضور",
  rescheduled: "تغییر زمان",
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function faDigits(n: number) {
  return n.toLocaleString("fa-IR");
}

interface DayCell {
  date: DateObject;
  iso: string;
  isToday: boolean;
}

function buildMonthGrid(monthDate: DateObject): (DayCell | null)[] {
  const first = new DateObject(monthDate);
  first.day = 1;

  const daysInMonth = first.month.length;
  const leading = first.weekDay.index; // 0 = شنبه ... 6 = جمعه

  const todayIso = toLocalIsoDate(new Date());

  const cells: (DayCell | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new DateObject(first);
    cellDate.day = d;
    const iso = toLocalIsoDate(cellDate.toDate());
    cells.push({ date: cellDate, iso, isToday: iso === todayIso });
  }

  return cells;
}

export default function ReceptionCalendarPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);

  const [currentMonth, setCurrentMonth] = useState(
    () => new DateObject({ calendar: persian, locale: persian_fa })
  );
  const [selectedIso, setSelectedIso] = useState<string | null>(() => toLocalIsoDate(new Date()));
  const [doctorFilter, setDoctorFilter] = useState<number | "all">("all");

  const grid = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);

  const monthLabel = useMemo(() => currentMonth.format("MMMM YYYY"), [currentMonth]);

  const { fromIso, toIso } = useMemo(() => {
    const first = new DateObject(currentMonth);
    first.day = 1;
    const last = new DateObject(first);
    last.day = first.month.length;
    return { fromIso: toLocalIsoDate(first.toDate()), toIso: toLocalIsoDate(last.toDate()) };
  }, [currentMonth]);

  const { data: doctors = [] } = useQuery({
    queryKey: queryKeys.appointmentsCalendar.doctors(clinicSlug),
    queryFn: () => getDoctors(clinicSlug),
    enabled: !!clinicSlug,
  });

  const {
    data: appointments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["reception-calendar", clinicSlug, fromIso, toIso, doctorFilter],
    queryFn: () =>
      getAppointments(clinicSlug, {
        from: fromIso,
        to: toIso,
        doctorUserId: doctorFilter === "all" ? undefined : doctorFilter,
      }),
    enabled: !!clinicSlug,
  });

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    for (const a of appointments) {
      const iso = toLocalIsoDate(new Date(a.startTime));
      const list = map.get(iso) ?? [];
      list.push(a);
      map.set(iso, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }
    return map;
  }, [appointments]);

  const selectedAppointments = selectedIso ? (appointmentsByDay.get(selectedIso) ?? []) : [];

  function goToday() {
    const now = new DateObject({ calendar: persian, locale: persian_fa });
    setCurrentMonth(now);
    setSelectedIso(toLocalIsoDate(new Date()));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">تقویم</h1>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">نمای ماهانه‌ی نوبت‌ها</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 outline-none transition focus:border-primary dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-300"
          >
            <option value="all">همه پزشکان</option>
            {doctors.map((d) => (
              <option key={d.userId} value={d.userId}>
                {d.fullName}
              </option>
            ))}
          </select>

          <button
            onClick={goToday}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
          >
            امروز
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.06]">
        {/* Month nav */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentMonth((prev) => new DateObject(prev).subtract(1, "month"))}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-400 transition hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/10"
            aria-label="ماه قبل"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{monthLabel}</span>

          <button
            onClick={() => setCurrentMonth((prev) => new DateObject(prev).add(1, "month"))}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-400 transition hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/10"
            aria-label="ماه بعد"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-400 dark:text-gray-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            در حال بارگذاری...
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 py-3 text-center text-xs text-danger dark:bg-red-500/10 dark:text-red-300">
            خطا در دریافت نوبت‌های این ماه
          </div>
        )}

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400 dark:text-gray-500">
          {WEEK_DAYS.map((w) => (
            <div key={w} className="py-1.5">
              {w}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell, idx) => {
            if (!cell) return <div key={`blank-${idx}`} />;

            const count = appointmentsByDay.get(cell.iso)?.length ?? 0;
            const isSelected = selectedIso === cell.iso;

            return (
              <button
                key={cell.iso}
                onClick={() => setSelectedIso(cell.iso)}
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl border text-xs transition ${
                  isSelected
                    ? "border-primary bg-primary-light/10 font-medium text-primary-dark dark:border-primary-light dark:bg-primary-light/10 dark:text-primary-light"
                    : cell.isToday
                      ? "border-primary-light/50 text-gray-700 dark:border-primary-light/30 dark:text-gray-200"
                      : "border-gray-100 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                }`}
              >
                <span>{faDigits(cell.date.day)}</span>
                {count > 0 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary dark:bg-primary-light" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day appointments */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.06]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-100">
            <CalendarDays className="h-4 w-4 text-primary-dark dark:text-primary-light" />
            نوبت‌های {selectedIso ?? "—"}
          </h3>
          <span className="rounded-full bg-gray-50 px-2 py-1 text-[9px] text-gray-400 dark:bg-white/[0.06] dark:text-gray-500">
            {faDigits(selectedAppointments.length)} نوبت
          </span>
        </div>

        {selectedAppointments.length === 0 ? (
          <div className="rounded-xl bg-gray-50 py-8 text-center text-xs text-gray-300 dark:bg-white/[0.03] dark:text-gray-600">
            نوبتی برای این روز ثبت نشده.
          </div>
        ) : (
          <div className="space-y-2">
            {selectedAppointments.map((a) => (
              <Link
                key={a.id}
                href={`/clinic/${clinicSlug}/calendar/${a.id}`}
                className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5 transition hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/[0.04]"
              >
                <span className="flex w-12 shrink-0 flex-col items-center text-primary-dark dark:text-primary-light">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium" dir="ltr">
                    {formatTime(a.startTime)}
                  </span>
                </span>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-gray-800 dark:text-gray-100">{a.patientName}</div>
                  <div className="truncate text-[11px] text-gray-400 dark:text-gray-500">
                    {a.serviceName} · {a.doctorName}
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[9px] ${
                    STATUS_BADGE[a.status] ?? "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                  }`}
                >
                  {STATUS_LABEL[a.status] ?? a.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
