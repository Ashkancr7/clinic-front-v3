import { redirect } from "next/navigation";
import { Building2, ChevronLeft, Leaf, SearchX } from "lucide-react";

import { getSession } from "@/lib/auth/session";

export default async function SelectClinicPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.userType === "super_admin") {
    redirect("/super-admin/clinics");
  }

  const basePath = session.userType === "patient" ? "/patient" : "/clinic";

  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center bg-gray-50 px-5 py-12 transition-colors duration-300 dark:bg-[#111827] sm:py-16"
    >
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light/15 dark:bg-primary/15">
          <Leaf className="h-8 w-8 text-primary dark:text-primary-light" />
        </div>

        <div className="text-center leading-tight">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Beauty Clinic CRM
          </h1>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            پلتفرم مدیریت کلینیک‌های زیبایی
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-colors duration-300 sm:p-8 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
        <h2 className="text-center text-xl font-bold text-gray-900 dark:text-white">
          انتخاب کلینیک
        </h2>

        <p className="mt-2 text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {session.clinics.length > 0
            ? "برای ادامه، کلینیک موردنظر خود را انتخاب کنید"
            : "کلینیکی برای این حساب یافت نشد"}
        </p>

        {session.clinics.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-white/[0.03]">
              <SearchX className="h-7 w-7 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              هیچ کلینیکی برای این حساب یافت نشد.
            </p>
          </div>
        ) : (
          <div className="mt-7 space-y-3">
            {session.clinics.map((c) => (
              <a
                key={c.id}
                href={`${basePath}/${c.slug}/dashboard`}
                className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/50 p-4 text-sm transition hover:border-primary hover:bg-primary-light/10 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-primary-light/60 dark:hover:bg-primary/10"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light/15 text-primary transition group-hover:bg-primary group-hover:text-white dark:bg-primary/15 dark:text-primary-light">
                  <Building2 className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-gray-800 dark:text-gray-100">
                    {c.name ?? c.slug}
                  </div>
                  {c.name && (
                    <div dir="ltr" className="truncate text-left text-xs text-gray-400 dark:text-gray-500">
                      {c.slug}
                    </div>
                  )}
                </div>

                <ChevronLeft className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:-translate-x-0.5 group-hover:text-primary dark:text-gray-600 dark:group-hover:text-primary-light" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}