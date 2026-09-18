"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "تغییر به تم روشن" : "تغییر به تم تیره"}
      title={isDark ? "تم روشن" : "تم تیره (Liquid Glass)"}
      className="fixed bottom-5 left-5 z-[60] flex h-12 w-12 items-center justify-center rounded-full border shadow-glass-sm backdrop-blur-xl transition-all duration-300
      border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary
      dark:border-white/15 dark:bg-white/[0.08] dark:text-gray-200 dark:hover:border-primary-light dark:hover:text-primary-light"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
