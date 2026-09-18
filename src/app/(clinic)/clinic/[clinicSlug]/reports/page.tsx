"use client";

import { use, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  Wallet,
  Sparkles,
  UserPlus,
  Megaphone,
  Stethoscope,
  RefreshCcw,
  Users,
  MessageSquare,
  Landmark,
  CalendarDays,
} from "lucide-react";
import { DateObject } from "react-multi-date-picker";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import {
  getServicesReport,
  getAppointmentsReport,
  getPatientsReport,
  getDoctorsReport,
  getReturnRateReport,
  getSmsReport,
  getFinanceReport,
  exportReport,
  type ReportType,
} from "@/lib/api/reports";
import { toLocalIsoDate } from "@/lib/api/appointments";
import { queryKeys } from "@/lib/query/keys";

const TABS = [
  { key: "services", label: "خدمات", icon: Stethoscope },
  { key: "patients", label: "بیماران", icon: UserPlus },
  { key: "doctors", label: "پزشکان", icon: Users },
  { key: "appointments", label: "نوبت‌ها", icon: CalendarDays },
  { key: "finance", label: "مالی", icon: Landmark },
  { key: "sms", label: "پیامک", icon: MessageSquare },
  {
    key: "marketing",
    label: "اثربخشی بازاریابی",
    icon: Megaphone,
  },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "در انتظار تایید",
  confirmed: "تایید‌شده",
  completed: "تکمیل‌شده",
  cancelled: "لغو‌شده",
  no_show: "عدم حضور",
  rescheduled: "تغییر زمان",
  delivered: "تحویل‌شده",
  sent: "ارسال‌شده",
  scheduled: "زمان‌بندی‌شده",
  failed: "ناموفق",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#0EA5A4",
  completed: "#0EA5A4",
  cancelled: "#EF4444",
  no_show: "#F472B6",
  rescheduled: "#A78BFA",
  delivered: "#0EA5A4",
  sent: "#60A5FA",
  scheduled: "#FBBF24",
  failed: "#EF4444",
};

const METHOD_LABEL: Record<string, string> = {
  cash: "نقدی",
  pos: "کارت‌خوان",
  online: "پرداخت آنلاین",
};

const MARKETING_MOCK = [
  {
    channel: "اینستاگرام",
    leads: 128,
    conversions: 34,
  },
  {
    channel: "پیامک تبلیغاتی",
    leads: 76,
    conversions: 19,
  },
  {
    channel: "معرفی توسط دیگران",
    leads: 54,
    conversions: 22,
  },
];

export default function ReportsPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);

  const [tab, setTab] = useState("services");

  const [fromDate, setFromDate] = useState<DateObject>(() => {
    const d = new DateObject({
      calendar: persian,
      locale: persian_fa,
    });

    return d.subtract(6, "months");
  });

  const [toDate, setToDate] = useState<DateObject>(
    new DateObject({
      calendar: persian,
      locale: persian_fa,
    })
  );

  const from = toLocalIsoDate(fromDate.toDate());
  const to = toLocalIsoDate(toDate.toDate());

  // --------------------------------------------------
  // Reports
  // --------------------------------------------------

  const {
    data: services = [],
    isLoading: servicesLoading,
  } = useQuery({
    queryKey: queryKeys.reports.services(
      clinicSlug,
      from,
      to
    ),
    queryFn: () =>
      getServicesReport(clinicSlug, from, to),
    enabled: !!clinicSlug,
  });

  const { data: appointmentStatuses = [] } =
    useQuery({
      queryKey: queryKeys.reports.appointments(
        clinicSlug,
        from,
        to
      ),
      queryFn: () =>
        getAppointmentsReport(
          clinicSlug,
          from,
          to
        ),
      enabled: !!clinicSlug,
    });

  const { data: patientsReport } = useQuery({
    queryKey: queryKeys.reports.patients(
      clinicSlug,
      from,
      to
    ),
    queryFn: () =>
      getPatientsReport(
        clinicSlug,
        from,
        to
      ),
    enabled: !!clinicSlug,
  });

  const { data: doctorsReport = [] } =
    useQuery({
      queryKey: queryKeys.reports.doctors(
        clinicSlug,
        from,
        to
      ),
      queryFn: () =>
        getDoctorsReport(
          clinicSlug,
          from,
          to
        ),
      enabled: !!clinicSlug,
    });

  const { data: returnRate } = useQuery({
    queryKey: queryKeys.reports.returnRate(
      clinicSlug,
      from,
      to
    ),
    queryFn: () =>
      getReturnRateReport(
        clinicSlug,
        from,
        to
      ),
    enabled: !!clinicSlug,
  });

  const { data: smsReport = [] } =
    useQuery({
      queryKey: queryKeys.reports.sms(
        clinicSlug
      ),
      queryFn: () =>
        getSmsReport(clinicSlug),
      enabled: !!clinicSlug,
    });

  const { data: financeReport } =
    useQuery({
      queryKey: queryKeys.reports.finance(
        clinicSlug
      ),
      queryFn: () =>
        getFinanceReport(clinicSlug),
      enabled: !!clinicSlug,
    });

  // --------------------------------------------------
  // Calculations
  // --------------------------------------------------

  const totalServicesCount = useMemo(
    () =>
      services.reduce(
        (sum, item) =>
          sum + item.totalCount,
        0
      ),
    [services]
  );

  const avgCostPerService =
    financeReport &&
      totalServicesCount > 0
      ? Math.round(
        financeReport.totalRevenue /
        totalServicesCount
      )
      : null;

  const totalAppointments = useMemo(
    () =>
      appointmentStatuses.reduce(
        (sum, item) =>
          sum + item.totalCount,
        0
      ),
    [appointmentStatuses]
  );

  // --------------------------------------------------
  // Export
  // --------------------------------------------------

  async function handleExport(
    reportType: ReportType
  ) {
    try {
      const url = await exportReport(
        clinicSlug,
        reportType,
        from,
        to
      );

      if (url) {
        window.open(url, "_blank");
      }
    } catch {
      // intentionally ignored
    }
  }

  // --------------------------------------------------
  // KPI
  // --------------------------------------------------

  const KPIS = [
    {
      icon: UserPlus,
      tone: "text-pink-600 dark:text-pink-400 bg-secondary-pink/40 dark:bg-pink-500/10",
      label: "بیماران جدید",
      value: patientsReport?.newPatients,
      unit: "نفر",
    },
    {
      icon: Users,
      tone: "text-blue-600 dark:text-blue-400 bg-secondary-blue/40 dark:bg-blue-500/10",
      label: "بیماران فعال",
      value: patientsReport?.activePatients,
      unit: "نفر",
    },
    {
      icon: RefreshCcw,
      tone: "text-purple-600 dark:text-purple-400 bg-secondary-purple/40 dark:bg-purple-500/10",
      label: "نرخ بازگشت",
      value: returnRate,
      unit: "٪",
    },
    {
      icon: Wallet,
      tone: "text-primary-dark dark:text-primary bg-primary-light/20 dark:bg-primary/10",
      label: "کل درآمد",
      value: financeReport?.totalRevenue,
      unit: "تومان",
    },
    {
      icon: Sparkles,
      tone: "text-primary-dark dark:text-primary bg-primary-light/20 dark:bg-primary/10",
      label: "میانگین هزینه هر خدمت",
      value: avgCostPerService,
      unit: "تومان",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 md:text-2xl">
          گزارش‌های کامل
        </h1>

        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          تحلیل عملکرد کلینیک در بازه‌ی زمانی انتخابی
        </p>
      </div>

      {/* Date Range */}
      <div className="flex flex-wrap items-center gap-2">
        {/* From */}
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
          <span className="text-gray-400 dark:text-gray-500">
            از
          </span>

          <DatePicker
            value={fromDate}
            onChange={(v) => {
              if (v) {
                setFromDate(v as DateObject);
              }
            }}
            calendar={persian}
            locale={persian_fa}
            calendarPosition="bottom-right"
            render={(_v, openCalendar) => (
              <button
                type="button"
                onClick={openCalendar}
                className="font-medium text-gray-700 transition-colors hover:text-primary dark:text-gray-200 dark:hover:text-primary"
              >
                {fromDate.format("YYYY/MM/DD")}
              </button>
            )}
          />
        </div>

        {/* To */}
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
          <span className="text-gray-400 dark:text-gray-500">
            تا
          </span>

          <DatePicker
            value={fromDate}
            onChange={(v) => {
              if (v) {
                setFromDate(v);
              }
            }}
            calendar={persian}
            locale={persian_fa}
            calendarPosition="bottom-right"
            render={(_v, openCalendar) => (
              <button
                type="button"
                onClick={openCalendar}
                className="font-medium text-gray-700 transition-colors hover:text-primary dark:text-gray-200 dark:hover:text-primary"
              >
                {fromDate.format("YYYY/MM/DD")}
              </button>
            )}
          />
        </div>

        {/* Export */}
        <button
          type="button"
          onClick={() =>
            handleExport(tab as ReportType)
          }
          disabled={tab === "marketing"}
          className="ms-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          خروجی CSV همین گزارش
        </button>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white px-4 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
        <div className="flex min-w-max items-center gap-5 text-xs">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive =
              tab === t.key;

            return (
              <button
                key={t.key}
                type="button"
                onClick={() =>
                  setTab(t.key)
                }
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-3 transition-all ${isActive
                  ? "border-primary font-medium text-primary-dark dark:text-primary"
                  : "border-transparent text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive
                    ? "text-primary"
                    : "text-gray-400 dark:text-gray-500"
                    }`}
                />

                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {KPIS.map((k) => {
          const Icon = k.icon;

          return (
            <div
              key={k.label}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  {k.label}
                </span>

                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${k.tone}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {k.value != null
                  ? k.value.toLocaleString(
                    "fa-IR"
                  )
                  : "—"}
              </div>

              <div className="text-[10px] text-gray-400 dark:text-gray-500">
                {k.unit}
              </div>
            </div>
          );
        })}
      </div>

      {/* Services */}
      {tab === "services" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
          <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">
            تعداد ارائه‌ی هر خدمت
          </h3>

          {servicesLoading && (
            <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
              در حال بارگذاری...
            </div>
          )}

          {!servicesLoading && (
            <div className="space-y-2.5">
              {[...services]
                .sort(
                  (a, b) =>
                    b.totalCount -
                    a.totalCount
                )
                .map((s) => {
                  const max = Math.max(
                    ...services.map(
                      (x) =>
                        x.totalCount
                    ),
                    1
                  );

                  return (
                    <div
                      key={s.serviceId}
                      className="flex items-center gap-3 text-xs"
                    >
                      <span className="w-32 shrink-0 truncate text-gray-700 dark:text-gray-300">
                        {s.name}
                      </span>

                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${(s.totalCount /
                              max) *
                              100
                              }%`,
                          }}
                        />
                      </div>

                      <span className="w-10 shrink-0 text-left font-medium text-gray-800 dark:text-gray-200">
                        {s.totalCount.toLocaleString(
                          "fa-IR"
                        )}
                      </span>
                    </div>
                  );
                })}

              {services.length === 0 && (
                <div className="py-6 text-center text-xs text-gray-300 dark:text-gray-600">
                  خدمتی ثبت نشده.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Patients */}
      {tab === "patients" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
            <div className="text-3xl font-bold text-primary-dark dark:text-primary">
              {(
                patientsReport?.newPatients ??
                0
              ).toLocaleString("fa-IR")}
            </div>

            <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              بیماران جدید در این بازه
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
            <div className="text-3xl font-bold text-primary-dark dark:text-primary">
              {(
                patientsReport?.activePatients ??
                0
              ).toLocaleString("fa-IR")}
            </div>

            <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              بیماران فعال در این بازه
            </div>
          </div>
        </div>
      )}

      {/* Doctors */}
      {tab === "doctors" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
          <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">
            عملکرد پزشکان (جلسات تکمیل‌شده)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 dark:border-white/10 dark:text-gray-500">
                  <th className="pb-2 font-medium">
                    پزشک
                  </th>

                  <th className="pb-2 font-medium">
                    جلسات تکمیل‌شده
                  </th>
                </tr>
              </thead>

              <tbody>
                {[...doctorsReport]
                  .sort(
                    (a, b) =>
                      b.completedVisits -
                      a.completedVisits
                  )
                  .map((d) => (
                    <tr
                      key={d.doctorUserId}
                      className="border-b border-gray-50 dark:border-white/5"
                    >
                      <td className="py-2 text-gray-700 dark:text-gray-300">
                        {d.fullName}
                      </td>

                      <td className="py-2 text-gray-700 dark:text-gray-300">
                        {d.completedVisits.toLocaleString(
                          "fa-IR"
                        )}
                      </td>
                    </tr>
                  ))}

                {doctorsReport.length ===
                  0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="py-6 text-center text-gray-300 dark:text-gray-600"
                      >
                        داده‌ای یافت نشد.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Appointments */}
      {tab === "appointments" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
          <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">
            نوبت‌ها به تفکیک وضعیت (
            مجموع:{" "}
            {totalAppointments.toLocaleString(
              "fa-IR"
            )}
            )
          </h3>

          <div className="space-y-2.5">
            {appointmentStatuses.map(
              (a) => (
                <div
                  key={a.status}
                  className="flex items-center gap-3 text-xs"
                >
                  <span className="flex w-32 shrink-0 items-center gap-1.5 text-gray-700 dark:text-gray-300">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          STATUS_COLOR[
                          a.status
                          ] ??
                          "#D1D5DB",
                      }}
                    />

                    {STATUS_LABEL[
                      a.status
                    ] ?? a.status}
                  </span>

                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${totalAppointments >
                          0
                          ? (a.totalCount /
                            totalAppointments) *
                          100
                          : 0
                          }%`,
                        backgroundColor:
                          STATUS_COLOR[
                          a.status
                          ] ??
                          "#D1D5DB",
                      }}
                    />
                  </div>

                  <span className="w-10 shrink-0 text-left font-medium text-gray-800 dark:text-gray-200">
                    {a.totalCount.toLocaleString(
                      "fa-IR"
                    )}
                  </span>
                </div>
              )
            )}

            {appointmentStatuses.length ===
              0 && (
                <div className="py-6 text-center text-xs text-gray-300 dark:text-gray-600">
                  نوبتی ثبت نشده.
                </div>
              )}
          </div>
        </div>
      )}

      {/* Finance */}
      {tab === "finance" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
            <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">
              درآمد به تفکیک روش پرداخت
            </h3>

            <div className="space-y-2.5 text-xs">
              {financeReport &&
                Object.entries(
                  financeReport.byMethod
                ).map(
                  ([method, amount]) => (
                    <div
                      key={method}
                      className="flex items-center justify-between"
                    >
                      <span className="text-gray-500 dark:text-gray-400">
                        {METHOD_LABEL[
                          method
                        ] ?? method}
                      </span>

                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {amount.toLocaleString(
                          "fa-IR"
                        )}{" "}
                        تومان
                      </span>
                    </div>
                  )
                )}

              {!financeReport && (
                <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-600">
                  داده‌ای یافت نشد.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
            <h3 className="mb-2 text-sm font-bold text-gray-800 dark:text-gray-100">
              مانده‌ی بدهی مشتریان
            </h3>

            <div className="text-2xl font-bold text-danger dark:text-red-400">
              {(
                financeReport?.outstandingBalance ??
                0
              ).toLocaleString("fa-IR")}{" "}
              تومان
            </div>

            <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
              مجموع مبالغ پرداخت‌نشده‌ی
              فاکتورهای صادرشده
            </p>
          </div>
        </div>
      )}

      {/* SMS */}
      {tab === "sms" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
          <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">
            پیامک‌ها به تفکیک وضعیت
          </h3>

          <div className="space-y-2.5">
            {smsReport.map((s) => (
              <div
                key={s.status}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        STATUS_COLOR[
                        s.status
                        ] ?? "#D1D5DB",
                    }}
                  />

                  {STATUS_LABEL[
                    s.status
                  ] ?? s.status}
                </span>

                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {s.totalCount.toLocaleString(
                    "fa-IR"
                  )}
                </span>
              </div>
            ))}

            {smsReport.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-300 dark:text-gray-600">
                پیامکی ثبت نشده.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Marketing */}
      {tab === "marketing" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            این بخش هیچ endpoint یا منبع
            داده‌ای در بک‌اند ندارد — اعداد
            زیر صرفاً نمایشی (mock) هستند.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 dark:border-white/10 dark:text-gray-500">
                  <th className="pb-2 font-medium">
                    کانال
                  </th>

                  <th className="pb-2 font-medium">
                    سرنخ
                  </th>

                  <th className="pb-2 font-medium">
                    تبدیل‌شده
                  </th>
                </tr>
              </thead>

              <tbody>
                {MARKETING_MOCK.map(
                  (m) => (
                    <tr
                      key={m.channel}
                      className="border-b border-gray-50 dark:border-white/5"
                    >
                      <td className="py-2 text-gray-700 dark:text-gray-300">
                        {m.channel}
                      </td>

                      <td className="py-2 text-gray-700 dark:text-gray-300">
                        {m.leads.toLocaleString(
                          "fa-IR"
                        )}
                      </td>

                      <td className="py-2 text-gray-700 dark:text-gray-300">
                        {m.conversions.toLocaleString(
                          "fa-IR"
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}