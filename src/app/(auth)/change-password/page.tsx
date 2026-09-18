import { Suspense } from "react";
import ChangePasswordForm from "./ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-5">
          <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-6 text-center dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-sm text-gray-400 dark:text-gray-500">در حال بارگذاری...</p>
          </div>
        </div>
      }
    >
      <ChangePasswordForm />
    </Suspense>
  );
}
