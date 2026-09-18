
import { apiClient } from "./client";

interface LaravelEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/* -------------------------------------------------------------------------- */
/* Response Helpers                                                           */
/* -------------------------------------------------------------------------- */

function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) {
    return res as T[];
  }

  if (res && typeof res === "object") {
    const outer = res as Record<string, unknown>;

    if (Array.isArray(outer.data)) {
      return outer.data as T[];
    }

    if (
      outer.data &&
      typeof outer.data === "object"
    ) {
      const inner =
        outer.data as Record<string, unknown>;

      if (Array.isArray(inner.data)) {
        return inner.data as T[];
      }
    }
  }

  return [];
}

function unwrapObject<T>(res: unknown): T {
  if (
    res &&
    typeof res === "object" &&
    "data" in (res as Record<string, unknown>)
  ) {
    return (res as { data: unknown }).data as T;
  }

  return res as T;
}

/* -------------------------------------------------------------------------- */
/* Appointment Types                                                          */
/* -------------------------------------------------------------------------- */

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "rescheduled"
  | "cancelled"
  | "completed"
  | "no_show";

export interface AppointmentStatusHistory {
  id?: string | number;

  status: AppointmentStatus;

  created_at?: string;
  updated_at?: string;

  created_by?: number | null;

  changed_by?: {
    id?: number;
    full_name?: string;
  } | null;

  reason?: string | null;
  notes?: string | null;

  from_status?: AppointmentStatus | null;
  to_status?: AppointmentStatus | null;
}

export interface AppointmentPatient {
  id: string;

  user_id?: string | null;

  first_name: string;
  last_name: string;

  national_id?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  phone?: string | null;

  emergency_contact?: string | null;
}

export interface AppointmentDoctor {
  id: number;

  full_name: string;

  phone?: string | null;
  email?: string | null;

  avatar_file_id?: string | null;
}

export interface AppointmentService {
  id: string;

  name: string;

  description?: string | null;

  default_duration_minutes?: number;

  base_price?: string | number;
}

export interface CalendarAppointment {
  id: string;

  startTime: string;
  endTime: string;

  patientId: string | null;
  patientName: string;
  patientPhone: string;

  doctorId: number | null;
  doctorName: string;

  serviceName: string;

  appointmentType:
    | "in_person"
    | "online"
    | "followup"
    | string;

  status: AppointmentStatus;

  source: string | null;
  notes: string | null;

  cancellationReason?: string | null;

  patient?: AppointmentPatient | null;

  doctor?: AppointmentDoctor | null;

  service?: AppointmentService | null;

  statusHistory?: AppointmentStatusHistory[];
}

/* -------------------------------------------------------------------------- */
/* Appointment Mapper                                                         */
/* -------------------------------------------------------------------------- */

function mapAppointment(
  a: Record<string, unknown>
): CalendarAppointment {
  const patient =
    a.patient &&
    typeof a.patient === "object"
      ? (a.patient as Record<string, unknown>)
      : undefined;

  const service =
    a.service &&
    typeof a.service === "object"
      ? (a.service as Record<string, unknown>)
      : undefined;

  const doctorSource =
    a.doctor ?? a.doctor_user;

  const doctor =
    doctorSource &&
    typeof doctorSource === "object"
      ? (doctorSource as Record<string, unknown>)
      : undefined;

  return {
    id: String(a.id ?? ""),

    startTime: String(
      a.start_time ?? ""
    ),

    endTime: String(
      a.end_time ?? ""
    ),

    patientId:
      a.patient_id !== null &&
      a.patient_id !== undefined
        ? String(a.patient_id)
        : null,

    patientName:
      patient?.first_name &&
      patient?.last_name
        ? `${String(
            patient.first_name
          )} ${String(
            patient.last_name
          )}`
        : typeof a.patient_name ===
            "string"
          ? a.patient_name
          : "بیمار",

    patientPhone:
      patient?.phone !== null &&
      patient?.phone !== undefined
        ? String(patient.phone)
        : "",

    serviceName:
      typeof service?.name ===
      "string"
        ? service.name
        : typeof a.service_name ===
            "string"
          ? a.service_name
          : "-",

    doctorId:
      a.doctor_user_id !== null &&
      a.doctor_user_id !== undefined
        ? Number(a.doctor_user_id)
        : doctor?.id !== null &&
            doctor?.id !== undefined
          ? Number(doctor.id)
          : null,

    doctorName:
      typeof doctor?.full_name ===
      "string"
        ? doctor.full_name
        : typeof a.doctor_name ===
            "string"
          ? a.doctor_name
          : "-",

    appointmentType:
      typeof a.appointment_type ===
      "string"
        ? (a.appointment_type as CalendarAppointment["appointmentType"])
        : "in_person",

    status:
      typeof a.status ===
      "string"
        ? (a.status as AppointmentStatus)
        : "pending",

    source:
      a.source !== null &&
      a.source !== undefined
        ? String(a.source)
        : null,

    notes:
      a.notes !== null &&
      a.notes !== undefined
        ? String(a.notes)
        : null,

    cancellationReason:
      a.cancellation_reason !==
        null &&
      a.cancellation_reason !==
        undefined
        ? String(
            a.cancellation_reason
          )
        : null,

    patient: patient
      ? {
          id: String(
            patient.id ?? ""
          ),

          user_id:
            patient.user_id !==
              null &&
            patient.user_id !==
              undefined
              ? String(
                  patient.user_id
                )
              : null,

          first_name: String(
            patient.first_name ?? ""
          ),

          last_name: String(
            patient.last_name ?? ""
          ),

          national_id:
            patient.national_id !==
              null &&
            patient.national_id !==
              undefined
              ? String(
                  patient.national_id
                )
              : null,

          birth_date:
            patient.birth_date !==
              null &&
            patient.birth_date !==
              undefined
              ? String(
                  patient.birth_date
                )
              : null,

          gender:
            patient.gender !==
              null &&
            patient.gender !==
              undefined
              ? String(
                  patient.gender
                )
              : null,

          phone:
            patient.phone !==
              null &&
            patient.phone !==
              undefined
              ? String(
                  patient.phone
                )
              : null,

          emergency_contact:
            patient.emergency_contact !==
              null &&
            patient.emergency_contact !==
              undefined
              ? String(
                  patient.emergency_contact
                )
              : null,
        }
      : null,

    doctor: doctor
      ? {
          id: Number(
            doctor.id ?? 0
          ),

          full_name: String(
            doctor.full_name ?? ""
          ),

          phone:
            doctor.phone !==
              null &&
            doctor.phone !==
              undefined
              ? String(
                  doctor.phone
                )
              : null,

          email:
            doctor.email !==
              null &&
            doctor.email !==
              undefined
              ? String(
                  doctor.email
                )
              : null,

          avatar_file_id:
            doctor.avatar_file_id !==
              null &&
            doctor.avatar_file_id !==
              undefined
              ? String(
                  doctor.avatar_file_id
                )
              : null,
        }
      : null,

    service: service
      ? {
          id: String(
            service.id ?? ""
          ),

          name: String(
            service.name ?? ""
          ),

          description:
            service.description !==
              null &&
            service.description !==
              undefined
              ? String(
                  service.description
                )
              : null,

          default_duration_minutes:
            service.default_duration_minutes !==
              null &&
            service.default_duration_minutes !==
              undefined
              ? Number(
                  service.default_duration_minutes
                )
              : 0,

          base_price:
            typeof service.base_price ===
                "string" ||
            typeof service.base_price ===
                "number"
              ? service.base_price
              : 0,
        }
      : null,

    statusHistory:
      Array.isArray(
        a.status_history
      )
        ? (a.status_history as AppointmentStatusHistory[])
        : [],
  };
}

/* -------------------------------------------------------------------------- */
/* Get Appointments                                                           */
/* -------------------------------------------------------------------------- */

interface AppointmentsQueryParams {
  from?: string;
  to?: string;
  doctorUserId?: number;
  status?: string;
}

/*
 * ساخت query string مشترک بین getAppointments و getAllAppointments
 * تا منطق from/to/doctor_user_id/status یک‌جا نگه‌داری شود.
 */
function buildAppointmentsQuery(
  params: AppointmentsQueryParams,
  page?: number
): URLSearchParams {
  const query = new URLSearchParams();

  if (params.from) {
    query.set("from", params.from);
  }

  /*
   * بعضی پیاده‌سازی‌های بک‌اند
   * بازه‌ی to را به صورت exclusive
   * در نظر می‌گیرند.
   *
   * بنابراین یک روز به to اضافه می‌کنیم
   * تا تمام نوبت‌های همان روز نیز
   * دریافت شوند.
   */
  if (params.to) {
    const toDate = new Date(`${params.to}T00:00:00`);

    if (!Number.isNaN(toDate.getTime())) {
      toDate.setDate(toDate.getDate() + 1);
      query.set("to", toLocalIsoDate(toDate));
    }
  }

  if (params.doctorUserId !== undefined && params.doctorUserId !== null) {
    query.set("doctor_user_id", String(params.doctorUserId));
  }

  if (params.status) {
    query.set("status", params.status);
  }

  if (page !== undefined) {
    query.set("page", String(page));
  }

  return query;
}

export async function getAppointments(
  clinicSlug: string,
  params: AppointmentsQueryParams = {}
): Promise<CalendarAppointment[]> {
  const queryString = buildAppointmentsQuery(params).toString();

  const url = queryString
    ? `/appointments?${queryString}`
    : "/appointments";

  const res = await apiClient<
    LaravelEnvelope<
      Record<string, unknown>[]
    > |
      Record<string, unknown>[]
  >(url, {
    clinicSlug,
  });

  return unwrapList<
    Record<string, unknown>
  >(res).map(mapAppointment);
}

/* -------------------------------------------------------------------------- */
/* Get ALL Appointments (همه‌ی صفحات)                                         */
/* -------------------------------------------------------------------------- */

/*
 * طبق مستندات، GET /appointments پاسخ صفحه‌بندی‌شده برمی‌گرداند.
 * getAppointments فقط یک صفحه را می‌گیرد — برای مواردی که واقعاً به
 * «همه‌ی نتایج» نیاز داریم (مثلاً پیدا کردن همه‌ی مراجعینِ یک پزشک برای
 * محدودسازی دسترسی در useDoctorPatientScope)، این تابع تمام صفحات را
 * پشت سر هم می‌گیرد.
 *
 * - اگر بک‌اند متادیتای صفحه‌بندی (current_page/last_page) برگرداند، دقیقاً
 *   تا last_page ادامه می‌دهیم.
 * - اگر متادیتا نبود، تا وقتی صفحه‌ی جدید آیتم تازه (id جدید) بدهد ادامه
 *   می‌دهیم؛ به محض تکراری بودن کامل یک صفحه (یعنی بک‌اند اصلاً به page
 *   واکنش نشان نداده) متوقف می‌شویم.
 * - maxPages یک سقف ایمنی است تا در هیچ حالتی حلقه‌ی بی‌نهایت نشود.
 */
function extractAppointmentsPaginationMeta(
  res: unknown
): { currentPage: number; lastPage: number } | null {
  if (!res || typeof res !== "object") return null;

  const outer = res as Record<string, unknown>;
  const candidate =
    outer.data && typeof outer.data === "object" && !Array.isArray(outer.data)
      ? (outer.data as Record<string, unknown>)
      : outer;

  const currentPage = candidate.current_page;
  const lastPage = candidate.last_page;

  if (typeof currentPage === "number" && typeof lastPage === "number") {
    return { currentPage, lastPage };
  }

  return null;
}

export async function getAllAppointments(
  clinicSlug: string,
  params: AppointmentsQueryParams = {},
  maxPages = 50
): Promise<CalendarAppointment[]> {
  const all: CalendarAppointment[] = [];
  const seenIds = new Set<string>();
  let page = 1;

  while (page <= maxPages) {
    const queryString = buildAppointmentsQuery(params, page).toString();

    const res = await apiClient<
      LaravelEnvelope<
        Record<string, unknown>[]
      > |
        Record<string, unknown>[]
    >(`/appointments?${queryString}`, {
      clinicSlug,
    });

    const pageItems = unwrapList<Record<string, unknown>>(res).map(mapAppointment);
    const newItems = pageItems.filter((item) => !seenIds.has(item.id));

    if (newItems.length === 0) break;

    newItems.forEach((item) => seenIds.add(item.id));
    all.push(...newItems);

    const meta = extractAppointmentsPaginationMeta(res);
    if (meta && meta.currentPage >= meta.lastPage) break;
    if (!meta && pageItems.length === 0) break;

    page += 1;
  }

  return all;
}

/* -------------------------------------------------------------------------- */
/* Appointment Detail                                                         */
/* -------------------------------------------------------------------------- */

export async function getAppointmentDetail(
  clinicSlug: string,
  appointmentId: string
): Promise<CalendarAppointment> {
  const res =
    await apiClient<
      LaravelEnvelope<
        Record<string, unknown>
      > |
        Record<string, unknown>
    >(
      `/appointments/${appointmentId}`,
      {
        clinicSlug,
      }
    );

  return mapAppointment(
    unwrapObject<
      Record<string, unknown>
    >(res)
  );
}

/* -------------------------------------------------------------------------- */
/* Create Appointment                                                         */
/* -------------------------------------------------------------------------- */

export interface CreateAppointmentPayload {
  patient_id: string;

  doctor_user_id: number;

  service_id?: string;
  service_option_id?: string;

  appointment_type:
    | "in_person"
    | "online"
    | "followup";

  start_time: string;
  end_time: string;

  notes?: string;
}

export async function createAppointment(
  clinicSlug: string,
  payload: CreateAppointmentPayload
): Promise<Record<string, unknown>> {
  const res =
    await apiClient<
      LaravelEnvelope<
        Record<string, unknown>
      > |
        Record<string, unknown>
    >("/appointments", {
      method: "POST",
      body: JSON.stringify(
        payload
      ),
      clinicSlug,
    });

  return unwrapObject<
    Record<string, unknown>
  >(res);
}

/* -------------------------------------------------------------------------- */
/* Update Appointment                                                         */
/* -------------------------------------------------------------------------- */

export type UpdateAppointmentPayload =
  Partial<{
    doctor_user_id: number;

    service_id: string;
    service_option_id: string;

    appointment_type:
      | "in_person"
      | "online"
      | "followup";

    notes: string;
  }>;

/*
 * ویرایش اطلاعات نوبت:
 * - پزشک
 * - خدمت
 * - گزینه خدمت
 * - نوع نوبت
 * - یادداشت
 *
 * برای تغییر زمان از
 * rescheduleAppointment استفاده کنید.
 */

export async function updateAppointment(
  clinicSlug: string,
  appointmentId: string,
  payload: UpdateAppointmentPayload
): Promise<CalendarAppointment> {
  const res =
    await apiClient<
      LaravelEnvelope<
        Record<string, unknown>
      > |
        Record<string, unknown>
    >(
      `/appointments/${appointmentId}`,
      {
        method: "PATCH",
        body: JSON.stringify(
          payload
        ),
        clinicSlug,
      }
    );

  return mapAppointment(
    unwrapObject<
      Record<string, unknown>
    >(res)
  );
}

/* -------------------------------------------------------------------------- */
/* Reschedule                                                                 */
/* -------------------------------------------------------------------------- */

export async function rescheduleAppointment(
  clinicSlug: string,
  appointmentId: string,
  payload: {
    start_time: string;
    end_time: string;
    reason?: string;
  }
) {
  return apiClient(
    `/appointments/${appointmentId}/reschedule`,
    {
      method: "POST",
      body: JSON.stringify(
        payload
      ),
      clinicSlug,
    }
  );
}

/* -------------------------------------------------------------------------- */
/* Cancel                                                                     */
/* -------------------------------------------------------------------------- */

export async function cancelAppointment(
  clinicSlug: string,
  appointmentId: string,
  reason: string
) {
  return apiClient(
    `/appointments/${appointmentId}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({
        reason,
      }),
      clinicSlug,
    }
  );
}

/* -------------------------------------------------------------------------- */
/* Complete                                                                   */
/* -------------------------------------------------------------------------- */

export async function completeAppointment(
  clinicSlug: string,
  appointmentId: string
) {
  return apiClient(
    `/appointments/${appointmentId}/complete`,
    {
      method: "POST",
      clinicSlug,
    }
  );
}

/* -------------------------------------------------------------------------- */
/* No Show                                                                    */
/* -------------------------------------------------------------------------- */

export async function markNoShow(
  clinicSlug: string,
  appointmentId: string
) {
  return apiClient(
    `/appointments/${appointmentId}/no-show`,
    {
      method: "POST",
      clinicSlug,
    }
  );
}

/* -------------------------------------------------------------------------- */
/* Reminder                                                                   */
/* -------------------------------------------------------------------------- */

export async function sendAppointmentReminder(
  clinicSlug: string,
  appointmentId: string
) {
  return apiClient(
    `/appointments/${appointmentId}/reminders/send`,
    {
      method: "POST",
      clinicSlug,
    }
  );
}

/* -------------------------------------------------------------------------- */
/* Availability                                                               */
/* -------------------------------------------------------------------------- */

export interface AvailabilitySlot {
  start: string;
  end: string;
}

export async function getAvailability(
  clinicSlug: string,
  params: {
    doctorUserId: number;
    date: string;
    serviceId?: string;
  }
): Promise<AvailabilitySlot[]> {
  const query =
    new URLSearchParams({
      doctor_user_id: String(
        params.doctorUserId
      ),
      date: params.date,
    });

  if (params.serviceId) {
    query.set(
      "service_id",
      params.serviceId
    );
  }

  const res =
    await apiClient<
      LaravelEnvelope<
        Record<string, unknown>[]
      > |
        Record<string, unknown>[]
    >(
      `/appointments/availability?${query.toString()}`,
      {
        clinicSlug,
      }
    );

  return unwrapList<
    Record<string, unknown>
  >(res).map((slot) => ({
    start: String(
      slot.start ??
        slot.start_time ??
        ""
    ),

    end: String(
      slot.end ??
        slot.end_time ??
        ""
    ),
  }));
}

/* -------------------------------------------------------------------------- */
/* Doctors                                                                    */
/* -------------------------------------------------------------------------- */

export interface DoctorOption {
  userId: number;
  fullName: string;
}

/*
 * دریافت پزشکان از لیست کارکنان کلینیک
 *
 * فقط کارکنانی که:
 *
 * role.key === "doctor"
 *
 * دارند به عنوان پزشک برگردانده می‌شوند.
 */

export async function getDoctors(
  clinicSlug: string
): Promise<DoctorOption[]> {
  const res =
    await apiClient<
      LaravelEnvelope<
        Record<string, unknown>[]
      > |
        Record<string, unknown>[]
    >(
      "/clinics/current/staff",
      {
        clinicSlug,
      }
    );

  const staff =
    unwrapList<
      Record<string, unknown>
    >(res);

  return staff
    .filter((member) => {
      const role =
        member.role &&
        typeof member.role ===
          "object"
          ? (member.role as Record<
              string,
              unknown
            >)
          : undefined;

      return role?.key ===
        "doctor";
    })
    .map((member) => {
      const user =
        member.user &&
        typeof member.user ===
          "object"
          ? (member.user as Record<
              string,
              unknown
            >)
          : undefined;

      return {
        userId: Number(
          member.user_id ??
            user?.id ??
            0
        ),

        fullName:
          typeof user?.full_name ===
          "string"
            ? user.full_name
            : "پزشک",
      };
    })
    .filter(
      (doctor) =>
        Number.isFinite(
          doctor.userId
        ) &&
        doctor.userId > 0
    );
}

/* -------------------------------------------------------------------------- */
/* Services                                                                   */
/* -------------------------------------------------------------------------- */

export interface ServiceOption {
  id: string;
  name: string;
  defaultDurationMinutes: number;
}

export async function getServicesForBooking(
  clinicSlug: string
): Promise<ServiceOption[]> {
  const res =
    await apiClient<
      LaravelEnvelope<
        Record<string, unknown>[]
      > |
        Record<string, unknown>[]
    >("/services?active=true", {
      clinicSlug,
    });

  return unwrapList<
    Record<string, unknown>
  >(res)
    .map((service) => ({
      id: String(
        service.id ?? ""
      ),

      name: String(
        service.name ?? ""
      ),

      defaultDurationMinutes:
        service.default_duration_minutes !==
          null &&
        service.default_duration_minutes !==
          undefined
          ? Number(
              service.default_duration_minutes
            )
          : 30,
    }))
    .filter(
      (service) =>
        service.id.length > 0 &&
        service.name.length > 0
    );
}

/* -------------------------------------------------------------------------- */
/* Date / Time Helpers                                                        */
/* -------------------------------------------------------------------------- */

export function addMinutesToIso(
  iso: string,
  minutes: number
): string {
  const d = new Date(iso);

  if (
    Number.isNaN(
      d.getTime()
    )
  ) {
    throw new Error(
      `تاریخ ISO نامعتبر است: "${iso}"`
    );
  }

  d.setMinutes(
    d.getMinutes() + minutes
  );

  return d.toISOString();
}

/**
 * رشته‌ی ساعت را که ممکن است
 * در چند فرمت مختلف از بک‌اند
 * دریافت شود به ISO تبدیل می‌کند.
 *
 * پشتیبانی:
 *
 * 2026-08-23T09:00:00
 *
 * 2026-08-23 09:00:00
 *
 * 09:00:00 2026-08-23
 *
 * 09:00
 *
 * 09:00:00
 */

export function buildDateTime(
  dateIso: string,
  time: string
): string {
  const trimmed =
    time.trim();

  /* ---------------------------------------------------------------------- */
  /* ISO کامل                                                               */
  /* ---------------------------------------------------------------------- */

  if (trimmed.includes("T")) {
    const d = new Date(
      trimmed
    );

    if (
      !Number.isNaN(
        d.getTime()
      )
    ) {
      return d.toISOString();
    }
  }

  /* ---------------------------------------------------------------------- */
  /* datetime با فاصله                                                      */
  /* ---------------------------------------------------------------------- */

  if (trimmed.includes(" ")) {
    const parts =
      trimmed
        .split(" ")
        .filter(Boolean);

    const datePart =
      parts.find((part) =>
        /^\d{4}-\d{2}-\d{2}$/.test(
          part
        )
      );

    const timePart =
      parts.find((part) =>
        /^\d{2}:\d{2}(:\d{2})?$/.test(
          part
        )
      );

    if (
      datePart &&
      timePart
    ) {
      const normalizedTime =
        timePart.length === 5
          ? `${timePart}:00`
          : timePart;

      const d = new Date(
        `${datePart}T${normalizedTime}`
      );

      if (
        !Number.isNaN(
          d.getTime()
        )
      ) {
        return d.toISOString();
      }
    }
  }

  /* ---------------------------------------------------------------------- */
  /* فقط ساعت                                                                */
  /* ---------------------------------------------------------------------- */

  const normalizedTime =
    trimmed.length === 5
      ? `${trimmed}:00`
      : trimmed;

  const d = new Date(
    `${dateIso}T${normalizedTime}`
  );

  if (
    !Number.isNaN(
      d.getTime()
    )
  ) {
    return d.toISOString();
  }

  throw new Error(
    `فرمت ساعت قابل تشخیص نیست: "${time}"`
  );
}

/**
 * استخراج HH:mm از مقدار خام
 */
export function extractTimeLabel(
  raw: string
): string {
  const match =
    raw.match(
      /(\d{2}:\d{2})(:\d{2})?/
    );

  return match
    ? match[1]
    : raw;
}

/**
 * تبدیل Date به YYYY-MM-DD
 * بر اساس timezone محلی مرورگر
 *
 * از toISOString استفاده نمی‌کنیم
 * چون ممکن است تاریخ را یک روز
 * جابه‌جا کند.
 */

export function toLocalIsoDate(
  d: Date
): string {
  const y =
    d.getFullYear();

  const m =
    String(
      d.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      d.getDate()
    ).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

/* -------------------------------------------------------------------------- */
/* Time Helpers                                                               */
/* -------------------------------------------------------------------------- */

function getLocalHourMinute(
  iso: string
): string {
  const date =
    new Date(iso);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleTimeString(
    "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  );
}

/* -------------------------------------------------------------------------- */
/* Filter Booked Slots                                                        */
/* -------------------------------------------------------------------------- */

/**
 * چون endpoint availability ممکن است
 * نوبت‌های رزروشده را از لیست حذف نکند،
 * این تابع یک لایه دفاعی سمت فرانت است.
 *
 * نوبت‌های cancelled و no_show
 * آزاد محسوب می‌شوند.
 */

export function filterBookedSlots(
  slots: AvailabilitySlot[],
  existingAppointments: CalendarAppointment[]
): AvailabilitySlot[] {
  const bookedTimes =
    new Set(
      existingAppointments
        .filter(
          (appointment) =>
            appointment.status !==
              "cancelled" &&
            appointment.status !==
              "no_show"
        )
        .map((appointment) =>
          getLocalHourMinute(
            appointment.startTime
          )
        )
        .filter(Boolean)
    );

  return slots.filter(
    (slot) =>
      !bookedTimes.has(
        extractTimeLabel(
          slot.start
        )
      )
  );
}

/* -------------------------------------------------------------------------- */
/* Duration                                                                   */
/* -------------------------------------------------------------------------- */

export function formatDurationMinutes(
  startIso: string,
  endIso: string
): number | null {
  if (
    !startIso ||
    !endIso
  ) {
    return null;
  }

  const start =
    new Date(
      startIso
    ).getTime();

  const end =
    new Date(
      endIso
    ).getTime();

  if (
    Number.isNaN(start) ||
    Number.isNaN(end)
  ) {
    return null;
  }

  const diff =
    (end - start) /
    60000;

  return Number.isFinite(
    diff
  ) && diff > 0
    ? Math.round(diff)
    : null;
}

