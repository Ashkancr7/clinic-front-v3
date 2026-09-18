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

export interface StaffMember {
  userId: number;
  fullName: string;
  phone: string;
  roleId: number | null;
  roleKey: string;
  roleName: string;
  accessScope: "all_patients" | "assigned_patients" | "limited" | null;
  isActive: boolean;
}

function mapStaffMember(s: Record<string, unknown>): StaffMember {
  const user = s.user as Record<string, unknown> | undefined;
  const role = s.role as Record<string, unknown> | undefined;
  return {
    userId: Number(s.user_id ?? user?.id ?? 0),
    fullName: (user?.full_name as string | undefined) ?? "",
    phone: (user?.phone as string | undefined) ?? "",
    roleId: role?.id != null ? Number(role.id) : null,
    roleKey: (role?.key as string | undefined) ?? "",
    roleName: (role?.name as string | undefined) ?? "",
    accessScope: (s.access_scope as StaffMember["accessScope"]) ?? null,
    isActive: Boolean(s.is_active),
  };
}

export async function getStaffMembers(clinicSlug: string): Promise<StaffMember[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    "/clinics/current/staff",
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapStaffMember);
}

export interface CreateStaffPayload {
  full_name: string;
  phone: string;
  role_id: number;
  access_scope: "all_patients" | "assigned_patients" | "limited";
  /**
   * رمز اولیه؛ فقط زمانی لازم است که این شماره هنوز حساب کارمندی نداشته
   * باشد. اگر شماره از قبل حساب کارمندی دارد (نقش دوم)، نباید ارسال شود —
   * رمز فعلی کاربر دست‌نخورده می‌ماند. اگر شماره جدید باشد و ارسال نشود،
   * بک‌اند خطای 422 با کد PASSWORD_REQUIRED برمی‌گرداند.
   */
  password?: string;
}

// --- دعوت / افزودن کارمند جدید به کلینیک ---
export async function createStaffMember(clinicSlug: string, payload: CreateStaffPayload): Promise<StaffMember> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    "/clinics/current/staff",
    { method: "POST", body: JSON.stringify(payload), clinicSlug }
  );
  const data =
    res && typeof res === "object" && "data" in (res as Record<string, unknown>)
      ? (res as { data: Record<string, unknown> }).data
      : (res as Record<string, unknown>);
  return mapStaffMember(data);
}

export interface UpdateStaffPayload {
  role_id?: number;
  access_scope?: "all_patients" | "assigned_patients" | "limited";
  is_active?: boolean;
}

// --- ویرایش نقش/سطح دسترسی/وضعیت یک کارمند ---
export async function updateStaffMember(
  clinicSlug: string,
  userId: number,
  payload: UpdateStaffPayload
): Promise<StaffMember> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/clinics/current/staff/${userId}`,
    { method: "PATCH", body: JSON.stringify(payload), clinicSlug }
  );
  const data =
    res && typeof res === "object" && "data" in (res as Record<string, unknown>)
      ? (res as { data: Record<string, unknown> }).data
      : (res as Record<string, unknown>);
  return mapStaffMember(data);
}

// --- لغو دسترسی کارمند به این کلینیک (بدون حذف حساب کاربری) ---
export async function removeStaffAccess(clinicSlug: string, userId: number) {
  return apiClient(`/clinics/current/staff/${userId}`, { method: "DELETE", clinicSlug });
}

export interface AssignedDoctor {
  id: string;
  doctorUserId: number;
  doctorName: string;
  doctorPhone: string | null;
  isActive: boolean;
}

function mapAssignedDoctor(a: Record<string, unknown>): AssignedDoctor {
  const doctor = a.doctor as Record<string, unknown> | undefined;
  return {
    id: String(a.id ?? ""),
    doctorUserId: Number(a.doctor_user_id ?? doctor?.id ?? 0),
    doctorName: (doctor?.full_name as string | undefined) ?? "پزشک",
    doctorPhone: (doctor?.phone as string | undefined) ?? null,
    isActive: Boolean(a.is_active ?? true),
  };
}

// --- لیست پزشکان تخصیص‌یافته به یک منشی ---
export async function getAssignedDoctors(clinicSlug: string, userId: number): Promise<AssignedDoctor[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/clinics/current/staff/${userId}/assigned-doctors`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapAssignedDoctor);
}

// --- تخصیص یک پزشک به منشی ---
export async function assignDoctorToStaff(clinicSlug: string, userId: number, doctorUserId: number) {
  return apiClient(`/clinics/current/staff/${userId}/assigned-doctors`, {
    method: "POST",
    body: JSON.stringify({ doctor_user_id: doctorUserId }),
    clinicSlug,
  });
}

// --- لغو تخصیص پزشک از منشی ---
export async function unassignDoctorFromStaff(clinicSlug: string, userId: number, doctorId: number) {
  return apiClient(`/clinics/current/staff/${userId}/assigned-doctors/${doctorId}`, {
    method: "DELETE",
    clinicSlug,
  });
}

// --- لیست پزشکان تخصیص‌یافته به منشیِ کاربر جاری (برای منوی سوییچ دکتر) ---
export async function getMyAssignedDoctors(clinicSlug: string): Promise<AssignedDoctor[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    "/clinics/current/my-assigned-doctors",
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapAssignedDoctor);
}