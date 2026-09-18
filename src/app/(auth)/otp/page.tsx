import { Suspense } from "react";
import OtpForm from "./OtpForm";

export default function OtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-5">
          <div className="glass-content w-full max-w-sm rounded-3xl p-6 text-center">
            <p className="text-sm text-gray-600">در حال بارگذاری...</p>
          </div>
        </div>
      }
    >
      <OtpForm />
    </Suspense>
  );
}