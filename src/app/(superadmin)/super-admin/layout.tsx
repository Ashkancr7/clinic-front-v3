"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Leaf,
  LayoutDashboard,
  Building2,
  Folder,
  Users,
  LayoutGrid,
  Receipt,
  BarChart3,
  Settings,
  Headset,
  Menu,
  X,
  LogOut,
  Gauge,
  ShieldAlert,
} from "lucide-react";
import Image from "next/image";

const NAV_ITEMS = [
  {
    href: "/super-admin/dashboard",
    label: "داشبورد",
    icon: LayoutDashboard,
  },
  {
    href: "/super-admin/clinics",
    label: "کلینیک‌ها",
    icon: Building2,
  },
  {
    href: "/super-admin/plans",
    label: "اشتراک‌ها",
    icon: Folder,
  },
  {
    href: "/super-admin/users",
    label: "کلینک طرف قرارداد",
    icon: Users,
  },
  {
    href: "/super-admin/modules",
    label: "ماژول‌ها",
    icon: LayoutGrid,
  },
  {
    href: "/super-admin/transactions",
    label: "تراکنش‌ها",
    icon: Receipt,
  },
  {
    href: "/super-admin/usage",
    label: "مصرف کلینیک‌ها",
    icon: Gauge,
  },
  {
    href: "/super-admin/reports",
    label: "گزارش‌ها",
    icon: BarChart3,
  },
  {
    href: "/super-admin/audit-logs",
    label: "لاگ عملیات",
    icon: ShieldAlert,
  },
  {
    href: "/super-admin/settings",
    label: "تنظیمات",
    icon: Settings,
  },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }

  // بستن Drawer هنگام تغییر مسیر
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // قفل کردن اسکرول صفحه وقتی Drawer باز است
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  const SidebarContent = (
    <>
      {/* Header Sidebar */}
      <div className="mb-6 flex items-center justify-between gap-2 lg:justify-start">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light/20 dark:bg-primary/15">
            <Leaf className="h-6 w-6 text-primary dark:text-primary-light" />
          </div>

          <div className="text-right leading-tight">
            <div className="text-base font-bold text-gray-900 dark:text-white">
              Beauty Clinic CRM
            </div>

            <div className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
              پنل سوپرادمین
            </div>
          </div>
        </div>

        {/* Close Drawer - Mobile */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(false)}
          className="
            rounded-lg p-2
            text-gray-400
            transition
            hover:bg-gray-50
            hover:text-gray-600
            dark:text-gray-500
            dark:hover:bg-white/[0.06]
            dark:hover:text-gray-200
            lg:hidden
          "
          aria-label="بستن منو"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="glass-scroll flex flex-1 flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                glass-nav-item
                group
                flex
                items-center
                rounded-xl
                px-4
                py-2.5
                text-sm
                transition-all
                duration-200

                ${
                  isActive
                    ? "active"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-white"
                }
              `}
            >
              <item.icon
                className={`
                  ml-5
                  h-4
                  w-4
                  shrink-0
                  transition-colors
                  ${
                    isActive
                      ? "text-primary-dark dark:text-primary-light"
                      : "text-gray-400 group-hover:text-gray-700 dark:text-gray-500 dark:group-hover:text-gray-200"
                  }
                `}
              />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="
          mt-2
          flex
          items-center
          gap-3
          rounded-xl
          px-4
          py-2.5
          text-sm
          text-danger
          transition-all
          duration-200
          hover:bg-red-50
          disabled:cursor-not-allowed
          disabled:opacity-60
          dark:text-red-300
          dark:hover:bg-red-500/10
        "
      >
        <LogOut className="ml-5 h-4 w-4 shrink-0" />
        <span>{isLoggingOut ? "در حال خروج..." : "خروج از حساب"}</span>
      </button>

      {/* Decorative Image */}
      <div className="mt-8 hidden justify-center lg:flex">
        <div className="rounded-full p-1 ring-1 ring-gray-100 dark:ring-white/10">
          <Image
            src="/image/superadmin.png"
            alt="Super Admin"
            width={120}
            height={120}
            unoptimized
            className="rounded-full object-cover"
          />
        </div>
      </div>

      {/* Support Box */}
      <div
        className="
          glass-strong
          mt-4
          rounded-2xl
          border
          border-gray-100
          p-4
          text-center
          dark:border-white/[0.08]
        "
      >
        <div className="text-sm font-semibold text-gray-800 dark:text-white">
          نیاز به کمک دارید؟
        </div>

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          تیم پشتیبانی ما آماده پاسخگویی است.
        </p>

        <button
          type="button"
          className="
            mt-3
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-transparent
            bg-primary-dark
            py-2.5
            text-xs
            font-medium
            text-white
            transition-all
            duration-200
            hover:opacity-90

            dark:border-primary-light/30
            dark:bg-primary/80
            dark:shadow-glow-primary
            dark:hover:bg-primary
          "
        >
          <Headset className="h-4 w-4" />
          تماس با پشتیبانی
        </button>
      </div>
    </>
  );

  return (
    <div
      dir="rtl"
      className="
        flex
        min-h-screen
        flex-col
        bg-gray-50
        text-gray-900
        transition-colors
        duration-300

        dark:bg-[#071514]
        dark:text-gray-100

        lg:flex-row
      "
    >
      {/* =========================
          Mobile Header
      ========================= */}
      <header
        className="
          glass
          flex
          items-center
          justify-between
          rounded-none
          border-b
          border-gray-100
          px-4
          py-3

          dark:border-white/[0.08]

          lg:hidden
        "
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light/20 dark:bg-primary/15">
            <Leaf className="h-5 w-5 text-primary dark:text-primary-light" />
          </div>

          <span className="text-sm font-bold text-gray-900 dark:text-white">
            Beauty Clinic CRM
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="
            rounded-xl
            border
            border-gray-200
            bg-white/70
            p-2
            text-gray-600
            transition
            hover:bg-gray-100

            dark:border-white/10
            dark:bg-white/[0.04]
            dark:text-gray-200
            dark:hover:bg-white/[0.08]
          "
          aria-label="باز کردن منو"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* =========================
          Mobile Overlay
      ========================= */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="
            fixed
            inset-0
            z-40
            bg-black/40
            backdrop-blur-sm
            dark:bg-black/60
            lg:hidden
          "
          aria-hidden="true"
        />
      )}

      {/* =========================
          Sidebar
      ========================= */}
      <aside
        className={`
          glass
          fixed
          inset-y-0
          right-0
          z-50
          flex
          w-72
          max-w-[85%]
          flex-col
          overflow-y-auto
          rounded-none
          border-l
          border-gray-100
          p-5
          shadow-xl
          transition-transform
          duration-300
          ease-in-out

          dark:border-white/[0.08]

          lg:static
          lg:z-auto
          lg:w-64
          lg:max-w-none
          lg:translate-x-0
          lg:shadow-none

          ${
            isDrawerOpen
              ? "translate-x-0"
              : "translate-x-full lg:translate-x-0"
          }
        `}
      >
        {SidebarContent}
      </aside>

      {/* =========================
          Main Content
      ========================= */}
      <main
        className="
          min-w-0
          flex-1
          overflow-x-hidden
          bg-gray-50
          p-4
          transition-colors
          duration-300

          dark:bg-[#071514]

          md:p-6
          lg:p-8
        "
      >
        <div
          className="
            glass-content
            min-h-[calc(100vh-2rem)]
            rounded-3xl
            border
            border-gray-100
            bg-white/60
            p-4
            text-gray-900
            transition-colors
            duration-300

            dark:border-white/[0.07]
            dark:bg-white/[0.025]
            dark:text-gray-100

            md:min-h-[calc(100vh-4rem)]
            md:p-6
          "
        >
          {children}
        </div>
      </main>
    </div>
  );
}