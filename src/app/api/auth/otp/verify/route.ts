import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.hessjr.com/api/v1";
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

  if (user.user_type !== "patient") {
    return NextResponse.json(
      { message: "این شماره متعلق به حساب کارمندی است. لطفاً از تب «ورود با رمز عبور» استفاده کنید." },
      { status: 403 }
    );
  }

  // مسیر درست برای گرفتن کلینیک‌های بیمار: /patient-portal/clinics
  // پاسخ آن آرایه‌ای از رکوردهای PatientClinic است که هرکدام یک clinic تودرتو دارند
  const clinicsRes = await fetch(`${API_URL}/patient-portal/clinics`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  const clinicsBody = await clinicsRes.json().catch(() => null);
  const patientClinics: { clinic: { id: string; slug: string; name: string } }[] = clinicsBody?.data ?? [];
  const clinics = patientClinics.map((pc) => ({ id: pc.clinic.id, slug: pc.clinic.slug, name: pc.clinic.name }));

  const res = NextResponse.json({ user, clinics });
  res.cookies.set("access_token", token, cookieOpts);
  res.cookies.set("user_type", "patient", cookieOpts);
  res.cookies.set("clinics", JSON.stringify(clinics), cookieOpts);

  return res;
}