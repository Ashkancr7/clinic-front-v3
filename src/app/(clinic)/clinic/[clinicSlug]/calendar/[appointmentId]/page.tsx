"use client";

import { use, useState } from "react";

import Link from "next/link";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  MoreVertical,
  ArrowRight,
  CalendarClock,
  Globe,
  Clock3,
  CalendarDays,
  Sparkles,
  Stethoscope,
  Video,
  BellRing,
  UserX,
  CheckCircle2,
  XCircle,
  CalendarCog,
  Bell,
  MessageCircle,
  Mail,
  Plus,
  Wallet,
  Receipt,
  StickyNote,
  Pencil,
  UserRound,
  Phone,
  ClipboardList,
  X,
  Loader2,
} from "lucide-react";

import Image from "next/image";

import { Calendar } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DateObject from "react-date-object";

import { ApiError } from "@/lib/api/client";

import { getPatientDetail, getPatientDebt } from "@/lib/api/patients";

import {
  getInvoices,
  createInvoice,
  issueInvoice,
  createPayment,
  type Invoice,
} from "@/lib/api/finance";

import {
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  PAYMENT_METHOD_LABEL,
  formatToman,
} from "@/lib/finance-labels";
import type { PaymentMethod } from "@/lib/api/finance";

import {
  getAppointmentDetail,
  rescheduleAppointment,
  cancelAppointment,
  completeAppointment,
  markNoShow,
  sendAppointmentReminder,
  updateAppointment,
  getDoctors,
  getServicesForBooking,
  formatDurationMinutes,
  toLocalIsoDate,
  buildDateTime,
  extractTimeLabel,
  getAvailability,
  type AvailabilitySlot,
  type DoctorOption,
  type ServiceOption,
} from "@/lib/api/appointments";

import {
  createVisit,
  addServiceToVisit,
  completeVisit,
} from "@/lib/api/visits";

import { queryKeys } from "@/lib/query/keys";

import { LoadingLogo } from "@/components/LoadingLogo";

const STATUS_LEGEND = [
  {
    label: "در انتظار تایید",
    tone: "bg-amber-50 text-warning dark:bg-amber-500/10 dark:text-amber-300",
    dot: "bg-warning dark:bg-amber-400",
    desc: "نوبت در انتظار بررسی و تایید است",
  },
  {
    label: "تکمیل شده",
    tone:
      "bg-primary-light/20 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light",
    dot: "bg-primary dark:bg-primary-light",
    desc: "ویزیت انجام و نوبت تکمیل شده است",
  },
  {
    label: "لغو شده",
    tone: "bg-red-50 text-danger dark:bg-red-500/10 dark:text-red-300",
    dot: "bg-danger dark:bg-red-400",
    desc: "نوبت توسط کلینیک یا بیمار لغو شده است",
  },
  {
    label: "تغییر زمان",
    tone:
      "bg-secondary-purple/40 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300",
    dot: "bg-purple-500 dark:bg-purple-400",
    desc: "زمان نوبت تغییر کرده است",
  },
  {
    label: "تایید شده",
    tone:
      "bg-primary-light/20 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light",
    dot: "bg-primary dark:bg-primary-light",
    desc: "نوبت توسط کلینیک تایید و برنامه‌ریزی شده است",
  },
  {
    label: "عدم حضور",
    tone:
      "bg-secondary-pink/40 text-pink-600 dark:bg-pink-500/10 dark:text-pink-300",
    dot: "bg-pink-500 dark:bg-pink-400",
    desc: "بیمار در زمان مقرر حضور نداشته است",
  },
];



const REMINDERS = [
  {
    icon: BellRing,
    tone:
      "text-primary-dark bg-primary-light/20 dark:text-primary-light dark:bg-primary-light/10",
    title: "یادآوری پیامکی",
    status: "ارسال شد",
    statusTone: "text-primary-dark dark:text-primary-light",
    time: "۱۰:۰۰ - ۲۳ خرداد ۱۴۰۳",
  },
  {
    icon: MessageCircle,
    tone:
      "text-primary-dark bg-primary-light/20 dark:text-primary-light dark:bg-primary-light/10",
    title: "یادآوری واتسابی",
    status: "ارسال شد",
    statusTone: "text-primary-dark dark:text-primary-light",
    time: "۰۸:۰۰ - ۲۳ خرداد ۱۴۰۳",
  },
  {
    icon: Mail,
    tone: "text-danger bg-red-50 dark:text-red-300 dark:bg-red-500/10",
    title: "یادآوری ایمیلی",
    status: "برنامه‌ریزی نشده",
    statusTone: "text-danger dark:text-red-300",
    time: "۱۲:۰۰ - ۲۴ خرداد ۱۴۰۳",
  },
];

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

const STATUS_TEXT: Record<string, string> = {
  confirmed: "تایید شده",
  pending: "در انتظار تایید",
  cancelled: "لغو شده",
  completed: "تکمیل شده",
  no_show: "عدم حضور",
  rescheduled: "تغییر زمان",
};

const SOURCE_LABEL: Record<string, string> = {
  admin: "پنل مدیریت",
  receptionist: "پذیرش",
  patient_portal: "پنل بیمار",
  website: "وب‌سایت",
};

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
    return new Date(iso).toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function calculateAge(birthDate?: string | null) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDiff = today.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 &&
      today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

export default function AppointmentDetailPage({
  params,
}: {
  params: Promise<{
    clinicSlug: string;
    appointmentId: string;
  }>;
}) {
  const { clinicSlug, appointmentId } = use(params);

  const queryClient = useQueryClient();

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const [visitSummary, setVisitSummary] = useState("");
  const [visitRecommendation, setVisitRecommendation] = useState("");
  const [visitSaved, setVisitSaved] = useState(false);

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [showEditAppointment, setShowEditAppointment] = useState(false);

  const {
    data: appt,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.appointmentsCalendar.detail(
      clinicSlug,
      appointmentId
    ),
    queryFn: () => getAppointmentDetail(clinicSlug, appointmentId),
    enabled: !!clinicSlug && !!appointmentId,
  });

  const patient = appt?.patient;

  const patientName = patient
    ? `${patient.first_name} ${patient.last_name}`
    : appt?.patientName ?? "—";

  const patientPhone =
    patient?.phone ?? appt?.patientPhone ?? "—";

  const patientNationalId =
    patient?.national_id ?? "—";

  const patientBirthDate = patient?.birth_date
    ? new Date(patient.birth_date).toLocaleDateString("fa-IR")
    : "—";


  const statusHistory = appt?.statusHistory ?? [];

  const { data: patientDetail } = useQuery({
    queryKey: queryKeys.patients.detail(
      clinicSlug,
      appt?.patientId ?? ""
    ),
    queryFn: () =>
      getPatientDetail(clinicSlug, appt!.patientId!),
    enabled: !!clinicSlug && !!appt?.patientId,
  });

  const patientAge = calculateAge(patient?.birth_date);


  const { data: debt } = useQuery({
    queryKey: [
      ...queryKeys.patients.detail(
        clinicSlug,
        appt?.patientId ?? ""
      ),
      "debt",
    ],
    queryFn: () =>
      getPatientDebt(clinicSlug, appt!.patientId!),
    enabled: !!clinicSlug && !!appt?.patientId,
  });

  /* =========================
     فاکتور / پرداخت
     توجه: بک‌اند هیچ لینک مستقیمی بین appointment و invoice ندارد
     (اسکیمای Invoice فیلد appointment_id ندارد)، پس اینجا آخرین
     فاکتورِ بازِ (unpaid/draft) همین بیمار را به‌عنوان فاکتور مرتبط
     با این ویزیت در نظر می‌گیریم، نه لزوماً فاکتور خودِ این نوبت.
  ========================= */

  const { data: patientInvoices = [] } = useQuery({
    queryKey: [
      ...queryKeys.patients.detail(clinicSlug, appt?.patientId ?? ""),
      "invoices",
    ],
    queryFn: () => getInvoices(clinicSlug, { patientId: appt!.patientId! }),
    enabled: !!clinicSlug && !!appt?.patientId,
  });

  const activeInvoice: Invoice | null =
    patientInvoices.find(
      (inv) => inv.status !== "cancelled" && inv.status !== "paid"
    ) ?? null;

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [financeError, setFinanceError] = useState<string | null>(null);

  function invalidateFinance() {
    queryClient.invalidateQueries({
      queryKey: [
        ...queryKeys.patients.detail(clinicSlug, appt?.patientId ?? ""),
        "invoices",
      ],
    });
    queryClient.invalidateQueries({
      queryKey: [
        ...queryKeys.patients.detail(clinicSlug, appt?.patientId ?? ""),
        "debt",
      ],
    });
  }

  const createInvoiceMutation = useMutation({
    mutationFn: () =>
      createInvoice(clinicSlug, {
        patient_id: appt!.patientId!,
        items: [
          {
            service_id: appt?.service?.id,
            description: appt?.serviceName || "خدمت",
            quantity: 1,
            unit_price: Number(appt?.service?.base_price ?? 0),
          },
        ],
      }),
    onSuccess: () => {
      setFinanceError(null);
      invalidateFinance();
    },
    onError: (e) =>
      setFinanceError(
        e instanceof Error ? e.message : "ایجاد فاکتور ناموفق بود."
      ),
  });

  const issueInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) => issueInvoice(clinicSlug, invoiceId),
    onSuccess: () => {
      setFinanceError(null);
      invalidateFinance();
    },
    onError: (e) =>
      setFinanceError(
        e instanceof Error ? e.message : "صدور فاکتور ناموفق بود."
      ),
  });

  const paymentMutation = useMutation({
    mutationFn: (invoiceId: string) =>
      createPayment(clinicSlug, invoiceId, {
        amount: Number(paymentAmount),
        method: paymentMethod,
      }),
    onSuccess: () => {
      setFinanceError(null);
      setShowPaymentForm(false);
      setPaymentAmount("");
      invalidateFinance();
    },
    onError: (e) =>
      setFinanceError(
        e instanceof Error ? e.message : "ثبت پرداخت ناموفق بود."
      ),
  });

  function invalidateAppointment() {
    queryClient.invalidateQueries({
      queryKey: queryKeys.appointmentsCalendar.detail(
        clinicSlug,
        appointmentId
      ),
    });

    queryClient.invalidateQueries({
      queryKey: ["appointments-calendar", clinicSlug],
    });
  }

  const completeMutation = useMutation({
    mutationFn: () =>
      completeAppointment(clinicSlug, appointmentId),

    onSuccess: () => {
      setActionError(null);
      setActionMessage("نوبت با موفقیت تکمیل شد.");
      invalidateAppointment();
    },

    onError: (e) =>
      setActionError(
        e instanceof Error
          ? e.message
          : "عملیات ناموفق بود"
      ),
  });

  const noShowMutation = useMutation({
    mutationFn: () =>
      markNoShow(clinicSlug, appointmentId),

    onSuccess: () => {
      setActionError(null);
      setActionMessage("عدم حضور بیمار ثبت شد.");
      invalidateAppointment();
    },

    onError: (e) =>
      setActionError(
        e instanceof Error
          ? e.message
          : "عملیات ناموفق بود"
      ),
  });

  const cancelMutation = useMutation({
    mutationFn: () => {
      const reason = prompt("دلیل لغو نوبت را وارد کنید:");

      if (!reason) {
        throw new Error("لغو انصراف داده شد");
      }

      return cancelAppointment(
        clinicSlug,
        appointmentId,
        reason
      );
    },

    onSuccess: () => {
      setActionError(null);
      setActionMessage("نوبت لغو شد.");
      invalidateAppointment();
    },

    onError: (e) => {
      if (
        e instanceof Error &&
        e.message === "لغو انصراف داده شد"
      ) {
        return;
      }

      setActionError(
        e instanceof Error
          ? e.message
          : "عملیات ناموفق بود"
      );
    },
  });

  const reminderMutation = useMutation({
    mutationFn: () =>
      sendAppointmentReminder(
        clinicSlug,
        appointmentId
      ),

    onSuccess: () => {
      setActionError(null);
      setActionMessage("درخواست یادآوری ثبت شد.");
    },

    onError: (e) =>
      setActionError(
        e instanceof Error
          ? e.message
          : "ارسال یادآوری ناموفق بود"
      ),
  });

  const rescheduleMutation = useMutation({
    mutationFn: (payload: {
      date: string;
      time: string;
    }) => {
      if (!appt) {
        throw new Error("نوبت یافت نشد");
      }

      const durationMin =
        formatDurationMinutes(
          appt.startTime,
          appt.endTime
        ) ?? 30;

      const newStart = buildDateTime(
        payload.date,
        payload.time
      );

      const newEnd = new Date(
        new Date(newStart).getTime() +
        durationMin * 60000
      ).toISOString();

      return rescheduleAppointment(
        clinicSlug,
        appointmentId,
        {
          start_time: newStart,
          end_time: newEnd,
        }
      );
    },

    onSuccess: () => {
      setActionError(null);
      setActionMessage("زمان نوبت تغییر کرد.");
      setShowRescheduleModal(false);
      invalidateAppointment();
    },

    onError: (e) => {
      if (
        e instanceof ApiError &&
        e.status === 409
      ) {
        setActionError(
          "این بازه‌ی زمانی برای این پزشک قبلاً رزرو شده است."
        );
      } else {
        setActionError(
          e instanceof Error
            ? e.message
            : "تغییر زمان ناموفق بود"
        );
      }
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: (payload: { doctor_user_id?: number; service_id?: string; notes?: string }) =>
      updateAppointment(clinicSlug, appointmentId, payload),
    onSuccess: () => {
      setActionError(null);
      setActionMessage("نوبت به‌روزرسانی شد.");
      setEditingNotes(false);
      setShowEditAppointment(false);
      invalidateAppointment();
    },
    onError: (e) =>
      setActionError(e instanceof Error ? e.message : "ویرایش نوبت ناموفق بود"),
  });

  const saveVisitResultMutation = useMutation({
    mutationFn: async () => {
      if (!appt?.patientId || !appt?.doctorId) {
        throw new Error(
          "بیمار یا پزشک این نوبت مشخص نیست؛ امکان ثبت جلسه‌ی درمان وجود ندارد."
        );
      }

      const visit = await createVisit(clinicSlug, {
        patient_id: appt.patientId,
        doctor_user_id: appt.doctorId,
        visit_date: appt.startTime,
        clinical_summary: visitSummary || undefined,
        patient_recommendation: visitRecommendation || undefined,
      });

      if (appt.service?.id) {
        await addServiceToVisit(clinicSlug, visit.id, {
          service_id: appt.service.id,
          doctor_user_id: appt.doctorId,
          description: visitSummary || undefined,
        });
      }

      await completeVisit(clinicSlug, visit.id);

      if (appt.status !== "completed") {
        await completeAppointment(clinicSlug, appointmentId);
      }

      return visit;
    },

    onSuccess: () => {
      setActionError(null);
      setActionMessage("نتیجه‌ی ویزیت ثبت و نوبت تکمیل شد.");
      setVisitSaved(true);
      invalidateAppointment();

      if (appt?.patientId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.visits.listByPatient(clinicSlug, appt.patientId),
        });
      }
    },

    onError: (e) =>
      setActionError(
        e instanceof Error ? e.message : "ثبت نتیجه‌ی ویزیت ناموفق بود"
      ),
  });

  if (isLoading) {
    return <LoadingLogo />;
  }

  if (error || !appt) {
    return (
      <div className="py-20 text-center text-sm text-danger dark:text-red-300">
        نوبت یافت نشد.
      </div>
    );
  }

  const durationMin = formatDurationMinutes(
    appt.startTime,
    appt.endTime
  );

  const ACTIONS = [
    {
      icon: Pencil,
      label: "ویرایش نوبت",
      onClick: () => setShowEditAppointment(true),
      disabled: false,
    },
    {
      icon: CalendarCog,
      label: "تغییر زمان",
      onClick: () =>
        setShowRescheduleModal(true),
      disabled: false,
    },
    {
      icon: XCircle,
      label: "لغو نوبت",
      onClick: () => cancelMutation.mutate(),
      disabled: cancelMutation.isPending,
      danger: true,
    },
    {
      icon: CheckCircle2,
      label: "علامت تکمیل شده",
      onClick: () =>
        completeMutation.mutate(),
      disabled: completeMutation.isPending,
    },
    {
      icon: UserX,
      label: "علامت عدم حضور",
      onClick: () =>
        noShowMutation.mutate(),
      disabled: noShowMutation.isPending,
      danger: true,
    },
    {
      icon: BellRing,
      label: "ارسال یادآوری",
      onClick: () =>
        reminderMutation.mutate(),
      disabled: reminderMutation.isPending,
    },
    {
      icon: Video,
      label: "شروع ویزیت آنلاین",
      onClick: () => { },
      disabled: true,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 dark:text-gray-500">
        <Link
          href={`/clinic/${clinicSlug}/calendar`}
          className="transition hover:text-primary-dark dark:hover:text-primary-light"
        >
          نوبت‌ها
        </Link>

        <span className="mx-1 text-gray-300 dark:text-gray-600">
          ‹
        </span>

        <span className="text-gray-600 dark:text-gray-300">
          جزئیات نوبت
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <CalendarClock className="h-5 w-5 text-primary-dark dark:text-primary-light" />
          جزئیات نوبت
        </h1>

        <div className="flex items-center gap-2">
          <Link
            href={`/clinic/${clinicSlug}/calendar`}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            بازگشت
          </Link>

          <button
            type="button"
            className="rounded-xl border border-gray-200 p-2 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:border-white/10 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-300"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      {actionError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500 dark:bg-red-500/10 dark:text-red-300">
          {actionError}
        </p>
      )}

      {actionMessage && (
        <p className="rounded-lg bg-primary-light/15 px-3 py-2 text-xs font-medium text-primary-dark dark:bg-primary-light/10 dark:text-primary-light">
          {actionMessage}
        </p>
      )}

      {/* Appointment Summary */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          <SummaryItem
            label="مراجع (بیمار)"
            value={patientName}
            sub={patientPhone}
            avatar
            action="مشاهده پروفایل"
          />

          <SummaryItem
            icon={Stethoscope}
            label="پزشک / اپراتور"
            value={appt.doctor?.full_name ?? appt.doctorName ?? "—"}
          />

          <SummaryItem
            icon={Sparkles}
            label="خدمت"
            value={appt.service?.name ?? appt.serviceName ?? "—"}
          />

          <SummaryItem
            icon={CalendarDays}
            label="تاریخ"
            value={formatJalaliDate(
              appt.startTime
            )}
          />

          <SummaryItem
            icon={Clock3}
            label="ساعت"
            value={`${formatTime(appt.startTime)}${durationMin
              ? ` - ${durationMin.toLocaleString(
                "fa-IR"
              )} دقیقه`
              : ""
              }`}
          />

          <SummaryItem
            custom={
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] ${STATUS_BADGE[appt.status] ??
                  "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                  }`}
              >
                {STATUS_TEXT[appt.status] ??
                  appt.status}
              </span>
            }
            label="وضعیت نوبت"
          />

          <SummaryItem
            custom={
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] ${
                  activeInvoice
                    ? INVOICE_STATUS_TONE[activeInvoice.status]
                    : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                }`}
              >
                {activeInvoice
                  ? INVOICE_STATUS_LABEL[activeInvoice.status]
                  : "بدون فاکتور"}
              </span>
            }
            label="وضعیت پرداخت"
          />

          <SummaryItem
            icon={Globe}
            label="کانال نوبت"
            value={
              appt.source
                ? SOURCE_LABEL[appt.source] ??
                appt.source
                : "—"
            }
          />
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            disabled={a.disabled}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[11px] whitespace-nowrap transition disabled:opacity-40 ${a.danger
              ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/10"
              }`}
          >
            <a.icon
              className={`h-3.5 w-3.5 shrink-0 ${a.danger
                ? "text-red-500 dark:text-red-300"
                : "text-primary-dark dark:text-primary-light"
                }`}
            />

            <span>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Right Column */}
        <div className="space-y-4">
          {/* Patient Profile */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.06]">
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-100">
              <UserRound className="h-4 w-4 text-primary-dark dark:text-primary-light" />
              پروفایل بیمار
            </h3>

            <div className="flex items-center gap-3">
              <Image
                src="/image/user.PNG"
                alt="User"
                width={30}
                height={30}
                unoptimized
                className="rounded-full object-cover"
              />

              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {patientName}
                </div>

                <div className="text-[10px] text-gray-400 dark:text-gray-500">
                  کد ملی:{" "}
                  {patientNationalId}
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 text-[11px] text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3 text-gray-300 dark:text-gray-600" />

                تاریخ تولد:

                {patientBirthDate}

                {patientAge !== null && (
                  <span>
                    ({patientAge.toLocaleString("fa-IR")} سال)
                  </span>
                )}
              </div>

              <div
                className="flex items-center gap-1.5"
                dir="ltr"
              >
                <Phone className="h-3 w-3 text-gray-300 dark:text-gray-600" />
                {appt.patientPhone || "—"}
              </div>
            </div>

            <button
              type="button"
              className="mt-3 flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-[11px] text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
            >
              موجودی حساب:{" "}
              {debt != null
                ? `${debt.toLocaleString(
                  "fa-IR"
                )} تومان`
                : "—"}

              <Pencil className="h-3 w-3 text-gray-300 dark:text-gray-600" />
            </button>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-gray-50 p-2 dark:bg-white/[0.04]">
                <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  طلایی
                </div>

                <div className="text-[9px] text-gray-400 dark:text-gray-500">
                  سطح وفاداری
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-2 dark:bg-white/[0.04]">
                <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  ۲
                </div>

                <div className="text-[9px] text-gray-400 dark:text-gray-500">
                  نوبت‌های آینده
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-2 dark:bg-white/[0.04]">
                <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  ۲۸
                </div>

                <div className="text-[9px] text-gray-400 dark:text-gray-500">
                  تعداد نوبت‌ها
                </div>
              </div>
            </div>
          </div>

          {/* Visit Result */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.06]">
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-100">
              <ClipboardList className="h-4 w-4 text-primary-dark dark:text-primary-light" />
              نتیجه و خروجی ویزیت
            </h3>

            {appt.status === "completed" || visitSaved ? (
              <p className="rounded-xl bg-primary-light/10 p-3 text-[11px] text-primary-dark dark:bg-primary-light/5 dark:text-primary-light">
                این نوبت تکمیل شده و جلسه‌ی درمان مربوطه در پرونده‌ی بیمار ثبت شده است.
              </p>
            ) : appt.status === "cancelled" ? (
              <p className="rounded-xl bg-gray-50 p-3 text-[11px] text-gray-500 dark:bg-white/5 dark:text-gray-400">
                این نوبت لغو شده؛ امکان ثبت نتیجه‌ی ویزیت برای آن وجود ندارد.
              </p>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">
                      خلاصه‌ی بالینی
                    </label>
                    <textarea
                      value={visitSummary}
                      onChange={(e) => setVisitSummary(e.target.value)}
                      rows={2}
                      placeholder="مثلاً: تزریق بوتاکس نواحی پیشانی و اطراف چشم انجام شد"
                      className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none transition focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">
                      توصیه به بیمار
                    </label>
                    <textarea
                      value={visitRecommendation}
                      onChange={(e) => setVisitRecommendation(e.target.value)}
                      rows={2}
                      placeholder="مثلاً: تا ۴۸ ساعت از دراز کشیدن روی صورت خودداری کنید"
                      className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none transition focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => saveVisitResultMutation.mutate()}
                  disabled={saveVisitResultMutation.isPending}
                  className="mt-4 w-full rounded-xl bg-primary py-2.5 text-xs font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary/90 dark:hover:bg-primary"
                >
                  {saveVisitResultMutation.isPending
                    ? "در حال ثبت..."
                    : "ثبت نتیجه و تکمیل نوبت"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Middle Column */}
        <div className="space-y-4">
          {/* Status History */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.06]">
            <h3 className="mb-4 text-xs font-bold text-gray-800 dark:text-gray-100">
              تاریخچه وضعیت نوبت
            </h3>

            <div className="relative space-y-4 border-r-2 border-gray-100 pr-4 dark:border-white/10">
              {statusHistory.length > 0 ? (
                statusHistory.map((history, index) => {
                  const status = history.to_status ?? history.status;

                  return (
                    <div
                      key={history.id ?? `${status}-${index}`}
                      className="relative pr-6"
                    >
                      {/* نقطه تایم‌لاین */}
                      <div className="absolute right-[-7px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-primary-500 dark:border-slate-900" />

                      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-slate-800 dark:text-white">
                            {STATUS_TEXT[status] ?? status}
                          </span>

                          {history.created_at && (
                            <span className="text-xs text-slate-400">
                              {new Date(history.created_at).toLocaleString("fa-IR")}
                            </span>
                          )}
                        </div>

                        {history.changed_by?.full_name && (
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            توسط {history.changed_by.full_name}
                          </p>
                        )}

                        {history.reason && (
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            دلیل: {history.reason}
                          </p>
                        )}

                        {history.notes && (
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {history.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    تاریخچه‌ای برای این نوبت ثبت نشده است.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.06]">
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-100">
              <StickyNote className="h-4 w-4 text-primary-dark dark:text-primary-light" />
              یادداشت‌ها
            </h3>

            {editingNotes ? (
              <>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none transition focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingNotes(false)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAppointmentMutation.mutate({ notes: notesDraft })}
                    disabled={updateAppointmentMutation.isPending}
                    className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
                  >
                    {updateAppointmentMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                    ذخیره
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-600 dark:bg-white/[0.04] dark:text-gray-300">
                  {appt.notes || "یادداشتی برای این نوبت ثبت نشده است."}
                </p>

                <div className="mt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setNotesDraft(appt.notes ?? "");
                      setEditingNotes(true);
                    }}
                    className="flex shrink-0 items-center gap-1 text-[10px] text-primary-dark transition hover:text-primary dark:text-primary-light dark:hover:text-primary"
                  >
                    <Plus className="h-3 w-3" />
                    {appt.notes ? "ویرایش یادداشت" : "افزودن یادداشت"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Left Column */}
        <div className="space-y-4">
          {/* Reminders */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.06]">
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-100">
              <Bell className="h-4 w-4 text-primary-dark dark:text-primary-light" />
              یادآوری‌ها
            </h3>

            <div className="space-y-3">
              {REMINDERS.map((r) => (
                <div
                  key={r.title}
                  className="flex items-center gap-2.5"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${r.tone}`}
                  >
                    <r.icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1">
                    <div className="text-[11px] font-medium text-gray-700 dark:text-gray-200">
                      {r.title}
                    </div>

                    <div className="text-[10px] text-gray-400 dark:text-gray-500">
                      {r.time}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-medium ${r.statusTone}`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                reminderMutation.mutate()
              }
              disabled={reminderMutation.isPending}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-primary-light/15 py-2 text-[11px] font-medium text-primary-dark transition hover:bg-primary-light/25 disabled:opacity-50 dark:bg-primary-light/10 dark:text-primary-light dark:hover:bg-primary-light/20"
            >
              <Plus className="h-3.5 w-3.5" />
              ارسال یادآوری جدید
            </button>
          </div>

          {/* Payment */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.06]">
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-100">
              <Wallet className="h-4 w-4 text-primary-dark dark:text-primary-light" />
              پرداخت و صورت‌حساب
            </h3>

            {financeError && (
              <p className="mb-2 rounded-lg bg-red-50 px-2.5 py-2 text-[11px] text-red-500 dark:bg-red-500/10 dark:text-red-300">
                {financeError}
              </p>
            )}

            {!activeInvoice ? (
              <div className="space-y-3">
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  هنوز فاکتوری برای این بیمار صادر نشده.
                </p>

                <button
                  type="button"
                  onClick={() => createInvoiceMutation.mutate()}
                  disabled={
                    createInvoiceMutation.isPending || !appt?.patientId
                  }
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-[11px] font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary/90 dark:hover:bg-primary"
                >
                  <Receipt className="h-3.5 w-3.5" />
                  {createInvoiceMutation.isPending
                    ? "در حال ایجاد..."
                    : "ایجاد فاکتور برای این خدمت"}
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 dark:text-gray-500">
                      وضعیت فاکتور
                    </span>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${INVOICE_STATUS_TONE[activeInvoice.status]}`}
                    >
                      {INVOICE_STATUS_LABEL[activeInvoice.status]}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 dark:text-gray-500">
                      مبلغ خدمات
                    </span>

                    <span className="text-gray-700 dark:text-gray-200">
                      {formatToman(activeInvoice.subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 dark:text-gray-500">
                      تخفیف
                    </span>

                    <span className="text-gray-700 dark:text-gray-200">
                      {formatToman(activeInvoice.discountTotal)}
                    </span>
                  </div>

                  {activeInvoice.paidAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 dark:text-gray-500">
                        پرداخت‌شده
                      </span>

                      <span className="text-gray-700 dark:text-gray-200">
                        {formatToman(activeInvoice.paidAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-50 pt-2 dark:border-white/10">
                    <span className="font-medium text-gray-600 dark:text-gray-300">
                      مبلغ قابل پرداخت
                    </span>

                    <span className="font-bold text-gray-800 dark:text-gray-100">
                      {formatToman(activeInvoice.remainingAmount)}
                    </span>
                  </div>
                </div>

                {showPaymentForm ? (
                  <div className="mt-3 space-y-2 rounded-xl border border-gray-100 p-2.5 dark:border-white/10">
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="مبلغ (تومان)"
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] text-gray-700 outline-none focus:border-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-200"
                    />

                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as PaymentMethod)
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] text-gray-700 outline-none focus:border-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-200 dark:[color-scheme:dark]"
                    >
                      {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map(
                        (m) => (
                          <option key={m} value={m}>
                            {PAYMENT_METHOD_LABEL[m]}
                          </option>
                        )
                      )}
                    </select>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => paymentMutation.mutate(activeInvoice.id)}
                        disabled={
                          paymentMutation.isPending ||
                          !paymentAmount ||
                          Number(paymentAmount) <= 0
                        }
                        className="flex-1 rounded-lg bg-primary py-1.5 text-[11px] font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {paymentMutation.isPending ? "در حال ثبت..." : "تایید پرداخت"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowPaymentForm(false);
                          setFinanceError(null);
                        }}
                        className="rounded-lg border border-gray-200 px-3 text-[11px] text-gray-500 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/10"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentAmount(String(activeInvoice.remainingAmount || ""));
                        setShowPaymentForm(true);
                      }}
                      disabled={
                        activeInvoice.status === "draft" ||
                        activeInvoice.remainingAmount <= 0
                      }
                      className="flex-1 rounded-lg bg-primary py-2 text-[11px] font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary/90 dark:hover:bg-primary"
                    >
                      دریافت پرداخت
                    </button>

                    {activeInvoice.status === "draft" && (
                      <button
                        type="button"
                        onClick={() => issueInvoiceMutation.mutate(activeInvoice.id)}
                        disabled={issueInvoiceMutation.isPending}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 py-2 text-[11px] text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        {issueInvoiceMutation.isPending ? "در حال صدور..." : "صدور فاکتور"}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>


      {/* Status Legend */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
        <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">
          راهنمای وضعیت نوبت
        </h3>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STATUS_LEGEND.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-gray-50 p-3 dark:border-white/5"
            >
              <span
                className={`mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${s.tone}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${s.dot}`}
                />

                {s.label}
              </span>

              <p className="text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && appt.doctorId && (
        <RescheduleModal
          clinicSlug={clinicSlug}
          doctorId={appt.doctorId}
          currentStartTime={appt.startTime}
          currentEndTime={appt.endTime}
          onClose={() =>
            setShowRescheduleModal(false)
          }
          onSubmit={(date, time) =>
            rescheduleMutation.mutate({
              date,
              time,
            })
          }
          isSubmitting={
            rescheduleMutation.isPending
          }
        />
      )}

      {showEditAppointment && (
        <EditAppointmentModal
          clinicSlug={clinicSlug}
          currentDoctorId={appt.doctorId ?? undefined}
          currentServiceId={appt.service?.id}
          onClose={() => setShowEditAppointment(false)}
          onSubmit={(payload) => updateAppointmentMutation.mutate(payload)}
          isSubmitting={updateAppointmentMutation.isPending}
        />
      )}
    </div>
  );
}

function EditAppointmentModal({
  clinicSlug,
  currentDoctorId,
  currentServiceId,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  clinicSlug: string;
  currentDoctorId?: number;
  currentServiceId?: string;
  onClose: () => void;
  onSubmit: (payload: { doctor_user_id?: number; service_id?: string }) => void;
  isSubmitting: boolean;
}) {
  const [doctorId, setDoctorId] = useState<string>(currentDoctorId != null ? String(currentDoctorId) : "");
  const [serviceId, setServiceId] = useState<string>(currentServiceId ?? "");

  const { data: doctors = [] } = useQuery({
    queryKey: queryKeys.appointmentsCalendar.doctors(clinicSlug),
    queryFn: () => getDoctors(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services-for-booking", clinicSlug],
    queryFn: () => getServicesForBooking(clinicSlug),
    enabled: !!clinicSlug,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px] dark:bg-black/60">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#18201e]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">ویرایش نوبت</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">پزشک</label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
            >
              <option value="">بدون تغییر</option>
              {doctors.map((d: DoctorOption) => (
                <option key={d.userId} value={d.userId}>
                  {d.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">خدمت</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
            >
              <option value="">بدون تغییر</option>
              {services.map((s: ServiceOption) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
          >
            انصراف
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() =>
              onSubmit({
                doctor_user_id: doctorId ? Number(doctorId) : undefined,
                service_id: serviceId || undefined,
              })
            }
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RescheduleModal({
  clinicSlug,
  doctorId,
  currentStartTime,
  currentEndTime,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  clinicSlug: string;
  doctorId: number;
  currentStartTime: string;
  currentEndTime: string;
  onClose: () => void;
  onSubmit: (
    date: string,
    time: string
  ) => void;
  isSubmitting: boolean;
}) {
  const [date, setDate] = useState<DateObject>(
    new DateObject({
      date: new Date(currentStartTime),
      calendar: persian,
      locale: persian_fa,
    })
  );

  const [selectedSlot, setSelectedSlot] =
    useState<AvailabilitySlot | null>(null);

  const isoDate = toLocalIsoDate(
    date.toDate()
  );

  const currentTimeLabel = extractTimeLabel(
    new Date(
      currentStartTime
    ).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );

  const isSameDayAsCurrent =
    isoDate ===
    toLocalIsoDate(
      new Date(currentStartTime)
    );

  const {
    data: rawSlots = [],
    isLoading: slotsLoading,
  } = useQuery({
    queryKey:
      queryKeys.appointmentsCalendar.availability(
        clinicSlug,
        doctorId,
        isoDate
      ),

    queryFn: () =>
      getAvailability(clinicSlug, {
        doctorUserId: doctorId,
        date: isoDate,
      }),

    enabled:
      !!clinicSlug && !!doctorId,
  });

  const slots = useMemoSlots(
    rawSlots,
    isSameDayAsCurrent,
    currentTimeLabel
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px] dark:bg-black/60">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#18201e]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            تغییر زمان نوبت
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-white/10 dark:bg-white/[0.02]">
          <Calendar
            value={date}
            onChange={(v) => {
              if (v) {
                setDate(v as DateObject);
                setSelectedSlot(null);
              }
            }}
            calendar={persian}
            locale={persian_fa}
            shadow={false}
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-300">
            ساعت جدید
          </label>

          {slotsLoading && (
            <p className="text-[11px] text-gray-300 dark:text-gray-600">
              در حال دریافت ساعت‌های آزاد...
            </p>
          )}

          {!slotsLoading &&
            slots.length === 0 && (
              <p className="text-[11px] text-gray-300 dark:text-gray-600">
                ساعت آزادی برای این روز نیست.
              </p>
            )}

          <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto">
            {slots.map((slot, i) => (
              <button
                type="button"
                key={i}
                onClick={() =>
                  setSelectedSlot(slot)
                }
                className={`rounded-xl border py-2 text-xs transition ${selectedSlot?.start ===
                  slot.start
                  ? "border-primary bg-primary-light/10 font-medium text-primary-dark dark:border-primary-light dark:bg-primary-light/10 dark:text-primary-light"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                  }`}
              >
                {extractTimeLabel(slot.start)}

                {extractTimeLabel(
                  slot.start
                ) === currentTimeLabel &&
                  isSameDayAsCurrent && (
                    <span className="mr-1 text-[9px] text-gray-400 dark:text-gray-500">
                      (فعلی)
                    </span>
                  )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
          >
            انصراف
          </button>

          <button
            type="button"
            disabled={
              !selectedSlot || isSubmitting
            }
            onClick={() =>
              selectedSlot &&
              onSubmit(
                isoDate,
                extractTimeLabel(
                  selectedSlot.start
                )
              )
            }
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-50 dark:bg-primary/90 dark:hover:bg-primary"
          >
            {isSubmitting
              ? "در حال ثبت..."
              : "ثبت تغییر"}
          </button>
        </div>
      </div>
    </div>
  );
}

function useMemoSlots(
  rawSlots: AvailabilitySlot[],
  isSameDayAsCurrent: boolean,
  currentTimeLabel: string
): AvailabilitySlot[] {
  const hasCurrent = rawSlots.some(
    (s) =>
      extractTimeLabel(s.start) ===
      currentTimeLabel
  );

  if (
    isSameDayAsCurrent &&
    !hasCurrent
  ) {
    return [
      {
        start: currentTimeLabel,
        end: "",
      },
      ...rawSlots,
    ];
  }

  return rawSlots;
}

function SummaryItem({
  icon: Icon,
  label,
  value,
  sub,
  custom,
  avatar,
  action,
}: {
  icon?: typeof Globe;
  label: string;
  value?: string;
  sub?: string;
  custom?: React.ReactNode;
  avatar?: boolean;
  action?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 text-[10px] text-gray-400 dark:text-gray-500">
        {label}
      </div>

      {custom ?? (
        <div className="flex items-center gap-1.5">
          {avatar && (
            <Image
              src="/image/user.PNG"
              alt="User"
              width={30}
              height={30}
              unoptimized
              className="shrink-0 rounded-full object-cover"
            />
          )}

          {Icon && !avatar && (
            <Icon className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600" />
          )}

          <div className="min-w-0">
            <div className="truncate text-xs font-medium text-gray-700 dark:text-gray-200">
              {value}
            </div>

            {sub && (
              <div className="truncate text-[9px] text-gray-400 dark:text-gray-500">
                {sub}
              </div>
            )}
          </div>
        </div>
      )}

      {action && (
        <button
          type="button"
          className="mt-1.5 rounded-lg bg-primary-light/15 px-2 py-1 text-[9px] text-primary-dark transition hover:bg-primary-light/25 dark:bg-primary-light/10 dark:text-primary-light dark:hover:bg-primary-light/20"
        >
          {action}
        </button>
      )}
    </div>
  );
}