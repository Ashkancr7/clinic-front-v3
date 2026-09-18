"use client";

import { use, useState } from "react";

import Link from "next/link";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ArrowRight,
  Receipt,
  CheckCircle2,
  XCircle,
  Send,
  Plus,
  X,
  Loader2,
  Undo2,
} from "lucide-react";

import {
  getInvoiceDetail,
  issueInvoice,
  cancelInvoice,
  sendInvoiceSms,
  createPayment,
  refundPayment,
  type PaymentMethod,
} from "@/lib/api/finance";

import { queryKeys } from "@/lib/query/keys";

import {
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  PAYMENT_METHOD_LABEL,
  formatToman,
} from "@/lib/finance-labels";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ clinicSlug: string; invoiceId: string }>;
}) {
  const { clinicSlug, invoiceId } = use(params);
  const queryClient = useQueryClient();

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [showAddPayment, setShowAddPayment] = useState(false);

  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.finance.invoiceDetail(clinicSlug, invoiceId),
    queryFn: () => getInvoiceDetail(clinicSlug, invoiceId),
    enabled: !!clinicSlug && !!invoiceId,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.finance.invoiceDetail(clinicSlug, invoiceId) });
    queryClient.invalidateQueries({ queryKey: ["finance", clinicSlug, "invoices"] });
  }

  const issueMutation = useMutation({
    mutationFn: () => issueInvoice(clinicSlug, invoiceId),
    onSuccess: () => {
      setActionError(null);
      setActionMessage("فاکتور صادر شد.");
      invalidate();
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "صدور فاکتور ناموفق بود"),
  });

  const cancelMutation = useMutation({
    mutationFn: () => {
      const reason = prompt("دلیل ابطال فاکتور را وارد کنید:");
      if (!reason) throw new Error("__cancelled__");
      return cancelInvoice(clinicSlug, invoiceId, reason);
    },
    onSuccess: () => {
      setActionError(null);
      setActionMessage("فاکتور ابطال شد.");
      invalidate();
    },
    onError: (e) => {
      if (e instanceof Error && e.message === "__cancelled__") return;
      setActionError(e instanceof Error ? e.message : "ابطال فاکتور ناموفق بود");
    },
  });

  const smsMutation = useMutation({
    mutationFn: () => sendInvoiceSms(clinicSlug, invoiceId),
    onSuccess: () => {
      setActionError(null);
      setActionMessage("پیامک فاکتور برای بیمار ارسال شد.");
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "ارسال پیامک ناموفق بود"),
  });

  const refundMutation = useMutation({
    mutationFn: (paymentId: string) => {
      const reason = prompt("دلیل بازپرداخت (اختیاری):") ?? undefined;
      return refundPayment(clinicSlug, paymentId, reason);
    },
    onSuccess: () => {
      setActionError(null);
      setActionMessage("بازپرداخت ثبت شد.");
      invalidate();
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "ثبت بازپرداخت ناموفق بود"),
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400 dark:text-gray-500">
        در حال بارگذاری...
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="py-20 text-center text-sm text-danger dark:text-red-300">
        فاکتور یافت نشد.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-400 dark:text-gray-500">
        <Link
          href={`/clinic/${clinicSlug}/finance/invoices`}
          className="transition hover:text-primary-dark dark:hover:text-primary-light"
        >
          فاکتورها
        </Link>
        <span className="mx-1 text-gray-300 dark:text-gray-600">‹</span>
        <span className="text-gray-600 dark:text-gray-300">جزئیات فاکتور</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <Receipt className="h-5 w-5 text-primary-dark dark:text-primary-light" />
          {invoice.invoiceNumber ?? "فاکتور بدون شماره"}
        </h1>

        <Link
          href={`/clinic/${clinicSlug}/finance/invoices`}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
        >
          <ArrowRight className="h-3.5 w-3.5" /> بازگشت
        </Link>
      </div>

      {actionError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500 dark:bg-red-500/10 dark:text-red-300">
          {actionError}
        </p>
      )}
      {actionMessage && (
        <p className="rounded-lg bg-primary-light/15 px-3 py-2 text-xs font-medium text-primary-dark dark:bg-primary-light/10 dark:text-primary-light">
          {actionMessage}
        </p>
      )}

      {/* Summary */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500">بیمار</div>
            <div className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              {invoice.patientName ?? "—"}
            </div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500" dir="ltr">
              {invoice.patientPhone ?? ""}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500">وضعیت</div>
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-1 text-[11px] ${INVOICE_STATUS_TONE[invoice.status]}`}
            >
              {INVOICE_STATUS_LABEL[invoice.status]}
            </span>
          </div>
          <div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500">مبلغ کل</div>
            <div className="mt-1 text-sm font-bold text-gray-800 dark:text-gray-100">
              {formatToman(invoice.totalAmount)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500">باقی‌مانده</div>
            <div
              className={`mt-1 text-sm font-bold ${
                invoice.remainingAmount > 0 ? "text-danger dark:text-red-300" : "text-gray-800 dark:text-gray-100"
              }`}
            >
              {formatToman(invoice.remainingAmount)}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {invoice.status === "draft" && (
            <button
              type="button"
              onClick={() => issueMutation.mutate()}
              disabled={issueMutation.isPending}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> صدور فاکتور
            </button>
          )}

          {invoice.remainingAmount > 0 && invoice.status !== "cancelled" && (
            <button
              type="button"
              onClick={() => setShowAddPayment(true)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
            >
              <Plus className="h-3.5 w-3.5" /> ثبت پرداخت
            </button>
          )}

          <button
            type="button"
            onClick={() => smsMutation.mutate()}
            disabled={smsMutation.isPending}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
          >
            <Send className="h-3.5 w-3.5" /> ارسال پیامک فاکتور
          </button>

          {invoice.status !== "cancelled" && invoice.status !== "paid" && (
            <button
              type="button"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-danger transition hover:bg-red-100 disabled:opacity-60 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
            >
              <XCircle className="h-3.5 w-3.5" /> ابطال فاکتور
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-bold text-gray-800 dark:text-gray-100">اقلام فاکتور</h3>

        {invoice.items.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500">قلمی برای این فاکتور ثبت نشده.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 dark:border-gray-800 dark:text-gray-500">
                  <th className="py-2 font-medium">شرح</th>
                  <th className="py-2 font-medium">تعداد</th>
                  <th className="py-2 font-medium">قیمت واحد</th>
                  <th className="py-2 font-medium">تخفیف</th>
                  <th className="py-2 font-medium">جمع</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((it) => (
                  <tr key={it.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2.5 text-gray-700 dark:text-gray-200">{it.description}</td>
                    <td className="py-2.5 text-gray-500 dark:text-gray-400">
                      {it.quantity.toLocaleString("fa-IR")}
                    </td>
                    <td className="py-2.5 text-gray-500 dark:text-gray-400">{formatToman(it.unitPrice)}</td>
                    <td className="py-2.5 text-gray-500 dark:text-gray-400">{formatToman(it.discountAmount)}</td>
                    <td className="py-2.5 font-medium text-gray-700 dark:text-gray-200">
                      {formatToman(it.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payments */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-bold text-gray-800 dark:text-gray-100">پرداخت‌ها</h3>

        {invoice.payments.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500">پرداختی برای این فاکتور ثبت نشده.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 dark:border-gray-800 dark:text-gray-500">
                  <th className="py-2 font-medium">مبلغ</th>
                  <th className="py-2 font-medium">روش</th>
                  <th className="py-2 font-medium">وضعیت</th>
                  <th className="py-2 font-medium">تاریخ</th>
                  <th className="py-2 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2.5 font-medium text-gray-700 dark:text-gray-200">
                      {formatToman(p.amount)}
                    </td>
                    <td className="py-2.5 text-gray-500 dark:text-gray-400">
                      {PAYMENT_METHOD_LABEL[p.method]}
                    </td>
                    <td className="py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${PAYMENT_STATUS_TONE[p.status]}`}>
                        {PAYMENT_STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-500 dark:text-gray-400">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString("fa-IR") : "—"}
                    </td>
                    <td className="py-2.5">
                      {p.status === "successful" && (
                        <button
                          type="button"
                          onClick={() => refundMutation.mutate(p.id)}
                          disabled={refundMutation.isPending}
                          title="بازپرداخت"
                          className="flex items-center gap-1 rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-danger disabled:opacity-40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddPayment && (
        <AddPaymentModal
          clinicSlug={clinicSlug}
          invoiceId={invoiceId}
          maxAmount={invoice.remainingAmount}
          onClose={() => setShowAddPayment(false)}
          onSaved={() => {
            setShowAddPayment(false);
            setActionMessage("پرداخت ثبت شد.");
            invalidate();
          }}
        />
      )}
    </div>
  );
}

function AddPaymentModal({
  clinicSlug,
  invoiceId,
  maxAmount,
  onClose,
  onSaved,
}: {
  clinicSlug: string;
  invoiceId: string;
  maxAmount: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState(maxAmount);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!amount || amount <= 0) throw new Error("مبلغ پرداخت باید بزرگ‌تر از صفر باشد.");
      return createPayment(clinicSlug, invoiceId, { amount, method, notes: notes || undefined });
    },
    onSuccess: () => onSaved(),
    onError: (e) => setFormError(e instanceof Error ? e.message : "ثبت پرداخت ناموفق بود"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px] dark:bg-black/60">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#18201e]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">ثبت پرداخت</h2>
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
              مبلغ (حداکثر {formatToman(maxAmount)})
            </label>
            <input
              type="number"
              min={0}
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">روش پرداخت</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
            >
              <option value="cash">نقدی</option>
              <option value="pos">کارتخوان</option>
              <option value="online">آنلاین</option>
              <option value="credit">اعتباری</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">یادداشت (اختیاری)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
            />
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
            {mutation.isPending ? "در حال ثبت..." : "ثبت پرداخت"}
          </button>
        </div>
      </div>
    </div>
  );
}
