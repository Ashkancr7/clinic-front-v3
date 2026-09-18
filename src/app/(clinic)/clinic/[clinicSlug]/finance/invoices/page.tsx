"use client";

import { use, useMemo, useState } from "react";

import Link from "next/link";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Receipt,
  Plus,
  Search,
  X,
  Loader2,
  UserRound,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import {
  getInvoices,
  createInvoice,
  issueInvoice,
  cancelInvoice,
  sendInvoiceSms,
  type Invoice,
  type InvoiceStatus,
  type CreateInvoiceItemPayload,
} from "@/lib/api/finance";

import { searchPatients, type PatientSearchResult } from "@/lib/api/patients";
import { getServices, type ClinicService } from "@/lib/api/services";
import { queryKeys } from "@/lib/query/keys";
import { INVOICE_STATUS_LABEL as STATUS_LABEL, INVOICE_STATUS_TONE as STATUS_TONE, formatToman } from "@/lib/finance-labels";

export default function InvoicesPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: invoices = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.finance.invoices(clinicSlug, statusFilter === "all" ? undefined : statusFilter),
    queryFn: () => getInvoices(clinicSlug, { status: statusFilter === "all" ? undefined : statusFilter }),
    enabled: !!clinicSlug,
  });

  function invalidateInvoices() {
    queryClient.invalidateQueries({ queryKey: ["finance", clinicSlug, "invoices"] });
  }

  const issueMutation = useMutation({
    mutationFn: (invoiceId: string) => issueInvoice(clinicSlug, invoiceId),
    onSuccess: () => {
      setActionError(null);
      invalidateInvoices();
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "صدور فاکتور ناموفق بود"),
  });

  const cancelMutation = useMutation({
    mutationFn: (invoiceId: string) => {
      const reason = prompt("دلیل ابطال فاکتور را وارد کنید:");
      if (!reason) throw new Error("__cancelled__");
      return cancelInvoice(clinicSlug, invoiceId, reason);
    },
    onSuccess: () => {
      setActionError(null);
      invalidateInvoices();
    },
    onError: (e) => {
      if (e instanceof Error && e.message === "__cancelled__") return;
      setActionError(e instanceof Error ? e.message : "ابطال فاکتور ناموفق بود");
    },
  });

  const smsMutation = useMutation({
    mutationFn: (invoiceId: string) => sendInvoiceSms(clinicSlug, invoiceId),
    onSuccess: () => {
      setActionError(null);
      alert("پیامک فاکتور ارسال شد.");
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "ارسال پیامک ناموفق بود"),
  });

  const filteredInvoices = useMemo(() => {
    const q = search.trim();
    if (!q) return invoices;
    return invoices.filter(
      (inv) =>
        (inv.patientName ?? "").includes(q) ||
        (inv.patientPhone ?? "").includes(q) ||
        (inv.invoiceNumber ?? "").includes(q)
    );
  }, [invoices, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <Receipt className="h-5 w-5 text-primary-dark dark:text-primary-light" /> فاکتورهای فروش
        </h1>

        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" /> فاکتور جدید
        </button>
      </div>

      {actionError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500 dark:bg-red-500/10 dark:text-red-300">
          {actionError}
        </p>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "draft", "issued", "partially_paid", "paid", "cancelled"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1.5 text-[11px] transition ${
                  statusFilter === s
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/20"
                }`}
              >
                {s === "all" ? "همه" : STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 dark:border-white/10 sm:w-64">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی بیمار یا شماره فاکتور..."
              className="w-full bg-transparent text-xs text-gray-600 outline-none placeholder:text-gray-300 dark:text-gray-200"
            />
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-300" />
          </div>
        </div>

        {isLoading ? (
          <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</p>
        ) : error ? (
          <p className="py-10 text-center text-xs text-danger dark:text-red-300">
            دریافت لیست فاکتورها ناموفق بود.
          </p>
        ) : filteredInvoices.length === 0 ? (
          <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">فاکتوری یافت نشد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 dark:border-gray-800 dark:text-gray-500">
                  <th className="py-2 font-medium">شماره فاکتور</th>
                  <th className="py-2 font-medium">بیمار</th>
                  <th className="py-2 font-medium">مبلغ کل</th>
                  <th className="py-2 font-medium">پرداخت‌شده</th>
                  <th className="py-2 font-medium">باقی‌مانده</th>
                  <th className="py-2 font-medium">وضعیت</th>
                  <th className="py-2 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-3">
                      <Link
                        href={`/clinic/${clinicSlug}/finance/invoices/${inv.id}`}
                        className="font-medium text-primary-dark hover:underline dark:text-primary-light"
                        dir="ltr"
                      >
                        {inv.invoiceNumber ?? "بدون شماره"}
                      </Link>
                    </td>
                    <td className="py-3 text-gray-700 dark:text-gray-200">{inv.patientName ?? "—"}</td>
                    <td className="py-3 text-gray-700 dark:text-gray-200">{formatToman(inv.totalAmount)}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">{formatToman(inv.paidAmount)}</td>
                    <td
                      className={`py-3 ${
                        inv.remainingAmount > 0 ? "text-danger dark:text-red-300" : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {formatToman(inv.remainingAmount)}
                    </td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] ${STATUS_TONE[inv.status]}`}>
                        {STATUS_LABEL[inv.status]}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        {inv.status === "draft" && (
                          <button
                            type="button"
                            onClick={() => issueMutation.mutate(inv.id)}
                            disabled={issueMutation.isPending}
                            title="صدور فاکتور"
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-primary-dark disabled:opacity-40 dark:hover:bg-white/10 dark:hover:text-primary-light"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {inv.status !== "cancelled" && inv.status !== "paid" && (
                          <button
                            type="button"
                            onClick={() => cancelMutation.mutate(inv.id)}
                            disabled={cancelMutation.isPending}
                            title="ابطال فاکتور"
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-danger disabled:opacity-40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => smsMutation.mutate(inv.id)}
                          disabled={smsMutation.isPending}
                          title="ارسال پیامک فاکتور"
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 disabled:opacity-40 dark:hover:bg-white/10 dark:hover:text-gray-200"
                        >
                          <Send className="h-3.5 w-3.5" />
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

      {showCreate && (
        <CreateInvoiceModal
          clinicSlug={clinicSlug}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            invalidateInvoices();
          }}
        />
      )}
    </div>
  );
}

interface DraftItem {
  serviceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
}

function emptyItem(): DraftItem {
  return { serviceId: "", description: "", quantity: 1, unitPrice: 0, discountAmount: 0 };
}

function CreateInvoiceModal({
  clinicSlug,
  onClose,
  onCreated,
}: {
  clinicSlug: string;
  onClose: () => void;
  onCreated: (invoiceId: string) => void;
}) {
  const [patientQuery, setPatientQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: patientResults = [], isFetching: patientsLoading } = useQuery({
    queryKey: [...queryKeys.patients.lookup(patientQuery), clinicSlug],
    queryFn: () => searchPatients(clinicSlug, patientQuery.trim()),
    enabled: patientQuery.trim().length >= 2 && !!clinicSlug,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services", clinicSlug, "active-for-invoice"],
    queryFn: () => getServices(clinicSlug),
    enabled: !!clinicSlug,
  });

  const total = items.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice - it.discountAmount,
    0
  );

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function applyService(index: number, service: ClinicService) {
    updateItem(index, {
      serviceId: service.id,
      description: service.name,
      unitPrice: service.basePrice ?? 0,
    });
  }

  const mutation = useMutation({
    mutationFn: () => {
      if (!selectedPatient) throw new Error("لطفاً یک بیمار انتخاب کنید.");
      const validItems = items.filter((it) => it.description.trim());
      if (validItems.length === 0) throw new Error("حداقل یک قلم برای فاکتور لازم است.");

      const payloadItems: CreateInvoiceItemPayload[] = validItems.map((it) => ({
        service_id: it.serviceId || undefined,
        description: it.description.trim(),
        quantity: it.quantity,
        unit_price: it.unitPrice,
        discount_amount: it.discountAmount || undefined,
      }));

      return createInvoice(clinicSlug, { patient_id: selectedPatient.id, items: payloadItems });
    },
    onSuccess: (invoice) => onCreated(invoice.id),
    onError: (e) => setFormError(e instanceof Error ? e.message : "ایجاد فاکتور ناموفق بود"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px] dark:bg-black/60">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#18201e]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">فاکتور جدید</h2>
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

        {/* Patient picker */}
        <div className="relative">
          <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">بیمار</label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 dark:border-white/10">
            <input
              value={patientQuery}
              onChange={(e) => {
                setPatientQuery(e.target.value);
                setSelectedPatient(null);
                setShowPatientResults(true);
              }}
              onFocus={() => setShowPatientResults(true)}
              placeholder="جستجوی نام یا موبایل بیمار..."
              className="w-full bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-300 dark:text-gray-200"
            />
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-300" />
          </div>

          {showPatientResults && !selectedPatient && patientQuery.trim().length >= 2 && (
            <div className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#11151c]">
              {patientsLoading && (
                <div className="px-3 py-3 text-center text-[11px] text-gray-400 dark:text-gray-500">
                  در حال جستجو...
                </div>
              )}
              {!patientsLoading && patientResults.length === 0 && (
                <div className="px-3 py-3 text-center text-[11px] text-gray-400 dark:text-gray-500">
                  بیماری با این مشخصات پیدا نشد.
                </div>
              )}
              {!patientsLoading &&
                patientResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPatient(p);
                      setPatientQuery(p.fullName);
                      setShowPatientResults(false);
                      setFormError(null);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-right text-xs transition hover:bg-gray-50 dark:hover:bg-white/10"
                  >
                    <span className="font-medium text-gray-700 dark:text-gray-200">{p.fullName}</span>
                    <span className="text-gray-400 dark:text-gray-500" dir="ltr">
                      {p.phone}
                    </span>
                  </button>
                ))}
            </div>
          )}

          {selectedPatient && (
            <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-gray-50 p-2.5 dark:bg-white/[0.05]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light/20 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light">
                <UserRound className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                  {selectedPatient.fullName}
                </div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500" dir="ltr">
                  {selectedPatient.phone}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[11px] text-gray-500 dark:text-gray-400">اقلام فاکتور</label>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, emptyItem()])}
              className="flex items-center gap-1 text-[11px] text-primary-dark hover:underline dark:text-primary-light"
            >
              <Plus className="h-3 w-3" /> افزودن قلم
            </button>
          </div>

          <div className="space-y-2">
            {items.map((it, index) => (
              <div key={index} className="rounded-xl border border-gray-100 p-2.5 dark:border-gray-800">
                <div className="mb-2 flex items-center gap-2">
                  <select
                    value={it.serviceId}
                    onChange={(e) => {
                      const svc = services.find((s) => s.id === e.target.value);
                      if (svc) applyService(index, svc);
                      else updateItem(index, { serviceId: "" });
                    }}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
                  >
                    <option value="">خدمت (اختیاری)</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                      className="shrink-0 rounded-lg p-1.5 text-gray-300 transition hover:bg-red-50 hover:text-danger dark:hover:bg-red-500/10 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <input
                  value={it.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  placeholder="شرح قلم فاکتور"
                  className="mb-2 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
                />

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-0.5 block text-[9px] text-gray-400">تعداد</label>
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => updateItem(index, { quantity: Number(e.target.value) || 1 })}
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[9px] text-gray-400">قیمت واحد</label>
                    <input
                      type="number"
                      min={0}
                      value={it.unitPrice}
                      onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[9px] text-gray-400">تخفیف</label>
                    <input
                      type="number"
                      min={0}
                      value={it.discountAmount}
                      onChange={(e) => updateItem(index, { discountAmount: Number(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 dark:bg-white/[0.04] dark:text-gray-200">
            <span>جمع کل</span>
            <span>{formatToman(total)}</span>
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
            {mutation.isPending ? "در حال ثبت..." : "ثبت فاکتور"}
          </button>
        </div>
      </div>
    </div>
  );
}
