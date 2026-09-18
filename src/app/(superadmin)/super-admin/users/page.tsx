"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

import {
  Plus,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  Building2,
  CheckCircle2,
  XCircle,
  Layers,
  X,
  Loader2,
  Globe,
  Phone,
} from "lucide-react";

import Image from "next/image";

// مسیر زیر را متناسب با ساختار پروژه‌ی خودت تنظیم کن — همان پوشه‌ای که superAdminApi در آن قرار دارد.
import {
  partnerClinicsApi,
  type PartnerClinic,
  type PartnerClinicPayload,
} from "@/lib/api/partner-clinics";

/* ------------------------------------------------------------------ */
/*  Form state                                                          */
/* ------------------------------------------------------------------ */
type ClinicFormState = {
  name: string;
  category: string;
  logo_url: string;
  description: string;
  website_url: string;
  phone: string;
  is_active: boolean;
};

const EMPTY_FORM: ClinicFormState = {
  name: "",
  category: "",
  logo_url: "",
  description: "",
  website_url: "",
  phone: "",
  is_active: true,
};

const STATUS_FILTERS: { value: "all" | "active" | "inactive"; label: string }[] = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
];

const inputClass = `
  w-full
  rounded-xl
  border
  border-gray-200
  bg-white
  px-3
  py-2
  text-xs
  text-gray-700
  outline-none
  transition
  focus:border-primary
  dark:border-white/10
  dark:bg-white/[0.025]
  dark:text-gray-200
  dark:focus:border-primary-light
`;

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function toPayload(form: ClinicFormState): PartnerClinicPayload {
  return {
    name: form.name.trim(),
    category: form.category.trim(),
    logo_url: form.logo_url.trim() || null,
    description: form.description.trim() || null,
    website_url: form.website_url.trim() || null,
    phone: form.phone.trim() || null,
    is_active: form.is_active,
  };
}

export default function PartnerClinicsPage() {
  const [clinics, setClinics] = useState<PartnerClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClinicFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Fetch list                                                        */
  /* ---------------------------------------------------------------- */
  const fetchClinics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await partnerClinicsApi.getPartnerClinics();
      setClinics(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  /* ---------------------------------------------------------------- */
  /*  Derived data                                                      */
  /* ---------------------------------------------------------------- */
  const categories = useMemo(() => {
    const unique = new Set(clinics.map((clinic) => clinic.category));
    return Array.from(unique);
  }, [clinics]);

  const filteredClinics = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return clinics.filter((clinic) => {
      const matchCategory =
        categoryFilter === "all" || clinic.category === categoryFilter;

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && clinic.is_active) ||
        (statusFilter === "inactive" && !clinic.is_active);

      const matchSearch =
        keyword === "" ||
        clinic.name.toLowerCase().includes(keyword) ||
        clinic.category.toLowerCase().includes(keyword) ||
        (clinic.phone ?? "").toLowerCase().includes(keyword);

      return matchCategory && matchStatus && matchSearch;
    });
  }, [clinics, search, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredClinics.length / pageSize));

  const pagedClinics = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClinics.slice(start, start + pageSize);
  }, [filteredClinics, currentPage]);

  const stats = useMemo(
    () => ({
      total: clinics.length,
      active: clinics.filter((clinic) => clinic.is_active).length,
      inactive: clinics.filter((clinic) => !clinic.is_active).length,
      categories: categories.length,
    }),
    [clinics, categories]
  );

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                          */
  /* ---------------------------------------------------------------- */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(event.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(event.target.value as "all" | "active" | "inactive");
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (clinic: PartnerClinic) => {
    setModalMode("edit");
    setEditingId(clinic.id);
    setForm({
      name: clinic.name,
      category: clinic.category,
      logo_url: clinic.logo_url ?? "",
      description: clinic.description ?? "",
      website_url: clinic.website_url ?? "",
      phone: clinic.phone ?? "",
      is_active: clinic.is_active,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!form.name.trim() || !form.category.trim()) {
      setFormError("نام کلینیک و دسته‌بندی الزامی است.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = toPayload(form);

      if (modalMode === "create") {
        await partnerClinicsApi.createPartnerClinic(payload);
      } else if (editingId) {
        await partnerClinicsApi.updatePartnerClinic(editingId, payload);
      }

      setModalOpen(false);
      await fetchClinics();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "خطایی رخ داد. دوباره تلاش کنید."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (clinic: PartnerClinic) => {
    setTogglingId(clinic.id);
    setError(null);

    try {
      await partnerClinicsApi.updatePartnerClinic(clinic.id, {
        name: clinic.name,
        category: clinic.category,
        logo_url: clinic.logo_url,
        description: clinic.description,
        website_url: clinic.website_url,
        phone: clinic.phone,
        is_active: !clinic.is_active,
      });

      setClinics((prev) =>
        prev.map((item) =>
          item.id === clinic.id ? { ...item, is_active: !item.is_active } : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "تغییر وضعیت کلینیک ناموفق بود."
      );
    } finally {
      setTogglingId(null);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                            */
  /* ---------------------------------------------------------------- */
  return (
    <div dir="rtl" className="space-y-6 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
            کلینیک‌های طرف‌قرارداد
          </h1>

          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            مدیریت مراکز و کلینیک‌های همکار جهت ارائه تخفیف به بیماران
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="
            flex items-center justify-center gap-2
            rounded-xl
            bg-primary
            px-5 py-2.5
            text-sm font-medium
            text-white
            transition
            hover:bg-primary-dark
            active:scale-[0.98]
            dark:shadow-glow-primary
          "
        >
          <Plus className="h-4 w-4" />
          افزودن کلینیک جدید
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Building2}
          tone="text-primary-dark bg-primary-light/20 dark:bg-primary/10 dark:text-primary-light"
          label="کل کلینیک‌ها"
          value={stats.total}
        />

        <StatCard
          icon={CheckCircle2}
          tone="bg-secondary-blue/40 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
          label="کلینیک‌های فعال"
          value={stats.active}
        />

        <StatCard
          icon={XCircle}
          tone="bg-secondary-pink/40 text-pink-600 dark:bg-pink-500/10 dark:text-pink-300"
          label="کلینیک‌های غیرفعال"
          value={stats.inactive}
        />

        <StatCard
          icon={Layers}
          tone="bg-secondary-purple/40 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300"
          label="دسته‌بندی‌ها"
          value={stats.categories}
        />
      </div>

      {/* Table card */}
      <div
        className="
          rounded-2xl
          border border-gray-100
          bg-white
          p-4
          shadow-sm
          dark:border-white/[0.07]
          dark:bg-white/[0.025]
          dark:shadow-none
          sm:p-5
        "
      >
        {/* Filters */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="
              flex
              w-full
              items-center
              gap-2
              rounded-xl
              border
              border-gray-200
              bg-white
              px-3
              py-2.5
              transition
              focus-within:border-primary
              focus-within:ring-2
              focus-within:ring-primary/10
              dark:border-white/10
              dark:bg-white/[0.025]
              dark:focus-within:border-primary-light
              dark:focus-within:ring-primary/10
              lg:w-80
            "
          >
            <Search className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-500" />

            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="جستجوی نام، دسته‌بندی یا تلفن..."
              className="
                w-full
                bg-transparent
                text-xs
                text-gray-700
                outline-none
                placeholder:text-gray-300
                dark:text-gray-200
                dark:placeholder:text-gray-600
              "
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={handleCategoryChange}
              className="
                rounded-xl
                border
                border-gray-200
                bg-white
                px-3
                py-2.5
                text-xs
                text-gray-600
                outline-none
                transition
                focus:border-primary
                dark:border-white/10
                dark:bg-[#151a19]
                dark:text-gray-300
                dark:focus:border-primary-light
              "
            >
              <option value="all">همه دسته‌بندی‌ها</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="
                rounded-xl
                border
                border-gray-200
                bg-white
                px-3
                py-2.5
                text-xs
                text-gray-600
                outline-none
                transition
                focus:border-primary
                dark:border-white/10
                dark:bg-[#151a19]
                dark:text-gray-300
                dark:focus:border-primary-light
              "
            >
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchClinics}
              className="
                flex
                items-center
                gap-1.5
                rounded-xl
                border
                border-gray-200
                bg-white
                px-3
                py-2.5
                text-xs
                text-gray-600
                transition
                hover:bg-gray-50
                dark:border-white/10
                dark:bg-white/[0.025]
                dark:text-gray-300
                dark:hover:bg-white/[0.05]
              "
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              به‌روزرسانی
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-xs text-danger">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 dark:border-white/[0.07] dark:text-gray-500">
                <th className="py-3 font-medium">کلینیک</th>
                <th className="py-3 font-medium">دسته‌بندی</th>
                <th className="py-3 font-medium">تماس / وبسایت</th>
                <th className="py-3 font-medium">تاریخ ثبت</th>
                <th className="py-3 font-medium">وضعیت</th>
                <th className="py-3 font-medium">عملیات</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      در حال دریافت اطلاعات...
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                pagedClinics.map((clinic) => (
                  <tr
                    key={clinic.id}
                    className="
                      border-b
                      border-gray-50
                      transition
                      hover:bg-gray-50/70
                      dark:border-white/[0.05]
                      dark:hover:bg-white/[0.025]
                    "
                  >
                    {/* Clinic */}
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <Image
                          src={clinic.logo_url || "/image/user.PNG"}
                          alt={clinic.name}
                          width={34}
                          height={34}
                          unoptimized
                          className="
                            h-[34px]
                            w-[34px]
                            shrink-0
                            rounded-full
                            object-cover
                            ring-1
                            ring-gray-100
                            dark:ring-white/10
                          "
                        />

                        <div className="min-w-0">
                          <div className="truncate font-medium text-gray-800 dark:text-gray-200">
                            {clinic.name}
                          </div>

                          {clinic.description && (
                            <div className="mt-0.5 truncate text-[10px] text-gray-400 dark:text-gray-500">
                              {clinic.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3">
                      <span
                        className="
                          inline-flex
                          rounded-full
                          bg-primary-light/20
                          px-2.5
                          py-1
                          text-[11px]
                          text-primary-dark
                          dark:bg-primary/10
                          dark:text-primary-light
                        "
                      >
                        {clinic.category}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col gap-1">
                        {clinic.phone ? (
                          <span className="flex items-center gap-1.5" dir="ltr">
                            <Phone className="h-3 w-3 shrink-0" />
                            {clinic.phone}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">
                            —
                          </span>
                        )}

                        {clinic.website_url && (
                          <a
                            href={clinic.website_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-primary-dark hover:underline dark:text-primary-light"
                          >
                            <Globe className="h-3 w-3 shrink-0" />
                            وبسایت
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Created */}
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(clinic.created_at)}
                    </td>

                    {/* Status */}
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(clinic)}
                        disabled={togglingId === clinic.id}
                        className={`
                          inline-flex
                          items-center
                          gap-1.5
                          disabled:opacity-50
                          ${
                            clinic.is_active
                              ? "text-primary-dark dark:text-primary-light"
                              : "text-danger"
                          }
                        `}
                      >
                        {togglingId === clinic.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        )}
                        {clinic.is_active ? "فعال" : "غیرفعال"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(clinic)}
                          className="
                            rounded-lg
                            border
                            border-gray-200
                            px-2.5
                            py-1.5
                            text-[11px]
                            text-gray-600
                            transition
                            hover:bg-gray-50
                            dark:border-white/10
                            dark:text-gray-300
                            dark:hover:bg-white/[0.05]
                          "
                        >
                          ویرایش
                        </button>

                        <button
                          type="button"
                          aria-label={`عملیات ${clinic.name}`}
                          className="
                            rounded-lg
                            border
                            border-gray-200
                            p-1.5
                            text-gray-400
                            transition
                            hover:bg-gray-50
                            hover:text-gray-600
                            dark:border-white/10
                            dark:text-gray-500
                            dark:hover:bg-white/[0.05]
                            dark:hover:text-gray-300
                          "
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && filteredClinics.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-sm text-gray-400 dark:text-gray-500"
                  >
                    هیچ کلینیکی با این مشخصات پیدا نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredClinics.length > 0 && (
          <div className="mt-5 flex flex-col-reverse items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row dark:border-white/[0.07]">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              نمایش {pagedClinics.length.toLocaleString("fa-IR")} از{" "}
              {filteredClinics.length.toLocaleString("fa-IR")} کلینیک
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="
                  rounded-lg
                  border
                  border-gray-200
                  px-3
                  py-1.5
                  text-xs
                  text-gray-500
                  transition
                  hover:bg-gray-50
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  dark:border-white/10
                  dark:hover:bg-white/[0.05]
                "
              >
                قبلی
              </button>

              <span className="px-2 text-xs text-gray-500 dark:text-gray-400">
                صفحه {currentPage.toLocaleString("fa-IR")} از{" "}
                {totalPages.toLocaleString("fa-IR")}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages}
                className="
                  rounded-lg
                  border
                  border-gray-200
                  px-3
                  py-1.5
                  text-xs
                  text-gray-500
                  transition
                  hover:bg-gray-50
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  dark:border-white/10
                  dark:hover:bg-white/[0.05]
                "
              >
                بعدی
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            dir="rtl"
            onClick={(event) => event.stopPropagation()}
            className="
              w-full
              max-w-lg
              rounded-2xl
              bg-white
              p-5
              shadow-xl
              dark:bg-[#151a19]
              dark:border
              dark:border-white/10
            "
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {modalMode === "create"
                  ? "افزودن کلینیک طرف‌قرارداد"
                  : "ویرایش کلینیک طرف‌قرارداد"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                aria-label="بستن"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <FormField label="نام کلینیک" required>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className={inputClass}
                  placeholder="مثال: کلینیک دندانپزشکی آفتاب"
                />
              </FormField>

              <FormField label="دسته‌بندی" required>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  className={inputClass}
                  placeholder="مثال: دندانپزشکی"
                />
              </FormField>

              <FormField label="توضیحات">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={2}
                  className={`${inputClass} resize-none`}
                  placeholder="همکار طرف‌قرارداد جهت ارائه تخفیف ویژه به بیماران"
                />
              </FormField>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="لینک لوگو">
                  <input
                    name="logo_url"
                    value={form.logo_url}
                    onChange={handleFormChange}
                    className={inputClass}
                    dir="ltr"
                    placeholder="https://..."
                  />
                </FormField>

                <FormField label="وبسایت">
                  <input
                    name="website_url"
                    value={form.website_url}
                    onChange={handleFormChange}
                    className={inputClass}
                    dir="ltr"
                    placeholder="https://..."
                  />
                </FormField>
              </div>

              <FormField label="تلفن">
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                  className={inputClass}
                  dir="ltr"
                  placeholder="0912-000-0000"
                />
              </FormField>

              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleFormChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                کلینیک فعال باشد
              </label>

              {formError && (
                <div className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">
                  {formError}
                </div>
              )}

              <div className="mt-2 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="
                    rounded-xl
                    border
                    border-gray-200
                    px-4
                    py-2
                    text-xs
                    text-gray-600
                    transition
                    hover:bg-gray-50
                    disabled:opacity-50
                    dark:border-white/10
                    dark:text-gray-300
                    dark:hover:bg-white/[0.05]
                  "
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="
                    flex
                    items-center
                    gap-1.5
                    rounded-xl
                    bg-primary
                    px-4
                    py-2
                    text-xs
                    font-medium
                    text-white
                    transition
                    hover:bg-primary-dark
                    disabled:opacity-60
                  "
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {modalMode === "create" ? "افزودن کلینیک" : "ذخیره تغییرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children}
    </div>
  );
}

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
        flex
        items-center
        gap-3
        rounded-2xl
        border
        border-gray-100
        bg-white
        p-4
        transition
        hover:-translate-y-0.5
        hover:shadow-sm
        dark:border-white/[0.07]
        dark:bg-white/[0.025]
        dark:hover:bg-white/[0.04]
        dark:hover:shadow-none
      "
    >
      <div
        className={`
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-full
          ${tone}
        `}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
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