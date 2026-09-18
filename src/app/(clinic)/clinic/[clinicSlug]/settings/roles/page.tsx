"use client";

import { use, useMemo, useState, Fragment } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ShieldCheck, Plus, X, Loader2, Pencil, Check } from "lucide-react";

import {
  getRoles,
  getPermissions,
  createRole,
  updateRole,
  type Role,
  type RolePermission,
} from "@/lib/auth/roles";

import { queryKeys } from "@/lib/query/keys";

const ACTION_LABEL: Record<string, string> = {
  view: "مشاهده",
  create: "ایجاد",
  update: "ویرایش",
  delete: "حذف",
  export: "خروجی",
};

const MODULE_LABEL: Record<string, string> = {
  patients: "مراجعین",
  appointments: "نوبت‌ها",
  services: "خدمات",
  finance: "مالی",
  invoices: "فاکتورها",
  payments: "پرداخت‌ها",
  visits: "جلسات درمان",
  chat: "چت",
  files: "فایل‌ها",
  consents: "رضایت‌نامه‌ها",
  intake: "فرم‌های پذیرش",
  reports: "گزارش‌ها",
  sms: "پیامک",
  video: "ویزیت آنلاین",
  staff: "کارکنان",
  roles: "نقش‌ها",
  clinics: "کلینیک",
  settings: "تنظیمات",
};

function moduleLabel(key: string) {
  return MODULE_LABEL[key] ?? key;
}

function actionLabel(action: string) {
  return ACTION_LABEL[action] ?? action;
}

export default function RolesPermissionsPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: queryKeys.roles.list(clinicSlug),
    queryFn: () => getRoles(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: permissions = [], isLoading: permsLoading } = useQuery({
    queryKey: ["permissions", clinicSlug],
    queryFn: () => getPermissions(clinicSlug),
    enabled: !!clinicSlug,
  });

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, RolePermission[]>();
    permissions.forEach((p) => {
      const list = groups.get(p.moduleKey) ?? [];
      list.push(p);
      groups.set(p.moduleKey, list);
    });
    return Array.from(groups.entries());
  }, [permissions]);

  function invalidateRoles() {
    queryClient.invalidateQueries({ queryKey: queryKeys.roles.list(clinicSlug) });
  }

  const toggleMutation = useMutation({
    mutationFn: ({ role, permission, checked }: { role: Role; permission: RolePermission; checked: boolean }) => {
      const currentIds = role.permissions.map((p) => p.id);
      const nextIds = checked ? currentIds.filter((id) => id !== permission.id) : [...currentIds, permission.id];
      return updateRole(clinicSlug, role.id, { permissions: nextIds });
    },
    onSuccess: () => {
      setActionError(null);
      invalidateRoles();
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "به‌روزرسانی مجوز ناموفق بود"),
  });

  const isLoading = rolesLoading || permsLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
            <ShieldCheck className="h-5 w-5 text-primary-dark dark:text-primary-light" /> نقش‌ها و دسترسی‌ها
          </h1>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            تعریف نقش‌های سفارشی و تنظیم دقیق مجوز هر نقش
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" /> نقش سفارشی جدید
        </button>
      </div>

      {actionError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500 dark:bg-red-500/10 dark:text-red-300">
          {actionError}
        </p>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</p>
        ) : roles.length === 0 ? (
          <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">نقشی یافت نشد.</p>
        ) : permissions.length === 0 ? (
          <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">مجوزی یافت نشد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="py-2 pl-4 font-medium text-gray-400 dark:text-gray-500">مجوز</th>
                  {roles.map((r) => (
                    <th key={r.id} className="px-3 py-2 text-center font-medium">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-gray-700 dark:text-gray-200">{r.name}</span>
                        {!r.isSystemRole && (
                          <button
                            type="button"
                            onClick={() => setEditingRole(r)}
                            title="ویرایش نقش"
                            className="text-gray-300 transition hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-300"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      {r.isSystemRole && (
                        <span className="mt-0.5 block text-[9px] font-normal text-gray-300 dark:text-gray-600">
                          سیستمی
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {groupedPermissions.map(([moduleKey, perms]) => (
                  <Fragment key={moduleKey}>
                    <tr className="bg-gray-50 dark:bg-white/[0.04]">
                      <td
                        colSpan={roles.length + 1}
                        className="py-1.5 pr-2 text-[10px] font-bold text-gray-500 dark:text-gray-400"
                      >
                        {moduleLabel(moduleKey)}
                      </td>
                    </tr>
                    {perms.map((perm) => (
                      <tr key={perm.id} className="border-b border-gray-50 dark:border-gray-800">
                        <td className="py-2 pl-4 pr-2 text-gray-600 dark:text-gray-300">
                          {actionLabel(perm.action)}
                          {perm.description && (
                            <span className="mr-1 text-[10px] text-gray-300 dark:text-gray-600">
                              ({perm.description})
                            </span>
                          )}
                        </td>
                        {roles.map((role) => {
                          const checked = role.permissions.some((p) => p.id === perm.id);
                          const disabled = role.isSystemRole || toggleMutation.isPending;
                          return (
                            <td key={role.id} className="px-3 py-2 text-center">
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => toggleMutation.mutate({ role, permission: perm, checked })}
                                className={`mx-auto flex h-5 w-5 items-center justify-center rounded-md border transition ${
                                  checked
                                    ? "border-primary bg-primary text-white"
                                    : "border-gray-200 bg-white text-transparent dark:border-white/10 dark:bg-white/[0.03]"
                                } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-primary"}`}
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <RoleFormModal
          clinicSlug={clinicSlug}
          permissions={permissions}
          groupedPermissions={groupedPermissions}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            invalidateRoles();
          }}
        />
      )}

      {editingRole && (
        <RoleFormModal
          clinicSlug={clinicSlug}
          permissions={permissions}
          groupedPermissions={groupedPermissions}
          existingRole={editingRole}
          onClose={() => setEditingRole(null)}
          onSaved={() => {
            setEditingRole(null);
            invalidateRoles();
          }}
        />
      )}
    </div>
  );
}

function RoleFormModal({
  clinicSlug,
  permissions,
  groupedPermissions,
  existingRole,
  onClose,
  onSaved,
}: {
  clinicSlug: string;
  permissions: RolePermission[];
  groupedPermissions: [string, RolePermission[]][];
  existingRole?: Role;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!existingRole;

  const [name, setName] = useState(existingRole?.name ?? "");
  const [key, setKey] = useState(existingRole?.key ?? "");
  const [description, setDescription] = useState(existingRole?.description ?? "");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(existingRole?.permissions.map((p) => p.id) ?? [])
  );
  const [formError, setFormError] = useState<string | null>(null);

  function toggle(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const mutation = useMutation({
    mutationFn: () => {
      if (!name.trim()) throw new Error("نام نقش الزامی است.");

      if (isEdit) {
        return updateRole(clinicSlug, existingRole!.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          permissions: Array.from(selectedIds),
        });
      }

      if (!key.trim()) throw new Error("کلید نقش الزامی است.");

      return createRole(clinicSlug, {
        name: name.trim(),
        key: key.trim(),
        description: description.trim() || undefined,
        permissions: Array.from(selectedIds),
      });
    },
    onSuccess: () => onSaved(),
    onError: (e) => setFormError(e instanceof Error ? e.message : "ذخیره نقش ناموفق بود"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px] dark:bg-black/60">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#18201e]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {isEdit ? `ویرایش نقش «${existingRole!.name}»` : "نقش سفارشی جدید"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {formError && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500 dark:bg-red-500/10 dark:text-red-300">
            {formError}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">نام نقش</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: دستیار پزشک"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">
                کلید نقش (انگلیسی، یکتا)
              </label>
              <input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                dir="ltr"
                placeholder="assistant"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">توضیحات (اختیاری)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] text-gray-500 dark:text-gray-400">
              مجوزها ({selectedIds.size.toLocaleString("fa-IR")} از {permissions.length.toLocaleString("fa-IR")})
            </label>

            <div className="max-h-56 space-y-3 overflow-y-auto rounded-xl border border-gray-100 p-3 dark:border-gray-800">
              {groupedPermissions.map(([moduleKey, perms]) => (
                <div key={moduleKey}>
                  <div className="mb-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500">
                    {moduleLabel(moduleKey)}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {perms.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggle(p.id)}
                        className={`rounded-full border px-2.5 py-1 text-[10px] transition ${
                          selectedIds.has(p.id)
                            ? "border-primary bg-primary-light/20 text-primary-dark dark:bg-primary/15 dark:text-primary"
                            : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/10"
                        }`}
                      >
                        {actionLabel(p.action)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isPending ? "در حال ذخیره..." : "ذخیره نقش"}
          </button>
        </div>
      </div>
    </div>
  );
}