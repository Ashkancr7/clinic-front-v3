"use client";

import { use, useMemo, useState } from "react";

import Link from "next/link";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  UserPlus,
  Search,
  ShieldCheck,
  Briefcase,
  Headset,
  Stethoscope,
  Users as UsersIcon,
  Pencil,
  Plus,
  X,
  Loader2,
  Trash2,
  UserCog,
} from "lucide-react";

import { ApiError } from "@/lib/api/client";

import {
  getStaffMembers,
  createStaffMember,
  updateStaffMember,
  removeStaffAccess,
  getAssignedDoctors,
  assignDoctorToStaff,
  unassignDoctorFromStaff,
  type StaffMember,
} from "@/lib/api/staff";

import { getRoles, type Role } from "@/lib/auth/roles";

import { queryKeys } from "@/lib/query/keys";

const ACCESS_SCOPE_LABEL: Record<string, string> = {
  all_patients: "همه مراجعین",
  assigned_patients: "مراجعین تخصیص‌یافته",
  limited: "محدود",
};

const ACCESS_SCOPE_OPTIONS: { value: StaffMember["accessScope"] & string; label: string }[] = [
  { value: "all_patients", label: "همه مراجعین" },
  { value: "assigned_patients", label: "مراجعین تخصیص‌یافته" },
  { value: "limited", label: "محدود" },
];

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none transition focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200";

function roleIcon(roleKey: string) {
  if (roleKey === "doctor") return Stethoscope;
  if (roleKey === "receptionist") return Headset;
  if (roleKey === "super_admin") return ShieldCheck;
  if (roleKey.includes("admin") || roleKey.includes("manager")) return Briefcase;
  return UsersIcon;
}

export default function UsersRolesPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [assignDoctorsFor, setAssignDoctorsFor] = useState<StaffMember | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: staff = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.staff.list(clinicSlug),
    queryFn: () => getStaffMembers(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: roles = [] } = useQuery({
    queryKey: queryKeys.roles.list(clinicSlug),
    queryFn: () => getRoles(clinicSlug),
    enabled: !!clinicSlug,
  });

  function invalidateStaff() {
    queryClient.invalidateQueries({ queryKey: queryKeys.staff.list(clinicSlug) });
  }

  const removeMutation = useMutation({
    mutationFn: (userId: number) => removeStaffAccess(clinicSlug, userId),
    onSuccess: () => {
      setActionError(null);
      invalidateStaff();
    },
    onError: (e) =>
      setActionError(e instanceof Error ? e.message : "لغو دسترسی ناموفق بود"),
  });

  const filteredStaff = useMemo(() => {
    const q = search.trim();
    if (!q) return staff;
    return staff.filter((s) => s.fullName.includes(q) || s.phone.includes(q));
  }, [staff, search]);

  const doctors = useMemo(() => staff.filter((s) => s.roleKey === "doctor"), [staff]);

  const stats = useMemo(() => {
    const total = staff.length;
    const active = staff.filter((s) => s.isActive).length;
    const byRole = new Map<string, { key: string; count: number }>();

    staff.forEach((s) => {
      const label = s.roleName || "بدون نقش";
      const entry = byRole.get(label);
      if (entry) {
        entry.count += 1;
      } else {
        byRole.set(label, { key: s.roleKey, count: 1 });
      }
    });

    return {
      total,
      active,
      inactive: total - active,
      byRole: Array.from(byRole.entries()),
    };
  }, [staff]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
            <ShieldCheck className="h-5 w-5 text-primary-dark dark:text-primary-light" /> کاربران و دسترسی‌ها
          </h1>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            مدیریت کارکنان این کلینیک و سطح دسترسی هرکدام
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark"
        >
          <UserPlus className="h-4 w-4" /> دعوت از کاربر جدید
        </button>
      </div>

      {actionError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500 dark:bg-red-500/10 dark:text-red-300">
          {actionError}
        </p>
      )}

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
            <UsersIcon className="h-5 w-5" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {stats.total.toLocaleString("fa-IR")} نفر
          </div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500">کل کارکنان</div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary-light/20 text-primary-dark dark:bg-primary/15 dark:text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {stats.active.toLocaleString("fa-IR")} نفر
          </div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500">فعال</div>
        </div>

        {stats.byRole.slice(0, 3).map(([label, info]) => {
          const Icon = roleIcon(info.key);
          return (
            <div
              key={label}
              className="rounded-2xl border border-gray-100 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-secondary-purple/40 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300">
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {info.count.toLocaleString("fa-IR")} نفر
              </div>
              <div className="text-[11px] text-gray-400 dark:text-gray-500">{label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* جدول کاربران */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:col-span-3">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 dark:border-white/10 sm:w-56">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجو در کاربران..."
                className="w-full bg-transparent text-xs text-gray-600 outline-none placeholder:text-gray-300 dark:text-gray-200"
              />
              <Search className="h-3.5 w-3.5 shrink-0 text-gray-300" />
            </div>
          </div>

          {isLoading ? (
            <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">
              در حال بارگذاری...
            </p>
          ) : error ? (
            <p className="py-10 text-center text-xs text-danger dark:text-red-300">
              دریافت لیست کارکنان ناموفق بود.
            </p>
          ) : filteredStaff.length === 0 ? (
            <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">
              کارمندی یافت نشد.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-right text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 dark:border-gray-800 dark:text-gray-500">
                    <th className="py-2 font-medium">کاربر</th>
                    <th className="py-2 font-medium">نقش</th>
                    <th className="py-2 font-medium">دسترسی</th>
                    <th className="py-2 font-medium">وضعیت</th>
                    <th className="py-2 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((s) => (
                    <tr
                      key={s.userId}
                      className="border-b border-gray-50 dark:border-gray-800"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 shrink-0 rounded-full bg-gray-100 dark:bg-gray-800" />
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-100">
                              {s.fullName || "—"}
                            </div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500" dir="ltr">
                              {s.phone || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="rounded-full bg-primary-light/20 px-2.5 py-1 text-[11px] text-primary-dark dark:bg-primary/15 dark:text-primary">
                          {s.roleName || "—"}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 dark:text-gray-400">
                        {s.accessScope ? ACCESS_SCOPE_LABEL[s.accessScope] : "—"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`flex items-center gap-1 ${
                            s.isActive ? "text-primary-dark dark:text-primary" : "text-danger dark:text-red-300"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {s.isActive ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingStaff(s)}
                            title="ویرایش دسترسی"
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          {s.roleKey === "receptionist" && (
                            <button
                              type="button"
                              onClick={() => setAssignDoctorsFor(s)}
                              title="پزشکان تخصیص‌یافته"
                              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
                            >
                              <UserCog className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (
                                confirm(
                                  `دسترسی «${s.fullName}» به این کلینیک لغو شود؟`
                                )
                              ) {
                                removeMutation.mutate(s.userId);
                              }
                            }}
                            disabled={removeMutation.isPending}
                            title="لغو دسترسی"
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-danger disabled:opacity-40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* نقش‌های تعریف‌شده */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-800 dark:text-gray-100">
            <ShieldCheck className="h-4 w-4 text-primary-dark dark:text-primary" /> نقش‌های این کلینیک
          </h3>

          {roles.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">نقشی یافت نشد.</p>
          ) : (
            <div className="space-y-2">
              {roles.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 p-2.5 text-xs dark:border-gray-800"
                >
                  <div>
                    <span className="text-gray-700 dark:text-gray-200">{r.name}</span>
                    {r.isSystemRole && (
                      <span className="mr-2 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500 dark:bg-white/10 dark:text-gray-400">
                        سیستمی
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {r.permissions.length.toLocaleString("fa-IR")} مجوز
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link
            href={`/clinic/${clinicSlug}/settings/roles`}
            className="mt-3 block text-[10px] text-primary-dark hover:underline dark:text-primary-light"
          >
            ویرایش دقیق مجوزهای هر نقش
          </Link>
        </div>
      </div>

      {showInvite && (
        <InviteStaffModal
          clinicSlug={clinicSlug}
          roles={roles}
          onClose={() => setShowInvite(false)}
          onCreated={() => {
            setShowInvite(false);
            invalidateStaff();
          }}
        />
      )}

      {editingStaff && (
        <EditStaffModal
          clinicSlug={clinicSlug}
          staffMember={editingStaff}
          roles={roles}
          onClose={() => setEditingStaff(null)}
          onSaved={() => {
            setEditingStaff(null);
            invalidateStaff();
          }}
        />
      )}

      {assignDoctorsFor && (
        <AssignedDoctorsModal
          clinicSlug={clinicSlug}
          staffMember={assignDoctorsFor}
          doctors={doctors}
          onClose={() => setAssignDoctorsFor(null)}
        />
      )}
    </div>
  );
}

function InviteStaffModal({
  clinicSlug,
  roles,
  onClose,
  onCreated,
}: {
  clinicSlug: string;
  roles: Role[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [accessScope, setAccessScope] = useState<"all_patients" | "assigned_patients" | "limited">(
    "assigned_patients"
  );
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  // اگر بک‌اند بگوید این شماره جدید است و رمز اولیه لازم دارد، فیلد رمز را
  // اجباری نشان می‌دهیم تا کاربر بفهمد چرا دوباره باید تلاش کند
  const [passwordRequired, setPasswordRequired] = useState(false);

  const mutation = useMutation({
    mutationFn: () => {
      if (!fullName.trim() || !phone.trim() || !roleId) {
        throw new Error("لطفاً همه‌ی فیلدهای ضروری را پر کنید.");
      }
      return createStaffMember(clinicSlug, {
        full_name: fullName.trim(),
        phone: phone.trim(),
        role_id: Number(roleId),
        access_scope: accessScope,
        password: password.trim() ? password.trim() : undefined,
      });
    },
    onSuccess: () => onCreated(),
    onError: (e) => {
      if (e instanceof ApiError && e.status === 409) {
        setFormError("این شماره موبایل قبلاً در این کلینیک عضو است.");
      } else if (e instanceof ApiError && e.code === "PASSWORD_REQUIRED") {
        setPasswordRequired(true);
        setFormError("این شماره جدید است؛ لطفاً یک رمز اولیه (حداقل ۸ کاراکتر) برای آن وارد کنید.");
      } else {
        setFormError(e instanceof Error ? e.message : "افزودن کارمند ناموفق بود");
      }
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px] dark:bg-black/60">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#18201e]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">دعوت از کاربر جدید</h2>
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
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">
              نام و نام خانوادگی
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              placeholder="مثلاً: دکتر سارا محمدی"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">
              شماره موبایل
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              className={inputClass}
              placeholder="09123334455"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">نقش</label>
            <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className={inputClass}>
              <option value="">انتخاب کنید</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">
              سطح دسترسی به بیماران
            </label>
            <select
              value={accessScope}
              onChange={(e) => setAccessScope(e.target.value as typeof accessScope)}
              className={inputClass}
            >
              {ACCESS_SCOPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">
              رمز عبور اولیه {passwordRequired ? "(الزامی — این شماره جدید است)" : "(اختیاری)"}
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordRequired) setPasswordRequired(false);
              }}
              dir="ltr"
              className={`${inputClass} ${passwordRequired ? "border-danger" : ""}`}
              placeholder="حداقل ۸ کاراکتر"
            />
            <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
              اگر این شماره از قبل حساب کارمندی در سیستم دارد، این فیلد را خالی بگذارید — رمز فعلی او تغییر نمی‌کند.
              اگر شماره جدید است، وارد کردن رمز اولیه اجباری است.
            </p>
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
            disabled={mutation.isPending || (passwordRequired && password.trim().length < 8)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isPending ? "در حال افزودن..." : "افزودن کارمند"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditStaffModal({
  clinicSlug,
  staffMember,
  roles,
  onClose,
  onSaved,
}: {
  clinicSlug: string;
  staffMember: StaffMember;
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [roleId, setRoleId] = useState<string>(
    staffMember.roleId != null ? String(staffMember.roleId) : ""
  );
  const [accessScope, setAccessScope] = useState<"all_patients" | "assigned_patients" | "limited">(
    (staffMember.accessScope as "all_patients" | "assigned_patients" | "limited") ?? "assigned_patients"
  );
  const [isActive, setIsActive] = useState(staffMember.isActive);
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      updateStaffMember(clinicSlug, staffMember.userId, {
        role_id: roleId ? Number(roleId) : undefined,
        access_scope: accessScope,
        is_active: isActive,
      }),
    onSuccess: () => onSaved(),
    onError: (e) => setFormError(e instanceof Error ? e.message : "ویرایش ناموفق بود"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px] dark:bg-black/60">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#18201e]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            ویرایش دسترسی «{staffMember.fullName}»
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
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">نقش</label>
            <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className={inputClass}>
              <option value="">بدون تغییر</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">
              سطح دسترسی به بیماران
            </label>
            <select
              value={accessScope}
              onChange={(e) => setAccessScope(e.target.value as typeof accessScope)}
              className={inputClass}
            >
              {ACCESS_SCOPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300"
            />
            فعال باشد
          </label>
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
            {mutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignedDoctorsModal({
  clinicSlug,
  staffMember,
  doctors,
  onClose,
}: {
  clinicSlug: string;
  staffMember: StaffMember;
  doctors: StaffMember[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const { data: assigned = [], isLoading } = useQuery({
    queryKey: queryKeys.staff.assignedDoctors(clinicSlug, staffMember.userId),
    queryFn: () => getAssignedDoctors(clinicSlug, staffMember.userId),
    enabled: !!clinicSlug,
  });

  const assignedIds = new Set(assigned.map((a) => a.doctorUserId));

  const toggleMutation = useMutation({
    mutationFn: (doctorUserId: number) =>
      assignedIds.has(doctorUserId)
        ? unassignDoctorFromStaff(clinicSlug, staffMember.userId, doctorUserId)
        : assignDoctorToStaff(clinicSlug, staffMember.userId, doctorUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.staff.assignedDoctors(clinicSlug, staffMember.userId),
      });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px] dark:bg-black/60">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#18201e]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            پزشکان تخصیص‌یافته به «{staffMember.fullName}»
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
            در حال بارگذاری...
          </p>
        ) : doctors.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
            هیچ پزشکی در این کلینیک ثبت نشده است.
          </p>
        ) : (
          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {doctors.map((d) => {
              const isAssigned = assignedIds.has(d.userId);
              return (
                <label
                  key={d.userId}
                  className="flex items-center justify-between rounded-xl border border-gray-100 p-2.5 text-xs dark:border-gray-800"
                >
                  <span className="text-gray-700 dark:text-gray-200">{d.fullName}</span>
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    disabled={toggleMutation.isPending}
                    onChange={() => toggleMutation.mutate(d.userId)}
                    className="h-3.5 w-3.5 rounded border-gray-300"
                  />
                </label>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
        >
          بستن
        </button>
      </div>
    </div>
  );
}