"use client";

import {
  Bell,
  CalendarDays,
  ChevronDown,
  KeyRound,
  LogOut,
  Menu,
  Settings,
} from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import Image from "next/image";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DateObject from "react-date-object";

interface ClinicTopbarProps {
  userName: string;
  roleLabel: string;
  notificationCount?: number;
  onToggleSidebar?: () => void;
  dateNavSlot?: ReactNode;
  showSettingsIcon?: boolean;
}

export function ClinicTopbar({
  userName,
  roleLabel,
  notificationCount = 0,
  onToggleSidebar,
  dateNavSlot,
  showSettingsIcon = true,
}: ClinicTopbarProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<DateObject | null>(
    new DateObject({ calendar: persian, locale: persian_fa })
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const goToToday = () => {
    setSelectedDate(new DateObject({ calendar: persian, locale: persian_fa }));
  };

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className="glass flex h-16 items-center justify-between rounded-none px-6">
      {/* سمت راست */}
      <div className="flex items-center gap-6">
        <button
          onClick={onToggleSidebar}
          className="text-gray-600 transition hover:text-primary dark:text-gray-300 dark:hover:text-primary-light"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* وسط */}
      <div className="flex items-center gap-4">
        <div className="glass-input flex h-10 items-center overflow-hidden rounded-xl">
          <button
            onClick={goToToday}
            className="flex items-center gap-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-white/[0.06]"
          >
            <ChevronDown className="h-4 w-4" />
            امروز
          </button>

          <div className="h-5 w-px bg-gray-200 dark:bg-white/10" />

          <DatePicker
            value={selectedDate}
            onChange={(val) => setSelectedDate(val as DateObject)}
            calendar={persian}
            locale={persian_fa}
            calendarPosition="bottom-right"
            render={(value, openCalendar) => (
              <button
                onClick={openCalendar}
                className="flex items-center gap-2 px-4 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.06]"
              >
                {selectedDate ? selectedDate.format("YYYY/MM/DD") : "انتخاب تاریخ"}
                <CalendarDays className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          />
        </div>

        {showSettingsIcon && (
          <button className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-50 hover:text-primary dark:text-gray-300 dark:hover:bg-white/[0.08] dark:hover:text-primary-light">
            <Settings className="h-5 w-5" />
          </button>
        )}

                <NotificationsDropdown />
      </div>

      {/* اطلاعات کاربر - دراپ‌داون واقعی */}
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 transition hover:bg-gray-50 dark:hover:bg-white/[0.06]"
        >
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 dark:text-gray-500 ${
              isMenuOpen ? "rotate-180" : ""
            }`}
          />

          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{userName}</p>
            <p className="text-xs text-gray-400">{roleLabel}</p>
          </div>

          <Image
            src="/image/user.PNG"
            alt="User"
            width={50}
            height={50}
            unoptimized
            className="rounded-full object-cover ring-2 ring-gray-100 dark:ring-white/10"
          />
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="glass-strong absolute left-0 top-[calc(100%+8px)] z-50 w-56 origin-top-left overflow-hidden rounded-2xl p-1.5"
            >
              <div className="border-b border-gray-100 px-3 py-2.5 dark:border-white/10">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{userName}</p>
                <p className="text-xs text-gray-400">{roleLabel}</p>
              </div>

              <div className="border-t border-gray-100 py-1.5 dark:border-white/10">
                <Link
                  href="/change-password"
                  role="menuitem"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.06]"
                >
                  <KeyRound className="h-4 w-4" />
                  تغییر رمز عبور
                </Link>
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
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}