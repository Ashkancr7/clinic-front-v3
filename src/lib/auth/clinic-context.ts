import { cache } from "react";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL ?? "https://api.hessjr.com/api/v1";

export interface ClinicMembership {
  clinicId: string;
  clinicSlug: string;
}

export interface PatientClinicOption {
  id: string;
  slug: string;
  name: string;
}

/**
 * بر اساس clinicSlug موجود در URL، شناسه‌ی UUID کلینیک را از کوکی clinics برمی‌گرداند.
 * این کوکی هنگام لاگین (staff-login یا otp/verify) پر می‌شود.
 * طبق NFR-TENANT-03: این تابع تنها راه رسمی برای گرفتن clinic_id فعال است.
 */
export const getActiveClinic = cache(
  async (clinicSlug: string): Promise<ClinicMembership | null> => {
    const store = await cookies();
    const clinicsRaw = store.get("clinics")?.value;
    const clinics: { id: string; slug: string }[] = clinicsRaw ? JSON.parse(clinicsRaw) : [];

    const match = clinics.find((c) => c.slug === clinicSlug);
    if (!match) return null;

    return { clinicId: match.id, clinicSlug: match.slug };
  }
);

/**
 * لیست کامل کلینیک‌هایی که بیمار در آن‌ها پرونده دارد، به‌همراه نام واقعی هرکدام
 * (نه فقط id/slug که در کوکی ذخیره شده). برای ClinicSwitcher و هدر پنل بیمار.
 * فقط برای بیمار معتبر است — کارکنان کلینیک از /clinics/current/staff می‌آیند، نه اینجا.
 */
export const getPatientClinics = cache(async (): Promise<PatientClinicOption[]> => {
  const store = await cookies();
  const token = store.get("access_token")?.value;
  if (!token) return [];

  try {
    const res = await fetch(`${API_URL}/patient-portal/clinics`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];

    const body = await res.json();
    const records: { clinic: { id: string; slug: string; name: string } }[] = body?.data ?? [];

    return records.map((pc) => ({
      id: pc.clinic.id,
      slug: pc.clinic.slug,
      name: pc.clinic.name,
    }));
  } catch {
    return [];
  }
});