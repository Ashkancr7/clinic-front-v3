"use client";

import { use, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { LayoutGrid, Check, X, Loader2 } from "lucide-react";

import {
  getClinicModules,
  updateClinicModule,
  type ClinicModule,
} from "@/lib/api/clinic-dashboard";

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

function moduleLabel(key: string) {
  return MODULE_LABELS[key] ?? key;
}

export default function ClinicModulesPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);
  const queryClient = useQueryClient();

  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const {
    data: modules = [],
    isLoading,
  } = useQuery({
    queryKey: queryKeys.modules.list(clinicSlug),
    queryFn: () => getClinicModules(clinicSlug),
    enabled: !!clinicSlug,
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      moduleKey,
      isEnabled,
    }: {
      moduleKey: string;
      isEnabled: boolean;
    }) => updateClinicModule(clinicSlug, moduleKey, isEnabled),

    onMutate: ({ moduleKey }) => {
      setActionError(null);
      setPendingKey(moduleKey);
    },

    onError: (err: unknown) => {
      setActionError(
        err instanceof Error ? err.message : "تغییر وضعیت ماژول با خطا مواجه شد."
      );
    },

    onSettled: () => {
      setPendingKey(null);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.modules.list(clinicSlug),
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
          ماژول‌های کلینیک
        </h1>

        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          ماژول‌های فعال کلینیک خود را مشاهده و مدیریت کنید. برخی ماژول‌ها بسته
          به پلن اشتراک شما ممکن است قابل فعال‌سازی نباشند.
        </p>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {actionError}
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400 dark:text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            در حال بارگذاری...
          </div>
        )}

        {!isLoading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {modules.map((module: ClinicModule) => {
              const isEnabled = module.is_enabled;
              const isPending = pendingKey === module.module_key;

              return (
                <div
                  key={module.id}
                  className={`flex items-center justify-between rounded-xl border p-4 transition ${
                    isEnabled
                      ? "border-primary-light/40 bg-primary-light/5 dark:border-primary-light/30 dark:bg-primary-light/10"
                      : "border-gray-100 bg-white dark:border-white/10 dark:bg-white/[0.03]"
                  }`}
                >
                  {/* Module information */}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {moduleLabel(module.module_key)}
                    </div>

                    <div
                      className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500"
                      dir="ltr"
                    >
                      {module.module_key}
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      toggleMutation.mutate({
                        moduleKey: module.module_key,
                        isEnabled: !isEnabled,
                      })
                    }
                    disabled={isPending}
                    aria-label={isEnabled ? "غیرفعال کردن ماژول" : "فعال کردن ماژول"}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      isEnabled ? "bg-primary dark:bg-primary" : "bg-gray-200 dark:bg-white/10"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-all ${
                        isEnabled ? "right-0.5" : "right-5"
                      }`}
                    >
                      {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                      ) : isEnabled ? (
                        <Check className="h-3 w-3 text-primary" />
                      ) : (
                        <X className="h-3 w-3 text-gray-300 dark:text-gray-500" />
                      )}
                    </span>
                  </button>
                </div>
              );
            })}

            {modules.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center gap-2 py-10 text-gray-300 dark:text-gray-600">
                <LayoutGrid className="h-8 w-8" />
                <p className="text-sm">ماژولی یافت نشد.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
