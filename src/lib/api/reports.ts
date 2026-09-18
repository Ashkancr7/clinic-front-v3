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
  }
  return [];
}

function unwrapObject<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in (res as Record<string, unknown>)) {
    return (res as { data: unknown }).data as T;
  }
  return res as T;
}

export interface ServiceReportItem {
  serviceId: string;
  name: string;
  totalCount: number;
}

export async function getServicesReport(clinicSlug: string, from: string, to: string): Promise<ServiceReportItem[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/reports/services?from=${from}&to=${to}`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map((s) => {
    const service = s.service as Record<string, unknown> | undefined;
    return {
      serviceId: String(s.service_id ?? ""),
      name: (service?.name as string | undefined) ?? "—",
      totalCount: Number(s.total_count ?? 0),
    };
  });
}

export interface AppointmentStatusItem {
  status: string;
  totalCount: number;
}

export async function getAppointmentsReport(clinicSlug: string, from: string, to: string): Promise<AppointmentStatusItem[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/reports/appointments?from=${from}&to=${to}`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map((a) => ({
    status: String(a.status ?? ""),
    totalCount: Number(a.total_count ?? 0),
  }));
}

export interface PatientsReport {
  newPatients: number;
  activePatients: number;
}

export async function getPatientsReport(clinicSlug: string, from: string, to: string): Promise<PatientsReport> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/reports/patients?from=${from}&to=${to}`,
    { clinicSlug }
  );
  const data = unwrapObject<Record<string, unknown>>(res);
  return {
    newPatients: Number(data.new_patients ?? 0),
    activePatients: Number(data.active_patients ?? 0),
  };
}

export interface DoctorReportItem {
  doctorUserId: number;
  fullName: string;
  completedVisits: number;
}

export async function getDoctorsReport(clinicSlug: string, from: string, to: string): Promise<DoctorReportItem[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/reports/doctors?from=${from}&to=${to}`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map((d) => {
    const doctor = d.doctor as Record<string, unknown> | undefined;
    return {
      doctorUserId: Number(d.doctor_user_id ?? 0),
      fullName: (doctor?.full_name as string | undefined) ?? "—",
      completedVisits: Number(d.completed_visits ?? 0),
    };
  });
}

export async function getReturnRateReport(clinicSlug: string, from: string, to: string): Promise<number> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/reports/return-rate?from=${from}&to=${to}`,
    { clinicSlug }
  );
  const data = unwrapObject<Record<string, unknown>>(res);
  return Number(data.return_rate_percent ?? 0);
}

export interface SmsStatusItem {
  status: string;
  totalCount: number;
}

export async function getSmsReport(clinicSlug: string): Promise<SmsStatusItem[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>("/reports/sms", {
    clinicSlug,
  });
  return unwrapList<Record<string, unknown>>(res).map((s) => ({
    status: String(s.status ?? ""),
    totalCount: Number(s.total_count ?? 0),
  }));
}

export interface FinanceReport {
  totalRevenue: number;
  byMethod: { cash: number; pos: number; online: number };
  outstandingBalance: number;
}

export async function getFinanceReport(clinicSlug: string): Promise<FinanceReport> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>("/reports/finance", {
    clinicSlug,
  });
  const data = unwrapObject<Record<string, unknown>>(res);
  const byMethod = (data.by_method as Record<string, unknown>) ?? {};
  return {
    totalRevenue: Number(data.total_revenue ?? 0),
    byMethod: {
      cash: Number(byMethod.cash ?? 0),
      pos: Number(byMethod.pos ?? 0),
      online: Number(byMethod.online ?? 0),
    },
    outstandingBalance: Number(data.outstanding_balance ?? 0),
  };
}

export type ReportType = "services" | "patients" | "appointments" | "doctors" | "sms" | "finance";

export async function exportReport(clinicSlug: string, reportType: ReportType, from?: string, to?: string): Promise<string> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>("/reports/export", {
    method: "POST",
    body: JSON.stringify({ report_type: reportType, from, to }),
    clinicSlug,
  });
  const data = unwrapObject<Record<string, unknown>>(res);
  return String(data.download_url ?? data.url ?? "");
}