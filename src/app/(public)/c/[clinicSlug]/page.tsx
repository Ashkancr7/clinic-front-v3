"use client";

import { use } from "react";

import Link from "next/link";
import Image from "next/image";

import { useQuery } from "@tanstack/react-query";

import { Leaf, MapPin, Phone, ExternalLink, ArrowLeft } from "lucide-react";

import { getPublicClinicInfo } from "@/lib/api/public-clinic";
import { partnerClinicsApi } from "@/lib/api/partner-clinics";
import { queryKeys } from "@/lib/query/keys";

export default function PublicClinicLandingPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);

  const {
    data: clinic,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.publicClinic.info(clinicSlug),
    queryFn: () => getPublicClinicInfo(clinicSlug),
    enabled: !!clinicSlug,
    retry: false,
  });

  const { data: ads = [] } = useQuery({
    queryKey: queryKeys.publicClinic.partnerAds(clinicSlug),
    queryFn: () => partnerClinicsApi.getPartnerAds(clinicSlug),
    enabled: !!clinicSlug,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0b0f14]">
        <div className="text-sm text-gray-400 dark:text-gray-500">در حال بارگذاری...</div>
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-4 text-center dark:bg-[#0b0f14]">
        <Leaf className="h-8 w-8 text-gray-300 dark:text-gray-600" />
        <h1 className="text-base font-bold text-gray-700 dark:text-gray-200">کلینیک یافت نشد</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          آدرسی که وارد کرده‌اید معتبر نیست یا این کلینیک دیگر فعال نمی‌باشد.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-[#0b0f14]"
      style={clinic.brandColor ? ({ "--clinic-brand": clinic.brandColor } as React.CSSProperties) : undefined}
    >
      {/* Header */}
      <div className="border-b border-gray-100 bg-white dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-10 text-center sm:py-14">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-primary-light/20 dark:bg-primary/15">
            {clinic.logoUrl ? (
              <Image
                src={clinic.logoUrl}
                alt={clinic.name}
                width={80}
                height={80}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <Leaf className="h-9 w-9 text-primary-dark dark:text-primary-light" />
            )}
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">{clinic.name}</h1>
            {clinic.specialty && (
              <span className="mt-2 inline-block rounded-full bg-primary-light/20 px-3 py-1 text-xs text-primary-dark dark:bg-primary/15 dark:text-primary-light">
                {clinic.specialty}
              </span>
            )}
          </div>

          {clinic.slogan && (
            <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">{clinic.slogan}</p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-500">
            {clinic.phone && (
              <span className="flex items-center gap-1.5" dir="ltr">
                <Phone className="h-3.5 w-3.5" />
                {clinic.phone}
              </span>
            )}
            {clinic.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {clinic.address}
              </span>
            )}
          </div>

          <Link
            href="/login"
            className="mt-2 flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark"
          >
            ورود به کلینیک
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Partner Ads */}
      {ads.length > 0 && (
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h2 className="mb-4 text-center text-sm font-bold text-gray-600 dark:text-gray-300">
            کسب‌وکارهای همکار
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-white/10">
                  {ad.logo_url ? (
                    <Image
                      src={ad.logo_url}
                      alt={ad.name}
                      width={44}
                      height={44}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Leaf className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{ad.name}</div>
                  {ad.category && (
                    <div className="text-[11px] text-gray-400 dark:text-gray-500">{ad.category}</div>
                  )}
                  {ad.description && (
                    <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                      {ad.description}
                    </p>
                  )}
                  {ad.website_url && (
                    <a
                      href={ad.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-primary-dark hover:underline dark:text-primary-light"
                    >
                      <ExternalLink className="h-3 w-3" />
                      مشاهده وب‌سایت
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}