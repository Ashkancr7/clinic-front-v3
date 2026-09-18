"use client";

import { use, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Link from "next/link";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Link2,
  UserPlus,
  Pencil,
  ShieldCheck,
  Users,
} from "lucide-react";

import Image from "next/image";

import {
  getAppointments,
  completeAppointment,
  cancelAppointment,
  toLocalIsoDate,
  type CalendarAppointment,
} from "@/lib/api/appointments";

import { queryKeys } from "@/lib/query/keys";

/* =========================
   Status
========================= */

const STATUS_LABEL: Record<string, string> = {
  pending: "در انتظار تایید",
  confirmed: "برنامه‌ریزی شده",
  completed: "تکمیل شده",
  cancelled: "لغو شده",
  no_show: "غیبت / نیامده",
  rescheduled: "تغییر زمان",
};

const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-400",
  confirmed: "bg-blue-400",
  completed: "bg-primary",
  cancelled: "bg-danger",
  no_show: "bg-warning",
  rescheduled: "bg-purple-500",
};

const STATUS_BORDER: Record<string, string> = {
  pending:
    "border-amber-100 dark:border-amber-500/20",
  confirmed:
    "border-gray-100 dark:border-white/10",
  completed:
    "border-primary-light/40 bg-primary-light/10 dark:border-primary-light/20 dark:bg-primary-light/5",
  cancelled:
    "border-red-100 dark:border-red-500/20",
  no_show:
    "border-amber-100 dark:border-amber-500/20",
  rescheduled:
    "border-purple-100 dark:border-purple-500/20",
};

const STATUS_BADGE: Record<string, string> = {
  pending:
    "bg-amber-50 text-warning dark:bg-amber-500/10 dark:text-amber-300",
  confirmed:
    "bg-secondary-blue/40 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
  completed:
    "bg-primary-light/20 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light",
  cancelled:
    "bg-red-50 text-danger dark:bg-red-500/10 dark:text-red-300",
  no_show:
    "bg-amber-50 text-warning dark:bg-amber-500/10 dark:text-amber-300",
  rescheduled:
    "bg-secondary-purple/40 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300",
};

/* =========================
   Helpers
========================= */

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/* =========================
   Page
========================= */

export default function ReceptionQueuePage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);

  const [activeFilter, setActiveFilter] = useState<"all" | "filtered">(
    "all"
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const today = toLocalIsoDate(new Date());

  const {
    data: appointments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.appointmentsCalendar.list(clinicSlug, today),
    queryFn: () =>
      getAppointments(clinicSlug, {
        from: today,
        to: today,
      }),
    enabled: !!clinicSlug,
  });

  /* =========================
     Sorted Appointments
  ========================= */

  const sorted = useMemo(
    () =>
      [...appointments].sort(
        (a, b) =>
          new Date(a.startTime).getTime() -
          new Date(b.startTime).getTime()
      ),
    [appointments]
  );

  const selected: CalendarAppointment | null =
    sorted.find((a) => a.id === selectedId) ??
    sorted[0] ??
    null;

  /* =========================
     Stats
  ========================= */

  const completedCount = appointments.filter(
    (a) => a.status === "completed"
  ).length;

  const remainingCount = appointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed"
  ).length;

  function invalidate() {
    queryClient.invalidateQueries({
      queryKey: ["appointments-calendar", clinicSlug],
    });
  }

  /* =========================
     Mutations
  ========================= */

  const completeMutation = useMutation({
    mutationFn: (id: string) =>
      completeAppointment(clinicSlug, id),
    onSuccess: invalidate,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      cancelAppointment(
        clinicSlug,
        id,
        "لغو توسط پذیرش"
      ),
    onSuccess: invalidate,
  });

  /* =========================
     In-service / Waiting
     (بک‌اند مفهوم صریحی برای "پذیرش/چک‌این" ندارد؛ این‌ها برآوردی هستند
     که فقط از روی نوبت‌های امروز و زمان جاری محاسبه می‌شوند)
  ========================= */

  const nowTs = Date.now();

  const inServiceList = appointments.filter((a) => {
    const start = new Date(a.startTime).getTime();
    const end = new Date(a.endTime).getTime();
    return a.status === "confirmed" && start <= nowTs && nowTs < end;
  });

  const inServiceIds = new Set(inServiceList.map((a) => a.id));

  const waitingList = appointments
    .filter((a) => {
      if (a.status !== "pending" && a.status !== "confirmed") return false;
      if (inServiceIds.has(a.id)) return false;
      return new Date(a.startTime).getTime() <= nowTs;
    })
    .sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

  function waitMinutes(a: CalendarAppointment) {
    return Math.max(
      0,
      Math.round((nowTs - new Date(a.startTime).getTime()) / 60000)
    );
  }

  function waitTone(minutes: number) {
    if (minutes >= 15) return "bg-red-50 text-danger dark:bg-red-500/10 dark:text-red-300";
    if (minutes >= 5) return "bg-amber-50 text-warning dark:bg-amber-500/10 dark:text-amber-300";
    return "bg-secondary-blue/40 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300";
  }

  function waitLabel(minutes: number) {
    return minutes > 0 ? `${minutes.toLocaleString("fa-IR")} دقیقه انتظار` : "همین الان";
  }

  /* =========================
     Real Stats
  ========================= */

  const REAL_STATS = [
    {
      icon: ShieldCheck,
      tone:
        "text-primary-dark bg-primary-light/20 dark:bg-primary-light/10 dark:text-primary-light",
      label: "تکمیل شده",
      value: completedCount.toLocaleString("fa-IR"),
      unit: "نفر",
    },
    {
      icon: ChevronLeft,
      tone:
        "text-primary-dark bg-primary-light/20 dark:bg-primary-light/10 dark:text-primary-light",
      label: "نوبت‌های باقی‌مانده",
      value: remainingCount.toLocaleString("fa-IR"),
      unit: "نوبت",
    },
    {
      icon: CalendarDays,
      tone:
        "text-purple-600 bg-secondary-purple/40 dark:bg-purple-500/10 dark:text-purple-300",
      label: "نوبت‌های امروز",
      value: appointments.length.toLocaleString("fa-IR"),
      unit: "نوبت",
    },
    {
      icon: UserPlus,
      tone: "text-pink-600 bg-secondary-pink/40 dark:bg-pink-500/10 dark:text-pink-300",
      label: "در حال خدمت",
      value: inServiceList.length.toLocaleString("fa-IR"),
      unit: "نفر",
    },
    {
      icon: Users,
      tone: "text-amber-500 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300",
      label: "بیماران حاضر",
      value: waitingList.length.toLocaleString("fa-IR"),
      unit: "نفر",
    },
  ];

  /* =========================
     Status Breakdown
  ========================= */

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};

    appointments.forEach((a) => {
      counts[a.status] = (counts[a.status] ?? 0) + 1;
    });

    return Object.entries(counts).map(
      ([status, count]) => ({
        status,
        label: STATUS_LABEL[status] ?? status,
        dot: STATUS_DOT[status] ?? "bg-gray-300",
        value: count.toLocaleString("fa-IR"),
      })
    );
  }, [appointments]);

  return (
    <div className="space-y-6">
      {/* =========================
          Stats
      ========================= */}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {REAL_STATS.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.08]"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  {stat.label}
                </span>

                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${stat.tone}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {isLoading ? "…" : stat.value}
              </div>

              <div className="text-[10px] text-gray-400 dark:text-gray-500">
                {stat.unit}
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================
          Actions
      ========================= */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button
          onClick={() =>
            setActiveFilter((filter) =>
              filter === "all" ? "filtered" : "all"
            )
          }
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-medium transition ${
            activeFilter === "filtered"
              ? "border border-primary bg-primary-light/10 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light"
              : "border border-primary text-primary-dark hover:bg-primary-light/10 dark:text-primary-light dark:hover:bg-primary-light/10"
          }`}
        >
          <Filter className="h-4 w-4" />
          فیلتر نوبت‌ها
        </button>

        <Link
          href={`/clinic/${clinicSlug}/patients?new=1`}
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/[0.1]"
        >
          <UserPlus className="h-4 w-4" />
          ثبت بیمار جدید
        </Link>

        <button
          disabled
          title="این بخش هنوز آماده نشده"
          className="flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-xs text-gray-400 opacity-50 dark:border-white/10 dark:text-gray-500"
        >
          <Link2 className="h-4 w-4" />
          ارسال لینک فرم پذیرش
        </button>
      </div>

      {/* =========================
          Main Content
      ========================= */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* =========================
            Selected Appointment
        ========================= */}

        <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.06]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100">
              جزئیات نوبت
            </h3>

            {selected && (
              <Link
                href={`/clinic/${clinicSlug}/calendar/${selected.id}`}
                aria-label="ویرایش نوبت"
              >
                <Pencil className="h-3.5 w-3.5 text-gray-300 transition hover:text-primary dark:text-gray-500 dark:hover:text-primary-light" />
              </Link>
            )}
          </div>

          {isLoading && (
            <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
              در حال بارگذاری...
            </div>
          )}

          {!isLoading && !selected && (
            <div className="py-6 text-center text-xs text-gray-300 dark:text-gray-600">
              نوبتی برای امروز ثبت نشده.
            </div>
          )}

          {!isLoading && selected && (
            <>
              {/* Patient */}
              <div className="mb-4 flex items-center gap-2.5">
                <Image
                  src="/image/user.PNG"
                  alt="User"
                  width={36}
                  height={36}
                  unoptimized
                  className="h-9 w-9 rounded-full object-cover"
                />

                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-gray-900 dark:text-gray-100">
                    {selected.patientName}
                  </div>

                  <div
                    className="text-[10px] text-gray-400 dark:text-gray-500"
                    dir="ltr"
                  >
                    {selected.patientPhone || "—"}
                  </div>
                </div>

                <span
                  className={`mr-auto shrink-0 rounded-full px-2 py-1 text-[9px] ${
                    STATUS_BADGE[selected.status] ??
                    "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                  }`}
                >
                  {STATUS_LABEL[selected.status] ??
                    selected.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 text-[11px]">
                <Row
                  label="خدمت"
                  value={selected.serviceName}
                />

                <Row
                  label="پزشک"
                  value={selected.doctorName}
                />

                <Row
                  label="ساعت"
                  value={`${formatTime(
                    selected.startTime
                  )} - ${formatTime(selected.endTime)}`}
                  dir="ltr"
                />

                <div className="pt-1">
                  <span className="text-gray-400 dark:text-gray-500">
                    یادداشت
                  </span>

                  <p className="mt-1 leading-relaxed text-gray-600 dark:text-gray-300">
                    {selected.notes ||
                      "یادداشتی ثبت نشده."}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 space-y-2">
                <button
                  onClick={() =>
                    completeMutation.mutate(
                      selected.id
                    )
                  }
                  disabled={
                    completeMutation.isPending ||
                    selected.status === "completed"
                  }
                  className="w-full rounded-xl bg-primary py-2.5 text-xs font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-primary-light"
                >
                  {completeMutation.isPending
                    ? "در حال ثبت..."
                    : "تکمیل خدمت"}
                </button>

                <Link
                  href={`/clinic/${clinicSlug}/calendar/${selected.id}`}
                  className="block w-full rounded-xl border border-gray-200 py-2.5 text-center text-xs text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/[0.06]"
                >
                  تغییر زمان
                </Link>

                <button
                  onClick={() =>
                    cancelMutation.mutate(
                      selected.id
                    )
                  }
                  disabled={
                    cancelMutation.isPending ||
                    selected.status === "cancelled"
                  }
                  className="w-full rounded-xl border border-red-100 py-2.5 text-xs text-danger transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:hover:bg-red-500/10"
                >
                  {cancelMutation.isPending
                    ? "در حال لغو..."
                    : "لغو نوبت"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* =========================
            Daily Schedule
        ========================= */}

        <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.06] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-100">
              <CalendarDays className="h-4 w-4 text-primary-dark dark:text-primary-light" />
              برنامه روزانه
            </h3>

            <span className="rounded-full bg-gray-50 px-2 py-1 text-[9px] text-gray-400 dark:bg-white/[0.06] dark:text-gray-500">
              {appointments.length.toLocaleString("fa-IR")} نوبت
            </span>
          </div>

          {isLoading && (
            <div className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">
              در حال بارگذاری...
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 py-4 text-center text-xs text-danger dark:bg-red-500/10 dark:text-red-300">
              خطا در دریافت نوبت‌ها
            </div>
          )}

          {!isLoading && !error && (
            <div className="space-y-2">
              {sorted.map((appointment) => (
                <button
                  key={appointment.id}
                  onClick={() =>
                    setSelectedId(appointment.id)
                  }
                  className={`flex w-full items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-right transition dark:bg-white/[0.02] ${
                    STATUS_BORDER[
                      appointment.status
                    ] ?? "border-gray-100 dark:border-white/10"
                  } ${
                    selected?.id === appointment.id
                      ? "ring-1 ring-primary/40 dark:ring-primary-light/40"
                      : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <span
                    className="w-10 shrink-0 text-[11px] text-gray-400 dark:text-gray-500"
                    dir="ltr"
                  >
                    {formatTime(
                      appointment.startTime
                    )}
                  </span>

                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Image
                        src="/image/user.PNG"
                        alt="User"
                        width={32}
                        height={32}
                        unoptimized
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />

                      <div className="min-w-0 text-right">
                        <div className="truncate text-[11px] font-medium text-gray-800 dark:text-gray-100">
                          {appointment.patientName}
                        </div>

                        <div className="truncate text-[10px] text-gray-400 dark:text-gray-500">
                          {appointment.serviceName}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[9px] ${
                        STATUS_BADGE[
                          appointment.status
                        ] ??
                        "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                      }`}
                    >
                      {STATUS_LABEL[
                        appointment.status
                      ] ?? appointment.status}
                    </span>
                  </div>
                </button>
              ))}

              {sorted.length === 0 && (
                <div className="rounded-xl bg-gray-50 py-8 text-center text-xs text-gray-300 dark:bg-white/[0.03] dark:text-gray-600">
                  نوبتی برای امروز ثبت نشده.
                </div>
              )}
            </div>
          )}
        </div>

        {/* =========================
            Right Sidebar
        ========================= */}

        <div className="space-y-4">
          {/* Status */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.06]">
            <h3 className="mb-4 flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-100">
              <ShieldCheck className="h-4 w-4 text-primary-dark dark:text-primary-light" />
              وضعیت نوبت‌ها
            </h3>

            <div className="space-y-3">
              {statusBreakdown.map((status) => (
                <div
                  key={status.status}
                  className="flex items-center justify-between text-[11px]"
                >
                  <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <span
                      className={`h-2 w-2 rounded-full ${status.dot}`}
                    />

                    {status.label}
                  </span>

                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {status.value}
                  </span>
                </div>
              ))}

              {statusBreakdown.length === 0 &&
                !isLoading && (
                  <p className="text-[11px] text-gray-300 dark:text-gray-600">
                    نوبتی ثبت نشده.
                  </p>
                )}
            </div>
          </div>

          {/* Waitlist */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.06]">
            <h3 className="mb-4 flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-100">
              <Users className="h-4 w-4 text-primary-dark dark:text-primary-light" />
              لیست انتظار
            </h3>

            <div className="space-y-3">
              {waitingList.length === 0 && (
                <p className="text-[11px] text-gray-300 dark:text-gray-600">
                  کسی در صف انتظار نیست.
                </p>
              )}

              {waitingList.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5"
                >
                  <Image
                    src="/image/user.PNG"
                    alt="User"
                    width={32}
                    height={32}
                    unoptimized
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-medium text-gray-700 dark:text-gray-200">
                      {item.patientName}
                    </div>

                    <div className="truncate text-[10px] text-gray-400 dark:text-gray-500">
                      {item.serviceName}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[9px] ${waitTone(waitMinutes(item))}`}
                  >
                    {waitLabel(waitMinutes(item))}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href={`/clinic/${clinicSlug}/calendar`}
              className="mt-4 flex items-center gap-1 text-[11px] text-primary-dark transition hover:text-primary dark:text-primary-light"
            >
              <ChevronRight className="h-3 w-3" />
              مشاهده همه
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Reusable Row
========================= */

function Row({
  label,
  value,
  dir,
}: {
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-gray-400 dark:text-gray-500">
        {label}
      </span>

      <span
        className="truncate text-left text-gray-700 dark:text-gray-200"
        dir={dir}
      >
        {value}
      </span>
    </div>
  );
}

