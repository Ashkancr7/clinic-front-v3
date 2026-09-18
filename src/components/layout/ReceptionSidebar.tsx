"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Headset } from "lucide-react";
import { RECEPTION_NAV_ITEMS } from "@/lib/auth/reception-nav";
import Image from "next/image";

interface ReceptionSidebarProps {
  clinicSlug: string;
  onNavigate?: () => void;
}

export function ReceptionSidebar({
  clinicSlug,
  onNavigate,
}: ReceptionSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="glass flex h-full w-full shrink-0 flex-col rounded-none p-5 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:rounded-none">
      {/* Logo */}
      <div className="mb-4 flex items-center justify-center gap-2 lg:justify-end">
        <Leaf className="h-7 w-7 text-primary dark:text-primary-light" />

        <div className="text-left leading-tight">
          <div className="text-base font-bold text-gray-900 dark:text-white">
            Beauty Clinic CRM
          </div>

          <div className="text-[11px] text-gray-400">
            پلتفرم مدیریت کلینیک زیبایی
          </div>
        </div>
      </div>

      {/* Panel Label */}
      <div className="glass-strong mb-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-primary-dark dark:text-primary-light">
        <Headset className="h-4 w-4" />
        <span>پنل منشی / نوبت‌دهی</span>
      </div>

      {/* Navigation */}
      <nav className="glass-scroll flex flex-1 flex-col gap-1 overflow-y-auto">
        {RECEPTION_NAV_ITEMS.map((item) => {
          const href = `/clinic/${clinicSlug}/${item.href}`;

          const active =
            pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={item.href}
              onClick={() => onNavigate?.()}
              href={href}
              className={`
                glass-nav-item
                flex items-center gap-3
                rounded-xl
                px-4 py-2.5
                text-sm
                transition-all
                duration-300
                ease-out
                ${active ? "active" : ""}
              `}
            >
              <item.icon className="h-4 w-4 shrink-0" />

              <span className="relative z-10">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User Image */}
      <div className="mt-6 hidden justify-center lg:flex">
        <Image
          src="/image/superadmin.png"
          alt="User"
          width={120}
          height={120}
          unoptimized
          className="
            rounded-full
            object-cover
            ring-2 ring-gray-100
            transition-transform
            duration-500
            hover:scale-[1.03]
            dark:ring-white/10
          "
        />
      </div>

      {/* Upgrade */}
      <div className="glass-strong mt-3 rounded-2xl p-4 text-center">
        <div className="text-sm font-semibold text-gray-800 dark:text-white">
          نسخه حرفه‌ای
        </div>

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          همه امکانات برای رشد کسب‌وکار شما
        </p>

        <button
          className="
            mt-3 w-full rounded-xl
            border border-transparent
            bg-primary-dark
            py-2.5
            text-xs font-medium text-white
            transition-all duration-300
            hover:-translate-y-0.5
            hover:opacity-90
            hover:shadow-lg
            dark:border-primary-light/30
            dark:bg-primary/80
            dark:shadow-glow-primary
            dark:hover:bg-primary
          "
        >
          ارتقای پلن
        </button>
      </div>
    </aside>
  );
}