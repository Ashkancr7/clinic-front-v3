import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function SelectClinicPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.userType === "super_admin") {
    redirect("/super-admin/clinics");
  }

  if (session.clinics.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        هیچ کلینیکی برای این حساب یافت نشد.
      </div>
    );
  }

  const basePath = session.userType === "patient" ? "/patient" : "/clinic";

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-xl font-bold text-gray-900">انتخاب کلینیک</h1>
      <div className="space-y-3">
        {session.clinics.map((c) => {
          return (
            <a
            
              key={c.id}
              href={`${basePath}/${c.slug}/dashboard`}
              className="block rounded-2xl border border-gray-200 p-4 text-sm hover:border-primary"
            >
              {c.name ?? c.slug}
            </a>
          );
        })}
      </div>
    </div>
  );
}