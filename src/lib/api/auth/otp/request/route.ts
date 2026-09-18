import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "https://api.hessjr.com/api/v1";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  const upstream = await fetch(`${API_URL}/auth/patient/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ phone }),
  });

  const body = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json({ message: body?.message ?? "ارسال کد ناموفق بود" }, { status: upstream.status });
  }

  return NextResponse.json({ success: true });
}