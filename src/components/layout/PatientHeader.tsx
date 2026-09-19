"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown, Leaf, LogOut, Menu, MessageSquare, Settings, UserRound, X } from "lucide-react";
import Image from "next/image";
import { NotificationsDropdown } from "./NotificationsDropdown";

import { getPatientDashboardSummary } from "@/lib/api/patient-portal";
import { getUnreadNotificationCount } from "@/lib/api/notifications";
import { queryKeys } from "@/lib/query/keys";

const NAV_ITEMS = [
  { href: "dashboard", label: "داشبورد" },
  { href: "appointments", label: "نوبت‌های من" },
  { href: "services", label: "خدمات من" },
  { href: "medical-records", label: "پرونده پزشکی من" },
  { href: "invoices", label: "فاکتورهای من" },
  { href: "chat", label: "پیام‌ها" },
];

export function PatientHeader({ clinicSlug }: { clinicSlug: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 224 });

  const profileWrapperRef = useRef<HTMLDivElement>(null); // فقط دکمه تریگر را نگه می‌دارد
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profilePanelRef = useRef<HTMLDivElement>(null); // پنل پرتال‌شده

  const { data: summary } = useQuery({
    queryKey: queryKeys.patientPortal.dashboard(clinicSlug),
    queryFn: () => getPatientDashboardSummary(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: getUnreadNotificationCount,
  });

  const displayName = summary?.fullName ?? "...";

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  function updateProfilePosition() {
    const btn = profileButtonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const panelWidth = 224; // w-56
    let left = rect.right - panelWidth;
    left = Math.max(8, Math.min(left, window.innerWidth - panelWidth - 8));
    setCoords({ top: rect.bottom + 8, left, width: panelWidth });
  }

  useEffect(() => {
    if (!isProfileOpen) return;

    updateProfilePosition();

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedTrigger = profileWrapperRef.current?.contains(target);
      const clickedPanel = profilePanelRef.current?.contains(target);
      if (!clickedTrigger && !clickedPanel) setIsProfileOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsProfileOpen(false);
    }
    function handleReposition() {
      updateProfilePosition();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const profilePanel = isProfileOpen && (
    <motion.div
      ref={profilePanelRef}
      role="menu"
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width }}
      // z-[9999] + پرتال به body: هیچ کارت یا ویجت دیگری در صفحه نمی‌تواند رویش بیاید
      className="glass-strong z-[9999] origin-top-left overflow-hidden rounded-2xl p-1.5 bg-white dark:bg-[#111827]"
    >
      <div className="border-b border-gray-100 px-3 py-2.5 dark:border-white/10">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{displayName}</p>
        <p className="text-xs text-gray-400">بیمار کلینیک</p>
      </div>

      {/* «پروفایل من» و «تنظیمات حساب» فعلاً غیرفعال‌اند — هنوز صفحه/endpoint
          مشخصی برایشان ساخته نشده */}
      <div className="py-1.5">
        <button
          disabled
          className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-sm text-gray-300"
        >
          <UserRound className="h-4 w-4 opacity-50" />
          پروفایل من
        </button>
        <button
          disabled
          className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-sm text-gray-300"
        >
          <Settings className="h-4 w-4 opacity-50" />
          تنظیمات حساب
        </button>
      </div>

      <div className="border-t border-gray-100 pt-1.5 dark:border-white/10">
        <button
          role="menuitem"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "در حال خروج..." : "خروج از حساب"}
        </button>
      </div>
    </motion.div>
  );

  return (
    <header className="glass sticky top-0 z-40 rounded-none px-4 md:px-8">
      <div className="flex h-16 items-center justify-between gap-4">
        <Link href={`/patient/${clinicSlug}/dashboard`} className="flex shrink-0 items-center gap-2">
          <Leaf className="h-7 w-7 text-primary dark:text-primary-light" />
          <div className="hidden text-left leading-tight sm:block">
            <div className="text-base font-bold text-gray-900 dark:text-white">Beauty Clinic CRM</div>
            <div className="text-[11px] text-gray-400">پلتفرم مدیریت کلینیک زیبایی</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          {NAV_ITEMS.map((item) => {
            const href = `/patient/${clinicSlug}/${item.href}`;
            const isActive = pathname === href;
            return (
              <Link
                key={item.href}
                href={href}
                className={`relative whitespace-nowrap rounded-lg px-3.5 py-2 transition-colors ${
                  isActive
                    ? "font-medium text-primary-dark dark:text-primary-light"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="patient-nav-underline"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-primary dark:bg-primary-light"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <NotificationsDropdown />

          <Link
            href={`/patient/${clinicSlug}/chat`}
            aria-label="پیام‌ها"
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-50 hover:text-primary sm:flex dark:text-gray-300 dark:hover:bg-white/[0.08] dark:hover:text-primary-light"
          >
            <MessageSquare className="h-5 w-5" />
          </Link>

          <div ref={profileWrapperRef} className="relative">
            <button
              ref={profileButtonRef}
              onClick={() => setIsProfileOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={isProfileOpen}
              className="flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-1 transition hover:bg-gray-50 dark:hover:bg-white/[0.06]"
            >
              <Image
                src="/image/user.PNG"
                alt="User"
                width={30}
                height={30}
                unoptimized
                className="rounded-full object-cover ring-2 ring-gray-100 dark:ring-white/10"
              />
              <span className="hidden text-sm font-medium text-gray-700 sm:block dark:text-gray-200">{displayName}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 dark:text-gray-500 ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {mounted && createPortal(<AnimatePresence>{profilePanel}</AnimatePresence>, document.body)}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label={isMobileMenuOpen ? "بستن منو" : "باز کردن منو"}
            aria-expanded={isMobileMenuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.08] md:hidden"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden md:hidden"
          >
            <div className="flex flex-col gap-1 border-t border-gray-100 py-3 dark:border-white/10">
              {NAV_ITEMS.map((item) => {
                const href = `/patient/${clinicSlug}/${item.href}`;
                const isActive = pathname === href;
                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={`rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-primary-light/15 font-medium text-primary-dark dark:text-primary-light"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}