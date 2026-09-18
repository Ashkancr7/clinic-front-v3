import { apiClient } from "./client";

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  brand_color: string | null;
  status: "active" | "inactive" | "suspended";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  slogan: string | null;
  specialty: string | null;
  latitude: string | null;
  longitude: string | null;
}

export interface CreatedClinicAdmin {
  id: number;
  full_name: string;
  phone: string;
  must_change_password: boolean;
}

export interface Plan {
  id: string;
  name: string;
  billing_cycle: "monthly" | "yearly";
  price: number;
  max_users: number | null;
  max_file_storage_mb: number | null;
  max_sms_per_month: number | null;
  included_modules: string[] | null;
  is_active: boolean;
}

// شکل واقعی پاسخ بک‌اند: { success, message, data: { data: [...], current_page, total, ... } }
interface LaravelEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface LaravelPaginator<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
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
    // اگر data خودش یک paginator بود، اینجا کاربرد ندارد؛ برای آیتم تکی معمولاً data مستقیم خودِ آبجکت است
    return outer.data as T;
  }
  return res as T;
}

export const superAdminApi = {
  // --- کلینیک‌ها ---
  getClinics: async () => {
    const res = await apiClient<LaravelEnvelope<LaravelPaginator<Clinic>> | Clinic[]>("/super-admin/clinics");
    return unwrapList<Clinic>(res);
  },

  getClinic: async (clinicId: string) => {
    const res = await apiClient<LaravelEnvelope<Clinic> | Clinic>(`/super-admin/clinics/${clinicId}`);
    return unwrapItem<Clinic>(res);
  },

  // پاسخ این endpoint دیگر مستقیم خودِ کلینیک نیست؛ چون سوپرادمین همزمان اولین
  // مدیر کلینیک را هم می‌سازد: { data: { clinic: {...}, admin: {...} } }
  createClinic: async (payload: {
    name: string;
    slug: string;
    phone?: string;
    address?: string;
    slogan?: string;
    specialty?: string;
    logo_url?: string;
    brand_color?: string;
    latitude?: string;
    longitude?: string;
    admin_full_name: string;
    admin_phone: string;
    admin_password: string;
  }) => {
    const res = await apiClient<LaravelEnvelope<{ clinic: Clinic; admin: CreatedClinicAdmin }>>(
      "/super-admin/clinics",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return unwrapItem<{ clinic: Clinic; admin: CreatedClinicAdmin }>(res);
  },

  updateClinic: async (
    clinicId: string,
    payload: Partial<Pick<Clinic, "name" | "phone" | "address" | "slogan" | "specialty" | "logo_url" | "brand_color" | "latitude" | "longitude">>
  ) => {
    const res = await apiClient<LaravelEnvelope<Clinic> | Clinic>(`/super-admin/clinics/${clinicId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return unwrapItem<Clinic>(res);
  },

  updateClinicStatus: async (clinicId: string, status: Clinic["status"]) => {
    const res = await apiClient<LaravelEnvelope<Clinic> | Clinic>(`/super-admin/clinics/${clinicId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return unwrapItem<Clinic>(res);
  },

  // --- پلن‌ها ---
  getPlans: async () => {
    const res = await apiClient<LaravelEnvelope<LaravelPaginator<Plan>> | LaravelEnvelope<Plan[]> | Plan[]>(
      "/super-admin/plans"
    );
    return unwrapList<Plan>(res);
  },

  createPlan: async (payload: Omit<Plan, "id">) => {
    const res = await apiClient<LaravelEnvelope<Plan> | Plan>("/super-admin/plans", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapItem<Plan>(res);
  },

  updatePlan: async (planId: string, payload: Partial<Omit<Plan, "id">>) => {
    const res = await apiClient<LaravelEnvelope<Plan> | Plan>(`/super-admin/plans/${planId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return unwrapItem<Plan>(res);
  },

  // --- اشتراک یک کلینیک خاص (نه لیست سراسری) ---
  assignSubscription: (clinicId: string, planId: string) =>
    apiClient(`/super-admin/clinics/${clinicId}/subscription`, {
      method: "POST",
      body: JSON.stringify({ plan_id: planId }),
    }),

  cancelSubscription: (clinicId: string) =>
    apiClient(`/super-admin/clinics/${clinicId}/subscription/cancel`, {
      method: "POST",
    }),
};