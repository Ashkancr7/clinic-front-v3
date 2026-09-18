import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.hessjr.com/api/v1";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "ابتدا وارد شوید" }, { status: 401 });
  }

  const { current_password, new_password, new_password_confirmation } = await req.json();

  const upstream = await fetch(`${API_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ current_password, new_password, new_password_confirmation }),
  });

  const body = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json(
      {
        message: body?.error?.message ?? body?.message ?? "تغییر رمز ناموفق بود",
        code: body?.error?.code,
      },
      { status: upstream.status }
    );
  }

  // رمز با موفقیت تغییر کرد: سایر نشست‌ها سمت بک‌اند ابطال شدند، اما توکن
  // جاری معتبر می‌ماند — پس کوکی‌های session را دست نمی‌زنیم، فقط پرچم
  // اجباری‌بودن تغییر رمز (که فقط سمت فرانت اعمال می‌شود) را پاک می‌کنیم.
  const res = NextResponse.json({ success: true });
  res.cookies.delete("must_change_password");
  return res;
}
