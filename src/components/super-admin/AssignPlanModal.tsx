"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { superAdminApi, type Plan } from "@/lib/api/super-admin";
import { queryKeys } from "@/lib/query/keys";
import { MODULE_LABELS } from "@/lib/constants/modules";

function fmtToman(n: number) {
  return `${n.toLocaleString("fa-IR")} تومان`;
}

export function AssignPlanModal({
  clinicName,
  currentPlanId,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  title,
  submitLabel,
  cancelLabel,
}: {
  clinicName: string;
  currentPlanId?: string;
  onClose: () => void;
  onSubmit: (plan: Plan) => void;
  isSubmitting: boolean;
  error: string | null;
  title?: string;
  submitLabel?: string;
  cancelLabel?: string;
}) {
  const { data: plans = [], isLoading } = useQuery({
    queryKey: queryKeys.superAdmin.plans.list(),
    queryFn: superAdminApi.getPlans,
  });

  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 dark:bg-gray-900">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {title ?? "اختصاص پلن"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
          برای کلینیک «{clinicName}» یک پلن اشتراک انتخاب کن. ماژول‌های همان
          پلن هم به‌صورت خودکار برای این کلینیک فعال می‌شوند.
        </p>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && plans.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            هنوز هیچ پلنی تعریف نشده. اول از بخش «پلن‌ها» یک پلن بساز.
          </div>
        )}

        {!isLoading && plans.length > 0 && (
          <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
            {plans.map((plan: Plan) => {
              const selected = selectedPlanId === plan.id;

              return (
                <label
                  key={plan.id}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-sm transition ${
                    selected
                      ? "border-primary bg-primary-light/10 dark:border-primary-light/40 dark:bg-primary/10"
                      : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  } ${!plan.is_active ? "opacity-60" : ""}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-gray-200">
                      {plan.name}
                      {plan.id === currentPlanId && (
                        <span className="flex items-center gap-1 rounded-full bg-primary-light/20 px-2 py-0.5 text-[10px] text-primary-dark dark:bg-primary/10 dark:text-primary-light">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          پلن فعلی
                        </span>
                      )}
                      {!plan.is_active && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          غیرفعال
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {fmtToman(plan.price)} /{" "}
                      {plan.billing_cycle === "monthly" ? "ماهانه" : "سالانه"}
                      {plan.max_users !== null &&
                        ` — تا ${plan.max_users.toLocaleString("fa-IR")} کاربر`}
                    </div>

                    {(plan.included_modules ?? []).length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {plan.included_modules!.map((m) => (
                          <span
                            key={m}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          >
                            {MODULE_LABELS[m] ?? m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={selected}
                    onChange={() => setSelectedPlanId(plan.id)}
                    className="h-4 w-4 shrink-0 accent-primary"
                  />
                </label>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {cancelLabel ?? "فعلاً رد شو"}
          </button>

          <button
            disabled={
              !selectedPlanId || isSubmitting || selectedPlanId === currentPlanId
            }
            onClick={() => {
              const plan = plans.find((p) => p.id === selectedPlanId);
              if (plan) onSubmit(plan);
            }}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              submitLabel ?? "اختصاص پلن"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
