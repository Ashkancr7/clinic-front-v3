import { CircleAlert } from "lucide-react";

export default function InstallmentsPage() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
      <CircleAlert className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
      <h1 className="text-base font-bold text-gray-800 dark:text-gray-100">طرح‌های اقساطی</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-400 dark:text-gray-500">
        بک‌اند فعلی مفهوم «طرح اقساطی» را پشتیبانی نمی‌کند (نه در فاکتور و نه در پرداخت). این صفحه وقتی
        قابل اتصال می‌شود که یک endpoint مخصوص اقساط به API اضافه شود.
      </p>
    </div>
  );
}
