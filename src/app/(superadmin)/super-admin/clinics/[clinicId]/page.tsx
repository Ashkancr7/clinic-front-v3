"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Pencil,
  Ban,
  Phone,
  MapPin,
  Info,
  X,
  ExternalLink,
  CreditCard,
  XCircle,
} from "lucide-react";

import { superAdminApi, type Clinic, type Plan } from "@/lib/api/super-admin";
import { superAdminReportsApi } from "@/lib/api/super-admin-reports";
import { queryKeys } from "@/lib/query/keys";
import { AssignPlanModal } from "@/components/super-admin/AssignPlanModal";
import { applyPlanModulesToClinic } from "@/lib/api/super-admin-modules";

const STATUS_LABELS: Record<Clinic["status"], { label: string; tone: string }> = {
  active: { label: "فعال", tone: "bg-primary-light/20 text-primary-dark" },
  inactive: { label: "غیرفعال", tone: "bg-gray-100 text-gray-500" },
  suspended: { label: "معلق", tone: "bg-red-50 text-danger" },
};

export default function ClinicDetailPage({ params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = use(params);
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const { data: clinic, isLoading, error } = useQuery({
    queryKey: queryKeys.superAdmin.clinics.detail(clinicId),
    queryFn: () => superAdminApi.getClinic(clinicId),
  });

  // وضعیت اشتراک/پلن فعلی این کلینیک (از گزارش جدول مقایسه‌ای کلینیک‌ها)
  const { data: clinicReport, isLoading: planLoading } = useQuery({
    queryKey: queryKeys.superAdminReports.clinicsReport({ clinic_id: clinicId }),
    queryFn: () => superAdminReportsApi.getClinicsReport({ clinic_id: clinicId }),
  });

  const planInfo = clinicReport?.items?.[0];
  const hasActivePlan = planInfo?.subscription_status === "active";

  const statusMutation = useMutation({
    mutationFn: (status: Clinic["status"]) => superAdminApi.updateClinicStatus(clinicId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.clinics.detail(clinicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.clinics.list() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof superAdminApi.updateClinic>[1]) =>
      superAdminApi.updateClinic(clinicId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.clinics.detail(clinicId) });
      setShowEditModal(false);
    },
  });

  const [appliedModulesCount, setAppliedModulesCount] = useState<
    number | null
  >(null);

  const assignPlanMutation = useMutation({
    mutationFn: async (plan: Plan) => {
      await superAdminApi.assignSubscription(clinicId, plan.id);

      const appliedCount = await applyPlanModulesToClinic(
        clinicId,
        plan.included_modules ?? []
      );

      return appliedCount;
    },
    onSuccess: (appliedCount) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.superAdminReports.clinicsReport({ clinic_id: clinicId }),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.superAdminModules.list(clinicId),
      });
      setShowPlanModal(false);
      setAppliedModulesCount(appliedCount);
    },
  });

  const cancelPlanMutation = useMutation({
    mutationFn: () => superAdminApi.cancelSubscription(clinicId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.superAdminReports.clinicsReport({ clinic_id: clinicId }),
      });
    },
  });

  if (isLoading) {
    return <div className="py-20 text-center text-sm text-gray-400">در حال بارگذاری...</div>;
  }

  if (error || !clinic) {
    return <div className="py-20 text-center text-sm text-danger">کلینیک یافت نشد.</div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/super-admin/clinics" className="flex w-fit items-center gap-1.5 text-sm text-gray-500 hover:text-primary-dark">
        <ArrowRight className="h-4 w-4" /> بازگشت به لیست کلینیک‌ها
      </Link>

      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 rounded-full bg-gray-100" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">{clinic.name}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] ${STATUS_LABELS[clinic.status].tone}`}>
                {STATUS_LABELS[clinic.status].label}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400" dir="ltr">
              <span dir="rtl">شناسه:</span> {clinic.slug}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/c/${clinic.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50"
          >
            <ExternalLink className="h-3.5 w-3.5" /> مشاهده صفحه عمومی
          </a>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50"
          >
            <Pencil className="h-3.5 w-3.5" /> ویرایش اطلاعات
          </button>
          <button
            onClick={() => statusMutation.mutate(clinic.status === "suspended" ? "active" : "suspended")}
            disabled={statusMutation.isPending}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium disabled:opacity-50 ${
              clinic.status === "suspended"
                ? "bg-primary text-white hover:bg-primary-dark"
                : "bg-red-50 text-danger hover:bg-red-100"
            }`}
          >
            <Ban className="h-3.5 w-3.5" /> {clinic.status === "suspended" ? "فعال‌سازی مجدد" : "تعلیق کلینیک"}
          </button>
        </div>
      </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="mb-4 text-sm font-bold text-gray-800">اطلاعات کلی</h2>
        <div className="space-y-3 text-xs">
          <InfoRow icon={Phone} label="تلفن" value={clinic.phone ?? "ثبت نشده"} dir="ltr" />
          <InfoRow icon={MapPin} label="آدرس" value={clinic.address ?? "ثبت نشده"} />
          <InfoRow icon={Info} label="تخصص" value={clinic.specialty ?? "ثبت نشده"} />
          <InfoRow icon={Info} label="شعار" value={clinic.slogan ?? "ثبت نشده"} />
          <div className="flex items-start justify-between gap-3">
            <span className="flex items-center gap-1.5 text-gray-400">
              <Info className="h-3.5 w-3.5" /> رنگ برند
            </span>
            {clinic.brand_color ? (
              <span className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full border border-gray-200" style={{ backgroundColor: clinic.brand_color }} />
                <span className="text-gray-700" dir="ltr">{clinic.brand_color}</span>
              </span>
            ) : (
              <span className="text-gray-700">ثبت نشده</span>
            )}
          </div>
          <InfoRow icon={MapPin} label="مختصات (Lat, Lng)" value={clinic.latitude && clinic.longitude ? `${clinic.latitude}, ${clinic.longitude}` : "ثبت نشده"} dir="ltr" />
          {clinic.logo_url && (
            <div className="flex items-start justify-between gap-3">
              <span className="flex items-center gap-1.5 text-gray-400">
                <Info className="h-3.5 w-3.5" /> لوگو
              </span>
              <a href={clinic.logo_url} target="_blank" rel="noreferrer" className="max-w-[200px] truncate text-primary-dark hover:underline" dir="ltr">
                {clinic.logo_url}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* اشتراک و پلن */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">اشتراک و پلن</h2>

          <div className="flex items-center gap-2">
            <Link
              href="/super-admin/modules"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              مدیریت ماژول‌ها
            </Link>

            <button
              onClick={() => setShowPlanModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              <CreditCard className="h-3.5 w-3.5" />
              {planInfo?.plan_name ? "تغییر پلن" : "اختصاص پلن"}
            </button>

            {hasActivePlan && (
              <button
                onClick={() => {
                  if (confirm("اشتراک این کلینیک لغو شود؟")) {
                    cancelPlanMutation.mutate();
                  }
                }}
                disabled={cancelPlanMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl border border-red-100 px-3 py-1.5 text-xs text-danger hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                لغو اشتراک
              </button>
            )}
          </div>
        </div>

        {appliedModulesCount !== null && (
          <div className="mb-4 flex items-center justify-between rounded-xl bg-primary-light/10 px-3 py-2 text-xs text-primary-dark">
            <span>
              {appliedModulesCount > 0
                ? `پلن اعمال شد و ${appliedModulesCount.toLocaleString(
                    "fa-IR"
                  )} ماژول برای این کلینیک فعال شد.`
                : "پلن اعمال شد."}
            </span>
            <button
              onClick={() => setAppliedModulesCount(null)}
              className="rounded-full p-0.5 hover:bg-primary/10"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {planLoading ? (
          <div className="py-6 text-center text-xs text-gray-400">
            در حال بارگذاری...
          </div>
        ) : planInfo?.plan_name ? (
          <div className="space-y-3 text-xs">
            <InfoRow icon={CreditCard} label="پلن فعلی" value={planInfo.plan_name} />
            <InfoRow
              icon={Info}
              label="وضعیت اشتراک"
              value={
                planInfo.subscription_status === "active"
                  ? "فعال"
                  : planInfo.subscription_status === "trial"
                  ? "آزمایشی"
                  : planInfo.subscription_status === "expired"
                  ? "منقضی‌شده"
                  : planInfo.subscription_status === "cancelled"
                  ? "لغوشده"
                  : (planInfo.subscription_status ?? "—")
              }
            />
            {planInfo.subscription_expires_at && (
              <InfoRow
                icon={Info}
                label="تاریخ انقضا"
                value={new Date(planInfo.subscription_expires_at).toLocaleDateString("fa-IR")}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-xs text-gray-400">
              این کلینیک هنوز هیچ پلن اشتراکی ندارد.
            </p>
            <button
              onClick={() => setShowPlanModal(true)}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-dark"
            >
              اختصاص پلن
            </button>
          </div>
        )}
      </div>

      {showPlanModal && (
        <AssignPlanModal
          clinicName={clinic.name}
          currentPlanId={undefined}
          title={planInfo?.plan_name ? "تغییر پلن" : "اختصاص پلن"}
          onClose={() => setShowPlanModal(false)}
          onSubmit={(plan) => assignPlanMutation.mutate(plan)}
          isSubmitting={assignPlanMutation.isPending}
          error={
            assignPlanMutation.error instanceof Error
              ? assignPlanMutation.error.message
              : null
          }
        />
      )}

      {showEditModal && (
        <EditClinicModal
          clinic={clinic}
          onClose={() => setShowEditModal(false)}
          onSubmit={(payload) => updateMutation.mutate(payload)}
          isSubmitting={updateMutation.isPending}
          error={updateMutation.error instanceof Error ? updateMutation.error.message : null}
        />
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  dir,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-1.5 text-gray-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="text-left text-gray-700" dir={dir}>
        {value}
      </span>
    </div>
  );
}

function EditClinicModal({
  clinic,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  clinic: Clinic;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    phone?: string;
    address?: string;
    slogan?: string;
    specialty?: string;
    logo_url?: string;
    brand_color?: string;
    latitude?: string;
    longitude?: string;
  }) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [name, setName] = useState(clinic.name);
  const [phone, setPhone] = useState(clinic.phone ?? "");
  const [address, setAddress] = useState(clinic.address ?? "");
  const [slogan, setSlogan] = useState(clinic.slogan ?? "");
  const [specialty, setSpecialty] = useState(clinic.specialty ?? "");
  const [logoUrl, setLogoUrl] = useState(clinic.logo_url ?? "");
  const [brandColor, setBrandColor] = useState(clinic.brand_color ?? "#0EA5A4");
  const [latitude, setLatitude] = useState(clinic.latitude ?? "");
  const [longitude, setLongitude] = useState(clinic.longitude ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">ویرایش اطلاعات کلینیک</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-600">نام کلینیک</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">شعار کلینیک</label>
            <input
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">تخصص</label>
            <input
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">تلفن</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">آدرس</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">آدرس لوگو (URL)</label>
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              dir="ltr"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">رنگ برند</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-9 w-12 rounded-lg border border-gray-200"
              />
              <input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                dir="ltr"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-600">عرض جغرافیایی (Lat)</label>
              <input
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                dir="ltr"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">طول جغرافیایی (Lng)</label>
              <input
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                dir="ltr"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            انصراف
          </button>
          <button
            disabled={!name || isSubmitting}
            onClick={() =>
              onSubmit({
                name,
                phone: phone || undefined,
                address: address || undefined,
                slogan: slogan || undefined,
                specialty: specialty || undefined,
                logo_url: logoUrl || undefined,
                brand_color: brandColor || undefined,
                latitude: latitude || undefined,
                longitude: longitude || undefined,
              })
            }
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
        </div>
      </div>
    </div>
  );
}