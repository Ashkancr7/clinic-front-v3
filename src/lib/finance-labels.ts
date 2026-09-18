import type { InvoiceStatus, PaymentMethod, PaymentStatus } from "./api/finance";

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "پیش‌نویس",
  issued: "صادرشده",
  partially_paid: "پرداخت جزئی",
  paid: "تسویه‌شده",
  cancelled: "ابطال‌شده",
  refunded: "بازپرداخت‌شده",
};

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, string> = {
  draft: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400",
  issued: "bg-amber-50 text-warning dark:bg-amber-500/10 dark:text-amber-300",
  partially_paid: "bg-amber-50 text-warning dark:bg-amber-500/10 dark:text-amber-300",
  paid: "bg-primary-light/20 text-primary-dark dark:bg-primary/15 dark:text-primary",
  cancelled: "bg-red-50 text-danger dark:bg-red-500/10 dark:text-red-300",
  refunded: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "در انتظار",
  successful: "موفق",
  failed: "ناموفق",
  refunded: "بازپرداخت‌شده",
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, string> = {
  pending: "bg-amber-50 text-warning dark:bg-amber-500/10 dark:text-amber-300",
  successful: "bg-primary-light/20 text-primary-dark dark:bg-primary/15 dark:text-primary",
  failed: "bg-red-50 text-danger dark:bg-red-500/10 dark:text-red-300",
  refunded: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "نقدی",
  pos: "کارتخوان",
  online: "آنلاین",
  credit: "اعتباری",
};

export function formatToman(n: number) {
  return `${n.toLocaleString("fa-IR")} تومان`;
}
