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

export interface PublicClinicInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string | null;
  slogan: string | null;
  specialty: string | null;
  phone: string | null;
  address: string | null;
}

function mapPublicClinicInfo(c: Record<string, unknown>): PublicClinicInfo {
  return {
    id: String(c.id ?? ""),
    name: (c.name as string | undefined) ?? "",
    slug: (c.slug as string | undefined) ?? "",
    logoUrl: (c.logo_url as string | null) ?? null,
    brandColor: (c.brand_color as string | null) ?? null,
    slogan: (c.slogan as string | null) ?? null,
    specialty: (c.specialty as string | null) ?? null,
    phone: (c.phone as string | null) ?? null,
    address: (c.address as string | null) ?? null,
  };
}

// --- اطلاعات عمومی کلینیک برای صفحه ورود/Loading (لوگو، شعار، لوکیشن) — بدون نیاز به احراز هویت ---
export async function getPublicClinicInfo(clinicSlug: string): Promise<PublicClinicInfo> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/public/clinics/${clinicSlug}/info`
  );
  return mapPublicClinicInfo(unwrapObject<Record<string, unknown>>(res));
}