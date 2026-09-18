"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Check, ChevronDown } from "lucide-react";

interface ClinicOption {
  slug: string;
  name: string;
}

interface ClinicSwitcherProps {
  currentSlug: string;
  clinics: ClinicOption[];
  basePath: "patient" | "clinic";
}

/**
 * فقط زمانی نمایش بده که clinics.length > 1 باشد.
 * با انتخاب کلینیک جدید، کل داده‌ها دوباره fetch می‌شوند (چون clinicSlug عوض شده و query key هم عوض می‌شود).
 */
export function ClinicSwitcher({ currentSlug, clinics, basePath }: ClinicSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const currentClinic = clinics.find((c) => c.slug === currentSlug) ?? clinics[0];

  // بستن با کلیک بیرون از کامپوننت
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (clinics.length <= 1) return null;

  function handleSelect(slug: string) {
    setIsOpen(false);
    if (slug === currentSlug) return;
    setIsNavigating(true);
    router.push(`/${basePath}/${slug}/dashboard`);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={isNavigating}
        className="glass-input flex min-w-[168px] items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm transition-all disabled:cursor-wait disabled:opacity-70"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary-light/15 dark:text-primary-light">
          <Building2 className="h-4 w-4" />
        </span>

        <span className="flex-1 truncate text-right font-medium text-gray-800 dark:text-gray-100">
          {currentClinic?.name}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 dark:text-gray-500 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            ref={listRef}
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="glass-strong absolute left-0 top-[calc(100%+8px)] z-50 w-full min-w-[220px] origin-top-left overflow-hidden rounded-2xl p-1.5"
          >
            {clinics.map((clinic) => {
              const isSelected = clinic.slug === currentSlug;
              return (
                <li key={clinic.slug} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => handleSelect(clinic.slug)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-sm transition-colors ${
                      isSelected
                        ? "bg-primary-light/15 font-medium text-primary-dark dark:text-primary-light"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="flex-1 truncate">{clinic.name}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-primary dark:text-primary-light" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}