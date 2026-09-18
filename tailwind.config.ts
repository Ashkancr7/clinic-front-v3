import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "Vazirmatn", "IRANSansX", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#0EA5A4",
          light: "#5EEAD4",
          dark: "#0F766E",
        },
        secondary: {
          pink: "#FBCFE8",
          purple: "#DDD6FE",
          blue: "#BFDBFE",
        },
        danger: "#F87171",
        success: "#4ADE80",
        warning: "#FBBF24",
        // پس‌زمینه‌ی تیره‌ی تم شیشه‌ای (Liquid Glass)
        abyss: {
          DEFAULT: "#05070d",
          950: "#05070d",
          900: "#0a0e1a",
          800: "#0f1524",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-sm": "0 4px 16px 0 rgba(0, 0, 0, 0.25)",
        "glass-lg": "0 20px 60px -10px rgba(0, 0, 0, 0.5)",
        "glow-primary": "0 0 24px -4px rgba(14, 165, 164, 0.55)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(3%, 4%) scale(1.05)" },
          "66%": { transform: "translate(-2%, -3%) scale(0.97)" },
        },
        "float-reverse": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(-4%, -2%) scale(0.96)" },
          "66%": { transform: "translate(3%, 3%) scale(1.06)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        float: "float 18s ease-in-out infinite",
        "float-reverse": "float-reverse 22s ease-in-out infinite",
        "float-slow": "float 30s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
