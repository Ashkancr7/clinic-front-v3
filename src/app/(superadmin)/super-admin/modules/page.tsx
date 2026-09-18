"use client";

import { useMemo, useState } from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Search,
  LayoutGrid,
  Check,
  X,
} from "lucide-react";

import { superAdminApi } from "@/lib/api/super-admin";

import {
  getClinicModulesByClinicId,
  updateClinicModuleByClinicId,
} from "@/lib/api/super-admin-modules";

import { queryKeys } from "@/lib/query/keys";

const MODULE_LABELS: Record<string, string> = {
  appointments: "نوبت‌دهی",
  chat: "چت",
  consents: "رضایت‌نامه‌ها",
  files: "فایل‌ها و تصاویر",
  finance: "مالی",
  intake: "فرم پذیرش",
  patients: "مراجعین",
  reports: "گزارش‌ها",
  services: "خدمات",
  sms: "پیامک",
  video: "تماس تصویری",
  visits: "جلسات درمان",
};

export default function SuperAdminModulesPage() {
  const [search, setSearch] = useState("");
  const [selectedClinicId, setSelectedClinicId] =
    useState<string | null>(null);

  const queryClient = useQueryClient();

  // ============================================================
  // Clinics
  // ============================================================

  const {
    data: clinics = [],
    isLoading: clinicsLoading,
  } = useQuery({
    queryKey: queryKeys.superAdmin.clinics.list(),

    queryFn: superAdminApi.getClinics,
  });

  const filteredClinics = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return clinics;
    }

    return clinics.filter((clinic) => {
      const name =
        clinic.name?.toLowerCase() ?? "";

      const phone =
        clinic.phone?.toLowerCase() ?? "";

      return (
        name.includes(normalizedSearch) ||
        phone.includes(normalizedSearch)
      );
    });
  }, [clinics, search]);

  const selectedClinic =
    clinics.find(
      (clinic) => clinic.id === selectedClinicId
    ) ?? null;

  // ============================================================
  // Modules
  // ============================================================

  const {
    data: modules = [],
    isLoading: modulesLoading,
  } = useQuery({
    queryKey: queryKeys.superAdminModules.list(
      selectedClinicId ?? ""
    ),

    queryFn: () =>
      getClinicModulesByClinicId(
        selectedClinicId!
      ),

    enabled: !!selectedClinicId,
  });

  // ============================================================
  // Toggle module
  // ============================================================

  const toggleMutation = useMutation({
    mutationFn: ({
      moduleKey,
      isEnabled,
    }: {
      moduleKey: string;
      isEnabled: boolean;
    }) =>
      updateClinicModuleByClinicId(
        selectedClinicId!,
        moduleKey,
        isEnabled
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          queryKeys.superAdminModules.list(
            selectedClinicId ?? ""
          ),
      });
    },
  });

  return (
    <div className="space-y-6">

      {/* ======================================================
          Header
      ======================================================= */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
          مدیریت ماژول‌ها
        </h1>

        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          یک کلینیک را انتخاب کنید تا ماژول‌های
          فعال/غیرفعال آن را ببینید و تغییر دهید.
        </p>
      </div>

      {/* ======================================================
          Main Grid
      ======================================================= */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* ====================================================
            Clinics
        ===================================================== */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.06]">

          {/* Search */}
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04]">

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="جستجوی کلینیک..."
              className="w-full bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-300 dark:text-gray-200 dark:placeholder:text-gray-600"
            />

            <Search className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-500" />
          </div>

          {/* Loading */}
          {clinicsLoading && (
            <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
              در حال بارگذاری...
            </div>
          )}

          {/* Clinics list */}
          {!clinicsLoading && (
            <div className="max-h-[520px] space-y-1.5 overflow-y-auto">

              {filteredClinics.map((clinic) => {
                const isSelected =
                  selectedClinicId ===
                  clinic.id;

                return (
                  <button
                    key={clinic.id}
                    type="button"
                    onClick={() =>
                      setSelectedClinicId(
                        clinic.id
                      )
                    }
                    className={`
                      w-full
                      rounded-xl
                      border
                      px-3
                      py-2.5
                      text-right
                      text-xs
                      transition

                      ${
                        isSelected
                          ? `
                            border-primary
                            bg-primary-light/10
                            font-medium
                            text-primary-dark

                            dark:border-primary-light
                            dark:bg-primary-light/10
                            dark:text-primary-light
                          `
                          : `
                            border-gray-100
                            text-gray-600
                            hover:bg-gray-50

                            dark:border-white/10
                            dark:text-gray-300
                            dark:hover:bg-white/10
                          `
                      }
                    `}
                  >
                    {clinic.name}
                  </button>
                );
              })}

              {filteredClinics.length === 0 && (
                <div className="py-10 text-center text-sm text-gray-300 dark:text-gray-600">
                  کلینیکی یافت نشد.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ====================================================
            Selected Clinic Modules
        ===================================================== */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06] lg:col-span-2">

          {/* No clinic selected */}
          {!selectedClinicId && (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 text-gray-300 dark:text-gray-600">

              <LayoutGrid className="h-8 w-8" />

              <p className="text-sm">
                یک کلینیک را از لیست کناری انتخاب کنید.
              </p>
            </div>
          )}

          {/* Clinic selected */}
          {selectedClinicId && (
            <>
              {/* Title */}
              <div className="mb-4">

                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  ماژول‌های «
                  {selectedClinic?.name}
                  »
                </h2>

                {selectedClinic?.phone && (
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                    {selectedClinic.phone}
                  </p>
                )}
              </div>

              {/* Modules loading */}
              {modulesLoading && (
                <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                  در حال بارگذاری...
                </div>
              )}

              {/* Modules */}
              {!modulesLoading && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                  {modules.map((module) => {
                    const isEnabled =
                      module.isEnabled;

                    return (
                      <div
                        key={module.id}
                        className={`
                          flex
                          items-center
                          justify-between
                          rounded-xl
                          border
                          p-4
                          transition

                          ${
                            isEnabled
                              ? `
                                border-primary-light/40
                                bg-primary-light/5

                                dark:border-primary-light/30
                                dark:bg-primary-light/10
                              `
                              : `
                                border-gray-100
                                bg-white

                                dark:border-white/10
                                dark:bg-white/[0.03]
                              `
                          }
                        `}
                      >

                        {/* Module information */}
                        <div className="min-w-0">

                          <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            {MODULE_LABELS[
                              module.moduleKey
                            ] ??
                              module.moduleKey}
                          </div>

                          <div
                            className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500"
                            dir="ltr"
                          >
                            {module.moduleKey}
                          </div>
                        </div>

                        {/* Toggle */}
                        <button
                          type="button"
                          onClick={() =>
                            toggleMutation.mutate({
                              moduleKey:
                                module.moduleKey,
                              isEnabled:
                                !isEnabled,
                            })
                          }
                          disabled={
                            toggleMutation.isPending
                          }
                          aria-label={
                            isEnabled
                              ? "غیرفعال کردن ماژول"
                              : "فعال کردن ماژول"
                          }
                          className={`
                            relative
                            h-6
                            w-11
                            shrink-0
                            rounded-full
                            transition-colors

                            disabled:cursor-not-allowed
                            disabled:opacity-50

                            ${
                              isEnabled
                                ? `
                                  bg-primary
                                  dark:bg-primary
                                `
                                : `
                                  bg-gray-200
                                  dark:bg-white/10
                                `
                            }
                          `}
                        >
                          <span
                            className={`
                              absolute
                              top-0.5
                              flex
                              h-5
                              w-5
                              items-center
                              justify-center
                              rounded-full
                              bg-white
                              shadow
                              transition-all

                              ${
                                isEnabled
                                  ? "right-0.5"
                                  : "right-5"
                              }
                            `}
                          >
                            {isEnabled ? (
                              <Check className="h-3 w-3 text-primary" />
                            ) : (
                              <X className="h-3 w-3 text-gray-300 dark:text-gray-500" />
                            )}
                          </span>
                        </button>
                      </div>
                    );
                  })}

                  {/* No modules */}
                  {modules.length === 0 && (
                    <div className="col-span-full py-10 text-center text-sm text-gray-300 dark:text-gray-600">
                      ماژولی یافت نشد.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}