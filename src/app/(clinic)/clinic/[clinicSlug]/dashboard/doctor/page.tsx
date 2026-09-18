"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock3, Users, CheckCircle2, StickyNote, Video, ChevronLeft, FileText, Images, Bell } from "lucide-react";

import { getCurrentClinicUser } from "@/lib/api/session";
import { getAppointments, toLocalIsoDate } from "@/lib/api/appointments";
import { queryKeys } from "@/lib/query/keys";

const STATUS_LABEL: Record<string, string> = {
  pending: "در انتظار تایید",
  confirmed: "تایید‌شده",
  completed: "انجام‌شده",
  cancelled: "لغو‌شده",
  no_show: "عدم حضور",
  rescheduled: "تغییر زمان",
};
const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-50 text-warning dark:bg-amber-500/10 dark:text-amber-400",
  confirmed: "bg-primary-light/20 text-primary-dark dark:bg-primary/10 dark:text-primary",
  completed: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  cancelled: "bg-red-50 text-danger",
  no_show: "bg-red-50 text-danger",
  rescheduled: "bg-secondary-purple/40 text-purple-600",
};

// این بخش‌ها هنوز منبع API مطمئنی ندارند (نه endpoint یادداشت‌های ناتمام پزشک،
// نه سیستم یادآوری هوشمند بر اساس سابقه‌ی پزشکی) — mock می‌مانند
const PENDING_NOTES = [
  { patient: "پریسا کاظمی", service: "تزریق ژل لب", date: "دیروز" },
  { patient: "فاطمه یوسفی", service: "بوتاکس", date: "۲ روز پیش" },
];

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function DoctorDashboardPage({ params }: { params: Promise<{ clinicSlug: string }> }) {
  const { clinicSlug } = use(params);

  const { data: currentUser } = useQuery({
    queryKey: queryKeys.session.currentUser(clinicSlug),
    queryFn: () => getCurrentClinicUser(clinicSlug),
    enabled: !!clinicSlug,
  });

  const today = toLocalIsoDate(new Date());

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: queryKeys.appointmentsCalendar.list(clinicSlug, today, currentUser?.userId ?? undefined),
    queryFn: () => getAppointments(clinicSlug, { from: today, to: today, doctorUserId: currentUser!.userId! }),
    enabled: !!clinicSlug && !!currentUser?.userId,
  });

  const sorted = useMemo(
    () => [...appointments].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [appointments]
  );

  const completedCount = appointments.filter((a) => a.status === "completed").length;

  const nextAppointment = useMemo(() => {
    const now = Date.now();
    return sorted.find((a) => new Date(a.startTime).getTime() > now && (a.status === "confirmed" || a.status === "pending")) ?? null;
  }, [sorted]);

  const minutesToNext = nextAppointment
    ? Math.max(0, Math.round((new Date(nextAppointment.startTime).getTime() - Date.now()) / 60000))
    : null;

  const STATS = [
    { icon: Users, tone: "text-primary-dark bg-primary-light/20 dark:text-primary dark:bg-primary/10", label: "بیماران امروز", value: appointments.length.toLocaleString("fa-IR") },
    { icon: CheckCircle2, tone: "text-blue-600 bg-secondary-blue/40 dark:text-blue-400 dark:bg-blue-500/10", label: "ویزیت‌های انجام‌شده", value: completedCount.toLocaleString("fa-IR") },
    {
      icon: Clock3,
      tone: "text-purple-600 bg-secondary-purple/40 dark:text-purple-400 dark:bg-purple-500/10",
      label: "نوبت بعدی تا",
      value: minutesToNext != null ? `${minutesToNext.toLocaleString("fa-IR")} دقیقه` : "—",
    },
    // «یادداشت‌های ناتمام» هیچ endpoint مشخصی ندارد — عدد mock می‌ماند
    { icon: StickyNote, tone: "text-pink-600 bg-secondary-pink/40 dark:text-pink-400 dark:bg-pink-500/10", label: "یادداشت‌های ناتمام", value: "۲" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
          سلام {currentUser?.fullName ?? "دکتر"}
        </h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">برنامه‌ی امروز شما و بیماران در انتظار ویزیت</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${s.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{isLoading ? "…" : s.value}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <h2 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">بیماران امروز</h2>

          {isLoading && <div className="py-10 text-center text-xs text-gray-400">در حال بارگذاری...</div>}

          {!isLoading && (
            <div className="space-y-3">
              {sorted.map((p) => (
                <Link
                  key={p.id}
                  href={`/clinic/${clinicSlug}/calendar/${p.id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-50 p-3 transition-colors hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-gray-800/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex w-12 shrink-0 flex-col items-center text-primary-dark dark:text-primary">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span className="text-[11px] font-medium">{formatTime(p.startTime)}</span>
                    </div>
                    <div className="h-8 w-8 shrink-0 rounded-full bg-gray-100 dark:bg-gray-800" />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">{p.patientName}</div>
                      <div className="truncate text-[11px] text-gray-400 dark:text-gray-500">{p.serviceName}</div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {p.appointmentType === "online" && <Video className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />}
                    <span className={`rounded-full px-2.5 py-1 text-[10px] ${STATUS_TONE[p.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </div>
                </Link>
              ))}
              {sorted.length === 0 && <div className="py-6 text-center text-xs text-gray-300">نوبتی برای امروز ثبت نشده.</div>}
            </div>
          )}

          <Link
            href={`/clinic/${clinicSlug}/calendar`}
            className="mt-4 flex items-center gap-1 text-xs text-primary-dark transition-colors hover:text-primary dark:text-primary"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> مشاهده تقویم کامل
          </Link>
        </div>

        {/* ستون کناری — کاملاً mock، بدون منبع API */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-800 dark:text-gray-100">
              <StickyNote className="h-4 w-4 text-primary-dark dark:text-primary" /> یادداشت‌های ناتمام
            </h3>
            <div className="space-y-3">
              {PENDING_NOTES.map((n) => (
                <div key={n.patient} className="flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-gray-700 dark:text-gray-200">{n.patient}</div>
                    <div className="truncate text-[10px] text-gray-400 dark:text-gray-500">
                      {n.service} · {n.date}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-lg bg-primary-light/15 px-2.5 py-1 text-[10px] text-primary-dark transition-colors hover:bg-primary-light/25 dark:bg-primary/10 dark:text-primary dark:hover:bg-primary/15"
                  >
                    تکمیل
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-800 dark:text-gray-100">
              <Bell className="h-4 w-4 text-primary-dark dark:text-primary" /> یادآوری‌ها
            </h3>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              بیمار «سارا محمدی» سابقه‌ی حساسیت به لیدوکائین دارد — قبل از تزریق بررسی شود.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickLink icon={Users} label="مشاهده پرونده بیمار" href={`/clinic/${clinicSlug}/patients`} />
        <QuickLink icon={FileText} label="ثبت یادداشت جلسه" href={null} />
        <QuickLink icon={Images} label="آپلود تصاویر قبل/بعد" href={null} />
        <QuickLink icon={Video} label="شروع ویزیت آنلاین" href={null} />
      </div>
    </div>
  );
}

function QuickLink({ icon: Icon, label, href }: { icon: typeof FileText; label: string; href: string | null }) {
  const content = (
    <>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light/20 dark:bg-primary/10">
        <Icon className="h-4 w-4 text-primary-dark dark:text-primary" />
      </div>
      <span className="text-center text-[11px] font-medium text-gray-700 dark:text-gray-200">{label}</span>
    </>
  );

  if (!href) {
    return (
      <button
        type="button"
        disabled
        title="این بخش هنوز آماده نشده"
        className="flex cursor-not-allowed flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 opacity-50 dark:border-gray-800 dark:bg-gray-900"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/70"
    >
      {content}
    </Link>
  );
}