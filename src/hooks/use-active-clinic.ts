"use client";

import { useParams } from "next/navigation";

/**
 * clinicSlug را از URL می‌خواند (نه از state جداگانه).
 * طبق تصمیم معماری: URL تنها منبع حقیقت برای کلینیک فعال است.
 */
export function useActiveClinic() {
  const params = useParams<{ clinicSlug: string }>();
  return { clinicSlug: params.clinicSlug };
}
