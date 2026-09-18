import { apiClient, ApiError } from "./client";

interface LaravelEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

function unwrapObject<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in (res as Record<string, unknown>)) {
    return (res as { data: unknown }).data as T;
  }
  return res as T;
}

export interface CurrentClinicUser {
  userId: number | null;
  fullName: string;
  roleKey: "clinic_admin" | "doctor" | "receptionist" | null;
  roleName: string;
  accessScope: "all_patients" | "assigned_patients" | "limited" | null;
}

// فرمت واقعی و تأییدشده‌ی /auth/me: { data: { user: {...}, clinics: [{ id, name, slug,
// pivot: { role_id, access_scope, is_active } }] } }
// نقش فقط به‌صورت role_id عددی می‌آید، نه اسم؛ این mapping بر اساس داده‌های seed
// واقعی که قبلاً از /clinics/current/staff دیده شده استخراج شده است.
const ROLE_ID_TO_KEY: Record<number, CurrentClinicUser["roleKey"]> = {
  2: "clinic_admin",
  3: "doctor",
  4: "receptionist",
};
const ROLE_ID_TO_NAME: Record<number, string> = {
  2: "مدیر کلینیک",
  3: "پزشک",
  4: "منشی / پذیرش",
};

export async function getCurrentClinicUser(clinicSlug: string): Promise<CurrentClinicUser> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>("/auth/me", {
    clinicSlug,
  });
  const data = unwrapObject<Record<string, unknown>>(res);

  const user = (data.user as Record<string, unknown>) ?? {};
  const userId = user.id != null ? Number(user.id) : null;
  const fullName = (user.full_name as string | undefined) ?? "";

  const clinics = (data.clinics as Record<string, unknown>[]) ?? [];
  const currentClinic = clinics.find((c) => c.slug === clinicSlug);
  const pivot = currentClinic?.pivot as Record<string, unknown> | undefined;
  const roleId = pivot?.role_id != null ? Number(pivot.role_id) : null;
  const accessScope =
    (pivot?.access_scope as CurrentClinicUser["accessScope"] | undefined) ?? null;

  return {
    userId,
    fullName,
    roleKey: roleId != null ? (ROLE_ID_TO_KEY[roleId] ?? null) : null,
    roleName: roleId != null ? (ROLE_ID_TO_NAME[roleId] ?? "") : "",
    accessScope,
  };
}

/**
 * مسیر درست داشبورد بر اساس نقش کاربر در کلینیک — بلافاصله بعد از لاگین
 * یا انتخاب کلینیک استفاده می‌شود تا هرکس به داشبورد مخصوص خودش برود.
 */
export function getDashboardPathForRole(clinicSlug: string, roleKey: CurrentClinicUser["roleKey"]): string {
  if (roleKey === "doctor") return `/clinic/${clinicSlug}/dashboard/doctor`;
  if (roleKey === "receptionist") return `/clinic/${clinicSlug}/dashboard/reception`;
  return `/clinic/${clinicSlug}/dashboard`;
}

// --- تغییر رمز عبور — اجباری در اولین ورود با رمز اولیه‌ای که یکی دیگر تعیین کرده ---
// نکته: این از /api/auth/change-password (نه پراکسی عمومی) عبور می‌کند چون علاوه بر
// فوروارد به بک‌اند، کوکی محلی must_change_password را هم بعد از موفقیت پاک می‌کند.
// بعد از موفقیت، سایر نشست‌ها سمت بک‌اند ابطال می‌شوند ولی توکن جاری معتبر می‌ماند —
// نیازی به لاگین مجدد نیست.
export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  const res = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(body?.message ?? "تغییر رمز ناموفق بود", res.status, body?.code);
  }
}