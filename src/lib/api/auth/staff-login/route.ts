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
  const { phone, password } = await req.json();

  const upstream = await fetch(`${API_URL}/auth/staff/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ phone, password }),
  });

  const body = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json({ message: body?.message ?? "ورود ناموفق بود" }, { status: upstream.status });
  }

  const { token, user, clinics } = body.data;

  const res = NextResponse.json({
    user,
    clinics: clinics.map((c: any) => ({ id: c.id, slug: c.slug, name: c.name })),
  });

  res.cookies.set("access_token", token, cookieOpts);
  res.cookies.set("user_type", user.user_type, cookieOpts); // "staff" | "super_admin"
  res.cookies.set("clinics", JSON.stringify(clinics.map((c: any) => ({ id: c.id, slug: c.slug }))), cookieOpts);

  return res;
}