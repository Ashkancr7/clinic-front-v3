"use client";

import { use, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { useSearchParams } from "next/navigation";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Search,
  SlidersHorizontal,
  UserPlus,
  Send,
  FileSpreadsheet,
  Calendar,
  Link2,
  FolderOpen,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Users,
  ArrowDownUp,
  X,
} from "lucide-react";

import Image from "next/image";

import {
  getPatients,
  createPatient,
  type PatientListItem,
} from "@/lib/api/patients";

import { queryKeys } from "@/lib/query/keys";
import { useDoctorPatientScope } from "@/hooks/use-doctor-patient-scope";

import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";

// تبدیل تاریخ انتخاب‌شده (جلالی) به رشته‌ی میلادی YYYY-MM-DD که بک‌اند
// انتظار دارد — از طریق convert بین تقویم‌ها، نه new Date().toISOString()،
// چون آن مسیر به‌خاطر اختلاف منطقه‌زمانی می‌تواند یک روز جابه‌جا شود.
function toGregorianDateString(d: DateObject): string {
  const g = d.convert(gregorian, gregorian_en);
  const y = String(g.year).padStart(4, "0");
  const m = String(g.month.number).padStart(2, "0");
  const day = String(g.day).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const STATUS_STYLE: Record<
  string,
  { dot: string; text: string; label: string }
> = {
  active: {
    dot: "bg-primary",
    text: "text-primary-dark dark:text-primary",
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

// این دو کارت هیچ منبع داده‌ای در بک‌اند ندارند
// طبق دستور، دقیقاً همان مقدار mock باقی می‌مانند.
const STATIC_STATS = [
  {
    key: "upcoming",
    label: "دارای نوبت آینده",
    value: "۴۲۳ نفر",
    icon: CalendarClock,
    tone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
  },
  {
    key: "alerts",
    label: "هشدار پزشکی",
    value: "۲۹ نفر",
    icon: AlertTriangle,
    tone: "bg-danger/10 text-danger dark:bg-danger/15 dark:text-red-400",
  },
];

function formatJalaliDate(iso: string | null) {
  if (!iso) return "—";

  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return "—";
  }
}

export default function PatientsListPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);

  const [search, setSearch] = useState("");

  const searchParams = useSearchParams();

  const [showCreateModal, setShowCreateModal] = useState(
    searchParams.get("new") === "1"
  );

  // اگر کاربر از یک لینک دیگر با ?new=1 وارد این صفحه شد،
  // مودال افزودن مراجعه‌کننده به‌صورت خودکار باز می‌شود.
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  const queryClient = useQueryClient();

  const {
    data: patients = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.patients.list(clinicSlug, { search }),
    queryFn: () => getPatients(clinicSlug, search || undefined),
    enabled: !!clinicSlug,
  });

  const { isDoctor, patientIds: doctorPatientIds, isLoading: scopeLoading } = useDoctorPatientScope(clinicSlug);

  const visiblePatients = useMemo(() => {
    if (!isDoctor || !doctorPatientIds) return patients;
    return patients.filter((p) => doctorPatientIds.has(p.id));
  }, [patients, isDoctor, doctorPatientIds]);

  const createMutation = useMutation({
    mutationFn: (
      payload: Parameters<typeof createPatient>[1]
    ) => createPatient(clinicSlug, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.list(clinicSlug, { search }),
      });

      setShowCreateModal(false);
    },
  });

  const stats = useMemo(
    () => ({
      total: visiblePatients.length,
      active: visiblePatients.filter((p) => p.status === "active").length,
    }),
    [visiblePatients]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            لیست مراجعین
          </h1>

          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            جستجو، فیلتر و مدیریت اطلاعات بیماران کلینیک
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="
              flex items-center gap-2 rounded-xl
              border border-gray-200
              bg-white px-4 py-2.5
              text-sm text-gray-600
              transition-colors
              hover:bg-gray-50
              dark:border-gray-700
              dark:bg-gray-900
              dark:text-gray-300
              dark:hover:bg-gray-800
            "
          >
            <FileSpreadsheet className="h-4 w-4" />
            خروجی اکسل
          </button>

          <button
            className="
              flex items-center gap-2 rounded-xl
              border border-gray-200
              bg-white px-4 py-2.5
              text-sm text-gray-600
              transition-colors
              hover:bg-gray-50
              dark:border-gray-700
              dark:bg-gray-900
              dark:text-gray-300
              dark:hover:bg-gray-800
            "
          >
            <Send className="h-4 w-4" />
            ارسال پیامک
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="
              flex items-center justify-center gap-2
              rounded-xl bg-primary px-5 py-2.5
              text-sm font-medium text-white
              transition-colors
              hover:bg-primary-dark
            "
          >
            <UserPlus className="h-4 w-4" />
            افزودن مراجعه‌کننده
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div
        className="
          rounded-2xl
          border border-gray-100
          bg-white p-5
          dark:border-gray-800
          dark:bg-gray-900
        "
      >
        {/* Search */}
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div
              className="
                flex flex-1 items-center gap-2
                rounded-xl
                border border-gray-200
                bg-white px-3 py-2
                dark:border-gray-700
                dark:bg-gray-950
              "
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="جستجو بر اساس نام، نام خانوادگی، کد ملی یا موبایل..."
                className="
                  w-full bg-transparent
                  text-xs text-gray-700
                  outline-none
                  placeholder:text-gray-300
                  dark:text-gray-200
                  dark:placeholder:text-gray-600
                "
              />

              <Search className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600" />
            </div>

            <button
              className="
                flex shrink-0 items-center gap-1.5
                rounded-xl
                border border-gray-200
                bg-white px-3 py-2
                text-xs text-gray-600
                transition-colors
                hover:bg-gray-50
                dark:border-gray-700
                dark:bg-gray-900
                dark:text-gray-300
                dark:hover:bg-gray-800
              "
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              فیلترها
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Total */}
          <div
            className="
              flex items-center justify-between
              rounded-xl
              border border-gray-100
              bg-white p-4
              dark:border-gray-800
              dark:bg-gray-900
            "
          >
            <div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                کل مراجعین
              </p>

              <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">
                {isLoading || scopeLoading
                  ? "…"
                  : `${stats.total.toLocaleString("fa-IR")} نفر`}
              </p>
            </div>

            <span
              className="
                flex h-9 w-9 items-center justify-center
                rounded-full
                bg-secondary-purple/30
                text-purple-600
                dark:bg-purple-500/15
                dark:text-purple-400
              "
            >
              <Users className="h-4 w-4" />
            </span>
          </div>

          {/* Active */}
          <div
            className="
              flex items-center justify-between
              rounded-xl
              border border-gray-100
              bg-white p-4
              dark:border-gray-800
              dark:bg-gray-900
            "
          >
            <div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                مراجعین فعال
              </p>

              <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">
                {isLoading || scopeLoading
                  ? "…"
                  : `${stats.active.toLocaleString("fa-IR")} نفر`}
              </p>
            </div>

            <span
              className="
                flex h-9 w-9 items-center justify-center
                rounded-full
                bg-primary/10
                text-primary-dark
                dark:bg-primary/15
                dark:text-primary
              "
            >
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>

          {/* Static Stats */}
          {STATIC_STATS.map((s) => (
            <div
              key={s.key}
              className="
                flex items-center justify-between
                rounded-xl
                border border-gray-100
                bg-white p-4
                dark:border-gray-800
                dark:bg-gray-900
              "
            >
              <div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  {s.label}
                </p>

                <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">
                  {s.value}
                </p>
              </div>

              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${s.tone}`}
              >
                <s.icon className="h-4 w-4" />
              </span>
            </div>
          ))}
        </div>

        {/* Sort */}
        <div className="mb-3 flex items-center justify-between">
          <button
            className="
              flex items-center gap-1.5
              rounded-xl
              border border-gray-200
              bg-white px-3 py-1.5
              text-xs text-gray-600
              transition-colors
              hover:bg-gray-50
              dark:border-gray-700
              dark:bg-gray-900
              dark:text-gray-300
              dark:hover:bg-gray-800
            "
          >
            <ArrowDownUp className="h-3.5 w-3.5" />
            مرتب‌سازی: جدیدترین
          </button>
        </div>

        {/* Loading */}
        {(isLoading || scopeLoading) && (
          <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            در حال بارگذاری...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="py-10 text-center text-sm text-danger dark:text-red-400">
            خطا در دریافت لیست مراجعین
          </div>
        )}

        {/* Table */}
        {!isLoading && !scopeLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 dark:border-gray-800 dark:text-gray-500">
                  <th className="py-2 font-medium">نام و نام خانوادگی</th>
                  <th className="py-2 font-medium">موبایل</th>
                  <th className="py-2 font-medium">کد ملی</th>
                  <th className="py-2 font-medium">سن</th>
                  <th className="py-2 font-medium">آخرین مراجعه</th>
                  <th className="py-2 font-medium">پزشک معالج</th>
                  <th className="py-2 font-medium">وضعیت</th>
                  <th className="py-2 font-medium">عملیات</th>
                </tr>
              </thead>

              <tbody>
                {visiblePatients.map((p) => {
                  const status = p.status
                    ? STATUS_STYLE[p.status]
                    : null;

                  return (
                    <tr
                      key={p.id}
                      className="
                        border-b border-gray-50
                        transition-colors
                        hover:bg-gray-50/60
                        dark:border-gray-800/70
                        dark:hover:bg-gray-800/40
                      "
                    >
                      {/* Name */}
                      <td className="py-3">
                        <Link
                          href={`/clinic/${clinicSlug}/patients/${p.id}`}
                          className="flex items-center gap-2"
                        >
                          <Image
                            src="/image/user.PNG"
                            alt="User"
                            width={30}
                            height={30}
                            unoptimized
                            className="rounded-full object-cover"
                          />

                          <span
                            className="
                              font-medium
                              text-gray-800
                              hover:text-primary-dark
                              dark:text-gray-200
                              dark:hover:text-primary
                            "
                          >
                            {p.firstName} {p.lastName}
                          </span>
                        </Link>
                      </td>

                      {/* Phone */}
                      <td
                        className="py-3 text-gray-500 dark:text-gray-400"
                        dir="ltr"
                      >
                        {p.phone || "—"}
                      </td>

                      {/* National ID */}
                      <td
                        className="py-3 text-gray-500 dark:text-gray-400"
                        dir="ltr"
                      >
                        {p.nationalId ?? "—"}
                      </td>

                      {/* Age */}
                      <td className="py-3 text-gray-500 dark:text-gray-400">
                        {p.age != null
                          ? p.age.toLocaleString("fa-IR")
                          : "—"}
                      </td>

                      {/* Last Visit */}
                      <td className="py-3 text-gray-500 dark:text-gray-400">
                        {formatJalaliDate(p.lastVisitAt)}
                      </td>

                      {/* Doctor */}
                      <td className="py-3 text-gray-300 dark:text-gray-600">
                        —
                      </td>

                      {/* Status */}
                      <td className="py-3">
                        {status ? (
                          <span
                            className={`flex items-center gap-1 ${status.text}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                            />

                            {status.label}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">
                            —
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            title="ارسال لینک"
                            className="
                              rounded-lg
                              border border-gray-200
                              bg-white p-1.5
                              text-gray-400
                              transition-colors
                              hover:bg-gray-50
                              dark:border-gray-700
                              dark:bg-gray-900
                              dark:text-gray-500
                              dark:hover:bg-gray-800
                            "
                          >
                            <Link2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            title="ثبت نوبت"
                            className="
                              rounded-lg
                              border border-gray-200
                              bg-white p-1.5
                              text-gray-400
                              transition-colors
                              hover:bg-gray-50
                              dark:border-gray-700
                              dark:bg-gray-900
                              dark:text-gray-500
                              dark:hover:bg-gray-800
                            "
                          >
                            <Calendar className="h-3.5 w-3.5" />
                          </button>

                          <Link
                            href={`/clinic/${clinicSlug}/patients/${p.id}`}
                            title="مشاهده پرونده"
                            className="
                              rounded-lg
                              border border-gray-200
                              bg-white p-1.5
                              text-gray-400
                              transition-colors
                              hover:bg-gray-50
                              dark:border-gray-700
                              dark:bg-gray-900
                              dark:text-gray-500
                              dark:hover:bg-gray-800
                            "
                          >
                            <FolderOpen className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Empty */}
                {visiblePatients.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-sm text-gray-400 dark:text-gray-500"
                    >
                      موردی یافت نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Patient Modal */}
      {showCreateModal && (
        <CreatePatientModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(payload) => createMutation.mutate(payload)}
          isSubmitting={createMutation.isPending}
          error={
            createMutation.error instanceof Error
              ? createMutation.error.message
              : null
          }
        />
      )}
    </div>
  );
}

function CreatePatientModal({
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  onClose: () => void;
  onSubmit: (payload: {
    first_name: string;
    last_name: string;
    phone: string;
    national_id?: string;
    birth_date?: string;
    gender?: "male" | "female" | "other";
    emergency_contact?: string;
  }) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [birthDate, setBirthDate] = useState<DateObject | null>(null);
  const [gender, setGender] = useState<"" | "male" | "female" | "other">("");
  const [emergencyContact, setEmergencyContact] = useState("");

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/30 p-4
        dark:bg-black/60
      "
    >
      <div
        className="
          w-full max-w-md
          rounded-2xl
          border border-transparent
          bg-white p-6
          shadow-xl
          dark:border-gray-800
          dark:bg-gray-900
        "
      >
        {/* Modal Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            افزودن مراجعه‌کننده
          </h2>

          <button
            onClick={onClose}
            className="
              rounded-lg p-1
              text-gray-400
              transition-colors
              hover:bg-gray-100
              hover:text-gray-600
              dark:text-gray-500
              dark:hover:bg-gray-800
              dark:hover:text-gray-300
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <p
            className="
              mb-3 rounded-lg
              bg-red-50 px-3 py-2
              text-xs text-red-500
              dark:bg-red-500/10
              dark:text-red-400
            "
          >
            {error}
          </p>
        )}

        <div className="space-y-3">
          {/* First / Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                نام
              </label>

              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="
                  w-full rounded-xl
                  border border-gray-200
                  bg-white px-3 py-2
                  text-sm text-gray-800
                  outline-none
                  transition-colors
                  placeholder:text-gray-300
                  focus:border-primary
                  dark:border-gray-700
                  dark:bg-gray-950
                  dark:text-gray-200
                  dark:placeholder:text-gray-600
                "
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                نام خانوادگی
              </label>

              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="
                  w-full rounded-xl
                  border border-gray-200
                  bg-white px-3 py-2
                  text-sm text-gray-800
                  outline-none
                  transition-colors
                  placeholder:text-gray-300
                  focus:border-primary
                  dark:border-gray-700
                  dark:bg-gray-950
                  dark:text-gray-200
                  dark:placeholder:text-gray-600
                "
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
              موبایل
            </label>

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              className="
                w-full rounded-xl
                border border-gray-200
                bg-white px-3 py-2
                text-sm text-gray-800
                outline-none
                transition-colors
                placeholder:text-gray-300
                focus:border-primary
                dark:border-gray-700
                dark:bg-gray-950
                dark:text-gray-200
                dark:placeholder:text-gray-600
              "
              placeholder="09121112233"
            />
          </div>

          {/* National ID */}
          <div>
            <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
              کد ملی (اختیاری)
            </label>

            <input
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              dir="ltr"
              className="
                w-full rounded-xl
                border border-gray-200
                bg-white px-3 py-2
                text-sm text-gray-800
                outline-none
                transition-colors
                placeholder:text-gray-300
                focus:border-primary
                dark:border-gray-700
                dark:bg-gray-950
                dark:text-gray-200
                dark:placeholder:text-gray-600
              "
            />
          </div>

          {/* Birth date / Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                تاریخ تولد (اختیاری)
              </label>

              <DatePicker
                value={birthDate}
                onChange={(val) => setBirthDate(val as DateObject | null)}
                calendar={persian}
                locale={persian_fa}
                format="YYYY/MM/DD"
                calendarPosition="bottom-right"
                className="patient-form-picker"
                containerClassName="w-full"
                inputClass="
                  w-full rounded-xl
                  border border-gray-200
                  bg-white px-3 py-2
                  text-sm text-gray-800
                  outline-none
                  transition-colors
                  placeholder:text-gray-300
                  focus:border-primary
                  dark:border-gray-700
                  dark:bg-gray-950
                  dark:text-gray-200
                  dark:placeholder:text-gray-600
                "
                placeholder="انتخاب تاریخ"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                جنسیت (اختیاری)
              </label>

              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "" | "male" | "female" | "other")}
                className="
                  w-full rounded-xl
                  border border-gray-200
                  bg-white px-3 py-2
                  text-sm text-gray-800
                  outline-none
                  transition-colors
                  focus:border-primary
                  dark:border-gray-700
                  dark:bg-gray-950
                  dark:text-gray-200
                "
              >
                <option value="">انتخاب نشده</option>
                <option value="female">زن</option>
                <option value="male">مرد</option>
                <option value="other">سایر</option>
              </select>
            </div>
          </div>

          {/* Emergency contact */}
          <div>
            <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
              تماس اضطراری (اختیاری)
            </label>

            <input
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              dir="ltr"
              placeholder="نام و شماره تماس یک نفر دیگر"
              className="
                w-full rounded-xl
                border border-gray-200
                bg-white px-3 py-2
                text-sm text-gray-800
                outline-none
                transition-colors
                placeholder:text-gray-300
                focus:border-primary
                dark:border-gray-700
                dark:bg-gray-950
                dark:text-gray-200
                dark:placeholder:text-gray-600
              "
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="
              flex-1 rounded-xl
              border border-gray-200
              bg-white py-2.5
              text-sm text-gray-600
              transition-colors
              hover:bg-gray-50
              dark:border-gray-700
              dark:bg-gray-900
              dark:text-gray-300
              dark:hover:bg-gray-800
            "
          >
            انصراف
          </button>

          <button
            disabled={!firstName || !lastName || !phone || isSubmitting}
            onClick={() =>
              onSubmit({
                first_name: firstName,
                last_name: lastName,
                phone,
                national_id: nationalId || undefined,
                birth_date: birthDate ? toGregorianDateString(birthDate) : undefined,
                gender: gender || undefined,
                emergency_contact: emergencyContact || undefined,
              })
            }
            className="
              flex-1 rounded-xl
              bg-primary py-2.5
              text-sm font-medium text-white
              transition-colors
              hover:bg-primary-dark
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {isSubmitting ? "در حال ثبت..." : "ثبت"}
          </button>
        </div>
      </div>
    </div>
  );
}