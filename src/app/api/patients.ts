import { apiClient } from "./client";

export interface PatientLookupResult {
  patientId: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  birthDate: string;
}

/**
 * چک می‌کند آیا این شماره موبایل قبلاً در سامانه (در هر کلینیکی) ثبت شده.
 * اگر بله، اطلاعات پایه (پرونده مرکزی) برمی‌گردد تا در فرم پذیرش کلینیک جدید prefill شود.
 * این تماس سراسری است و به clinicSlug وابسته نیست.
 */
export async function lookupPatientByPhone(phone: string) {
  return apiClient<PatientLookupResult | null>(`/patients/lookup?phone=${phone}`);
}

export interface PatientListItem {
  patientId: string;
  patientCode: string; // کد اختصاصی بیمار در همین کلینیک (از patient_clinics)
  fullName: string;
  lastVisitAt: string | null;
}

export async function getPatients(clinicSlug: string, search?: string) {
  return apiClient<PatientListItem[]>(
    `/patients${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    { clinicSlug }
  );
}
