"use client";

import { use, useMemo, useState } from "react";

import {
  Plus,
  Search,
  Pencil,
  Ban,
  Sparkles,
  Syringe,
  Scissors,
  Droplet,
  X,
} from "lucide-react";

import Link from "next/link";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getServices,
  createService,
  updateService,
  updateServiceStatus,
  type ClinicService,
} from "@/lib/api/services";

import { queryKeys } from "@/lib/query/keys";
import { LoadingLogo } from "@/components/LoadingLogo";

const ICONS = [Sparkles, Syringe, Scissors, Droplet];

const TONES = [
  "from-primary-light/60 to-primary-light/20",
  "from-pink-200 dark:from-pink-900/50 dark:to-pink-950/30 to-pink-100",
  "from-secondary-purple/60 dark:from-purple-900/50 dark:to-purple-950/30 to-secondary-purple/20",
  "from-secondary-blue/60 dark:from-blue-900/50 dark:to-blue-950/30 to-secondary-blue/20",
];

export default function ServicesManagementPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);

  const [category, setCategory] = useState("همه");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] =
    useState<ClinicService | null>(null);

  const queryClient = useQueryClient();

  const {
    data: services = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.services.list(clinicSlug),
    queryFn: () => getServices(clinicSlug),
    enabled: !!clinicSlug,
  });

  const createMutation = useMutation({
    mutationFn: (
      payload: Parameters<typeof createService>[1]
    ) => createService(clinicSlug, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.services.list(clinicSlug),
      });

      setShowCreateModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateService>[2];
    }) => updateService(clinicSlug, id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.services.list(clinicSlug),
      });

      setEditingService(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => updateServiceStatus(clinicSlug, id, isActive),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.services.list(clinicSlug),
      }),
  });

  // ساخت دسته‌بندی‌ها از داده‌های موجود
  // چون endpoint مستقلی برای دسته‌بندی‌ها نیست، لیست دسته‌ها را از خودِ داده می‌سازیم
  const categories = useMemo(() => {
    const names = new Set<string>();
    services.forEach((s) => {
      if (s.categoryName) names.add(s.categoryName);
    });
    return ["همه", ...Array.from(names)];
  }, [services]);

  // لیست {id, name, color} یکتا برای دراپ‌داون انتخاب دسته‌بندی در فرم افزودن/ویرایش خدمت
  const categoryOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string | null }>();
    services.forEach((s) => {
      if (s.categoryId && s.categoryName && !map.has(s.categoryId)) {
        map.set(s.categoryId, { id: s.categoryId, name: s.categoryName, color: s.categoryColor });
      }
    });
    return Array.from(map.values());
  }, [services]);

  const filtered = services.filter((service) => {
    const matchCategory =
      category === "همه" || service.categoryName === category;

    const keyword = search.trim();

    const matchSearch =
      !keyword ||
      service.name.includes(keyword) ||
      (service.categoryName ?? "").includes(keyword);

    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            خدمات
          </h1>

          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            مدیریت خدمات، قیمت‌ها و مدت‌زمان هر خدمت
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="
            flex items-center justify-center gap-2
            rounded-xl
            bg-primary
            px-5 py-2.5
            text-sm font-medium text-white
            transition
            hover:bg-primary-dark
            active:scale-[0.98]
          "
        >
          <Plus className="h-4 w-4" />
          افزودن خدمت جدید
        </button>
      </div>

      {/* Search + Categories */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div
          className="
            flex items-center gap-2
            rounded-xl
            border border-gray-200
            bg-white
            px-3 py-2.5
            transition
            focus-within:border-primary
            dark:border-gray-700
            dark:bg-gray-900
          "
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی خدمت..."
            className="
              w-full
              bg-transparent
              text-sm
              text-gray-700
              outline-none
              placeholder:text-gray-300
              dark:text-gray-200
              dark:placeholder:text-gray-600
            "
          />

          <Search className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`
                rounded-full
                px-4 py-1.5
                text-xs
                transition
                ${category === c
                  ? "bg-primary text-white shadow-sm"
                  : `
                      border border-gray-200
                      bg-white
                      text-gray-500
                      hover:bg-gray-50
                      dark:border-gray-700
                      dark:bg-gray-900
                      dark:text-gray-400
                      dark:hover:bg-gray-800
                    `
                }
              `}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && <LoadingLogo />}

      {/* Error */}
      {error && (
        <div
          className="
            rounded-2xl
            border border-red-100
            bg-red-50
            py-10
            text-center
            text-sm text-danger
            dark:border-red-900/40
            dark:bg-red-950/20
            dark:text-red-400
          "
        >
          خطا در دریافت خدمات
        </div>
      )}

      {/* Services */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service, index) => {
            const Icon = ICONS[index % ICONS.length];
            const tone = TONES[index % TONES.length];

            return (
              <Link
                key={service.id}
                href={`/clinic/${clinicSlug}/services/${service.id}`}
                className="
                  overflow-hidden
                  rounded-2xl
                  border border-gray-100
                  bg-white
                  shadow-sm
                  transition
                  hover:-translate-y-0.5
                  hover:shadow-md
                  dark:border-gray-800
                  dark:bg-gray-900
                  dark:shadow-black/20
                "
              >
                {/* Service visual */}
                <div
                  className={`
                    flex h-24
                    items-center justify-center
                    bg-gradient-to-br
                    ${tone}
                  `}
                >
                  <Icon className="h-7 w-7 text-white/90 drop-shadow-sm" />
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Name + status */}
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span
                      className="
                        truncate
                        text-sm
                        font-semibold
                        text-gray-800
                        dark:text-gray-100
                      "
                    >
                      {service.name}
                    </span>

                    <span
                      className={`
                        h-2 w-2
                        shrink-0
                        rounded-full
                        ${service.isActive
                          ? "bg-primary shadow-[0_0_0_3px_rgba(14,165,164,0.12)]"
                          : "bg-gray-300 dark:bg-gray-600"
                        }
                      `}
                    />
                  </div>

                  {/* Category + duration */}
                  <div
                    className="
                      mb-3
                      flex items-center gap-2
                      text-[11px]
                      text-gray-400
                      dark:text-gray-500
                    "
                  >
                    <span>
                      {service.categoryName ?? "بدون دسته"}
                    </span>

                    <span>·</span>

                    <span>
                      {service.defaultDurationMinutes.toLocaleString(
                        "fa-IR"
                      )}{" "}
                      دقیقه
                    </span>
                  </div>

                  {/* Price + actions */}
                  <div className="flex items-center justify-between">
                    <span
                      className="
                        text-xs
                        font-bold
                        text-gray-800
                        dark:text-gray-100
                      "
                    >
                      {service.basePrice != null
                        ? `${service.basePrice.toLocaleString(
                          "fa-IR"
                        )} تومان`
                        : "—"}
                    </span>

                    <div className="flex gap-1">
                      {/* Edit */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingService(service);
                        }}
                        className="
                          rounded-lg
                          border border-gray-200
                          bg-white
                          p-1.5
                          text-gray-400
                          transition
                          hover:border-primary/30
                          hover:bg-primary/5
                          hover:text-primary-dark
                          dark:border-gray-700
                          dark:bg-gray-800
                          dark:text-gray-500
                          dark:hover:bg-primary/10
                          dark:hover:text-primary
                        "
                        title="ویرایش خدمت"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      {/* Activate / Deactivate */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          statusMutation.mutate({ id: service.id, isActive: !service.isActive });
                        }}
                        disabled={statusMutation.isPending}
                        title={
                          service.isActive
                            ? "غیرفعال کردن"
                            : "فعال کردن"
                        }
                        className="
                          rounded-lg
                          border border-gray-200
                          bg-white
                          p-1.5
                          text-gray-400
                          transition
                          hover:border-red-200
                          hover:bg-red-50
                          hover:text-danger
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                          dark:border-gray-700
                          dark:bg-gray-800
                          dark:text-gray-500
                          dark:hover:border-red-900/50
                          dark:hover:bg-red-950/30
                          dark:hover:text-red-400
                        "
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Empty */}
          {filtered.length === 0 && (
            <div
              className="
                col-span-full
                rounded-2xl
                border border-dashed border-gray-200
                bg-white
                py-10
                text-center
                text-sm text-gray-400
                dark:border-gray-700
                dark:bg-gray-900
                dark:text-gray-500
              "
            >
              خدمتی یافت نشد.
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
            {showCreateModal && (
        <ServiceFormModal
          title="افزودن خدمت جدید"
          categoryOptions={categoryOptions}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(payload) => createMutation.mutate(payload)}
          isSubmitting={createMutation.isPending}
          error={createMutation.error instanceof Error ? createMutation.error.message : null}
        />
      )}

      {editingService && (
        <ServiceFormModal
          title="ویرایش خدمت"
          initial={editingService}
          categoryOptions={categoryOptions}
          onClose={() => setEditingService(null)}
          onSubmit={(payload) => updateMutation.mutate({ id: editingService.id, payload })}
          isSubmitting={updateMutation.isPending}
          error={updateMutation.error instanceof Error ? updateMutation.error.message : null}
        />
      )}
    </div>
  );
}

/* =========================================================
   Service Form Modal
========================================================= */

function ServiceFormModal({
  title,
  initial,
  categoryOptions,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  title: string;
  initial?: ClinicService;
  categoryOptions: { id: string; name: string; color: string | null }[];
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    description?: string;
    category_id?: string;
    default_duration_minutes: number;
    base_price?: number;
    requires_consent?: boolean;
    requires_before_after_images?: boolean;
    requires_followup?: boolean;
  }) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [duration, setDuration] = useState(String(initial?.defaultDurationMinutes ?? 30));
  const [price, setPrice] = useState(initial?.basePrice?.toString() ?? "");
  const [requiresConsent, setRequiresConsent] = useState(initial?.requiresConsent ?? false);
  const [requiresImages, setRequiresImages] = useState(initial?.requiresBeforeAfterImages ?? false);
  const [requiresFollowup, setRequiresFollowup] = useState(initial?.requiresFollowup ?? false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-600">نام خدمت</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">دسته‌بندی (اختیاری)</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">بدون دسته‌بندی</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {categoryOptions.length === 0 && (
              <p className="mt-1 text-[10px] text-gray-400">
                هنوز هیچ دسته‌بندی‌ای در سیستم ثبت نشده — می‌توانید خدمت را بدون دسته‌بندی ثبت کنید.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">توضیحات (اختیاری)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-600">مدت‌زمان (دقیقه)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">قیمت پایه (تومان)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input type="checkbox" checked={requiresConsent} onChange={(e) => setRequiresConsent(e.target.checked)} />
              نیازمند رضایت‌نامه
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input type="checkbox" checked={requiresImages} onChange={(e) => setRequiresImages(e.target.checked)} />
              نیازمند تصاویر قبل/بعد
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input type="checkbox" checked={requiresFollowup} onChange={(e) => setRequiresFollowup(e.target.checked)} />
              نیازمند نوبت پیگیری
            </label>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            انصراف
          </button>
          <button
            disabled={!name || !duration || isSubmitting}
            onClick={() =>
              onSubmit({
                name,
                description: description || undefined,
                category_id: categoryId || undefined,
                default_duration_minutes: Number(duration),
                base_price: price ? Number(price) : undefined,
                requires_consent: requiresConsent,
                requires_before_after_images: requiresImages,
                requires_followup: requiresFollowup,
              })
            }
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {isSubmitting ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </div>
    </div>
  );
}