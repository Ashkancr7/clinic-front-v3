import { cookies } from "next/headers";

export interface Session {
  userType: "patient" | "staff" | "super_admin";
  clinics: { id: string; slug: string; name?: string }[];
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get("access_token")?.value;
  const userType = store.get("user_type")?.value as Session["userType"] | undefined;

  if (!token || !userType) return null;

  const clinicsRaw = store.get("clinics")?.value;
  const clinics = clinicsRaw ? JSON.parse(clinicsRaw) : [];

  return { userType, clinics };
}