// مرورگر همیشه به پروکسی داخلی Next می‌زنه، نه مستقیم به لاراول.
// توکن Bearer هرگز سمت کلاینت دیده نمی‌شه؛ در app/api/[...path]/route.ts تزریق می‌شه.
const PROXY_BASE = "/api/proxy";

interface RequestOptions extends RequestInit {
  clinicSlug?: string; // اگر ست شود، به‌صورت هدر برای پروکسی ارسال می‌شود و آنجا به X-Clinic-Id تبدیل می‌شود
}

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { clinicSlug, headers, ...rest } = options;

  const res = await fetch(`${PROXY_BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(clinicSlug ? { "X-Clinic-Slug": clinicSlug } : {}),
      ...headers,
    },
    credentials: "include", // برای اینکه کوکی access_token با درخواست به روت‌های خود Next بره
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(body?.message ?? `خطای درخواست: ${res.status}`);
  }

  return body as T;
}