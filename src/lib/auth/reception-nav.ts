import {
  LayoutDashboard,
  CalendarClock,
  CalendarDays,
  Users,
  FileText,
  MessageSquare,
  Briefcase,
  Stethoscope,
  BarChart3,
  Settings,
} from "lucide-react";

export interface ReceptionNavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

/**
 * منوی مخصوص پنل منشی — عمداً از CLINIC_NAV_ITEMS جداست چون
 * ترتیب و مجموعه‌ی آیتم‌ها با پنل مدیر/پزشک فرق دارد.
 */
export const RECEPTION_NAV_ITEMS: ReceptionNavItem[] = [
  { href: "dashboard/reception", label: "داشبورد", icon: LayoutDashboard },
  { href: "calendar", label: "نوبت‌ها", icon: CalendarClock },
  { href: "reception/calendar", label: "تقویم", icon: CalendarDays },
  { href: "patients", label: "بیماران", icon: Users },
  { href: "reception/intake-forms", label: "فرم‌های پذیرش", icon: FileText },
  { href: "sms", label: "پیام‌ها", icon: MessageSquare },
  { href: "settings/forms", label: "فرم‌های سیستمی", icon: FileText },
  { href: "services", label: "خدمات", icon: Briefcase },
  { href: "reception/doctors", label: "پزشکان", icon: Stethoscope },
  { href: "reports", label: "گزارش‌ها", icon: BarChart3 },
  { href: "settings", label: "تنظیمات", icon: Settings },  
];
