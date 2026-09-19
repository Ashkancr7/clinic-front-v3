"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Info,
} from "lucide-react";

import { superAdminApi } from "@/lib/api/super-admin";
import { superAdminReportsApi } from "@/lib/api/super-admin-reports";
import { queryKeys } from "@/lib/query/keys";

const ACTION_TONE: Record<string, string> = {
  create: "text-primary-dark bg-primary-light/20 dark:text-primary-light dark:bg-primary/10",
  update: "text-blue-600 bg-secondary-blue/40 dark:text-blue-300 dark:bg-blue-500/10",
  delete: "text-danger bg-red-50 dark:text-red-400 dark:bg-red-500/10",
};

function actionTone(action: string) {
  const key = Object.keys(ACTION_TONE).find((k) => action.includes(k));
  return key
    ? ACTION_TONE[key]
    : "text-gray-500 bg-gray-100 dark:text-gray-300 dark:bg-gray-800";
}

function fmt(n: number | undefined | null) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString("fa-IR");
}

function fmtDate(iso: string | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fa-IR");
  } catch {
    return iso;
  }
}

export default function SuperAdminAuditLogsPage() {
  const [clinicId, setClinicId] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data: clinics = [] } = useQuery({
    queryKey: queryKeys.superAdmin.clinics.list(),
    queryFn: superAdminApi.getClinics,
  });

  const filters = {
    clinic_id: clinicId || undefined,
    action: action || undefined,
    entity_type: entityType || undefined,
    from: from || undefined,
    to: to || undefined,
    per_page: perPage,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.superAdminReports.auditLogs({ ...filters, page }),
    queryFn: () => superAdminReportsApi.getAuditLogs(filters),
  });

  const rows = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
          لاگ عملیات حساس
        </h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          لاگ سراسری عملیات حساس در پلتفرم، قابل فیلتر بر اساس کلینیک، کاربر،
          عملیات و بازه‌ی زمانی
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        به دلایل امنیتی، مقادیر قبل و بعد از تغییر (old_value / new_value) در
        این گزارش نمایش داده نمی‌شود.
      </div>

      {/* فیلترها */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={clinicId}
          onChange={(e) => {
            setClinicId(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
        >
          <option value="">همه کلینیک‌ها</option>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-700 dark:bg-gray-950">
          <input
            type="text"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            placeholder="نوع عملیات (مثلاً update)"
            className="w-40 bg-transparent text-xs text-gray-600 outline-none placeholder:text-gray-300 dark:text-gray-200 dark:placeholder:text-gray-600"
          />
          <Search className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600" />
        </div>

        <input
          type="text"
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
          placeholder="نوع موجودیت (مثلاً subscription)"
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:placeholder:text-gray-600"
        />

        <input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
        />
        <span className="text-xs text-gray-400">تا</span>
        <input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
        />
      </div>

      {/* جدول */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        {isLoading && (
          <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            در حال بارگذاری...
          </div>
        )}

        {error && (
          <div className="py-10 text-center text-sm text-danger dark:text-red-400">
            خطا در دریافت لاگ عملیات
          </div>
        )}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 dark:border-gray-800 dark:text-gray-500">
                  <th className="py-2 font-medium">زمان</th>
                  <th className="py-2 font-medium">کلینیک</th>
                  <th className="py-2 font-medium">کاربر</th>
                  <th className="py-2 font-medium">عملیات</th>
                  <th className="py-2 font-medium">موجودیت</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-50 dark:border-gray-800"
                  >
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {fmtDate(row.created_at)}
                    </td>

                    <td className="py-3 text-gray-700 dark:text-gray-300">
                      {row.clinic_name ??
                        clinics.find((c) => c.id === row.clinic_id)?.name ??
                        "—"}
                    </td>

                    <td className="py-3 text-gray-700 dark:text-gray-300">
                      {row.user_name ?? (row.user_id ? `#${fmt(row.user_id)}` : "—")}
                    </td>

                    <td className="py-3">
                      <span
                        className={`flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] ${actionTone(
                          row.action
                        )}`}
                      >
                        <ShieldAlert className="h-3 w-3" />
                        {row.action}
                      </span>
                    </td>

                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {row.entity_type ?? "—"}
                      {row.entity_id ? ` #${row.entity_id}` : ""}
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-10 text-center text-sm text-gray-400 dark:text-gray-500"
                    >
                      موردی یافت نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && data && data.lastPage > 1 && (
          <div className="mt-4 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>
              صفحه {fmt(data.currentPage)} از {fmt(data.lastPage)} — مجموع{" "}
              {fmt(data.total)} رکورد
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-gray-200 p-1.5 disabled:opacity-40 dark:border-gray-700"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.lastPage, p + 1))}
                disabled={page >= data.lastPage}
                className="rounded-lg border border-gray-200 p-1.5 disabled:opacity-40 dark:border-gray-700"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
