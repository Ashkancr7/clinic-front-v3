"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Clock3,
  Heart,
  CalendarCheck,
  FolderHeart,
  FileText,
  MessageSquare,
  CalendarPlus,
  UserRound,
  ChevronDown,
  Images,
  Download,
  FilePlus2,
  ShieldCheck,
  Headset,
  Gift,
  Lock,
  Info,
  Wallet,
  Phone,
} from "lucide-react";
import { PatientHeader } from "@/components/layout/PatientHeader";
import Image from "next/image";

import {
  getPatientDashboardSummary,
  getPatientAppointments,
  getPatientImages,
  getPatientConsents,
  getPatientInvoices,
  groupImagesByVisitService,
} from "@/lib/api/patient-portal";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, formatToman } from "@/lib/finance-labels";
import { queryKeys } from "@/lib/query/keys";

const TABS = [
  { key: "appointments", label: "نوبت‌های من", icon: CalendarCheck },
  { key: "records", label: "پرونده پزشکی", icon: FolderHeart },
  { key: "billing", label: "صورت‌حساب", icon: Wallet },
  { key: "consents", label: "رضایت‌نامه‌ها", icon: ShieldCheck },
  { key: "gallery", label: "تصاویر من", icon: Images },
  { key: "files", label: "فایل‌ها", icon: FileText },
];

// این بخش هنوز منبع API ندارد (هیچ endpoint فایل عمومی برای بیمار وجود ندارد) — mock می‌ماند
const FILES = [
  { name: "گزارش آخرین جلسه مزوتراپی", type: "PDF", size: "۱.۲ مگابایت", date: "۱۴۰۳/۰۳/۲۸" },
  { name: "عکس راهنمای مراقبت بعد از تزریق", type: "JPG", size: "۸۰۰ کیلوبایت", date: "۱۴۰۳/۰۳/۲۸" },
  { name: "فاکتور خدمات", type: "PDF", size: "۲ مگابایت", date: "۱۴۰۳/۰۳/۲۵" },
  { name: "برنامه درمانی", type: "PDF", size: "۱.۱ مگابایت", date: "۱۴۰۳/۰۳/۲۰" },
];

const GALLERY_TONES = [
  "from-pink-200 to-pink-100 dark:from-pink-400/30 dark:to-pink-400/10",
  "from-primary-light/60 to-primary-light/20 dark:from-primary-light/40 dark:to-primary-light/10",
  "from-secondary-purple/60 to-secondary-purple/20 dark:from-secondary-purple/40 dark:to-secondary-purple/10",
  "from-secondary-blue/60 to-secondary-blue/20 dark:from-secondary-blue/40 dark:to-secondary-blue/10",
];

const QUICK_ACTIONS = [
  {
    icon: MessageSquare,
    tone: "bg-secondary-blue/40 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
    title: "پیام به پزشک",
    desc: "سوالات خود را بپرسید",
    href: "chat",
  },
  {
    icon: CalendarPlus,
    tone: "bg-primary-light/25 text-primary-dark dark:bg-primary-light/15 dark:text-primary-light",
    title: "درخواست نوبت",
    desc: "رزرو سریع و آسان",
    href: "appointments",
  },
  {
    icon: Headset,
    tone: "bg-secondary-purple/40 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300",
    title: "پشتیبانی",
    desc: "ما همیشه همراه شما هستیم",
    href: null,
  },
  {
    icon: Gift,
    tone: "bg-secondary-pink/40 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300",
    title: "پیشنهاد ویژه",
    desc: "مشاهده تخفیف‌های فعال",
    href: null,
  },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "در انتظار تایید",
  confirmed: "تایید شده",
  completed: "انجام‌شده",
  canceled: "لغوشده",
};

function formatJalaliDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fa-IR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}
function formatShortJalaliDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}
function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function PatientDashboardPage({ params }: { params: Promise<{ clinicSlug: string }> }) {
  const { clinicSlug } = use(params);
  const [activeTab, setActiveTab] = useState("gallery");

  const { data: summary } = useQuery({
    queryKey: queryKeys.patientPortal.dashboard(clinicSlug),
    queryFn: () => getPatientDashboardSummary(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: queryKeys.patientPortal.appointments(clinicSlug),
    queryFn: () => getPatientAppointments(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: images = [], isLoading: imagesLoading } = useQuery({
    queryKey: queryKeys.patientPortal.images(clinicSlug),
    queryFn: () => getPatientImages(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: consents = [], isLoading: consentsLoading } = useQuery({
    queryKey: queryKeys.patientPortal.consents(clinicSlug),
    queryFn: () => getPatientConsents(clinicSlug),
    enabled: !!clinicSlug,
  });

  // صورت‌حساب — از endpoint اختصاصی پرتال بیمار (/patient-portal/invoices)؛
  // نیازی به شناسه‌ی جداگانه‌ی بیمار نیست چون بر اساس توکن کاربر جاری فیلتر
  // می‌شود. فقط فاکتورهای صادرشده برمی‌گردد (پیش‌نویس/ابطال‌شده هرگز).
  const {
    data: invoices = [],
    isLoading: invoicesLoading,
    error: invoicesError,
  } = useQuery({
    queryKey: queryKeys.patientPortal.invoices(clinicSlug),
    queryFn: () => getPatientInvoices(clinicSlug),
    enabled: !!clinicSlug,
  });

  const totalDue = useMemo(
    () => invoices.reduce((sum, inv) => sum + inv.remainingAmount, 0),
    [invoices]
  );

  const completed = useMemo(() => appointments.filter((a) => a.status === "completed"), [appointments]);
  const nextAppointment = summary?.nextAppointment ?? null;
  const imageGroups = useMemo(() => groupImagesByVisitService(images), [images]);
  const recentVisits = summary?.recentVisits ?? [];

  const STATS = [
    {
      icon: FileText,
      label: "فایل‌ها و تصاویر",
      value: (summary?.visibleImagesCount ?? images.length).toLocaleString("fa-IR"),
      iconClass: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
    },
    {
      icon: CalendarCheck,
      label: "نوبت‌های گذشته",
      value: (summary?.pastAppointmentsCount ?? 0).toLocaleString("fa-IR"),
      iconClass: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
    },
    {
      icon: Heart,
      label: "خدمات انجام‌شده",
      value: (summary?.completedVisitsCount ?? completed.length).toLocaleString("fa-IR"),
      iconClass: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent">
      <PatientHeader clinicSlug={clinicSlug} />

      <div className="mx-auto max-w-9xl space-y-6 px-4 py-6 md:px-8">
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06] lg:grid-cols-[280px_1fr_auto] lg:items-center">
          <div className="flex items-center gap-4">
            <Image
              src="/image/user.PNG"
              alt="User"
              width={70}
              height={70}
              unoptimized
              className="rounded-full object-cover ring-2 ring-gray-100 dark:ring-white/10"
            />
            <div className="text-right">
              <h1 className="text-base font-bold text-gray-900 dark:text-white">سلام {summary?.fullName ?? ""} عزیز</h1>
              <p className="mt-1 max-w-[250px] text-[12px] text-gray-400">
                از اعتماد شما سپاسگزاریم. ما همیشه در تلاشیم بهترین تجربه‌ی زیبایی را برای شما بسازیم.
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/patient/${clinicSlug}/appointments`}
                  className="flex items-center gap-1 rounded-[3px] bg-primary px-2 py-1.5 text-[11px] font-medium text-white hover:bg-primary-dark dark:bg-primary/80 dark:hover:bg-primary lg:px-2 lg:py-1"
                >
                  <CalendarPlus className="h-3 w-3 lg:h-2.5 lg:w-2" />
                  درخواست نوبت
                </Link>
                <Link
                  href={`/patient/${clinicSlug}/chat`}
                  className="flex items-center gap-1 rounded-[3px] border border-primary px-2 py-1.5 text-[11px] font-medium text-primary-dark dark:border-primary-light dark:text-primary-light lg:px-2 lg:py-1"
                >
                  <MessageSquare className="h-3 w-3 lg:h-2.5 lg:w-2" />
                  پیام به پزشک
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center rounded-2xl border border-gray-100 p-3 text-center dark:border-white/10"
              >
                <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full ${s.iconClass}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="text-base font-bold text-gray-900 dark:text-white">{s.value}</div>
                <div className="text-[10px] text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-100 p-4 dark:border-white/10">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">نوبت بعدی شما</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light/20">
                <Clock3 className="h-4 w-4 text-primary-dark dark:text-primary-light" />
              </div>
            </div>
            {appointmentsLoading && <div className="text-xs text-gray-300 dark:text-gray-500">در حال بارگذاری...</div>}
            {!appointmentsLoading && nextAppointment && (
              <>
                <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{formatJalaliDate(nextAppointment.startTime)}</div>
                <div className="text-xs text-gray-400">{formatTime(nextAppointment.startTime)}</div>
                <div className="mt-3 border-t border-gray-50 pt-2 text-xs dark:border-white/10">
                  <div className="font-medium text-gray-700 dark:text-gray-200">{nextAppointment.serviceName}</div>
                  <div className="text-gray-400">{nextAppointment.doctorName}</div>
                </div>
              </>
            )}
            {!appointmentsLoading && !nextAppointment && (
              <div className="text-xs text-gray-300 dark:text-gray-500">نوبت آینده‌ای ثبت نشده.</div>
            )}
            <Link
              href={`/patient/${clinicSlug}/appointments`}
              className="mt-3 block w-full rounded-lg bg-primary-light/15 py-2 text-center text-[11px] font-medium text-primary-dark dark:text-primary-light"
            >
              مشاهده جزئیات نوبت
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            {/* خلاصه اطلاعات من — فقط فیلدهایی که واقعاً از API داریم */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
              <div className="mb-4 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-primary-dark dark:text-primary-light" />
                <h3 className="text-sm font-bold text-primary dark:text-primary-light">خلاصه اطلاعات من</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">نام و نام‌خانوادگی</span>
                  <span className="text-gray-700 dark:text-gray-200">{summary?.fullName ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">وضعیت پرونده</span>
                  <span className="rounded-full bg-primary-light/20 px-2.5 py-0.5 text-[11px] text-primary-dark dark:text-primary-light">
                    فعال
                  </span>
                </div>
              </div>
            </div>

            {/* تاریخچه خدمات من — از نوبت‌های تکمیل‌شده */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary dark:text-primary-light">تاریخچه خدمات من</h3>
              </div>
              <div className="space-y-4">
                {completed.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <Image
                      src="/image/user.PNG"
                      alt="User"
                      width={30}
                      height={30}
                      unoptimized
                      className="rounded-full object-cover ring-2 ring-gray-100 dark:ring-white/10"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-200">{s.serviceName}</div>
                      <div className="flex items-center gap-3 text-[10px] text-gray-400">
                        <span>{s.doctorName}</span>
                        <span>{formatJalaliDate(s.startTime)}</span>
                      </div>
                    </div>
                    <span className="mb-1 inline-block rounded-full bg-primary-light/20 px-2 py-0.5 text-[9px] text-primary-dark dark:text-primary-light">
                      انجام‌شده
                    </span>
                  </div>
                ))}
                {!appointmentsLoading && completed.length === 0 && (
                  <div className="text-center text-xs text-gray-300 dark:text-gray-500">خدمتی ثبت نشده.</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white px-4 dark:border-white/10 dark:bg-white/[0.06]">
              <div className="flex min-w-max items-center gap-6 text-sm">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-3 transition-colors ${
                        activeTab === tab.key
                          ? "border-primary font-medium text-primary-dark dark:border-primary-light dark:text-primary-light"
                          : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {activeTab === "gallery" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-primary dark:text-primary-light">گالری تصاویر (قبل و بعد)</h2>
                  <button className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-500 dark:border-white/15 dark:text-gray-300">
                    همه خدمات <ChevronDown className="h-3 w-3" />
                  </button>
                </div>

                {imagesLoading && (
                  <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</div>
                )}

                {/*
                  توجه: بک‌اند فقط storage_key می‌دهد نه یک URL قابل نمایش مستقیم در <img>،
                  برای همین فعلاً به‌جای عکس واقعی از یک باکس رنگی placeholder استفاده می‌کنیم
                  ولی برچسب‌های «قبل»/«بعد» واقعی هستند (بر اساس image_type واقعی هر گروه).
                */}
                {!imagesLoading && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {imageGroups.map((g, i) => (
                      <div key={g.key}>
                        <div
                          className={`relative h-28 overflow-hidden rounded-xl bg-gradient-to-br ${GALLERY_TONES[i % GALLERY_TONES.length]}`}
                        >
                          {g.before && (
                            <span className="absolute right-1.5 top-1.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] text-gray-600">
                              قبل
                            </span>
                          )}
                          {g.after && (
                            <span className="absolute left-1.5 top-1.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] text-gray-600">
                              بعد
                            </span>
                          )}
                          <Images className="absolute bottom-2 left-1/2 h-5 w-5 -translate-x-1/2 text-white/70" />
                        </div>
                        <div className="mt-1.5 text-xs font-medium text-gray-700 dark:text-gray-200">
                          {(g.before ?? g.after)?.bodyArea ?? "تصویر"}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {formatJalaliDate((g.before ?? g.after)?.createdAt ?? null)}
                        </div>
                      </div>
                    ))}
                    {imageGroups.length === 0 && (
                      <div className="col-span-full py-6 text-center text-xs text-gray-300 dark:text-gray-500">
                        تصویری ثبت نشده.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "appointments" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
                <h2 className="mb-4 text-sm font-bold text-primary dark:text-primary-light">نوبت‌های من</h2>
                <div className="space-y-3">
                  {appointments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-xl border border-gray-50 p-3 text-xs dark:border-white/10"
                    >
                      <div>
                        <div className="font-medium text-gray-700 dark:text-gray-200">{a.serviceName}</div>
                        <div className="text-[10px] text-gray-400">
                          {formatJalaliDate(a.startTime)} · {formatTime(a.startTime)} · {a.doctorName}
                        </div>
                      </div>
                      <span className="rounded-full bg-primary-light/20 px-2 py-0.5 text-[10px] text-primary-dark dark:text-primary-light">
                        {STATUS_LABEL[a.status] ?? a.status}
                      </span>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <div className="py-6 text-center text-xs text-gray-300 dark:text-gray-500">نوبتی ثبت نشده.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "consents" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
                <h2 className="mb-4 text-sm font-bold text-primary dark:text-primary-light">رضایت‌نامه‌ها</h2>
                <div className="space-y-3">
                  {consents.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 p-3 text-xs dark:border-white/10"
                    >
                      <span className="font-medium text-gray-700 dark:text-gray-200">{c.title}</span>
                      <span className="text-[10px] text-gray-400">{formatJalaliDate(c.signedAt)}</span>
                    </div>
                  ))}
                  {consents.length === 0 && (
                    <div className="py-6 text-center text-xs text-gray-300 dark:text-gray-500">رضایت‌نامه‌ای امضا نشده.</div>
                  )}
                </div>
              </div>
            )}

            {/* پرونده پزشکی — از recent_visits واقعی (خلاصه؛ نسخه‌ی کامل در صفحه‌ی /records) */}
            {activeTab === "records" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-primary dark:text-primary-light">پرونده پزشکی</h2>
                  <Link
                    href={`/patient/${clinicSlug}/records`}
                    className="text-[11px] font-medium text-primary-dark dark:text-primary-light"
                  >
                    مشاهده کامل
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentVisits.map((v) => (
                    <div key={v.id} className="rounded-xl border border-gray-50 p-3 text-xs dark:border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          {v.services.map((s) => s.serviceName).join("، ") || "ویزیت"}
                        </span>
                        <span className="text-[10px] text-gray-400">{formatShortJalaliDate(v.visitDate)}</span>
                      </div>
                      {v.clinicalSummary && <p className="mt-1 text-[11px] text-gray-400">{v.clinicalSummary}</p>}
                    </div>
                  ))}
                  {recentVisits.length === 0 && (
                    <div className="py-6 text-center text-xs text-gray-300 dark:text-gray-500">ویزیتی ثبت نشده.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-primary dark:text-primary-light">صورت‌حساب</h2>
                  <div className="flex items-center gap-3">
                    {invoices.length > 0 && (
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        مانده‌ی کل: <span className="font-medium text-gray-700 dark:text-gray-200">{formatToman(totalDue)}</span>
                      </span>
                    )}
                    <Link
                      href={`/patient/${clinicSlug}/invoices`}
                      className="text-[11px] font-medium text-primary-dark dark:text-primary-light"
                    >
                      مشاهده همه
                    </Link>
                  </div>
                </div>

                {invoicesLoading && (
                  <div className="py-6 text-center text-xs text-gray-300 dark:text-gray-500">در حال بارگذاری...</div>
                )}

                {!invoicesLoading && invoicesError && (
                  <div className="py-6 text-center text-xs text-danger dark:text-red-300">
                    دریافت صورت‌حساب با خطا مواجه شد.
                  </div>
                )}

                {!invoicesLoading && !invoicesError && (
                  <div className="space-y-3">
                    {invoices.slice(0, 5).map((inv) => (
                      <Link
                        key={inv.id}
                        href={`/patient/${clinicSlug}/invoices/${inv.id}`}
                        className="block rounded-xl border border-gray-100 p-3 text-xs transition hover:border-primary/40 hover:bg-gray-50/70 dark:border-white/10 dark:hover:bg-white/[0.04]"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-200" dir="ltr">
                            {inv.invoiceNumber ?? "—"}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${INVOICE_STATUS_TONE[inv.status]}`}>
                            {INVOICE_STATUS_LABEL[inv.status]}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
                          <span>مبلغ کل: {formatToman(inv.totalAmount)}</span>
                          {inv.remainingAmount > 0 ? (
                            <span className="font-medium text-danger dark:text-red-300">
                              مانده: {formatToman(inv.remainingAmount)}
                            </span>
                          ) : (
                            <span className="font-medium text-primary-dark dark:text-primary-light">تسویه‌شده</span>
                          )}
                        </div>
                      </Link>
                    ))}

                    {invoices.length === 0 && (
                      <div className="py-6 text-center text-xs text-gray-300 dark:text-gray-500">
                        فاکتوری برای شما صادر نشده.
                      </div>
                    )}

                    {totalDue > 0 && (
                      <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-[11px] text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>برای پرداخت مانده‌ی حساب با پذیرش کلینیک تماس بگیرید.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "files" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400 dark:border-white/10 dark:bg-white/[0.06]">
                <div className="mx-auto flex max-w-sm items-start gap-2 text-right text-[11px] text-gray-400 dark:text-gray-500">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>این بخش هنوز به بک‌اند وصل نشده — endpoint فایل عمومی برای بیمار در لیست موجود نبود.</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-primary dark:text-primary-light">رضایت‌نامه‌ها</h3>
                  <button className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[10px] text-gray-500 dark:border-white/15 dark:text-gray-300">
                    جدیدترین <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {consentsLoading && (
                    <div className="text-center text-xs text-gray-300 dark:text-gray-500">در حال بارگذاری...</div>
                  )}
                  {!consentsLoading &&
                    consents.slice(0, 4).map((c) => (
                      <div
                        key={c.id}
                        className="flex w-full items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-white/10"
                      >
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{c.title}</span>
                        <button className="rounded-lg p-2 text-primary transition hover:bg-primary/10 dark:text-primary-light dark:hover:bg-primary-light/10">
                          <FilePlus2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  {!consentsLoading && consents.length === 0 && (
                    <div className="text-center text-xs text-gray-300 dark:text-gray-500">رضایت‌نامه‌ای ثبت نشده.</div>
                  )}
                </div>
              </div>

              {/* فایل‌ها و پیوست‌ها — mock، هیچ endpoint فایل عمومی برای بیمار وجود ندارد */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-primary dark:text-primary-light">فایل‌ها و پیوست‌ها</h3>
                  <button className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[10px] text-gray-500 dark:border-white/15 dark:text-gray-300">
                    جدیدترین <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {FILES.map((f) => (
                    <div
                      key={f.name}
                      className="flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-white/10"
                    >
                      <div>
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-200">{f.name}</div>
                        <div className="text-[10px] text-gray-400">
                          {f.type} · {f.size} · {f.date}
                        </div>
                      </div>
                      <button className="rounded-lg border border-gray-200 p-2 text-gray-400 transition hover:border-primary hover:text-primary dark:border-white/15 dark:hover:border-primary-light dark:hover:text-primary-light">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((a) =>
            a.href ? (
              <Link
                key={a.title}
                href={`/patient/${clinicSlug}/${a.href}`}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-right transition hover:shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${a.tone}`}>
                  <a.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-800 dark:text-gray-100">{a.title}</div>
                  <div className="text-[10px] text-gray-400">{a.desc}</div>
                </div>
              </Link>
            ) : (
              <button
                key={a.title}
                disabled
                className="flex cursor-not-allowed items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-right opacity-50 dark:border-white/10 dark:bg-white/[0.06]"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${a.tone}`}>
                  <a.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-800 dark:text-gray-100">{a.title}</div>
                  <div className="text-[10px] text-gray-400">{a.desc}</div>
                </div>
              </button>
            )
          )}
        </div>

        <p className="flex items-center justify-center gap-1.5 pb-4 text-center text-xs text-gray-400">
          <Lock className="h-3.5 w-3.5" />
          تمامی اطلاعات شما نزد ما امن است و به هیچ عنوان در اختیار شخص ثالث قرار نمی‌گیرد.
        </p>
      </div>
    </div>
  );
}