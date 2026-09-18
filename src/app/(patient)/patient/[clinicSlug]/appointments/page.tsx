"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarPlus,
  Clock3,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { PatientHeader } from "@/components/layout/PatientHeader";
import { getPatientAppointments, requestPatientAppointment } from "@/lib/api/patient-portal";
import { queryKeys } from "@/lib/query/keys";

import DatePicker from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

const TABS = [
  { key: "upcoming", label: "نوبت‌های آینده" },
  { key: "past", label: "نوبت‌های گذشته" },
  { key: "canceled", label: "لغوشده‌ها" },
] as const;

function formatJalaliDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

interface KnownService {
  id: string;
  name: string;
}

function NewAppointmentModal({
  clinicSlug,
  knownServices,
  initialServiceId,
  onClose,
}: {
  clinicSlug: string;
  knownServices: KnownService[];
  initialServiceId?: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
  const [dateValue, setDateValue] = useState<DateObject | null>(null);
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      requestPatientAppointment(clinicSlug, {
        serviceId,
        startTime: (dateValue as DateObject).toDate().toISOString(),
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patientPortal.appointments(clinicSlug) });
      onClose();
    },
    onError: (err: unknown) => {
      setErrorMsg(err instanceof Error ? err.message : "خطا در ثبت درخواست نوبت");
    },
  });

  const canSubmit = !!serviceId && !!dateValue && !mutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">درخواست نوبت جدید</h3>
          <button onClick={onClose} aria-label="بستن" className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/*
          TODO موقتی: endpoint عمومی /services برای نقش بیمار 403 می‌دهد (فقط staff دسترسی دارد).
          تا وقتی بک‌اند یک endpoint مخصوص پرتال بیمار اضافه کند (مثلاً GET /patient-portal/services)،
          فقط خدماتی که قبلاً برای این بیمار نوبت داشته‌اند قابل انتخابند.
        */}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-gray-500 dark:text-gray-400">خدمت مورد نظر</label>
            {knownServices.length === 0 && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[11px] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  فعلاً لیست خدمات کلینیک برای شما در دسترس نیست. برای درخواست نوبت جدید با پذیرش کلینیک تماس بگیرید.
                </span>
              </div>
            )}
            {knownServices.length > 0 && (
              <>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-primary/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-200"
                >
                  <option value="">انتخاب کنید...</option>
                  {knownServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-gray-400">
                  فقط خدماتی که پیش‌تر برایتان رزرو شده نمایش داده می‌شود.
                </p>
              </>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-gray-500 dark:text-gray-400">تاریخ و ساعت پیشنهادی</label>
            <DatePicker
              value={dateValue}
              onChange={(val) => setDateValue(val as DateObject)}
              calendar={persian}
              locale={persian_fa}
              format="YYYY/MM/DD HH:mm"
              calendarPosition="bottom-right"
              plugins={[<TimePicker key="time-picker" position="bottom" hideSeconds />]}
              className="patient-appointment-picker"
              containerClassName="w-full"
              inputClass="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-primary/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-200"
              placeholder="تاریخ و ساعت را انتخاب کنید"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-gray-500 dark:text-gray-400">توضیحات (اختیاری)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-primary/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-200"
              placeholder="توضیح مختصری از دلیل مراجعه..."
            />
          </div>

          {errorMsg && <div className="text-xs text-danger">{errorMsg}</div>}

          <button
            disabled={!canSubmit}
            onClick={() => mutation.mutate()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary/90 dark:hover:bg-primary"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            ثبت درخواست
          </button>

          <p className="text-center text-[10px] text-gray-400">
            این یک درخواست است؛ نوبت پس از تایید کلینیک قطعی می‌شود.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsPage({ params }: { params: Promise<{ clinicSlug: string }> }) {
  const { clinicSlug } = use(params);
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get("service") ?? undefined;

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("upcoming");
  const [modalOpen, setModalOpen] = useState(false);

  // دیپ‌لینک از صفحه‌ی «خدمات من»: /appointments?service=<id>&open=1
  useEffect(() => {
    if (searchParams.get("open") === "1") {
      setModalOpen(true);
    }
  }, [searchParams]);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: queryKeys.patientPortal.appointments(clinicSlug),
    queryFn: () => getPatientAppointments(clinicSlug),
    enabled: !!clinicSlug,
  });

  const now = Date.now();
  const upcoming = useMemo(
    () =>
      appointments
        .filter((a) => a.status !== "canceled" && new Date(a.startTime).getTime() >= now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [appointments, now]
  );
  const past = useMemo(
    () =>
      appointments
        .filter((a) => a.status !== "canceled" && new Date(a.startTime).getTime() < now)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [appointments, now]
  );
  const canceled = useMemo(() => appointments.filter((a) => a.status === "canceled"), [appointments]);

  const knownServices = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of appointments) {
      if (a.serviceId && !map.has(a.serviceId)) map.set(a.serviceId, a.serviceName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [appointments]);

  const typeLabel = (t: string) => (t === "online" ? "آنلاین" : "حضوری");
  const statusLabel: Record<string, string> = {
    pending: "در انتظار تایید",
    confirmed: "تایید شده",
    completed: "انجام‌شده",
    canceled: "لغوشده",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent">
      <PatientHeader clinicSlug={clinicSlug} />
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">نوبت‌های من</h1>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">مدیریت و پیگیری نوبت‌های رزروشده</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark dark:bg-primary/90 dark:hover:bg-primary"
          >
            <CalendarPlus className="h-4 w-4" />
            درخواست نوبت جدید
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white px-4 dark:border-white/10 dark:bg-white/[0.06]">
          <div className="flex min-w-max items-center gap-6 text-sm">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap border-b-2 py-3 transition-colors ${
                  activeTab === tab.key
                    ? "border-primary font-medium text-primary-dark dark:border-primary-light dark:text-primary-light"
                    : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && <div className="py-10 text-center text-xs text-gray-400">در حال بارگذاری...</div>}

        {!isLoading && activeTab === "upcoming" && (
          <div className="space-y-4">
            {upcoming.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.08]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light/20 dark:bg-primary-light/10">
                      <Clock3 className="h-5 w-5 text-primary-dark dark:text-primary-light" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{a.serviceName}</div>
                      <div className="text-xs text-gray-400">{a.doctorName}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatJalaliDate(a.startTime)} - {formatTime(a.startTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] ${
                        a.appointmentType === "online"
                          ? "bg-secondary-blue/40 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
                          : "bg-primary-light/20 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light"
                      }`}
                    >
                      {typeLabel(a.appointmentType)}
                    </span>
                    <span className="rounded-full bg-gray-50 px-3 py-1 text-[11px] text-gray-500 dark:bg-white/10 dark:text-gray-300">
                      {statusLabel[a.status] ?? a.status}
                    </span>
                    <button
                      aria-label="گزینه‌های بیشتر"
                      className="rounded-lg border border-gray-200 p-2 text-gray-400 transition hover:border-primary hover:text-primary dark:border-white/15 dark:hover:border-primary-light dark:hover:text-primary-light"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && (
              <div className="py-10 text-center text-xs text-gray-300 dark:text-gray-500">نوبت آینده‌ای ثبت نشده.</div>
            )}
          </div>
        )}

        {!isLoading && activeTab === "past" && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-white/[0.06]">
            {past.map((a, i) => (
              <div
                key={a.id}
                className={`flex items-center justify-between p-4 ${
                  i !== past.length - 1 ? "border-b border-gray-50 dark:border-white/10" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary-dark dark:text-primary-light" />
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{a.serviceName}</div>
                    <div className="text-xs text-gray-400">
                      {a.doctorName} · {formatJalaliDate(a.startTime)}
                    </div>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] ${
                    a.status === "completed"
                      ? "bg-primary-light/20 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light"
                      : "bg-gray-50 text-gray-500 dark:bg-white/10 dark:text-gray-300"
                  }`}
                >
                  {statusLabel[a.status] ?? a.status}
                </span>
              </div>
            ))}
            {past.length === 0 && (
              <div className="py-10 text-center text-xs text-gray-300 dark:text-gray-500">نوبت گذشته‌ای ثبت نشده.</div>
            )}
          </div>
        )}

        {!isLoading && activeTab === "canceled" && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-white/[0.06]">
            {canceled.map((a, i) => (
              <div
                key={a.id}
                className={`flex items-center justify-between p-4 ${
                  i !== canceled.length - 1 ? "border-b border-gray-50 dark:border-white/10" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <XCircle className="h-4 w-4 text-danger" />
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{a.serviceName}</div>
                    <div className="text-xs text-gray-400">
                      {a.doctorName} · {formatJalaliDate(a.startTime)}
                    </div>
                    {a.cancellationReason && (
                      <div className="mt-1 text-[10px] text-gray-400">دلیل: {a.cancellationReason}</div>
                    )}
                  </div>
                </div>
                <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] text-danger dark:bg-red-500/15 dark:text-red-300">
                  لغوشده
                </span>
              </div>
            ))}
            {canceled.length === 0 && (
              <div className="py-10 text-center text-xs text-gray-300 dark:text-gray-500">نوبت لغوشده‌ای ثبت نشده.</div>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <NewAppointmentModal
          clinicSlug={clinicSlug}
          knownServices={knownServices}
          initialServiceId={preselectedServiceId}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}