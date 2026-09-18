import { apiClient } from "./client";
import type { Plan } from "./super-admin";

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

export type SubscriptionStatus = "trial" | "active" | "expired" | "cancelled";

export interface CurrentSubscription {
  id: string;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string | null;
  plan: Plan | null;
}

function mapSubscription(s: Record<string, unknown>): CurrentSubscription {
  const plan = s.plan as Record<string, unknown> | undefined;
  return {
    id: String(s.id ?? ""),
    status: (s.status as SubscriptionStatus) ?? "active",
    startedAt: (s.started_at as string | undefined) ?? "",
    expiresAt: (s.expires_at as string | null) ?? null,
    plan: plan
      ? {
          id: String(plan.id ?? ""),
          name: (plan.name as string | undefined) ?? "",
          billing_cycle: (plan.billing_cycle as Plan["billing_cycle"]) ?? "monthly",
          price: Number(plan.price ?? 0),
          max_users: plan.max_users != null ? Number(plan.max_users) : null,
          max_file_storage_mb: plan.max_file_storage_mb != null ? Number(plan.max_file_storage_mb) : null,
          max_sms_per_month: plan.max_sms_per_month != null ? Number(plan.max_sms_per_month) : null,
          included_modules: (plan.included_modules as string[] | null) ?? null,
          is_active: Boolean(plan.is_active),
        }
      : null,
  };
}

// --- وضعیت اشتراک و محدودیت‌های کلینیک جاری ---
export async function getCurrentSubscription(clinicSlug: string): Promise<CurrentSubscription> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    "/clinics/current/subscription",
    { clinicSlug }
  );
  return mapSubscription(unwrapObject<Record<string, unknown>>(res));
}