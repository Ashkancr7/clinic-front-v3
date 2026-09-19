"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Database,
  MessageSquare,
  Users2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { superAdminApi } from "@/lib/api/super-admin";
import {
  superAdminReportsApi,
  type UsageMetric,
} from "@/lib/api/super-admin-reports";
import { queryKeys } from "@/lib/query/keys";

function fmt(n: number | undefined | null) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString("fa-IR");
}

function ProgressCell({ metric }: { metric: UsageMetric | undefined }) {
  if (!metric) {
    return <span className="text-gray-300 dark:text-gray-700">—</span>;
  }

  const percent = Math.min(100, metric.usage_percent ?? 0);

  return (
    <div className="min-w-[130px]">
      <div className="mb-1 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
        <span>
          {fmt(metric.used)} /{" "}
          {metric.is_unlimited ? "نامحدود" : fmt(metric.limit)}
        </span>
        <span
          className={
            metric.over_limit ? "font-bold text-danger dark:text-red-400" : ""
          }
        >
          {metric.usage_percent}٪
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className={`h-full rounded-full transition-all ${
            metric.over_limit
              ? "bg-danger"
              : percent >= 70
              ? "bg-amber-400"
              : "bg-primary"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function SuperAdminUsagePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "" | "active" | "inactive" | "suspended"
  >("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  // ============================================================
  // کلینیک‌ها (برای جستجوی نام)
  // ============================================================

  const { data: clinics = [] } = useQuery({
    queryKey: queryKeys.superAdmin.clinics.list(),
    queryFn: superAdminApi.getClinics,
  });

  const clinicIdByName = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return undefined;

    return clinics.find((c) => c.name.toLowerCase().includes(keyword))?.id;
  }, [clinics, search]);

  // ============================================================
  // گزارش مصرف (GET /super-admin/reports/usage)
  // ============================================================

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.superAdminReports.usageReport({
      status: statusFilter || undefined,
      clinic_id: clinicIdByName,
      page,
    }),
    queryFn: () =>
      superAdminReportsApi.getUsageReport({
        status: statusFilter || undefined,
        clinic_id: clinicIdByName,
        per_page: perPage,
      }),
  });

  const rows = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
          مصرف و آمار کلان
        </h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          مصرف کاربر، فضای ذخیره‌سازی و پیامک هر کلینیک در برابر سقف پلن
        </p>
      </div>

      {/* فیلترها */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-700 dark:bg-gray-950 sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="جستجوی نام کلینیک..."
            className="w-full bg-transparent text-xs text-gray-600 outline-none placeholder:text-gray-300 dark:text-gray-200 dark:placeholder:text-gray-600"
          />
          <Search className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            setPage(1);
          }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
          <option value="suspended">معلق</option>
        </select>
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
            خطا در دریافت گزارش مصرف
          </div>
        )}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 dark:border-gray-800 dark:text-gray-500">
                  <th className="py-2 font-medium">کلینیک</th>
                  <th className="py-2 font-medium">پلن</th>
                  <th className="py-2 font-medium">
                    <span className="flex items-center gap-1">
                      <Users2 className="h-3.5 w-3.5" /> کاربران
                    </span>
                  </th>
                  <th className="py-2 font-medium">
                    <span className="flex items-center gap-1">
                      <Database className="h-3.5 w-3.5" /> فضای ذخیره‌سازی
                    </span>
                  </th>
                  <th className="py-2 font-medium">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> پیامک
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.clinic_id}
                    className="border-b border-gray-50 dark:border-gray-800"
                  >
                    <td className="py-3 font-medium text-gray-800 dark:text-gray-200">
                      {row.clinic_name}
                    </td>

                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {row.plan_name ?? "—"}
                    </td>

                    <td className="py-3">
                      <ProgressCell metric={row.users} />
                    </td>

                    <td className="py-3">
                      <ProgressCell metric={row.storage_mb} />
                    </td>

                    <td className="py-3">
                      <ProgressCell metric={row.sms_this_month} />
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

        {/* صفحه‌بندی */}
        {!isLoading && !error && data && data.lastPage > 1 && (
          <div className="mt-4 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>
              صفحه {fmt(data.currentPage)} از {fmt(data.lastPage)} — مجموع{" "}
              {fmt(data.total)} کلینیک
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
