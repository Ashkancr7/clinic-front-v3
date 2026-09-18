"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Check, Pencil, Sparkles, X } from "lucide-react";

import { superAdminApi, type Plan } from "@/lib/api/super-admin";
import { queryKeys } from "@/lib/query/keys";

export default function PlansPage() {
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const {
    data: plans = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.superAdmin.plans.list(),
    queryFn: superAdminApi.getPlans,
  });

  const createMutation = useMutation({
    mutationFn: superAdminApi.createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.superAdmin.plans.list(),
      });

      setShowCreateModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      planId,
      payload,
    }: {
      planId: string;
      payload: Partial<Omit<Plan, "id">>;
    }) => superAdminApi.updatePlan(planId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.superAdmin.plans.list(),
      });

      setEditingPlan(null);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
            پلن‌های اشتراک
          </h1>

          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            مدیریت پلن‌های قابل‌فروش به کلینیک‌ها
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
            transition
            hover:bg-primary-dark
            dark:bg-primary/90
            dark:hover:bg-primary
          "
        >
          <Plus className="h-4 w-4" />
          ایجاد پلن جدید
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="rounded-2xl border border-gray-100 bg-white py-10 text-center text-sm text-gray-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-500">
          در حال بارگذاری...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 py-10 text-center text-sm text-danger dark:border-red-500/20 dark:bg-red-500/10">
          خطا در دریافت پلن‌ها
        </div>
      )}

      {/* Plans */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`
                relative rounded-2xl border p-6
                transition
                ${
                  plan.is_active
                    ? `
                      border-gray-100
                      bg-white
                      hover:-translate-y-0.5
                      hover:shadow-lg
                      dark:border-white/10
                      dark:bg-white/[0.04]
                      dark:hover:bg-white/[0.06]
                      dark:hover:shadow-black/20
                    `
                    : `
                      border-red-100
                      bg-white
                      opacity-60
                      dark:border-red-500/20
                      dark:bg-red-500/[0.03]
                    `
                }
              `}
            >
              {/* Card Header */}
              <div className="mb-4 flex items-center justify-between">
                <div
                  className="
                    flex h-11 w-11 items-center justify-center
                    rounded-full
                    bg-primary-light/20
                    text-primary-dark
                    dark:bg-primary/10
                    dark:text-primary-light
                  "
                >
                  <Sparkles className="h-5 w-5" />
                </div>

                <button
                  type="button"
                  onClick={() => setEditingPlan(plan)}
                  aria-label={`ویرایش ${plan.name}`}
                  className="
                    rounded-lg
                    border border-gray-200
                    p-1.5
                    text-gray-400
                    transition
                    hover:bg-gray-50
                    hover:text-gray-600
                    dark:border-white/10
                    dark:text-gray-500
                    dark:hover:bg-white/[0.06]
                    dark:hover:text-gray-300
                  "
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Plan Name */}
              <div className="text-base font-bold text-gray-900 dark:text-white">
                {plan.name}
              </div>

              {/* Price */}
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {plan.price.toLocaleString("fa-IR")}
                </span>

                <span className="text-xs text-gray-400 dark:text-gray-500">
                  تومان /{" "}
                  {plan.billing_cycle === "monthly" ? "ماه" : "سال"}
                </span>
              </div>

              {/* Inactive */}
              {!plan.is_active && (
                <div className="mt-1 text-[11px] text-danger">
                  غیرفعال
                </div>
              )}

              {/* Features */}
              <ul className="mt-5 space-y-2.5">
                <li className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-dark dark:text-primary-light" />

                  {plan.max_users
                    ? `تا ${plan.max_users.toLocaleString(
                        "fa-IR"
                      )} کاربر فعال`
                    : "کاربران نامحدود"}
                </li>

                {plan.max_sms_per_month != null && (
                  <li className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-dark dark:text-primary-light" />

                    تا{" "}
                    {plan.max_sms_per_month.toLocaleString("fa-IR")}{" "}
                    پیامک در ماه
                  </li>
                )}

                {(plan.included_modules ?? []).map((module) => (
                  <li
                    key={module}
                    className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-dark dark:text-primary-light" />

                    {module}
                  </li>
                ))}
              </ul>

              {/* Bottom Status */}
              <div className="mt-6 border-t border-gray-100 pt-4 dark:border-white/10">
                <span
                  className={`
                    inline-flex items-center gap-1.5
                    rounded-full
                    px-2.5 py-1
                    text-[10px] font-medium
                    ${
                      plan.is_active
                        ? "bg-primary-light/20 text-primary-dark dark:bg-primary/10 dark:text-primary-light"
                        : "bg-red-50 text-danger dark:bg-red-500/10"
                    }
                  `}
                >
                  <span
                    className={`
                      h-1.5 w-1.5 rounded-full
                      ${
                        plan.is_active
                          ? "bg-primary"
                          : "bg-danger"
                      }
                    `}
                  />

                  {plan.is_active ? "فعال" : "غیرفعال"}
                </span>
              </div>
            </div>
          ))}

          {plans.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center text-sm text-gray-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-500">
              هنوز پلنی ثبت نشده.
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <PlanFormModal
          title="ایجاد پلن جدید"
          onClose={() => setShowCreateModal(false)}
          onSubmit={(payload) => createMutation.mutate(payload)}
          isSubmitting={createMutation.isPending}
          error={
            createMutation.error instanceof Error
              ? createMutation.error.message
              : null
          }
        />
      )}

      {/* Edit Modal */}
      {editingPlan && (
        <PlanFormModal
          title="ویرایش پلن"
          initial={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSubmit={(payload) =>
            updateMutation.mutate({
              planId: editingPlan.id,
              payload,
            })
          }
          isSubmitting={updateMutation.isPending}
          error={
            updateMutation.error instanceof Error
              ? updateMutation.error.message
              : null
          }
        />
      )}
    </div>
  );
}

function PlanFormModal({
  title,
  initial,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  title: string;
  initial?: Plan;
  onClose: () => void;
  onSubmit: (payload: Omit<Plan, "id">) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [name, setName] = useState(initial?.name ?? "");

  const [billingCycle, setBillingCycle] = useState<
    Plan["billing_cycle"]
  >(initial?.billing_cycle ?? "monthly");

  const [price, setPrice] = useState(
    initial?.price?.toString() ?? ""
  );

  const [maxUsers, setMaxUsers] = useState(
    initial?.max_users?.toString() ?? ""
  );

  const [modulesText, setModulesText] = useState(
    (initial?.included_modules ?? []).join("، ")
  );

  const [isActive, setIsActive] = useState(
    initial?.is_active ?? true
  );

  const modules = useMemo(
    () =>
      modulesText
        .split(/[،,]/)
        .map((module) => module.trim())
        .filter(Boolean),
    [modulesText]
  );

  const handleSubmit = () => {
    if (!name.trim() || !price || isSubmitting) return;

    onSubmit({
      name: name.trim(),

      billing_cycle: billingCycle,

      price: Number(price),

      max_users: maxUsers ? Number(maxUsers) : null,

      max_file_storage_mb:
        initial?.max_file_storage_mb ?? null,

      max_sms_per_month:
        initial?.max_sms_per_month ?? null,

      included_modules: modules,

      is_active: isActive,
    });
  };

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/40
        p-4
        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="
          max-h-[90vh]
          w-full max-w-md
          overflow-y-auto
          rounded-2xl
          border border-gray-100
          bg-white
          p-5
          shadow-2xl
          dark:border-white/10
          dark:bg-[#111827]
          dark:shadow-black/40
          sm:p-6
        "
      >
        {/* Modal Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="
              rounded-lg
              p-1.5
              text-gray-400
              transition
              hover:bg-gray-100
              hover:text-gray-600
              dark:text-gray-500
              dark:hover:bg-white/[0.06]
              dark:hover:text-gray-300
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-500 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">
              نام پلن
            </label>

            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثلاً پلن حرفه‌ای"
              className="
                w-full
                rounded-xl
                border border-gray-200
                bg-white
                px-3 py-2.5
                text-sm text-gray-800
                outline-none
                transition
                placeholder:text-gray-300
                focus:border-primary
                focus:ring-2
                focus:ring-primary/10
                dark:border-white/10
                dark:bg-white/[0.04]
                dark:text-white
                dark:placeholder:text-gray-600
                dark:focus:border-primary-light
                dark:focus:ring-primary/10
              "
            />
          </div>

          {/* Price + Billing */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">
                قیمت (تومان)
              </label>

              <input
                type="number"
                min="0"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="
                  w-full
                  rounded-xl
                  border border-gray-200
                  bg-white
                  px-3 py-2.5
                  text-sm text-gray-800
                  outline-none
                  transition
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/10
                  dark:border-white/10
                  dark:bg-white/[0.04]
                  dark:text-white
                  dark:focus:border-primary-light
                "
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">
                دوره‌ی صورتحساب
              </label>

              <select
                value={billingCycle}
                onChange={(event) =>
                  setBillingCycle(
                    event.target.value as Plan["billing_cycle"]
                  )
                }
                className="
                  w-full
                  rounded-xl
                  border border-gray-200
                  bg-white
                  px-3 py-2.5
                  text-sm text-gray-800
                  outline-none
                  transition
                  focus:border-primary
                  dark:border-white/10
                  dark:bg-[#182132]
                  dark:text-white
                "
              >
                <option value="monthly">ماهانه</option>
                <option value="yearly">سالانه</option>
              </select>
            </div>
          </div>

          {/* Max Users */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">
              حداکثر کاربران
              <span className="mr-1 text-gray-400">
                (خالی = نامحدود)
              </span>
            </label>

            <input
              type="number"
              min="0"
              value={maxUsers}
              onChange={(event) => setMaxUsers(event.target.value)}
              placeholder="مثلاً ۵۰"
              className="
                w-full
                rounded-xl
                border border-gray-200
                bg-white
                px-3 py-2.5
                text-sm text-gray-800
                outline-none
                transition
                placeholder:text-gray-300
                focus:border-primary
                focus:ring-2
                focus:ring-primary/10
                dark:border-white/10
                dark:bg-white/[0.04]
                dark:text-white
                dark:placeholder:text-gray-600
                dark:focus:border-primary-light
              "
            />
          </div>

          {/* Modules */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">
              ماژول‌های شامل
            </label>

            <textarea
              value={modulesText}
              onChange={(event) =>
                setModulesText(event.target.value)
              }
              rows={3}
              placeholder="چت، نوبت‌دهی، تماس تصویری"
              className="
                w-full
                resize-none
                rounded-xl
                border border-gray-200
                bg-white
                px-3 py-2.5
                text-sm text-gray-800
                outline-none
                transition
                placeholder:text-gray-300
                focus:border-primary
                focus:ring-2
                focus:ring-primary/10
                dark:border-white/10
                dark:bg-white/[0.04]
                dark:text-white
                dark:placeholder:text-gray-600
                dark:focus:border-primary-light
              "
            />

            <p className="mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
              ماژول‌ها را با ویرگول فارسی یا انگلیسی جدا کنید.
            </p>
          </div>

          {/* Active */}
          <label
            className="
              flex cursor-pointer
              items-center gap-2
              rounded-xl
              border border-gray-100
              bg-gray-50
              px-3 py-2.5
              text-xs text-gray-600
              transition
              hover:bg-gray-100
              dark:border-white/10
              dark:bg-white/[0.03]
              dark:text-gray-300
              dark:hover:bg-white/[0.06]
            "
          >
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) =>
                setIsActive(event.target.checked)
              }
              className="
                h-4 w-4
                rounded
                border-gray-300
                text-primary
                focus:ring-primary
                dark:border-white/20
                dark:bg-white/10
              "
            />

            <span>پلن فعال باشد</span>
          </label>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="
              flex-1
              rounded-xl
              border border-gray-200
              py-2.5
              text-sm text-gray-600
              transition
              hover:bg-gray-50
              dark:border-white/10
              dark:text-gray-300
              dark:hover:bg-white/[0.06]
            "
          >
            انصراف
          </button>

          <button
            type="button"
            disabled={!name.trim() || !price || isSubmitting}
            onClick={handleSubmit}
            className="
              flex-1
              rounded-xl
              bg-primary
              py-2.5
              text-sm font-medium text-white
              transition
              hover:bg-primary-dark
              disabled:cursor-not-allowed
              disabled:opacity-50
              dark:bg-primary/90
              dark:hover:bg-primary
            "
          >
            {isSubmitting ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </div>
    </div>
  );
}