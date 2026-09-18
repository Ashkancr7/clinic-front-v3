"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function writeThemeCookie(theme: Theme) {
  // یک سال اعتبار؛ non-httpOnly تا هم از کلاینت و هم از سرور (root layout) قابل خواندن باشد
  document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // هماهنگ‌سازی کلاس html با مقداری که سرور رندر کرده (برای پوشش لحظه‌ی هیدریشن)
  useEffect(() => {
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, [initialTheme]);

  const applyTheme = (next: Theme) => {
    setThemeState(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    writeThemeCookie(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage در دسترس نیست، مشکلی نیست چون کوکی هم داریم
    }
  };

  const toggleTheme = () => applyTheme(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme باید داخل ThemeProvider استفاده شود");
  return ctx;
}