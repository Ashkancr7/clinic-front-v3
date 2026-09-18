import { apiClient } from "./client";

interface LaravelEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === "object") {
    const outer = res as Record<string, unknown>;
    if (Array.isArray(outer.data)) return outer.data as T[];
    if (outer.data && typeof outer.data === "object") {
      const inner = outer.data as Record<string, unknown>;
      if (Array.isArray(inner.data)) return inner.data as T[];
    }
  }
  return [];
}

function unwrapObject<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in (res as Record<string, unknown>)) {
    return (res as { data: unknown }).data as T;
  }
  return res as T;
}

/**
 * ۰=یکشنبه تا ۶=شنبه (مطابق Carbon در بک‌اند)
 */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: "یکشنبه",
  1: "دوشنبه",
  2: "سه‌شنبه",
  3: "چهارشنبه",
  4: "پنجشنبه",
  5: "جمعه",
  6: "شنبه",
};

export interface DoctorSchedule {
  id: string;
  doctorUserId: number;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

function mapDoctorSchedule(s: Record<string, unknown>): DoctorSchedule {
  return {
    id: String(s.id ?? ""),
    doctorUserId: Number(s.doctor_user_id ?? 0),
    weekday: Number(s.weekday ?? 0) as Weekday,
    startTime: (s.start_time as string | undefined) ?? "",
    endTime: (s.end_time as string | undefined) ?? "",
    isActive: s.is_active !== undefined ? Boolean(s.is_active) : true,
  };
}

// --- لیست برنامه‌ی هفتگی پزشکان ---
export async function getDoctorSchedules(clinicSlug: string, doctorUserId?: number): Promise<DoctorSchedule[]> {
  const query = doctorUserId != null ? `?doctor_user_id=${doctorUserId}` : "";
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/doctor-schedules${query}`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapDoctorSchedule);
}

export interface CreateDoctorSchedulePayload {
  doctor_user_id: number;
  weekday: Weekday;
  start_time: string;
  end_time: string;
  is_active?: boolean;
}

// --- افزودن بازه‌ی کاری پزشک در یک روز هفته ---
export async function createDoctorSchedule(
  clinicSlug: string,
  payload: CreateDoctorSchedulePayload
): Promise<DoctorSchedule> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    "/doctor-schedules",
    { method: "POST", body: JSON.stringify(payload), clinicSlug }
  );
  return mapDoctorSchedule(unwrapObject<Record<string, unknown>>(res));
}

export type UpdateDoctorSchedulePayload = Partial<{
  start_time: string;
  end_time: string;
  is_active: boolean;
}>;

// --- ویرایش یا غیرفعال‌کردن یک بازه کاری ---
export async function updateDoctorSchedule(
  clinicSlug: string,
  scheduleId: string,
  payload: UpdateDoctorSchedulePayload
): Promise<DoctorSchedule> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/doctor-schedules/${scheduleId}`,
    { method: "PATCH", body: JSON.stringify(payload), clinicSlug }
  );
  return mapDoctorSchedule(unwrapObject<Record<string, unknown>>(res));
}