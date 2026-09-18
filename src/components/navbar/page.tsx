"use client";

import { useState } from "react";
import { Leaf, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "امکانات", href: "#features" },
  { label: "قیمت‌گذاری", href: "#pricing" },
  { label: "مشتریان", href: "#customers" },
  { label: "منابع", href: "#resources" },
  { label: "درباره ما", href: "#about" },
  { label: "تماس با ما", href: "#contact" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // تنظیمات انیمیشن منوی موبایل
  const menuVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      y: -20,
    },
    visible: {
      opacity: 1,
      height: "auto",
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      y: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <header
      className="
        sticky top-0 z-50 w-full
        border-b border-gray-100
        bg-white/80
        backdrop-blur-md
        transition-colors
        dark:border-white/10
        dark:bg-[#0b0f14]/80
      "
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* لوگو */}
        <div className="flex items-center gap-2">
          <Leaf className="h-7 w-7 text-primary" />

          <div className="leading-tight">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Beauty Clinic CRM
            </div>

            <div className="text-xs text-gray-400 dark:text-gray-500">
              پلتفرم مدیریت کلینیک زیبایی
            </div>
          </div>
        </div>

        {/* منوی دسکتاپ */}
        <nav
          className="
            hidden items-center gap-8
            text-sm font-medium
            text-gray-600
            dark:text-gray-400
            lg:flex
          "
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="
                transition-colors
                hover:text-primary
                dark:hover:text-primary
              "
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* دکمه‌های اکشن دسکتاپ */}
        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="/login"
            className="
              rounded-md
              border-[1.5px] border-primary
              px-5 py-2
              text-sm font-medium
              text-primary
              shadow-lg
              transition-all duration-200
              hover:scale-105
              hover:bg-primary/5
              hover:text-primary
              active:scale-95
              dark:hover:bg-primary/10
            "
          >
            ورود به پنل
          </a>

          <a
            href="#demo"
            className="
              rounded-[5px]
              bg-primary
              px-5 py-2
              text-sm font-medium
              text-white
              transition-all duration-200
              hover:scale-105
              hover:bg-primary-dark
              hover:shadow-lg
              active:scale-95
            "
          >
            درخواست دمو
          </a>
        </div>

        {/* دکمه همبرگری موبایل */}
        <button
          type="button"
          aria-label={isMenuOpen ? "بستن منو" : "باز کردن منو"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="
            rounded-lg
            p-2
            text-gray-600
            transition-colors
            hover:bg-gray-100
            hover:text-primary
            dark:text-gray-300
            dark:hover:bg-white/10
            dark:hover:text-primary
            lg:hidden
          "
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* منوی موبایل */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="
              overflow-hidden
              border-b border-gray-100
              bg-white
              dark:border-white/10
              dark:bg-[#0b0f14]
              lg:hidden
            "
          >
            <div className="flex flex-col gap-4 p-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="
                    block
                    text-gray-600
                    transition-colors
                    hover:text-primary
                    dark:text-gray-300
                    dark:hover:text-primary
                  "
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}

              <hr className="border-gray-100 dark:border-white/10" />

              <div className="flex flex-col gap-3">
                <a
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="
                    w-full
                    rounded-lg
                    border border-primary
                    py-2
                    text-center
                    text-sm font-medium
                    text-primary
                    transition-colors
                    hover:bg-primary/5
                    dark:hover:bg-primary/10
                  "
                >
                  ورود به پنل
                </a>

                <a
                  href="#demo"
                  onClick={() => setIsMenuOpen(false)}
                  className="
                    w-full
                    rounded-lg
                    bg-primary
                    py-2
                    text-center
                    text-sm font-medium
                    text-white
                    transition-all
                    hover:bg-primary-dark
                    hover:shadow-lg
                  "
                >
                  درخواست دمو
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}