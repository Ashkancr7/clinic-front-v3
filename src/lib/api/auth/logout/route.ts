import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "https://api.hessjr.com/api/v1";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;

  if (token) {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    }).catch(() => null);
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete("access_token");
  res.cookies.delete("user_type");
  res.cookies.delete("clinics");
  return res;
}