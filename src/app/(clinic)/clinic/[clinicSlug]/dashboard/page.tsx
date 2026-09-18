"use client";

import { useEffect, useMemo } from "react";

import { useRouter } from "next/navigation";

import {
  RefreshCcw,
  Sparkles,
  CalendarCheck,
  Users,
  ChevronLeft,
  Gift,
  Send,
  Mail,
  Clock3,
  XCircle,
  CheckCircle2,
  BarChart3,
  Briefcase,
  UserPlus,
  Receipt,
  Wallet,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { LoadingLogo } from "@/components/LoadingLogo";

import { useActiveClinic } from "@/hooks/use-active-clinic";
import { queryKeys } from "@/lib/query/keys";

import { getCurrentClinicUser, getDashboardPathForRole } from "@/lib/api/session";

import {
  getClinicDashboard,
  getClinicModules,
  getUpcomingAppointments,
  isFinanceModuleEnabled,
} from "@/lib/api/clinic-dashboard";

import { getServicesReport, getAppointmentsReport, getSmsReport } from "@/lib/api/reports";
import { getPatients } from "@/lib/api/patients";
import { getPayments } from "@/lib/api/finance";
import { PAYMENT_METHOD_LABEL, formatToman } from "@/lib/finance-labels";

const SERVICE_COLORS = ["#0EA5A4", "#F9A8D4", "#C4B5FD", "#5EEAD4", "#0F766E", "#FCA5A5"];

const SMS_STATUS_META: Record<string, { label: string; icon: typeof Send; tone: string }> = {
  scheduled: {
    label: "زمان‌بندی‌شده",
    icon: Clock3,
    tone: "text-purple-600 bg-secondary-purple/40 dark:bg-purple-500/10 dark:text-purple-300",
  },
  sent: {
    label: "ارسال‌شده",
    icon: Send,
    tone: "text-primary-dark bg-primary-light/20 dark:bg-primary-light/10 dark:text-primary-light",
  },
  delivered: {
    label: "تحویل‌شده",
    icon: CheckCircle2,
    tone: "text-primary-dark bg-primary-light/20 dark:bg-primary-light/10 dark:text-primary-light",
  },
  failed: {
    label: "ناموفق",
    icon: XCircle,
    tone: "text-danger bg-red-50 dark:bg-red-500/10 dark:text-red-300",
  },
  cancelled: {
    label: "لغوشده",
    icon: XCircle,
    tone: "text-danger bg-red-50 dark:bg-red-500/10 dark:text-red-300",
  },
};

function formatValue(value: number | null, suffix = "") {
  if (value === null) return "—";
  return value.toLocaleString("fa-IR") + suffix;
}

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getMonthRange(monthsAgo: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
  return {
    label: start.toLocaleDateString("fa-IR", { month: "long" }),
    from: toIso(start),
    to: toIso(end),
  };
}

export default function ClinicDashboardPage() {
  const { clinicSlug } = useActiveClinic();
  const router = useRouter();

  const { data: currentUser, isLoading: currentUserLoading } = useQuery({
    queryKey: queryKeys.session.currentUser(clinicSlug),
    queryFn: () => getCurrentClinicUser(clinicSlug),
    enabled: !!clinicSlug,
  });

  useEffect(() => {
    if (!clinicSlug || !currentUser) return;
    if (currentUser.roleKey === "doctor" || currentUser.roleKey === "receptionist") {
      router.replace(getDashboardPathForRole(clinicSlug, currentUser.roleKey));
    }
  }, [clinicSlug, currentUser, router]);

  const today = useMemo(() => new Date(), []);
  const todayIso = toIso(today);
  const last30DaysIso = useMemo(() => toIso(new Date(today.getTime() - 29 * 86400000)), [today]);
  const monthRanges = useMemo(() => [5, 4, 3, 2, 1, 0].map(getMonthRange), []);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: queryKeys.dashboard.clinic(clinicSlug),
    queryFn: () => getClinicDashboard(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: modules = [] } = useQuery({
    queryKey: queryKeys.modules.list(clinicSlug),
    queryFn: () => getClinicModules(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: upcomingAppointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: queryKeys.dashboard.upcomingAppointments(clinicSlug),
    queryFn: () => getUpcomingAppointments(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: topServicesRaw = [], isLoading: topServicesLoading } = useQuery({
    queryKey: queryKeys.reports.services(clinicSlug, last30DaysIso, todayIso),
    queryFn: () => getServicesReport(clinicSlug, last30DaysIso, todayIso),
    enabled: !!clinicSlug,
  });

  const { data: monthlyVisits = [], isLoading: visitsLoading } = useQuery({
    queryKey: ["dashboard", clinicSlug, "monthly-visits", monthRanges.map((r) => r.from).join(",")],
    queryFn: async () => {
      const results = await Promise.all(monthRanges.map((r) => getAppointmentsReport(clinicSlug, r.from, r.to)));
      return monthRanges.map((r, i) => ({
        label: r.label,
        total: results[i].reduce((sum, item) => sum + item.totalCount, 0),
      }));
    },
    enabled: !!clinicSlug,
  });

  const { data: smsStats = [] } = useQuery({
    queryKey: queryKeys.reports.sms(clinicSlug),
    queryFn: () => getSmsReport(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: allPatients = [] } = useQuery({
    queryKey: queryKeys.patients.list(clinicSlug),
    queryFn: () => getPatients(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: recentPayments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: queryKeys.finance.payments(clinicSlug),
    queryFn: () => getPayments(clinicSlug),
    enabled: !!clinicSlug,
  });

  const financeEnabled = isFinanceModuleEnabled(modules);

  const topServices = useMemo(() => {
    const sorted = [...topServicesRaw].sort((a, b) => b.totalCount - a.totalCount).slice(0, 5);
    const total = sorted.reduce((sum, s) => sum + s.totalCount, 0);
    return sorted.map((s, i) => ({
      ...s,
      color: SERVICE_COLORS[i % SERVICE_COLORS.length],
      percent: total > 0 ? Math.round((s.totalCount / total) * 100) : 0,
    }));
  }, [topServicesRaw]);

  const topServicesTotal = topServices.reduce((sum, s) => sum + s.totalCount, 0);

  let cumulative = 0;
  const gradientParts =
    topServicesTotal > 0
      ? topServices
          .map((service) => {
            const start = (cumulative / topServicesTotal) * 100;
            cumulative += service.totalCount;
            const end = (cumulative / topServicesTotal) * 100;
            return `${service.color} ${start}% ${end}%`;
          })
          .join(", ")
      : "#e5e7eb 0% 100%";

  const barMax = Math.max(...monthlyVisits.map((item) => item.total), 1);

  const upcomingBirthdays = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in7Days = new Date(todayStart.getTime() + 7 * 86400000);

    return allPatients
      .filter((p) => p.birthDate)
      .map((p) => {
        const bd = new Date(p.birthDate!);
        let next = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
        if (next < todayStart) next = new Date(now.getFullYear() + 1, bd.getMonth(), bd.getDate());
        return { name: `${p.firstName} ${p.lastName}`, date: next };
      })
      .filter((p) => p.date <= in7Days)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [allPatients]);

  const recentPaymentsSorted = useMemo(
    () =>
      [...recentPayments]
        .sort((a, b) => new Date(b.paidAt ?? 0).getTime() - new Date(a.paidAt ?? 0).getTime())
        .slice(0, 5),
    [recentPayments]
  );

  if (currentUserLoading || currentUser?.roleKey === "doctor" || currentUser?.roleKey === "receptionist") {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-gray-400 dark:text-gray-500">
      <LoadingLogo />
      </div>
    );
  }

  const QUICK_ACTIONS = [
    {
      icon: Briefcase,
      tone: "text-gray-600 bg-gray-100 dark:bg-white/10 dark:text-gray-300",
      label: "مدیریت خدمات",
      href: "services",
    },
    {
      icon: BarChart3,
      tone: "text-primary-dark bg-primary-light/20 dark:bg-primary-light/10 dark:text-primary-light",
      label: "گزارش درآمد",
      href: "reports",
    },
    {
      icon: Send,
      tone: "text-pink-600 bg-secondary-pink/40 dark:bg-pink-500/10 dark:text-pink-300",
      label: "ارسال پیامک",
      href: "sms",
    },
    {
      icon: Receipt,
      tone: "text-blue-600 bg-secondary-blue/40 dark:bg-blue-500/10 dark:text-blue-300",
      label: "صدور فاکتور",
      href: "finance/invoices",
      requiresFinance: true,
    },
    {
      icon: UserPlus,
      tone: "text-purple-600 bg-secondary-purple/40 dark:bg-purple-500/10 dark:text-purple-300",
      label: "مراجع جدید",
      href: "patients?new=1",
    },
    {
      icon: CalendarCheck,
      tone: "text-primary-dark bg-primary-light/20 dark:bg-primary-light/10 dark:text-primary-light",
      label: "نوبت جدید",
      href: "calendar/new",
    },
  ].filter((a) => !a.requiresFinance || financeEnabled);

  const KPIS = [
    {
      icon: CalendarCheck,
      tone: "text-purple-600 bg-secondary-purple/40 dark:bg-purple-500/10 dark:text-purple-300",
      label: "نوبت‌های امروز",
      value: formatValue(summary?.appointmentsToday ?? null),
    },
    {
      icon: Users,
      tone: "text-pink-600 bg-secondary-pink/40 dark:bg-pink-500/10 dark:text-pink-300",
      label: "بیماران جدید امروز",
      value: formatValue(summary?.newPatientsToday ?? null),
    },
    {
      icon: Sparkles,
      tone: "text-primary-dark bg-primary-light/20 dark:bg-primary-light/10 dark:text-primary-light",
      label: "خدمات انجام‌شده امروز",
      value: formatValue(summary?.servicesPerformedToday ?? null),
    },
    {
      icon: RefreshCcw,
      tone: "text-purple-600 bg-secondary-purple/40 dark:bg-purple-500/10 dark:text-purple-300",
      label: "نرخ بازگشت مشتری",
      value: formatValue(summary?.returnRatePercent ?? null, "٪"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.08]"
            >
              <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${kpi.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {summaryLoading ? "…" : kpi.value}
              </div>
              <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Visits + Top Services */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Visits */}
        <div className="group relative overflow-hidden rounded-3xl border border-gray-100/80 bg-white/90 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">مراجعات در ۶ ماه گذشته</h3>
          </div>

          {visitsLoading ? (
            <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</p>
          ) : (
            <svg viewBox="0 0 280 130" className="w-full">
              {monthlyVisits.map((visit, index) => {
                const barW = 24;
                const gap = 280 / monthlyVisits.length;
                const barH = (visit.total / barMax) * 100;
                const x = index * gap + (gap - barW) / 2;
                return (
                  <g key={visit.label}>
                    <rect x={x} y={110 - barH} width={barW} height={barH} rx="4" fill="#5EEAD4" />
                    <text x={x + barW / 2} y="124" fontSize="8" fill="#9CA3AF" textAnchor="middle">
                      {visit.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          <Link
            href={`/clinic/${clinicSlug}/reports`}
            className="mt-2 flex items-center gap-1 text-xs text-primary-dark transition hover:text-primary dark:text-primary-light"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            گزارش کامل مراجعات
          </Link>
        </div>

        {/* Top Services */}
        <div className="group relative overflow-hidden rounded-3xl border border-gray-100/80 bg-white/90 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
          <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">
            خدمات پرطرفدار <span className="text-[10px] font-normal text-gray-400">(۳۰ روز اخیر)</span>
          </h3>

          {topServicesLoading ? (
            <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</p>
          ) : topServices.length === 0 ? (
            <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">
              خدمتی در این بازه ثبت نشده.
            </p>
          ) : (
            <>
              <div className="flex justify-center">
                <div
                  className="flex h-32 w-32 items-center justify-center rounded-full"
                  style={{ background: `conic-gradient(${gradientParts})` }}
                >
                  <div className="flex h-[5.5rem] w-[5.5rem] flex-col items-center justify-center rounded-full bg-white p-4 text-center dark:bg-[#1b2423]">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">کل خدمات</span>
                    <span className="text-base font-bold text-gray-800 dark:text-white">
                      {topServicesTotal.toLocaleString("fa-IR")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-[11px]">
                {topServices.map((service) => (
                  <div
                    key={service.serviceId}
                    className="flex items-center justify-between rounded-xl p-2 transition hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                  >
                    <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: service.color }} />
                      {service.name}
                    </span>
                    <span className="text-gray-700 dark:text-gray-200">
                      {service.totalCount.toLocaleString("fa-IR")} ({service.percent}٪)
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <Link
            href={`/clinic/${clinicSlug}/services`}
            className="mt-4 flex items-center gap-1 text-xs text-primary-dark transition hover:text-primary dark:text-primary-light"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            مشاهده همه خدمات
          </Link>
        </div>
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Recent Payments */}
        <div className="group relative overflow-hidden rounded-3xl border border-gray-100/80 bg-white/90 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
          <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-gray-800 dark:text-gray-100">
              آخرین دریافت‌ها
            </h3>
            <Link
              href={`/clinic/${clinicSlug}/finance/receipts`}
              className="rounded-full bg-primary-light/10 px-3 py-1 text-[11px] font-medium text-primary-dark transition hover:bg-primary-light/20 dark:text-primary-light dark:hover:bg-primary-light/15"
            >
              مشاهده همه
            </Link>
          </div>

          {paymentsLoading ? (
            <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</p>
          ) : recentPaymentsSorted.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">دریافتی ثبت نشده.</p>
          ) : (
            <div className="space-y-3">
              {recentPaymentsSorted.map((p) => (
                <div
                  key={p.id}
                  className="group/item flex items-start justify-between gap-2 rounded-xl p-2 transition hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-primary-dark bg-primary-light/20 dark:bg-primary-light/10 dark:text-primary-light">
                      <Wallet className="h-3 w-3" />
                    </span>
                    <p className="text-xs leading-6 text-gray-600 dark:text-gray-300">
                      {p.patientName ?? "بیمار"} — {formatToman(p.amount)}
                      <span className="mr-1 text-[10px] text-gray-400">({PAYMENT_METHOD_LABEL[p.method]})</span>
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-gray-300 dark:text-gray-600">
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString("fa-IR") : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SMS status */}
        <div className="group relative overflow-hidden rounded-3xl border border-gray-100/80 bg-white/90 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
          <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">وضعیت پیامک‌ها</h3>
            <Link
              href={`/clinic/${clinicSlug}/sms`}
              className="rounded-full bg-primary-light/10 px-3 py-1 text-[11px] font-medium text-primary-dark transition hover:bg-primary-light/20 dark:text-primary-light dark:hover:bg-primary-light/15"
            >
              مشاهده همه
            </Link>
          </div>

          {smsStats.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">پیامکی ثبت نشده.</p>
          ) : (
            <div className="space-y-3">
              {smsStats.map((sms) => {
                const meta = SMS_STATUS_META[sms.status] ?? {
                  label: sms.status,
                  icon: Mail,
                  tone: "text-gray-600 bg-gray-100 dark:bg-white/10 dark:text-gray-300",
                };
                const Icon = meta.icon;
                return (
                  <div
                    key={sms.status}
                    className="flex items-center justify-between rounded-xl p-2 transition hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                  >
                    <span className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full ${meta.tone}`}>
                        <Icon className="h-3 w-3" />
                      </span>
                      {meta.label}
                    </span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                      {sms.totalCount.toLocaleString("fa-IR")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Birthdays */}
        <div className="group relative overflow-hidden rounded-3xl border border-gray-100/80 bg-white/90 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
          <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">تولدهای ۷ روز آینده</h3>
            <Link
              href={`/clinic/${clinicSlug}/patients`}
              className="rounded-full bg-primary-light/10 px-3 py-1 text-[11px] font-medium text-primary-dark transition hover:bg-primary-light/20 dark:text-primary-light dark:hover:bg-primary-light/15"
            >
              مشاهده همه
            </Link>
          </div>

          {upcomingBirthdays.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
              تولدی در ۷ روز آینده ثبت نشده.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingBirthdays.slice(0, 5).map((birthday, i) => (
                <div
                  key={`${birthday.name}-${i}`}
                  className="flex items-center justify-between rounded-xl p-2 transition hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                >
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {birthday.date.toLocaleDateString("fa-IR", { day: "numeric", month: "long" })}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-200">
                    {birthday.name}
                    <Gift className="h-3.5 w-3.5 text-pink-400 dark:text-pink-300" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="group relative overflow-hidden rounded-3xl border border-gray-100/80 bg-white/90 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
          <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">نوبت‌های آینده</h3>
            <Link
              href={`/clinic/${clinicSlug}/calendar`}
              className="rounded-full bg-primary-light/10 px-3 py-1 text-[11px] font-medium text-primary-dark transition hover:bg-primary-light/20 dark:text-primary-light dark:hover:bg-primary-light/15"
            >
              مشاهده همه
            </Link>
          </div>

          {appointmentsLoading && (
            <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</div>
          )}

          {!appointmentsLoading && (
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 4).map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-2.5 rounded-xl p-1 transition hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                >
                  <Image
                    src="/image/user.PNG"
                    alt="User"
                    width={30}
                    height={30}
                    unoptimized
                    className="h-[30px] w-[30px] rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-gray-700 dark:text-gray-200">
                      {appointment.patientName}
                    </div>
                    <div className="truncate text-[10px] text-gray-400 dark:text-gray-500">
                      {appointment.serviceName}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500" dir="ltr">
                    {appointment.startTime
                      ? new Date(appointment.startTime).toLocaleTimeString("fa-IR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </span>
                </div>
              ))}

              {upcomingAppointments.length === 0 && (
                <div className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">نوبتی ثبت نشده.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-gray-800 dark:text-gray-100">دسترسی سریع</h3>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={`/clinic/${clinicSlug}/${action.href}`}
                className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 transition hover:bg-gray-50 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${action.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-center text-[11px] font-medium text-gray-700 dark:text-gray-200">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}