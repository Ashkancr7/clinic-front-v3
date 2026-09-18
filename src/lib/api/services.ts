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

export interface ClinicService {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  defaultDurationMinutes: number;
  basePrice: number | null;
  requiresConsent: boolean;
  requiresBeforeAfterImages: boolean;
  requiresFollowup: boolean;
  isActive: boolean;
}

function mapService(s: Record<string, unknown>): ClinicService {
  const category = s.category as Record<string, unknown> | undefined;
  return {
    id: String(s.id ?? ""),
    name: String(s.name ?? ""),
    description: (s.description as string | null) ?? null,
    categoryId: (s.category_id as string | null) ?? null,
    categoryName: (category?.name as string | undefined) ?? null,
    categoryColor: (category?.color as string | undefined) ?? null,
    defaultDurationMinutes: Number(s.default_duration_minutes ?? 30),
    basePrice: s.base_price != null ? Number(s.base_price) : null,
    requiresConsent: Boolean(s.requires_consent),
    requiresBeforeAfterImages: Boolean(s.requires_before_after_images),
    requiresFollowup: Boolean(s.requires_followup),
    isActive: Boolean(s.is_active),
  };
}

export async function getServices(clinicSlug: string): Promise<ClinicService[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>("/services", {
    clinicSlug,
  });
  return unwrapList<Record<string, unknown>>(res).map(mapService);
}

export interface CreateServicePayload {
  name: string;
  description?: string;
  category_id?: string;
  default_duration_minutes: number;
  base_price?: number;
  requires_consent?: boolean;
  requires_before_after_images?: boolean;
  requires_followup?: boolean;
}

export async function createService(clinicSlug: string, payload: CreateServicePayload) {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>("/services", {
    method: "POST",
    body: JSON.stringify(payload),
    clinicSlug,
  });
  return mapService(unwrapObject<Record<string, unknown>>(res));
}

export async function updateService(clinicSlug: string, serviceId: string, payload: Partial<CreateServicePayload>) {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(`/services/${serviceId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    clinicSlug,
  });
  return mapService(unwrapObject<Record<string, unknown>>(res));
}

export async function updateServiceStatus(clinicSlug: string, serviceId: string, isActive: boolean) {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/services/${serviceId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
      clinicSlug,
    }
  );
  return mapService(unwrapObject<Record<string, unknown>>(res));
}

export interface ServiceDoctorLink {
  doctorUserId: number;
  fullName: string;
}

export interface ServiceOptionItem {
  id: string;
  name: string;
  description: string | null;
  defaultDurationMinutes: number | null;
  basePrice: number | null;
  isActive: boolean;
  displayOrder: number;
}

export interface ServiceFieldItem {
  id: string;
  serviceOptionId: string | null;
  fieldKey: string;
  label: string;
  fieldType: "text" | "number" | "select" | "multi_select" | "date" | "yes_no" | "file";
  isRequired: boolean;
  options: string[] | null;
  displayOrder: number;
  isActive: boolean;
}

export interface ServiceDetail extends ClinicService {
  doctors: ServiceDoctorLink[];
  optionsList: ServiceOptionItem[];
  fieldsList: ServiceFieldItem[];
}

function mapServiceOption(o: Record<string, unknown>): ServiceOptionItem {
  return {
    id: String(o.id ?? ""),
    name: String(o.name ?? ""),
    description: (o.description as string | null) ?? null,
    defaultDurationMinutes: o.default_duration_minutes != null ? Number(o.default_duration_minutes) : null,
    basePrice: o.base_price != null ? Number(o.base_price) : null,
    isActive: Boolean(o.is_active),
    displayOrder: Number(o.display_order ?? 0),
  };
}

function mapServiceField(f: Record<string, unknown>): ServiceFieldItem {
  return {
    id: String(f.id ?? ""),
    serviceOptionId: (f.service_option_id as string | null) ?? null,
    fieldKey: String(f.field_key ?? ""),
    label: String(f.label ?? ""),
    fieldType: (f.field_type as ServiceFieldItem["fieldType"]) ?? "text",
    isRequired: Boolean(f.is_required),
    options: (f.options as string[] | null) ?? null,
    displayOrder: Number(f.display_order ?? 0),
    isActive: Boolean(f.is_active),
  };
}

export async function getServiceDetail(clinicSlug: string, serviceId: string): Promise<ServiceDetail> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/services/${serviceId}`,
    { clinicSlug }
  );
  const data = unwrapObject<Record<string, unknown>>(res);

  console.log("RAW /services/{id} response:", JSON.stringify(data, null, 2));
  const base = mapService(data);

  const doctorsRaw = (data.doctors as Record<string, unknown>[]) ?? [];
  const doctors: ServiceDoctorLink[] = doctorsRaw.map((d) => {
    const user = d.doctor ?? d.user ?? d;
    const u = user as Record<string, unknown>;
    return {
      doctorUserId: Number(d.doctor_user_id ?? u.id ?? 0),
      fullName: (u.full_name as string | undefined) ?? "—",
    };
  });

  const optionsRaw = (data.options as Record<string, unknown>[]) ?? [];
  const fieldsRaw = (data.fields as Record<string, unknown>[]) ?? [];

  return {
    ...base,
    doctors,
    optionsList: optionsRaw.map(mapServiceOption),
    fieldsList: fieldsRaw.map(mapServiceField),
  };
}

export async function attachDoctorToService(clinicSlug: string, serviceId: string, doctorUserId: number) {
  return apiClient(`/services/${serviceId}/doctors`, {
    method: "POST",
    body: JSON.stringify({ doctor_user_id: doctorUserId }),
    clinicSlug,
  });
}

export async function detachDoctorFromService(clinicSlug: string, serviceId: string, doctorUserId: number) {
  return apiClient(`/services/${serviceId}/doctors/${doctorUserId}`, {
    method: "DELETE",
    clinicSlug,
  });
}

export async function getServiceOptions(clinicSlug: string, serviceId: string): Promise<ServiceOptionItem[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/services/${serviceId}/options`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapServiceOption);
}

export interface CreateServiceOptionPayload {
  name: string;
  description?: string;
  default_duration_minutes?: number;
  base_price?: number;
  display_order?: number;
}

export async function createServiceOption(clinicSlug: string, serviceId: string, payload: CreateServiceOptionPayload) {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/services/${serviceId}/options`,
    { method: "POST", body: JSON.stringify(payload), clinicSlug }
  );
  return mapServiceOption(unwrapObject<Record<string, unknown>>(res));
}

export async function updateServiceOption(clinicSlug: string, optionId: string, payload: Partial<CreateServiceOptionPayload & { is_active: boolean }>) {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/services/options/${optionId}`,
    { method: "PATCH", body: JSON.stringify(payload), clinicSlug }
  );
  return mapServiceOption(unwrapObject<Record<string, unknown>>(res));
}

export async function getServiceFields(clinicSlug: string, serviceId: string, serviceOptionId?: string): Promise<ServiceFieldItem[]> {
  const query = serviceOptionId ? `?service_option_id=${serviceOptionId}` : "";
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/services/${serviceId}/fields${query}`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapServiceField);
}

export interface CreateServiceFieldPayload {
  field_key: string;
  label: string;
  field_type: ServiceFieldItem["fieldType"];
  is_required?: boolean;
  options?: string[];
  display_order?: number;
  service_option_id?: string;
}

export async function createServiceField(clinicSlug: string, serviceId: string, payload: CreateServiceFieldPayload) {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/services/${serviceId}/fields`,
    { method: "POST", body: JSON.stringify(payload), clinicSlug }
  );
  return mapServiceField(unwrapObject<Record<string, unknown>>(res));
}

export async function updateServiceField(clinicSlug: string, fieldId: string, payload: Partial<CreateServiceFieldPayload & { is_active: boolean }>) {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/services/fields/${fieldId}`,
    { method: "PATCH", body: JSON.stringify(payload), clinicSlug }
  );
  return mapServiceField(unwrapObject<Record<string, unknown>>(res));
}