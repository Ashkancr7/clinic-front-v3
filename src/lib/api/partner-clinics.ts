import { apiClient } from "./client";

export interface PartnerClinic {
  id: string;
  name: string;
  category: string;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export type PartnerClinicPayload = {
  name: string;
  category: string;
  logo_url?: string | null;
  description?: string | null;
  website_url?: string | null;
  phone?: string | null;
  is_active: boolean;
};

// شکل واقعی پاسخ بک‌اند: { success, message, data: [...] } یا { success, data: { data: [...] } }
interface LaravelEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// یک تابع مقاوم که چند حالت محتمل پاسخ را پوشش می‌دهد:
// آرایه‌ی خام، { data: [...] }، یا { success, data: { data: [...] } }
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

// همین‌طور برای پاسخ‌های تکی (یک آبجکت، نه لیست): { success, data: {...} } یا مستقیم {...}
function unwrapItem<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in (res as Record<string, unknown>)) {
    const outer = res as { data: unknown };
    return outer.data as T;
  }
  return res as T;
}

export const partnerClinicsApi = {
  // --- لیست تبلیغات کلینیک‌های طرف‌قرارداد برای صفحه ورود (عمومی، بدون نیاز به احراز هویت) ---
  getPartnerAds: async (clinicSlug: string) => {
    const res = await apiClient<LaravelEnvelope<PartnerClinic[]> | PartnerClinic[]>(
      `/public/clinics/${clinicSlug}/partner-ads`
    );
    return unwrapList<PartnerClinic>(res);
  },

  getPartnerClinics: async () => {
    const res = await apiClient<LaravelEnvelope<PartnerClinic[]> | PartnerClinic[]>(
      "/super-admin/partner-clinics"
    );
    return unwrapList<PartnerClinic>(res);
  },

  getPartnerClinic: async (id: string) => {
    const res = await apiClient<LaravelEnvelope<PartnerClinic> | PartnerClinic>(
      `/super-admin/partner-clinics/${id}`
    );
    return unwrapItem<PartnerClinic>(res);
  },

  createPartnerClinic: async (payload: PartnerClinicPayload) => {
    const res = await apiClient<LaravelEnvelope<PartnerClinic> | PartnerClinic>(
      "/super-admin/partner-clinics",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return unwrapItem<PartnerClinic>(res);
  },

  updatePartnerClinic: async (id: string, payload: PartnerClinicPayload) => {
    const res = await apiClient<LaravelEnvelope<PartnerClinic> | PartnerClinic>(
      `/super-admin/partner-clinics/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
    return unwrapItem<PartnerClinic>(res);
  },
};