"use client";

import { use, useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  CalendarPlus,
  UserRound,
  Clock3,
  RefreshCcw,
  Video,
  Search,
  Stethoscope,
  Sparkles,
  StickyNote,
  X,
  Check,
} from "lucide-react";

import { Calendar } from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import { ApiError } from "@/lib/api/client";
import { getCurrentClinicUser } from "@/lib/api/session";

import {
  searchPatients,
  type PatientSearchResult,
} from "@/lib/api/patients";

import {
  getDoctors,
  getServicesForBooking,
  getAvailability,
  getAppointments,
  createAppointment,
  buildDateTime,
  addMinutesToIso,
  extractTimeLabel,
  filterBookedSlots,
  toLocalIsoDate,
  type AvailabilitySlot,
} from "@/lib/api/appointments";

import { queryKeys } from "@/lib/query/keys";

const APPOINTMENT_TYPES = [
  {
    key: "in_person" as const,
    icon: UserRound,
    tone:
      "text-primary-dark bg-primary-light/20 dark:text-primary-light dark:bg-primary-light/10",
    title: "حضوری",
    desc: "مراجعه به کلینیک",
  },
  {
    key: "online" as const,
    icon: Video,
    tone:
      "text-blue-600 bg-secondary-blue/40 dark:text-blue-300 dark:bg-blue-500/10",
    title: "آنلاین",
    desc: "مشاوره و خدمات آنلاین",
  },
  {
    key: "followup" as const,
    icon: RefreshCcw,
    tone:
      "text-purple-600 bg-secondary-purple/40 dark:text-purple-300 dark:bg-purple-500/10",
    title: "پیگیری",
    desc: "نوبت پیگیری و چکاپ",
  },
];

export default function NewAppointmentPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);

  const router = useRouter();
  const queryClient = useQueryClient();

  const [date, setDate] = useState<DateObject>(
    new DateObject({
      calendar: persian,
      locale: persian_fa,
    })
  );

  const [appointmentType, setAppointmentType] = useState<
    "in_person" | "online" | "followup"
  >("in_person");

  const [smsReminder, setSmsReminder] = useState(true);
  const [notes, setNotes] = useState("");

  const [patientQuery, setPatientQuery] = useState("");
  const [selectedPatient, setSelectedPatient] =
    useState<PatientSearchResult | null>(null);
  const [showPatientResults, setShowPatientResults] = useState(false);

  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] =
    useState<AvailabilitySlot | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isoDate = toLocalIsoDate(date.toDate());

  /*
   * نقش کاربر جاری — اگر پزشک بود، خودش را به‌عنوان پزشکِ نوبت قفل می‌کنیم
   * (همان الگویی که توی صفحه‌ی تقویم روزانه استفاده شده) چون پزشک باید
   * بتواند مستقیماً برای بیمار خودش نوبت ثبت کند، نه اینکه از لیست کل
   * کادر درمانی خودش را پیدا و انتخاب کند.
   */
  const { data: currentUser } = useQuery({
    queryKey: queryKeys.session.currentUser(clinicSlug),
    queryFn: () => getCurrentClinicUser(clinicSlug),
    enabled: !!clinicSlug,
  });

  const isDoctor = currentUser?.roleKey === "doctor";

  useEffect(() => {
    if (isDoctor && currentUser?.userId) {
      setDoctorId(currentUser.userId);
    }
  }, [isDoctor, currentUser?.userId]);

  /*
   * با تغییر تاریخ، ساعت قبلی دیگر معتبر نیست.
   */
  useEffect(() => {
    setSelectedSlot(null);
  }, [isoDate]);

  /*
   * جستجوی بیمار
   */
  const {
    data: patientResults = [],
    isFetching: patientsLoading,
  } = useQuery({
    queryKey: [
      ...queryKeys.patients.lookup(patientQuery),
      clinicSlug,
    ],
    queryFn: () =>
      searchPatients(clinicSlug, patientQuery.trim()),
    enabled:
      patientQuery.trim().length >= 2 && !!clinicSlug,
  });

  /*
   * پزشکان
   * (پزشک نیازی به لیست کل کادر درمانی ندارد، چون خودش قفل است — درست
   * مثل صفحه‌ی تقویم روزانه)
   */
  const { data: doctors = [] } = useQuery({
    queryKey:
      queryKeys.appointmentsCalendar.doctors(clinicSlug),

    queryFn: () => getDoctors(clinicSlug),

    enabled: !!clinicSlug && !isDoctor,
  });

  /*
   * خدمات
   */
  const { data: services = [] } = useQuery({
    queryKey: queryKeys.services.list(clinicSlug),

    queryFn: () =>
      getServicesForBooking(clinicSlug),

    enabled: !!clinicSlug,
  });

  const selectedService = useMemo(
    () =>
      services.find(
        (service) => service.id === serviceId
      ),
    [services, serviceId]
  );

  /*
   * ساعات آزاد پزشک
   */
  const {
    data: rawSlots = [],
    isLoading: slotsLoading,
    error: slotsError,
  } = useQuery({
    queryKey:
      queryKeys.appointmentsCalendar.availability(
        clinicSlug,
        doctorId ?? 0,
        isoDate
      ),

    queryFn: () =>
      getAvailability(clinicSlug, {
        doctorUserId: doctorId!,
        date: isoDate,
        serviceId: serviceId ?? undefined,
      }),

    enabled:
      !!clinicSlug && !!doctorId,
  });

  /*
   * نوبت‌های قبلی پزشک در همان روز
   */
  const {
    data: doctorAppointmentsForDay = [],
  } = useQuery({
    queryKey:
      queryKeys.appointmentsCalendar.list(
        clinicSlug,
        isoDate,
        doctorId ?? undefined
      ),

    queryFn: () =>
      getAppointments(clinicSlug, {
        from: isoDate,
        to: isoDate,
        doctorUserId: doctorId!,
      }),

    enabled:
      !!clinicSlug && !!doctorId,
  });

  const slots = useMemo(
    () =>
      filterBookedSlots(
        rawSlots,
        doctorAppointmentsForDay
      ),
    [rawSlots, doctorAppointmentsForDay]
  );

  /*
   * اگر خدمت یا پزشک تغییر کند،
   * ساعت قبلی دیگر معتبر نیست.
   */
  useEffect(() => {
    setSelectedSlot(null);
  }, [serviceId, doctorId]);

  /*
   * انتخاب پزشک
   */
  const handleDoctorChange = (
    value: string
  ) => {
    setDoctorId(
      value ? Number(value) : null
    );

    setSelectedSlot(null);
    setError(null);
  };

  /*
   * انتخاب خدمت
   */
  const handleServiceChange = (
    value: string
  ) => {
    setServiceId(value || null);

    setSelectedSlot(null);
    setError(null);
  };

  /*
   * ثبت نوبت
   */
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatient) {
        throw new Error(
          "لطفاً مراجع را انتخاب کنید."
        );
      }

      if (!doctorId) {
        throw new Error(
          "لطفاً پزشک را انتخاب کنید."
        );
      }

      if (!serviceId) {
        throw new Error(
          "لطفاً خدمت را انتخاب کنید."
        );
      }

      if (!selectedSlot) {
        throw new Error(
          "لطفاً ساعت نوبت را انتخاب کنید."
        );
      }

      const startTime = buildDateTime(
        isoDate,
        selectedSlot.start
      );

      const endTime = selectedSlot.end
        ? buildDateTime(
          isoDate,
          selectedSlot.end
        )
        : addMinutesToIso(
          startTime,
          selectedService
            ?.defaultDurationMinutes ?? 30
        );

      return createAppointment(
        clinicSlug,
        {
          patient_id: selectedPatient.id,
          doctor_user_id: doctorId,
          service_id: serviceId,
          appointment_type: appointmentType,
          start_time: startTime,
          end_time: endTime,
          notes: notes.trim() || undefined,
        }
      );
    },

    onSuccess: () => {
      setError(null);
      setSuccess(true);

      queryClient.invalidateQueries({
        queryKey: [
          "appointments-calendar",
          clinicSlug,
        ],
      });

      setTimeout(() => {
        router.push(
          `/clinic/${clinicSlug}/calendar`
        );
      }, 1200);
    },

    onError: (e) => {
      setSuccess(false);

      if (
        e instanceof ApiError &&
        e.status === 409
      ) {
        setError(
          "این بازه‌ی زمانی قبلاً برای این پزشک رزرو شده است. لطفاً ساعت دیگری انتخاب کنید."
        );

        setSelectedSlot(null);

        queryClient.invalidateQueries({
          queryKey: [
            "appointments-calendar",
            clinicSlug,
          ],
        });

        queryClient.invalidateQueries({
          queryKey:
            queryKeys.appointmentsCalendar.availability(
              clinicSlug,
              doctorId ?? 0,
              isoDate
            ),
        });

        return;
      }

      setError(
        e instanceof Error
          ? e.message
          : "ثبت نوبت ناموفق بود."
      );
    },
  });

  return (
    <>
      <div className="space-y-4">
        {/* =====================================================
            Breadcrumb
        ====================================================== */}
        <div className="text-xs text-gray-400 dark:text-gray-500">
          <Link
            href={`/clinic/${clinicSlug}/calendar`}
            className="transition hover:text-primary-dark dark:hover:text-primary-light"
          >
            نوبت‌ها
          </Link>

          <span className="mx-1">‹</span>

          <span className="text-gray-600 dark:text-gray-300">
            ثبت نوبت جدید
          </span>
        </div>

        {/* =====================================================
            Title
        ====================================================== */}
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
            <CalendarPlus className="h-5 w-5 text-primary-dark dark:text-primary-light" />

            ثبت نوبت جدید
          </h1>

          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            لطفاً اطلاعات نوبت را تکمیل کنید.
          </p>
        </div>

        {/* =====================================================
            Error
        ====================================================== */}
        {error && (
          <div
            className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-500 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          >
            {error}
          </div>
        )}

        {/* =====================================================
            Success
        ====================================================== */}
        {success && (
          <div
            className={`
              flex items-center gap-1.5
              rounded-xl
              border border-primary-light/20
              bg-primary-light/15
              px-3 py-2.5
              text-xs font-medium
              text-primary-dark
              dark:border-primary-light/20
              dark:bg-primary-light/10
              dark:text-primary-light
            `}
          >
            <Check className="h-3.5 w-3.5" />

            نوبت با موفقیت ثبت شد. در حال انتقال به
            لیست نوبت‌ها...
          </div>
        )}

        {/* =====================================================
            Layout
        ====================================================== */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">

          {/* ===================================================
              SIDEBAR
          ==================================================== */}
          <div className="space-y-4 lg:order-2">

            {/* =================================================
                Calendar
            ================================================== */}
            <div
              className={`
                overflow-hidden
                rounded-2xl
                border border-gray-100
                bg-white
                dark:border-white/10
                dark:bg-white/[0.06]
              `}
            >
              <Calendar
                value={date}
                onChange={(value) => {
                  if (value) {
                    setDate(value);
                    setError(null);
                  }
                }}
                calendar={persian}
                locale={persian_fa}
                shadow={false}
                className="clinic-calendar"
              />
            </div>

            {/* =================================================
                Patient
            ================================================== */}
            <div
              className={`
                rounded-2xl
                border border-gray-100
                bg-white
                p-4
                dark:border-white/10
                dark:bg-white/[0.06]
              `}
            >
              <h3
                className={`
                  mb-3
                  flex items-center gap-1.5
                  text-xs font-bold
                  text-gray-800
                  dark:text-gray-100
                `}
              >
                <UserRound
                  className={`
                    h-4 w-4
                    text-primary-dark
                    dark:text-primary-light
                  `}
                />

                اطلاعات مراجع
              </h3>

              <div className="relative">

                {/* Search */}
                <div
                  className={`
                    flex items-center
                    rounded-xl
                    border border-gray-200
                    bg-white
                    px-3 py-2.5
                    transition
                    focus-within:border-primary
                    dark:border-white/10
                    dark:bg-white/[0.04]
                    dark:focus-within:border-primary-light
                  `}
                >
                  <Search
                    className={`
                      ml-2
                      h-4 w-4
                      shrink-0
                      text-gray-300
                      dark:text-gray-500
                    `}
                  />

                  <input
                    type="text"
                    value={patientQuery}
                    onChange={(e) => {
                      setPatientQuery(
                        e.target.value
                      );

                      setShowPatientResults(true);
                      setSelectedPatient(null);
                    }}
                    onFocus={() =>
                      setShowPatientResults(true)
                    }
                    placeholder="جستجو با نام، موبایل یا کد ملی..."
                    className={`
                      w-full
                      bg-transparent
                      text-xs
                      text-gray-700
                      outline-none
                      placeholder:text-gray-300
                      dark:text-gray-200
                      dark:placeholder:text-gray-600
                    `}
                  />
                </div>

                {/* Search Results */}
                {showPatientResults &&
                  !selectedPatient &&
                  patientQuery.trim().length >= 2 && (
                    <div
                      className={`
                        absolute
                        z-30
                        mt-1
                        max-h-56
                        w-full
                        overflow-y-auto
                        rounded-xl
                        border border-gray-100
                        bg-white
                        p-1
                        shadow-lg
                        dark:border-white/10
                        dark:bg-[#11151c]
                      `}
                    >
                      {patientsLoading && (
                        <div
                          className={`
                            px-3 py-3
                            text-center
                            text-[11px]
                            text-gray-400
                            dark:text-gray-500
                          `}
                        >
                          در حال جستجو...
                        </div>
                      )}

                      {!patientsLoading &&
                        patientResults.length === 0 && (
                          <div
                            className={`
                              px-3 py-3
                              text-center
                              text-[11px]
                              text-gray-400
                              dark:text-gray-500
                            `}
                          >
                            بیماری با این مشخصات پیدا نشد.
                          </div>
                        )}

                      {!patientsLoading &&
                        patientResults.map(
                          (patient) => (
                            <button
                              key={patient.id}
                              type="button"
                              onClick={() => {
                                setSelectedPatient(
                                  patient
                                );

                                setPatientQuery(
                                  patient.fullName
                                );

                                setShowPatientResults(
                                  false
                                );

                                setError(null);
                              }}
                              className={`
                                flex w-full
                                items-center
                                justify-between
                                rounded-lg
                                px-3 py-2.5
                                text-right
                                text-xs
                                transition
                                hover:bg-gray-50
                                dark:hover:bg-white/10
                              `}
                            >
                              <span
                                className={`
                                  font-medium
                                  text-gray-700
                                  dark:text-gray-200
                                `}
                              >
                                {patient.fullName}
                              </span>

                              <span
                                className={`
                                  text-gray-400
                                  dark:text-gray-500
                                `}
                                dir="ltr"
                              >
                                {patient.phone}
                              </span>
                            </button>
                          )
                        )}
                    </div>
                  )}
              </div>

              {/* Selected Patient */}
              {selectedPatient && (
                <div
                  className={`
                    mt-3
                    flex items-center gap-2.5
                    rounded-xl
                    bg-gray-50
                    p-2.5
                    dark:bg-white/[0.05]
                  `}
                >
                  <div
                    className={`
                      flex h-8 w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-primary-light/20
                      text-primary-dark
                      dark:bg-primary-light/10
                      dark:text-primary-light
                    `}
                  >
                    <UserRound className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <div
                      className={`
                        truncate
                        text-xs font-semibold
                        text-gray-800
                        dark:text-gray-100
                      `}
                    >
                      {selectedPatient.fullName}
                    </div>

                    <div
                      className={`
                        text-[10px]
                        text-gray-400
                        dark:text-gray-500
                      `}
                      dir="ltr"
                    >
                      {selectedPatient.phone}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setPatientQuery("");
                    }}
                    className={`
                      mr-auto
                      rounded-lg
                      p-1
                      text-gray-300
                      transition
                      hover:bg-white
                      hover:text-gray-500
                      dark:text-gray-600
                      dark:hover:bg-white/10
                      dark:hover:text-gray-300
                    `}
                    aria-label="حذف مراجع"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* =================================================
                Available Slots
            ================================================== */}
            <div
              className={`
                rounded-2xl
                border border-gray-100
                bg-white
                p-4
                dark:border-white/10
                dark:bg-white/[0.06]
              `}
            >
              <h3
                className={`
                  mb-3
                  flex items-center gap-1.5
                  text-xs font-bold
                  text-gray-800
                  dark:text-gray-100
                `}
              >
                <Clock3
                  className={`
                    h-4 w-4
                    text-primary-dark
                    dark:text-primary-light
                  `}
                />

                ساعت‌های در دسترس
              </h3>

              {!doctorId && (
                <p
                  className={`
                    text-[11px]
                    text-gray-300
                    dark:text-gray-500
                  `}
                >
                  ابتدا پزشک را انتخاب کنید.
                </p>
              )}

              {doctorId && slotsLoading && (
                <p
                  className={`
                    text-[11px]
                    text-gray-300
                    dark:text-gray-500
                  `}
                >
                  در حال دریافت ساعت‌های آزاد...
                </p>
              )}

              {doctorId && slotsError && (
                <p
                  className={`
                    text-[11px]
                    text-danger
                    dark:text-red-300
                  `}
                >
                  دریافت ساعت‌های آزاد ناموفق بود.
                </p>
              )}

              {doctorId &&
                !slotsLoading &&
                !slotsError &&
                slots.length === 0 && (
                  <p
                    className={`
                      text-[11px]
                      text-gray-300
                      dark:text-gray-500
                    `}
                  >
                    ساعت آزادی برای این روز وجود ندارد.
                  </p>
                )}

              {slots.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {slots.map(
                    (slot, index) => {
                      const isSelected =
                        selectedSlot?.start ===
                        slot.start;

                      return (
                        <button
                          key={`${slot.start}-${slot.end ?? index}`}
                          type="button"
                          onClick={() => {
                            setSelectedSlot(
                              slot
                            );

                            setError(null);
                          }}
                          className={`
                            rounded-xl
                            border
                            py-2
                            text-xs
                            transition

                            ${isSelected
                              ? `
                                  border-primary
                                  bg-primary-light/10
                                  font-medium
                                  text-primary-dark
                                  dark:border-primary-light
                                  dark:bg-primary-light/10
                                  dark:text-primary-light
                                `
                              : `
                                  border-gray-200
                                  text-gray-600
                                  hover:border-primary/30
                                  hover:bg-gray-50

                                  dark:border-white/10
                                  dark:text-gray-300
                                  dark:hover:border-primary-light/30
                                  dark:hover:bg-white/10
                                `
                            }
                          `}
                        >
                          {extractTimeLabel(
                            slot.start
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ===================================================
              MAIN
          ==================================================== */}
          <div
            className={`
              space-y-4
              lg:order-1
              lg:col-span-3
            `}
          >

            {/* =================================================
                Appointment Type
            ================================================== */}
            <div
              className={`
                rounded-2xl
                border border-gray-100
                bg-white
                p-5
                dark:border-white/10
                dark:bg-white/[0.06]
              `}
            >
              <h3
                className={`
                  mb-3
                  text-sm font-bold
                  text-gray-800
                  dark:text-gray-100
                `}
              >
                نوع نوبت
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {APPOINTMENT_TYPES.map(
                  (type) => {
                    const Icon = type.icon;

                    const active =
                      appointmentType ===
                      type.key;

                    return (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() =>
                          setAppointmentType(
                            type.key
                          )
                        }
                        className={`
                          flex
                          flex-col
                          items-center
                          gap-2
                          rounded-2xl
                          border
                          p-4
                          text-center
                          transition

                          ${active
                            ? `
                                border-primary
                                bg-primary-light/5

                                dark:border-primary-light
                                dark:bg-primary-light/10
                              `
                            : `
                                border-gray-100
                                hover:border-gray-200
                                hover:bg-gray-50

                                dark:border-white/10
                                dark:hover:border-white/20
                                dark:hover:bg-white/[0.04]
                              `
                          }
                        `}
                      >
                        <div
                          className={`
                            flex h-11 w-11
                            items-center
                            justify-center
                            rounded-full
                            ${type.tone}
                          `}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div
                          className={`
                            text-sm font-semibold
                            text-gray-800
                            dark:text-gray-100
                          `}
                        >
                          {type.title}
                        </div>

                        <div
                          className={`
                            text-[11px]
                            text-gray-400
                            dark:text-gray-500
                          `}
                        >
                          {type.desc}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* =================================================
                Appointment Information
            ================================================== */}
            <div
              className={`
                rounded-2xl
                border border-gray-100
                bg-white
                p-5
                dark:border-white/10
                dark:bg-white/[0.06]
              `}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* =============================================
                    Doctor
                ============================================== */}
                <div>
                  <label
                    className={`
                      mb-1.5
                      block
                      text-xs
                      text-gray-600
                      dark:text-gray-300
                    `}
                  >
                    پزشک / متخصص{" "}
                    <span className="text-danger">
                      *
                    </span>
                  </label>

                  {isDoctor ? (
                    <div
                      className={`
                        flex items-center gap-2
                        rounded-xl
                        border border-gray-200
                        bg-gray-50
                        px-3 py-2.5
                        text-xs
                        text-gray-700
                        dark:border-white/10
                        dark:bg-white/[0.04]
                        dark:text-gray-200
                      `}
                    >
                      <Stethoscope
                        className={`
                          h-3.5 w-3.5
                          shrink-0
                          text-primary-dark
                          dark:text-primary-light
                        `}
                      />
                      <span className="font-medium">
                        {currentUser?.fullName || "شما"}
                      </span>
                      <span className="mr-auto text-[10px] text-gray-400 dark:text-gray-500">
                        (این نوبت برای خودِ شما ثبت می‌شود)
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`
                        flex items-center
                        rounded-xl
                        border border-gray-200
                        bg-white
                        px-3 py-2.5
                        transition
                        focus-within:border-primary
                        dark:border-white/10
                        dark:bg-white/[0.04]
                        dark:focus-within:border-primary-light
                      `}
                    >
                      <Stethoscope
                        className={`
                          ml-2
                          h-3.5 w-3.5
                          shrink-0
                          text-gray-300
                          dark:text-gray-500
                        `}
                      />

                      <select
                        value={doctorId ?? ""}
                        onChange={(e) =>
                          handleDoctorChange(
                            e.target.value
                          )
                        }
                        className={`
                          w-full
                          bg-transparent
                          text-xs
                          text-gray-700
                          outline-none

                          dark:text-gray-200
                          dark:[color-scheme:dark]
                        `}
                      >
                        <option value="">
                          انتخاب پزشک / متخصص
                        </option>

                        {doctors.map(
                          (doctor) => (
                            <option
                              key={doctor.userId}
                              value={doctor.userId}
                            >
                              {doctor.fullName}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  )}
                </div>

                {/* =============================================
                    Service
                ============================================== */}
                <div>
                  <label
                    className={`
                      mb-1.5
                      block
                      text-xs
                      text-gray-600
                      dark:text-gray-300
                    `}
                  >
                    خدمت اصلی{" "}
                    <span className="text-danger">
                      *
                    </span>
                  </label>

                  <div
                    className={`
                      flex items-center
                      rounded-xl
                      border border-gray-200
                      bg-white
                      px-3 py-2.5
                      transition
                      focus-within:border-primary
                      dark:border-white/10
                      dark:bg-white/[0.04]
                      dark:focus-within:border-primary-light
                    `}
                  >
                    <Sparkles
                      className={`
                        ml-2
                        h-3.5 w-3.5
                        shrink-0
                        text-gray-300
                        dark:text-gray-500
                      `}
                    />

                    <select
                      value={serviceId ?? ""}
                      onChange={(e) =>
                        handleServiceChange(
                          e.target.value
                        )
                      }
                      className={`
                        w-full
                        bg-transparent
                        text-xs
                        text-gray-700
                        outline-none

                        dark:text-gray-200
                        dark:[color-scheme:dark]
                      `}
                    >
                      <option value="">
                        انتخاب خدمت
                      </option>

                      {services.map(
                        (service) => (
                          <option
                            key={service.id}
                            value={service.id}
                          >
                            {service.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* =============================================
                    Selected Slot
                ============================================== */}
                <div>
                  <label
                    className={`
                      mb-1.5
                      block
                      text-xs
                      text-gray-600
                      dark:text-gray-300
                    `}
                  >
                    ساعت انتخاب‌شده
                  </label>

                  <div
                    className={`
                      flex min-h-[42px]
                      items-center
                      rounded-xl
                      border border-gray-200
                      bg-white
                      px-3 py-2.5
                      text-xs

                      dark:border-white/10
                      dark:bg-white/[0.04]
                    `}
                  >
                    {selectedSlot ? (
                      <span
                        className={`
                          font-medium
                          text-primary-dark
                          dark:text-primary-light
                        `}
                      >
                        {extractTimeLabel(
                          selectedSlot.start
                        )}

                        {selectedSlot.end &&
                          ` تا ${extractTimeLabel(
                            selectedSlot.end
                          )}`}
                      </span>
                    ) : (
                      <span
                        className={`
                          text-gray-300
                          dark:text-gray-600
                        `}
                      >
                        از ستون کناری انتخاب کنید
                      </span>
                    )}
                  </div>
                </div>

                {/* =============================================
                    Date
                ============================================== */}
                <div>
                  <label
                    className={`
                      mb-1.5
                      block
                      text-xs
                      text-gray-600
                      dark:text-gray-300
                    `}
                  >
                    تاریخ نوبت
                  </label>

                  <div
                    className={`
                      flex min-h-[42px]
                      items-center
                      rounded-xl
                      border border-gray-200
                      bg-white
                      px-3 py-2.5
                      text-xs
                      text-gray-700

                      dark:border-white/10
                      dark:bg-white/[0.04]
                      dark:text-gray-200
                    `}
                  >
                    {date.format(
                      "YYYY/MM/DD"
                    )}
                  </div>
                </div>

                {/* =============================================
                    SMS
                ============================================== */}
                <div className="sm:col-span-2">
                  <label
                    className={`
                      mb-1.5
                      block
                      text-xs
                      text-gray-600
                      dark:text-gray-300
                    `}
                  >
                    یادآوری پیامکی
                  </label>

                  <div
                    className={`
                      flex items-center
                      justify-between
                      rounded-xl
                      border border-gray-200
                      bg-white
                      px-3 py-2.5

                      dark:border-white/10
                      dark:bg-white/[0.04]
                    `}
                  >
                    <span
                      className={`
                        text-[11px]
                        text-gray-400
                        dark:text-gray-500
                      `}
                    >
                      ارسال یادآوری خودکار برای مراجع
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setSmsReminder(
                          (value) => !value
                        )
                      }
                      className={`
                        relative
                        h-5 w-9
                        shrink-0
                        rounded-full
                        transition-colors

                        ${smsReminder
                          ? "bg-primary"
                          : "bg-gray-200 dark:bg-white/10"
                        }
                      `}
                      aria-label="یادآوری پیامکی"
                      aria-pressed={
                        smsReminder
                      }
                    >
                      <span
                        className={`
                          absolute
                          top-0.5
                          h-4 w-4
                          rounded-full
                          bg-white
                          shadow
                          transition-all

                          ${smsReminder
                            ? "right-0.5"
                            : "right-4"
                          }
                        `}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* ===============================================
                  Notes
              ================================================ */}
              <div className="mt-4">
                <label
                  className={`
                    mb-1.5
                    flex items-center gap-1.5
                    text-xs
                    text-gray-600
                    dark:text-gray-300
                  `}
                >
                  <StickyNote
                    className={`
                      h-3.5 w-3.5
                      text-gray-500
                      dark:text-gray-400
                    `}
                  />

                  یادداشت‌ها (اختیاری)
                </label>

                <textarea
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value)
                  }
                  rows={3}
                  placeholder="توضیحات یا نکات مرتبط با این نوبت..."
                  className={`
                    w-full
                    resize-none
                    rounded-xl
                    border border-gray-200
                    bg-white
                    px-3 py-2.5
                    text-xs
                    text-gray-700
                    outline-none
                    transition

                    placeholder:text-gray-300

                    focus:border-primary

                    dark:border-white/10
                    dark:bg-white/[0.04]
                    dark:text-gray-200
                    dark:placeholder:text-gray-600
                    dark:focus:border-primary-light
                  `}
                />
              </div>
            </div>

            {/* =================================================
                Actions
            ================================================== */}
            <div
              className={`
                flex
                flex-col-reverse
                gap-3
                sm:flex-row
                sm:items-center
                sm:justify-between
              `}
            >
              <Link
                href={`/clinic/${clinicSlug}/calendar`}
                className={`
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border border-gray-200
                  bg-white
                  px-6 py-3
                  text-sm
                  text-gray-600
                  transition
                  hover:bg-gray-50

                  dark:border-white/10
                  dark:bg-white/[0.04]
                  dark:text-gray-300
                  dark:hover:bg-white/10
                `}
              >
                <X className="h-4 w-4" />

                انصراف
              </Link>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  createMutation.mutate();
                }}
                disabled={
                  createMutation.isPending ||
                  success
                }
                className={`
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-primary
                  px-8 py-3
                  text-sm
                  font-medium
                  text-white
                  transition

                  hover:bg-primary-dark

                  dark:bg-primary/90
                  dark:hover:bg-primary

                  disabled:cursor-not-allowed
                  disabled:opacity-50
                `}
              >
                <Check className="h-4 w-4" />

                {createMutation.isPending
                  ? "در حال ثبت..."
                  : "ثبت نوبت"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================
          React Multi Date Picker - Dark Theme
      ======================================================== */}
      <style jsx global>{`
        /* =====================================================
           Calendar wrapper
        ====================================================== */

        .clinic-calendar {
          width: 100% !important;
          box-shadow: none !important;
          border: none !important;
          background: transparent !important;
        }

        .clinic-calendar .rmdp-wrapper {
          width: 100% !important;
          box-shadow: none !important;
          border: none !important;
          background: transparent !important;
        }

        .clinic-calendar .rmdp-calendar {
          width: 100% !important;
          background: transparent !important;
        }

        /* =====================================================
           Header
        ====================================================== */

        .clinic-calendar .rmdp-header {
          color: #374151;
        }

        .dark .clinic-calendar .rmdp-header {
          color: #f3f4f6;
        }

        .clinic-calendar .rmdp-header-values {
          color: inherit !important;
        }

        .dark .clinic-calendar .rmdp-header-values {
          color: #f3f4f6 !important;
        }

        /* =====================================================
           Week days
        ====================================================== */

        .clinic-calendar .rmdp-week-day {
          color: #9ca3af !important;
        }

        .dark .clinic-calendar .rmdp-week-day {
          color: #6b7280 !important;
        }

        /* =====================================================
           Normal days
        ====================================================== */

        .clinic-calendar .rmdp-day {
          color: #374151;
        }

        .dark .clinic-calendar .rmdp-day {
          color: #d1d5db;
        }

        .dark .clinic-calendar .rmdp-day span {
          color: #d1d5db;
        }

        /* =====================================================
           Hover
        ====================================================== */

        .clinic-calendar .rmdp-day:not(.rmdp-disabled):not(.rmdp-day-hidden)
          span:hover {
          background: rgba(255, 255, 255, 0.08) !important;
        }

        .dark
          .clinic-calendar
          .rmdp-day:not(.rmdp-disabled):not(.rmdp-day-hidden)
          span:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
        }

        /* =====================================================
           Selected day
        ====================================================== */

        .clinic-calendar .rmdp-day.rmdp-selected span {
          background: var(--color-primary, #14b8a6) !important;
          box-shadow: none !important;
          color: #ffffff !important;
        }

        /* =====================================================
           Today
        ====================================================== */

        .clinic-calendar .rmdp-day.rmdp-today span {
          background: rgba(20, 184, 166, 0.15);
          color: #0f766e;
        }

        .dark .clinic-calendar .rmdp-day.rmdp-today span {
          background: rgba(20, 184, 166, 0.15);
          color: #5eead4;
        }

        /* =====================================================
           Disabled
        ====================================================== */

        .clinic-calendar .rmdp-day.rmdp-disabled span {
          color: #d1d5db !important;
        }

        .dark .clinic-calendar .rmdp-day.rmdp-disabled span {
          color: #4b5563 !important;
        }

        /* =====================================================
           Navigation arrows
        ====================================================== */

        .clinic-calendar .rmdp-arrow-container {
          background: transparent !important;
          box-shadow: none !important;
        }

        .clinic-calendar .rmdp-arrow-container:hover {
          background: #f9fafb !important;
        }

        .dark .clinic-calendar .rmdp-arrow-container:hover {
          background: rgba(255, 255, 255, 0.08) !important;
        }

        .clinic-calendar .rmdp-arrow {
          border-color: #6b7280 !important;
        }

        .dark .clinic-calendar .rmdp-arrow {
          border-color: #9ca3af !important;
        }

        /* =====================================================
           Month / year popup
        ====================================================== */

        .dark .clinic-calendar .rmdp-month-picker,
        .dark .clinic-calendar .rmdp-year-picker {
          background: #11151c !important;
        }

        .dark .clinic-calendar .rmdp-month-picker,
        .dark .clinic-calendar .rmdp-year-picker,
        .dark .clinic-calendar .rmdp-month-picker div,
        .dark .clinic-calendar .rmdp-year-picker div {
          color: #d1d5db !important;
        }

        .dark
          .clinic-calendar
          .rmdp-month-picker
          .rmdp-day.rmdp-selected
          span,
        .dark
          .clinic-calendar
          .rmdp-year-picker
          .rmdp-day.rmdp-selected
          span {
          background: var(--color-primary, #14b8a6) !important;
          color: white !important;
        }
      `}</style>
    </>
  );
}