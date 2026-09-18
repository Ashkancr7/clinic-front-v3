import { getActiveClinic, getPatientClinics } from "@/lib/auth/clinic-context";
import { ClinicSwitcher } from "@/components/layout/ClinicSwitcher";

export default async function PatientClinicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = await params;
  const clinic = await getActiveClinic(clinicSlug);
  const myClinics = await getPatientClinics();

  const currentClinicName = myClinics.find((c) => c.slug === clinicSlug)?.name ?? clinic?.clinicSlug ?? "کلینیک";

  return (
    <div dir="rtl" className="min-h-screen">
      <header className="glass flex items-center justify-between rounded-none px-4 py-3 md:px-8">
        <span className="font-bold text-primary-dark dark:text-primary-light">{currentClinicName}</span>

        <ClinicSwitcher
          currentSlug={clinicSlug}
          clinics={myClinics.map((c) => ({ slug: c.slug, name: c.name }))}
          basePath="patient"
        />
      </header>

      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8">
        <div className="rounded-3xl bg-white p-4 text-gray-900 dark:bg-slate-950 dark:text-white md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}