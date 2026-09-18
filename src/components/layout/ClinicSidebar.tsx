"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, ChevronDown } from "lucide-react";
import { CLINIC_NAV_ITEMS, type ClinicRole, type ClinicNavItem } from "@/lib/auth/clinic-nav";
import Image from "next/image";

interface ClinicSidebarProps {
  clinicSlug: string;
  role: ClinicRole;
  onNavigate?: () => void;
}

export function ClinicSidebar({ clinicSlug, role, onNavigate }: ClinicSidebarProps) {
  const pathname = usePathname();
  const visibleItems = CLINIC_NAV_ITEMS.filter((item) => item.roles.includes(role));

  const isItemActive = (item: ClinicNavItem) => {
    const href = `/clinic/${clinicSlug}/${item.href}`;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const [openGroup, setOpenGroup] = useState<string | null>(
    visibleItems.find((i) => i.children?.some((c) => isItemActive(c)))?.href ?? null
  );

  return (
    <aside className="glass flex h-full w-full shrink-0 flex-col rounded-none p-5 lg:h-screen lg:w-64 lg:sticky lg:top-0 lg:rounded-none">
      <div className="mb-6 flex items-center justify-center gap-2 lg:justify-strat">
        <Leaf className="h-7 w-7 text-primary dark:text-primary-light" />
        <div className="text-left leading-tight">
          <div className="text-base font-bold text-gray-900 dark:text-white">Beauty Clinic CRM</div>
          <div className="text-[11px] text-gray-400">پلتفرم مدیریت کلینیک زیبایی</div>
        </div>
      </div>

      <nav className="glass-scroll flex flex-1 flex-col gap-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const hasChildren = !!item.children?.length;
          const active = isItemActive(item);
          const isOpen = openGroup === item.href;

          if (!hasChildren) {
            return (
              <Link
                key={item.href}
                onClick={() => onNavigate?.()}
                href={
                  item.href === "dashboard"
                    ? `/clinic/${clinicSlug}/dashboard${role === "doctor" ? "/doctor" : role === "receptionist" ? "/reception" : ""
                    }`
                    : `/clinic/${clinicSlug}/${item.href}`
                }
                className={`glass-nav-item flex items-center rounded-xl px-4 py-2.5 text-sm ${active ? "active" : ""}`}
              >
                <item.icon className="h-4 w-4 ml-4" />
                {item.label}
              </Link>
            );
          }

          return (
            <div key={item.href}>
              <button
                onClick={() => setOpenGroup(isOpen ? null : item.href)}
                className={`glass-nav-item flex w-full items-center rounded-xl px-4 py-2.5 text-sm transition-all duration-300 ${active ? "active" : ""}`}
              >

                <item.icon className="h-4 w-4 ml-4" />

                <span className="flex items-center gap-2">
                  {item.label}
                  <ChevronDown
                    className={`
    h-3.5 w-3.5
    transition-transform
    duration-500
    ease-[cubic-bezier(0.22,1,0.36,1)]
    ${isOpen ? "rotate-180" : "rotate-0"}
  `}
                  />

                </span>
              </button>

              <div
                className={`
  grid
  transition-all
  duration-500
  ease-[cubic-bezier(0.22,1,0.36,1)]
  ${isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                  }
`}
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    className={`
  mr-1 mt-1 flex flex-col gap-0.5
  border-r border-gray-100 pr-3
  dark:border-white/10
  transition-transform
  duration-500
  ease-[cubic-bezier(0.22,1,0.36,1)]
  ${isOpen ? "translate-y-0" : "-translate-y-1"}
`}
                  >
                    {item.children!
                      .filter((child) => child.roles.includes(role))
                      .map((child) => {
                        const childHref = `/clinic/${clinicSlug}/${child.href}`;
                        const childActive = pathname === childHref;

                        return (
                          <Link
                            key={child.href}
                            onClick={() => onNavigate?.()}
                            href={childHref}
                            className={`
                glass-nav-item
                flex items-center
                rounded-lg
                px-3 py-2
                text-[13px]
                ${childActive ? "active" : ""}
              `}
                          >
                            <child.icon className="ml-2 h-3.5 w-3.5" />
                            {child.label}
                          </Link>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mt-6 hidden justify-center lg:flex">
        <Image
          src="/image/superadmin.png"
          alt="User"
          width={120}
          height={120}
          unoptimized
          className="rounded-full object-cover ring-2 ring-gray-100 dark:ring-white/10"
        />
      </div>

      <div className="glass-strong mt-3 rounded-2xl p-4 text-center">
        <div className="text-sm font-semibold text-gray-800 dark:text-white">نسخه حرفه‌ای</div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">همه امکانات برای رشد کسب‌وکار شما</p>
        <button className="mt-3 w-full rounded-xl border border-transparent bg-primary-dark py-2.5 text-xs font-medium text-white transition hover:opacity-90 dark:border-primary-light/30 dark:bg-primary/80 dark:shadow-glow-primary dark:hover:bg-primary">
          ارتقای پلن
        </button>
      </div>
    </aside>
  );
}
