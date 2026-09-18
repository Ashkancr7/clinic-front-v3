"use client";

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { getCurrentClinicUser } from "@/lib/api/session";
import { getAllAppointments } from "@/lib/api/appointments";
import { queryKeys } from "@/lib/query/keys";

/**
 * برای پزشک‌ها: پرونده‌ی مراجعینی که هیچ نوبتی با این پزشک نداشته‌اند
 * نباید در لیست بیماران/پرونده‌ها دیده شود. مدیر کلینیک و منشی همه را می‌بینند.
 *
 * استثنا: پزشکی که access_scope او روی "all_patients" تنظیم شده (یعنی
 * مدیر کلینیک صراحتاً به او دسترسی کامل داده)، محدود نمی‌شود — این فیلد
 * از پیش روی UserClinicAccess بک‌اند وجود دارد و باید رعایت شود.
 *
 * این هوک لیست شناسه‌ی همان مراجعین را (فقط برای پزشکِ محدودشده) با
 * استفاده از GET /appointments?doctor_user_id=... می‌سازد — و چون این
 * endpoint صفحه‌بندی‌شده است، از getAllAppointments (همه‌ی صفحات) استفاده
 * می‌کند تا مراجعین قدیمی‌تر از لیست گم نشوند.
 */
export function useDoctorPatientScope(clinicSlug: string) {
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: queryKeys.session.currentUser(clinicSlug),
    queryFn: () => getCurrentClinicUser(clinicSlug),
    enabled: !!clinicSlug,
  });

  const isDoctor = currentUser?.roleKey === "doctor";
  const hasFullAccess = currentUser?.accessScope === "all_patients";
  const isRestricted = isDoctor && !hasFullAccess;

  const doctorUserId = isRestricted ? currentUser?.userId ?? undefined : undefined;

  const { data: doctorAppointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["doctor-patient-scope", clinicSlug, doctorUserId ?? "none"],
    queryFn: () => getAllAppointments(clinicSlug, { doctorUserId }),
    enabled: !!clinicSlug && isRestricted && !!doctorUserId,
  });

  const patientIds = useMemo(() => {
    if (!isRestricted) return null;
    return new Set(doctorAppointments.map((a) => a.patientId).filter(Boolean));
  }, [isRestricted, doctorAppointments]);

  return {
    isDoctor: isRestricted,
    patientIds,
    isLoading: userLoading || (isRestricted && appointmentsLoading),
  };
}