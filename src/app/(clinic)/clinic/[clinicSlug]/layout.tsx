"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClinicSidebar } from "@/components/layout/ClinicSidebar";
import { ReceptionSidebar } from "@/components/layout/ReceptionSidebar";
import { ClinicTopbar } from "@/components/layout/ClinicTopbar";
import { ROLE_LABELS, type ClinicRole } from "@/lib/auth/clinic-nav";
import { getCurrentClinicUser } from "@/lib/api/session";
import { getUnreadNotificationCount } from "@/lib/api/notifications";
import { queryKeys } from "@/lib/query/keys";

export default function ClinicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: queryKeys.session.currentUser(clinicSlug),
    queryFn: () => getCurrentClinicUser(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: getUnreadNotificationCount,
  });

  // اگر نقش کاربر هنوز از سرور نیامده یا قابل تشخیص نبود، فعلاً مدیر کلینیک فرض می‌شود
  // (fallback ایمن، نه یک منبع معتبر تشخیص نقش)
  const role: ClinicRole = currentUser?.roleKey ?? "clinic_admin";
  const userName = currentUser?.fullName || "...";
  const roleLabel = currentUser?.roleName || ROLE_LABELS[role];

  return (
    <div dir="rtl" className="flex min-h-screen flex-col lg:flex-row-reverse">
      <div className="flex-1">
        <ClinicTopbar
          userName={userName}
          roleLabel={roleLabel}
          notificationCount={unreadCount}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        <main className="p-4 md:p-6">{children}</main>
      </div>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-50 w-72 transition-transform duration-200 lg:static lg:z-auto lg:w-auto lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {role === "receptionist" ? (
          <ReceptionSidebar clinicSlug={clinicSlug} onNavigate={() => setSidebarOpen(false)} />
        ) : (
          <ClinicSidebar clinicSlug={clinicSlug} role={role} onNavigate={() => setSidebarOpen(false)} />
        )}
      </div>
    </div>
  );
}