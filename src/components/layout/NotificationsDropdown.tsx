"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { getNotifications, markNotificationRead, getUnreadNotificationCount } from "@/lib/api/notifications";
import { queryKeys } from "@/lib/query/keys";

const TYPE_ICON_TONE: Record<string, string> = {
  system: "bg-blue-50 text-blue-500",
  appointment: "bg-primary-light/20 text-primary-dark",
  sms: "bg-purple-50 text-purple-600",
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
  const ref = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="اعلان‌ها"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-50 hover:text-primary dark:text-gray-300 dark:hover:bg-white/[0.08] dark:hover:text-primary-light"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] text-white ring-2 ring-white dark:ring-abyss-900">
            {unreadCount.toLocaleString("fa-IR")}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="glass-strong absolute left-0 top-[calc(100%+8px)] z-50 max-h-96 w-80 overflow-y-auto rounded-2xl p-2"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-2 py-2 dark:border-white/10">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">اعلان‌ها</span>
            </div>

            {isLoading && <div className="py-8 text-center text-xs text-gray-400">در حال بارگذاری...</div>}

            {!isLoading && notifications.length === 0 && (
              <div className="py-8 text-center text-xs text-gray-300">اعلانی وجود ندارد.</div>
            )}

            {!isLoading &&
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.readAt && readMutation.mutate(n.id)}
                  className={`flex w-full items-start gap-2.5 rounded-xl p-2.5 text-right transition hover:bg-gray-50 dark:hover:bg-white/[0.06] ${
                    !n.readAt ? "bg-primary-light/5" : ""
                  }`}
                >
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${TYPE_ICON_TONE[n.type] ?? "bg-gray-100 text-gray-500"}`}>
                    <Bell className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">{n.title}</span>
                      {!n.readAt && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">{n.body}</p>
                    <span className="mt-1 block text-[10px] text-gray-300">{formatRelativeTime(n.createdAt)}</span>
                  </div>
                  {!n.readAt && <CheckCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300" />}
                </button>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}