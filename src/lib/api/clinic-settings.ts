import { apiClient } from "./client";

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

export interface ClinicSettings {
  timezone: string;
  calendarType: "jalali" | "gregorian";
  defaultLanguage: string;
  intakeLinkEnabled: boolean;
  qrEnabled: boolean;
  patientPortalEnabled: boolean;
  smsEnabled: boolean;
  videoEnabled: boolean;
  chatEnabled: boolean;
}

function mapSettings(s: Record<string, unknown>): ClinicSettings {
  return {
    timezone: String(s.timezone ?? "Asia/Tehran"),
    calendarType: (s.calendar_type as ClinicSettings["calendarType"]) ?? "jalali",
    defaultLanguage: String(s.default_language ?? "fa"),
    intakeLinkEnabled: Boolean(s.intake_link_enabled),
    qrEnabled: Boolean(s.qr_enabled),
    patientPortalEnabled: Boolean(s.patient_portal_enabled),
    smsEnabled: Boolean(s.sms_enabled),
    videoEnabled: Boolean(s.video_enabled),
    chatEnabled: Boolean(s.chat_enabled),
  };
}

export async function getClinicSettings(clinicSlug: string): Promise<ClinicSettings> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    "/clinics/current/settings",
    { clinicSlug }
  );
  return mapSettings(unwrapObject<Record<string, unknown>>(res));
}

export interface UpdateClinicSettingsPayload {
  timezone?: string;
  calendar_type?: "jalali" | "gregorian";
  default_language?: string;
  intake_link_enabled?: boolean;
  qr_enabled?: boolean;
  patient_portal_enabled?: boolean;
  sms_enabled?: boolean;
  video_enabled?: boolean;
  chat_enabled?: boolean;
}

export async function updateClinicSettings(clinicSlug: string, payload: UpdateClinicSettingsPayload): Promise<ClinicSettings> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    "/clinics/current/settings",
    { method: "PATCH", body: JSON.stringify(payload), clinicSlug }
  );
  return mapSettings(unwrapObject<Record<string, unknown>>(res));
}