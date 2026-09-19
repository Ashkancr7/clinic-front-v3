"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { getNotifications, markNotificationRead, getUnreadNotificationCount } from "@/lib/api/notifications";
import { queryKeys } from "@/lib/query/keys";

const TYPE_ICON_TONE: Record<string, string> = {
  system: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
  appointment: "bg-primary-light/20 text-primary-dark dark:bg-primary/15 dark:text-primary-light",
  sms: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
};

function formatRelativeTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("fa-IR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 320 });

  const wrapperRef = useRef<HTMLDivElement>(null); // wraps the trigger button only
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null); // the portaled dropdown panel
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: getUnreadNotificationCount,
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: queryKeys.notificationsList.all(),
    queryFn: () => getNotifications(),
    enabled: isOpen, // فقط وقتی dropdown باز می‌شود، لیست کامل را می‌گیریم
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsList.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });

  // پرتال فقط سمت کلاینت mount می‌شود
  useEffect(() => {
    setMounted(true);
  }, []);

  // محاسبه موقعیت پنل نسبت به دکمه (چون داخل header قرار ندارد، خودمان جایش را حساب می‌کنیم)
  function updatePosition() {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const panelWidth = 320; // w-80
    // در RTL دراپ‌داون از سمت راست دکمه شروع می‌شود؛ اگر جا نبود به داخل صفحه می‌چسبد
    let left = rect.right - panelWidth;
    left = Math.max(8, Math.min(left, window.innerWidth - panelWidth - 8));
    setCoords({ top: rect.bottom + 8, left, width: panelWidth });
  }

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const clickedTrigger = wrapperRef.current?.contains(target);
      const clickedPanel = panelRef.current?.contains(target);
      if (!clickedTrigger && !clickedPanel) setIsOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    function handleReposition() {
      updatePosition();
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
  }, [isOpen]);

  const panel = isOpen && (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width }}
      // z-[9999] + پرتال به body یعنی هیچ stacking context والدی نمی‌تواند این پنل را زیر خودش نگه دارد
      className="z-[9999] max-h-96 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[#111827] dark:shadow-none"
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-2 py-2 dark:border-white/10">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">اعلان‌ها</span>
      </div>

      {isLoading && (
        <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">اعلانی وجود ندارد.</div>
      )}

      {!isLoading &&
        notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => !n.readAt && readMutation.mutate(n.id)}
            className={`flex w-full items-start gap-2.5 rounded-xl p-2.5 text-right transition hover:bg-gray-50 dark:hover:bg-white/[0.06] ${
              !n.readAt ? "bg-primary-light/10 dark:bg-primary/10" : ""
            }`}
          >
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                TYPE_ICON_TONE[n.type] ?? "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">{n.title}</span>
                {!n.readAt && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />}
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">{n.body}</p>
              <span className="mt-1 block text-[10px] text-gray-400 dark:text-gray-500">
                {formatRelativeTime(n.createdAt)}
              </span>
            </div>
            {!n.readAt && (
              <CheckCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600" />
            )}
          </button>
        ))}
    </motion.div>
  );

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="اعلان‌ها"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-50 hover:text-primary dark:text-gray-300 dark:hover:bg-white/[0.08] dark:hover:text-primary-light"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] text-white ring-2 ring-white dark:ring-[#111827]">
            {unreadCount.toLocaleString("fa-IR")}
          </span>
        )}
      </button>

      {mounted && createPortal(<AnimatePresence>{panel}</AnimatePresence>, document.body)}
    </div>
  );
}