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

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  createdAt: string;
}

export async function getNotifications(unreadOnly = false): Promise<NotificationItem[]> {
  const query = unreadOnly ? "?unread_only=true" : "";
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/notifications${query}`
  );
  return unwrapList<Record<string, unknown>>(res).map((n) => ({
    id: String(n.id ?? ""),
    title: String(n.title ?? ""),
    body: String(n.body ?? ""),
    type: String(n.type ?? ""),
    readAt: (n.read_at as string | null) ?? null,
    createdAt: String(n.created_at ?? ""),
  }));
}

export async function markNotificationRead(notificationId: string) {
  return apiClient(`/notifications/${notificationId}/read`, { method: "POST" });
}

// این تابع از قبل موجود بود — دست‌نخورده می‌ماند
export async function getUnreadNotificationCount(): Promise<number> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown> | number>(
    "/notifications/unread-count"
  );

  if (typeof res === "number") return res;

  const data = (res as LaravelEnvelope<Record<string, unknown>>)?.data ?? res;
  if (typeof data === "number") return data;

  const obj = data as Record<string, unknown>;
  return Number(obj.count ?? obj.unread_count ?? 0);
}