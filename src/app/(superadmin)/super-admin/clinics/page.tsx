"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Building2,
  CheckCircle2,
  XCircle,
  Ban,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";

import {
  superAdminApi,
  type Clinic,
} from "@/lib/api/super-admin";

import { ApiError } from "@/lib/api/client";

import { queryKeys } from "@/lib/query/keys";

const STATUS_LABELS: Record<
  Clinic["status"],
  {
    label: string;
    tone: string;
    dot: string;
    badge: string;
  }
> = {
  active: {
    label: "فعال",
    tone: "text-primary-dark dark:text-primary-light",
    dot: "bg-primary-dark dark:bg-primary-light",
    badge:
      "bg-primary-light/20 text-primary-dark dark:bg-primary/10 dark:text-primary-light",
  },

  inactive: {
    label: "غیرفعال",
    tone: "text-gray-500 dark:text-gray-400",
    dot: "bg-gray-400 dark:bg-gray-500",
    badge:
      "bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400",
  },

  suspended: {
    label: "معلق",
    tone: "text-danger",
    dot: "bg-danger",
    badge: "bg-red-50 text-danger dark:bg-red-500/10 dark:text-red-400",
  },
};

const STATUS_FILTERS: {
  value: Clinic["status"] | "all";
  label: string;
}[] = [
    { value: "all", label: "همه" },
    { value: "active", label: "فعال" },
    { value: "inactive", label: "غیرفعال" },
    { value: "suspended", label: "معلق" },
  ];

export default function ClinicsListPage() {
  const [statusFilter, setStatusFilter] =
    useState<Clinic["status"] | "all">("all");

  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: clinics = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.superAdmin.clinics.list(),
    queryFn: superAdminApi.getClinics,
  });

  /*
   * تغییر وضعیت کلینیک
   */
  const statusMutation = useMutation({
    mutationFn: ({
      clinicId,
      status,
    }: {
      clinicId: string;
      status: Clinic["status"];
    }) => superAdminApi.updateClinicStatus(clinicId, status),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.superAdmin.clinics.list(),
      });
    },
  });

  /*
   * ایجاد کلینیک
   */
  const createMutation = useMutation({
    mutationFn: superAdminApi.createClinic,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.superAdmin.clinics.list(),
      });

      setShowCreateModal(false);
    },
  });

  /*
   * فیلتر کلینیک‌ها
   */
  const filteredClinics = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return clinics.filter((clinic) => {
      const matchSearch =
        !normalizedSearch ||
        clinic.name.toLowerCase().includes(normalizedSearch) ||
        (clinic.phone ?? "").toLowerCase().includes(normalizedSearch);

      const matchStatus =
        statusFilter === "all" || clinic.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [clinics, search, statusFilter]);

  /*
   * آمار
   */
  const stats = useMemo(
    () => ({
      total: clinics.length,

      active: clinics.filter((clinic) => clinic.status === "active").length,

      inactive: clinics.filter(
        (clinic) => clinic.status !== "active"
      ).length,
    }),
    [clinics]
  );

  /*
   * خطای Mutation
   */
  const createError = (() => {
    const err = createMutation.error;
    if (!err) return null;
    if (err instanceof ApiError && err.code === "PHONE_BELONGS_TO_PATIENT") {
      return "این شماره موبایل قبلاً متعلق به یک حساب بیمار است؛ شماره دیگری برای مدیر کلینیک انتخاب کنید.";
    }
    return err instanceof Error ? err.message : null;
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
            کلینیک‌ها
          </h1>

          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            مدیریت تمام کلینیک‌های ثبت‌شده در سامانه
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="
            flex items-center justify-center gap-2
            rounded-xl
            bg-primary
            px-5 py-2.5
            text-sm font-medium text-white
            shadow-sm
            transition
            hover:bg-primary-dark
            dark:bg-primary
            dark:hover:bg-primary-light
          "
        >
          <Plus className="h-4 w-4" />
          افزودن کلینیک جدید
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Building2}
          tone="
            text-primary-dark bg-primary-light/20
            dark:bg-primary/10 dark:text-primary-light
          "
          label="کل کلینیک‌ها"
          value={stats.total}
        />

        <StatCard
          icon={CheckCircle2}
          tone="
            text-primary-dark bg-primary-light/20
            dark:bg-primary/10 dark:text-primary-light
          "
          label="کلینیک‌های فعال"
          value={stats.active}
        />

        <StatCard
          icon={XCircle}
          tone="
            text-danger bg-red-50
            dark:bg-red-500/10 dark:text-red-400
          "
          label="غیرفعال / معلق"
          value={stats.inactive}
        />
      </div>

      {/* Main table card */}
      <div
        className="
          rounded-2xl
          border border-gray-100
          bg-white
          p-5
          shadow-sm
          dark:border-white/[0.08]
          dark:bg-white/[0.025]
          dark:shadow-none
        "
      >
        {/* Toolbar */}
        <div
          className="
            mb-5
            flex flex-col gap-3
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          {/* Search */}
          <div
            className="
              flex items-center gap-2
              rounded-xl
              border border-gray-200
              bg-transparent
              px-3 py-2.5
              transition
              focus-within:border-primary
              dark:border-white/[0.1]
              dark:focus-within:border-primary-light/50
              lg:w-80
            "
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-500" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جستجوی نام یا تلفن کلینیک..."
              className="
                w-full
                bg-transparent
                text-right
                text-xs
                text-gray-700
                outline-none
                placeholder:text-gray-300
                dark:text-gray-200
                dark:placeholder:text-gray-600
              "
            />
          </div>

          {/* Status filters */}
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((filter) => {
              const isSelected = statusFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`
                    rounded-xl
                    border
                    px-3 py-2
                    text-xs
                    transition
                    ${isSelected
                      ? `
                          border-primary
                          bg-primary-light/10
                          text-primary-dark
                          dark:border-primary-light/40
                          dark:bg-primary/10
                          dark:text-primary-light
                        `
                      : `
                          border-gray-200
                          text-gray-600
                          hover:bg-gray-50
                          dark:border-white/[0.1]
                          dark:text-gray-400
                          dark:hover:bg-white/[0.05]
                        `
                    }
                  `}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-14">
            <Loader2 className="mb-3 h-5 w-5 animate-spin text-primary" />

            <span className="text-sm text-gray-400 dark:text-gray-500">
              در حال بارگذاری کلینیک‌ها...
            </span>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-center text-sm text-danger dark:border-red-500/10 dark:bg-red-500/5 dark:text-red-400">
            خطا در دریافت لیست کلینیک‌ها
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table
              className="
                w-full
                min-w-[720px]
                text-right
                text-xs
              "
            >
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.07]">
                  <th className="py-3 font-medium text-gray-400 dark:text-gray-500">
                    نام کلینیک
                  </th>

                  <th className="py-3 font-medium text-gray-400 dark:text-gray-500">
                    تلفن
                  </th>

                  <th className="py-3 font-medium text-gray-400 dark:text-gray-500">
                    تخصص
                  </th>

                  <th className="py-3 font-medium text-gray-400 dark:text-gray-500">
                    وضعیت
                  </th>

                  <th className="py-3 font-medium text-gray-400 dark:text-gray-500">
                    عملیات
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredClinics.map((clinic) => {
                  const status = STATUS_LABELS[clinic.status];

                  const isUpdating =
                    statusMutation.isPending &&
                    statusMutation.variables?.clinicId === clinic.id;

                  return (
                    <tr
                      key={clinic.id}
                      className="
                        border-b border-gray-50
                        transition
                        hover:bg-gray-50/70
                        dark:border-white/[0.05]
                        dark:hover:bg-white/[0.025]
                      "
                    >
                      {/* Clinic name */}
                      <td className="py-3.5">
                        <Link
                          href={`/super-admin/clinics/${clinic.id}`}
                          className="
                            inline-flex
                            items-center
                            gap-2
                            font-medium
                            text-gray-800
                            transition
                            hover:text-primary-dark
                            dark:text-gray-200
                            dark:hover:text-primary-light
                          "
                        >
                          <span
                            className="
                              flex h-8 w-8
                              items-center justify-center
                              rounded-lg
                              bg-primary-light/20
                              text-primary-dark
                              dark:bg-primary/10
                              dark:text-primary-light
                            "
                          >
                            <Building2 className="h-4 w-4" />
                          </span>

                          <span>
                            <span className="block">{clinic.name}</span>
                            <span
                              className="block text-[10px] font-normal text-gray-400 dark:text-gray-500"
                              dir="ltr"
                            >
                              /{clinic.slug}
                            </span>
                          </span>
                        </Link>
                      </td>

                      {/* Phone */}
                      <td
                        className="py-3.5 text-gray-500 dark:text-gray-400"
                        dir="ltr"
                      >
                        {clinic.phone ?? "-"}
                      </td>

                      <td
                        className="py-3.5 text-gray-500 dark:text-gray-400"
                        dir="ltr"
                      >
                        {clinic.specialty ?? "-"}
                      </td>

                      {/* Status */}
                      <td className="py-3.5">
                        <span
                          className={`
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-full
                            px-2.5 py-1
                            text-[11px]
                            ${status.badge}
                          `}
                        >
                          <span
                            className={`
                              h-1.5 w-1.5
                              rounded-full
                              ${status.dot}
                            `}
                          />

                          {status.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`/c/${clinic.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="مشاهده صفحه عمومی"
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-lg
                              border border-gray-200
                              px-2.5 py-1.5
                              text-[11px]
                              text-gray-500
                              transition
                              hover:border-gray-300
                              hover:bg-gray-50
                              dark:border-white/[0.1]
                              dark:text-gray-400
                              dark:hover:border-white/[0.16]
                              dark:hover:bg-white/[0.05]
                            "
                          >
                            <ExternalLink className="h-3 w-3" />
                            صفحه عمومی
                          </a>

                          <button
                          type="button"
                          onClick={() =>
                            statusMutation.mutate({
                              clinicId: clinic.id,

                              status:
                                clinic.status === "active"
                                  ? "suspended"
                                  : "active",
                            })
                          }
                          disabled={statusMutation.isPending}
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-lg
                            border border-gray-200
                            px-2.5 py-1.5
                            text-[11px]
                            text-gray-500
                            transition
                            hover:border-gray-300
                            hover:bg-gray-50
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                            dark:border-white/[0.1]
                            dark:text-gray-400
                            dark:hover:border-white/[0.16]
                            dark:hover:bg-white/[0.05]
                          "
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Ban className="h-3 w-3" />
                          )}

                          {clinic.status === "active"
                            ? "تعلیق"
                            : "فعال‌سازی"}
                        </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Empty */}
                {filteredClinics.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-14 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className="
                            mb-3
                            flex h-12 w-12
                            items-center justify-center
                            rounded-full
                            bg-gray-100
                            text-gray-400
                            dark:bg-white/[0.06]
                            dark:text-gray-500
                          "
                        >
                          <Building2 className="h-5 w-5" />
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          هیچ کلینیکی پیدا نشد.
                        </p>

                        {(search || statusFilter !== "all") && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearch("");
                              setStatusFilter("all");
                            }}
                            className="
                              mt-2
                              text-xs
                              text-primary-dark
                              hover:underline
                              dark:text-primary-light
                            "
                          >
                            حذف فیلترها
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!isLoading && !error && (
          <div
            className="
              mt-4
              flex
              flex-col
              gap-2
              text-xs
              text-gray-400
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <span>
              نمایش{" "}
              <strong className="font-medium text-gray-600 dark:text-gray-300">
                {filteredClinics.length.toLocaleString("fa-IR")}
              </strong>{" "}
              از{" "}
              <strong className="font-medium text-gray-600 dark:text-gray-300">
                {clinics.length.toLocaleString("fa-IR")}
              </strong>{" "}
              کلینیک
            </span>

            <Link
              href="/super-admin/dashboard"
              className="
                text-primary-dark
                transition
                hover:underline
                dark:text-primary-light
              "
            >
              بازگشت به داشبورد
            </Link>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateClinicModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(payload) => createMutation.mutate(payload)}
          isSubmitting={createMutation.isPending}
          error={createError}
        />
      )}
    </div>
  );
}

/* =========================================================
   Stat Card
========================================================= */

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: typeof Building2;
  tone: string;
  label: string;
  value: number;
}) {
  return (
    <div
      className="
        flex items-center gap-3
        rounded-2xl
        border border-gray-100
        bg-white
        p-4
        shadow-sm
        dark:border-white/[0.08]
        dark:bg-white/[0.025]
        dark:shadow-none
      "
    >
      <div
        className={`
          flex h-11 w-11
          shrink-0
          items-center justify-center
          rounded-full
          ${tone}
        `}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <div className="text-lg font-bold text-gray-900 dark:text-white">
          {value.toLocaleString("fa-IR")}
        </div>

        <div className="text-xs text-gray-400 dark:text-gray-500">
          {label}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Create Clinic Modal
========================================================= */

function CreateClinicModal({
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    slug: string;
    phone?: string;
    address?: string;
    slogan?: string;
    specialty?: string;
    logo_url?: string;
    brand_color?: string;
    latitude?: string;
    longitude?: string;
    admin_full_name: string;
    admin_phone: string;
    admin_password: string;
  }) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [slogan, setSlogan] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("#0EA5A4");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [adminFullName, setAdminFullName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">افزودن کلینیک جدید</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-600">نام کلینیک *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="کلینیک پوست و مو نگین"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">شناسه یکتا (slug) *</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              dir="ltr"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="negin-clinic"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">شعار کلینیک</label>
            <input
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="پوست سالم، اعتماد به‌نفس بیشتر"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">تخصص</label>
            <input
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="پوست و مو"
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
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              rows={2}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">آدرس لوگو (URL)</label>
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              dir="ltr"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="https://..."
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
          <div className="mt-2 border-t border-gray-100 pt-3">
            <p className="mb-2 text-xs font-medium text-gray-700">
              اولین مدیر کلینیک *
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-600">نام و نام خانوادگی مدیر *</label>
                <input
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="دکتر سارا محمدی"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">شماره موبایل مدیر *</label>
                <input
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  dir="ltr"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="09121234567"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">رمز عبور اولیه * (حداقل ۸ کاراکتر)</label>
                <input
                  type="text"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  dir="ltr"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="رمز اولیه"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  مدیر کلینیک باید در اولین ورود این رمز را تغییر دهد.
                </p>
              </div>
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
                placeholder="35.7219"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">طول جغرافیایی (Lng)</label>
              <input
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                dir="ltr"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="51.3347"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            انصراف
          </button>
          <button
            disabled={
              !name ||
              !slug ||
              !adminFullName ||
              !adminPhone ||
              adminPassword.length < 8 ||
              isSubmitting
            }
            onClick={() =>
              onSubmit({
                name,
                slug,
                phone: phone || undefined,
                address: address || undefined,
                slogan: slogan || undefined,
                specialty: specialty || undefined,
                logo_url: logoUrl || undefined,
                brand_color: brandColor || undefined,
                latitude: latitude || undefined,
                longitude: longitude || undefined,
                admin_full_name: adminFullName,
                admin_phone: adminPhone,
                admin_password: adminPassword,
              })
            }
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {isSubmitting ? "در حال ثبت..." : "ثبت کلینیک"}
          </button>
        </div>
      </div>
    </div>
  );
}