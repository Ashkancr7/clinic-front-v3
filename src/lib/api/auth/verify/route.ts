import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "https://api.hessjr.com/api/v1";
const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function POST(req: NextRequest) {
  const { phone, code } = await req.json();

  const upstream = await fetch(`${API_URL}/auth/patient/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ phone, code }),
  });

  const body = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json({ message: body?.message ?? "کد نامعتبر است" }, { status: upstream.status });
  }

  const { token, user } = body.data;

  // verify فقط توکن+یوزر می‌ده، لیست کلینیک‌ها رو نداره → با همون توکن /auth/me رو می‌زنیم
  const meRes = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  const me = await meRes.json().catch(() => null);
  const clinics = me?.data?.clinics ?? me?.clinics ?? [];

  const res = NextResponse.json({ user });
  res.cookies.set("access_token", token, cookieOpts);
  res.cookies.set("user_type", "patient", cookieOpts);
  res.cookies.set("clinics", JSON.stringify(clinics.map((c: any) => ({ id: c.id, slug: c.slug }))), cookieOpts);

  return res;
}