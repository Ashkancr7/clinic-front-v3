
import { apiClient } from "./client";

/**
 * پاسخ استاندارد Laravel
 */
interface LaravelEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * تبدیل پاسخ لیست
 */
function unwrapList<T>(res: unknown): T[] {
  // اگر خود response آرایه باشد
  if (Array.isArray(res)) {
    return res as T[];
  }

  // اگر response به صورت { data: [...] } باشد
  if (res && typeof res === "object") {
    const outer = res as Record<string, unknown>;

    if (Array.isArray(outer.data)) {
      return outer.data as T[];
    }
  }

  return [];
}

/**
 * تبدیل پاسخ object
 */
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

/**
 * مدل ماژول کلینیک
 */
export interface ClinicModule {
  id: string;
  clinicId: string;
  moduleKey: string;
  isEnabled: boolean;
}

/**
 * تبدیل اطلاعات API به مدل فرانت‌اند
 */
function mapModule(
  module: Record<string, unknown>
): ClinicModule {
  return {
    id: String(module.id ?? ""),
    clinicId: String(module.clinic_id ?? ""),
    moduleKey: String(module.module_key ?? ""),
    isEnabled: Boolean(module.is_enabled),
  };
}

/**
 * =========================================================
 * Super Admin - Clinic Modules
 * =========================================================
 */

/**
 * دریافت لیست تمام ماژول‌های یک کلینیک
 *
 * GET
 * /super-admin/clinics/{clinic}/modules
 */
export async function getClinicModulesByClinicId(
  clinicId: string
): Promise<ClinicModule[]> {
  const res = await apiClient<
    | LaravelEnvelope<Record<string, unknown>[]>
    | Record<string, unknown>[]
  >(`/super-admin/clinics/${clinicId}/modules`);

  return unwrapList<Record<string, unknown>>(res).map(mapModule);
}

/**
 * فعال یا غیرفعال کردن یک ماژول برای یک کلینیک
 *
 * PATCH
 * /super-admin/clinics/{clinic}/modules/{moduleKey}
 */
export async function updateClinicModuleByClinicId(
  clinicId: string,
  moduleKey: string,
  isEnabled: boolean
): Promise<ClinicModule> {
  const res = await apiClient<
    | LaravelEnvelope<Record<string, unknown>>
    | Record<string, unknown>
  >(`/super-admin/clinics/${clinicId}/modules/${moduleKey}`, {
    method: "PATCH",
    body: JSON.stringify({
      is_enabled: isEnabled,
    }),
  });

  return mapModule(
    unwrapObject<Record<string, unknown>>(res)
  );
}

