import { NextRequest, NextResponse } from "next/server";

const PATIENT_PREFIX = "/patient/";
const CLINIC_PREFIX = "/clinic/";
const SUPERADMIN_PREFIX = "/super-admin";
const PUBLIC_PATHS = ["/login", "/otp", "/select-clinic"];
const CHANGE_PASSWORD_PATH = "/change-password";

function resolveHomeUrl(
  userType: string,
  clinicSlugs: string[],
  patientBasePrefix: "patient" | "clinic",
  request: NextRequest
) {
  if (userType === "super_admin") {
    return new URL("/super-admin/clinics", request.url);
  }
  if (clinicSlugs.length === 1) {
    return new URL(`/${patientBasePrefix}/${clinicSlugs[0]}/dashboard`, request.url);
  }
  return new URL("/select-clinic", request.url);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("access_token")?.value;
  const userType = request.cookies.get("user_type")?.value;
  const clinicsRaw = request.cookies.get("clinics")?.value;
  const clinicSlugs: string[] = clinicsRaw
    ? JSON.parse(clinicsRaw).map((c: { slug: string }) => c.slug)
    : [];
  const mustChangePassword = request.cookies.get("must_change_password")?.value === "1";

  // کاربری که با رمز اولیه (تعیین‌شده توسط یکی دیگر) وارد شده، تا قبل از تغییر
  // رمز به جای دیگری راه ندارد — این فقط سمت فرانت اعمال می‌شود، سرور همچنان
  // اجازه می‌دهد.
  if (
    token &&
    mustChangePassword &&
    pathname !== CHANGE_PASSWORD_PATH &&
    pathname !== "/login" &&
    !pathname.startsWith("/api")
  ) {
    return NextResponse.redirect(new URL(CHANGE_PASSWORD_PATH, request.url));
  }

  // ریشه‌ی سایت: اگر کاربر لاگین است، به داشبورد خودش هدایت شود
  if (pathname === "/") {
    if (token && userType) {
      const patientBasePrefix = userType === "patient" ? "patient" : "clinic";
      return NextResponse.redirect(resolveHomeUrl(userType, clinicSlugs, patientBasePrefix, request));
    }
    return NextResponse.next();
  }

  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.includes("/intake") ||
    pathname.startsWith("/c/")
  ) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith(SUPERADMIN_PREFIX) && userType !== "super_admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith(PATIENT_PREFIX)) {
    if (userType !== "patient") return NextResponse.redirect(new URL("/login", request.url));
    const slug = pathname.split("/")[2];
    if (slug && !clinicSlugs.includes(slug)) {
      return NextResponse.redirect(new URL("/select-clinic", request.url));
    }
  }

  if (pathname.startsWith(CLINIC_PREFIX)) {
    if (userType !== "staff") return NextResponse.redirect(new URL("/login", request.url));
    const slug = pathname.split("/")[2];
    if (slug && !clinicSlugs.includes(slug)) {
      return NextResponse.redirect(new URL("/select-clinic", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|image).*)"],
};