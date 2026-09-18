import {
  LayoutDashboard,
  CalendarClock,
  Users,
  Folder,
  Briefcase,
  Wallet,
  Receipt,
  ArrowDownCircle,
  AlertCircle,
  RefreshCcw,
  CalendarRange,
  FileBarChart,
  Megaphone,
  MessageSquare,
  UserCircle,
  BarChart3,
  Settings,
  Settings2,
  FileText,
  UserCog,
  ShieldCheck,
  History,
  Send,
  MessageCircle,
  Clock,
  LayoutGrid
} from "lucide-react";

export type ClinicRole = "clinic_admin" | "doctor" | "receptionist";

export const ROLE_LABELS: Record<ClinicRole, string> = {
  clinic_admin: "مدیر کلینیک",
  doctor: "پزشک",
  receptionist: "منشی و پذیرش",
};

export interface ClinicNavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: ClinicRole[];
  children?: ClinicNavItem[];
}

export const CLINIC_NAV_ITEMS: ClinicNavItem[] = [
  { href: "dashboard", label: "داشبورد", icon: LayoutDashboard, roles: ["clinic_admin", "doctor", "receptionist"] },
  { href: "calendar", label: "نوبت‌ها", icon: CalendarClock, roles: ["clinic_admin", "doctor", "receptionist"] },
  { href: "patients", label: "مراجعین", icon: Users, roles: ["clinic_admin", "doctor", "receptionist"] },
  { href: "records", label: "پرونده‌ها", icon: Folder, roles: ["clinic_admin", "doctor"] },
  { href: "users", label: "کاربران سیستمی", icon: Users, roles: ["clinic_admin",] },
  { href: "doctor", label: "برنامه‌ی کاری پزشکان", icon: Clock, roles: ["clinic_admin"] },
  { href: "services", label: "خدمات", icon: Briefcase, roles: ["clinic_admin"] },
  {
    href: "finance",
    label: "مالی",
    icon: Wallet,
    roles: ["clinic_admin"],
    children: [
      { href: "finance", label: "مالی و پرداخت‌ها", icon: Wallet, roles: ["clinic_admin"] },
      { href: "finance/invoices", label: "فاکتورهای فروش", icon: Receipt, roles: ["clinic_admin"] },
      { href: "finance/receipts", label: "دریافت‌ها", icon: ArrowDownCircle, roles: ["clinic_admin"] },
      { href: "finance/debts", label: "بدهی‌ها", icon: AlertCircle, roles: ["clinic_admin"] },
      { href: "finance/refunds", label: "بازپرداخت‌ها", icon: RefreshCcw, roles: ["clinic_admin"] },
      { href: "finance/installments", label: "طرح‌های اقساطی", icon: CalendarRange, roles: ["clinic_admin"] },
      { href: "finance/reports", label: "گزارش‌های مالی", icon: FileBarChart, roles: ["clinic_admin"] },
    ],
  },
  // { href: "marketing", label: "بازاریابی", icon: Megaphone, roles: ["clinic_admin"] },
  { href: "sms", label: "پیامک‌ها", icon: Send, roles: ["clinic_admin", "receptionist"] },
  { href: "chat", label: "گفتگوهای داخلی", icon: MessageCircle, roles: ["clinic_admin", "doctor", "receptionist"] },
  // { href: "profile", label: "پروفایل", icon: UserCircle, roles: ["clinic_admin", "doctor", "receptionist"] },
  { href: "reports", label: "گزارش‌ها", icon: BarChart3, roles: ["clinic_admin"] },
  {
    href: "settings",
    label: "تنظیمات",
    icon: Settings,
    roles: ["clinic_admin"],
    children: [
      { href: "settings", label: "تنظیمات عمومی", icon: Settings2, roles: ["clinic_admin"] },
      { href: "settings/forms", label: "قالب‌ها و فرم‌ها", icon: FileText, roles: ["clinic_admin"] },
      { href: "settings/message-templates", label: "قالب‌های پیامک", icon: MessageSquare, roles: ["clinic_admin"] },
      // { href: "settings/users", label: "مدیریت کاربران", icon: UserCog, roles: ["clinic_admin"] },
      { href: "settings/roles", label: "نقش‌ها و دسترسی‌ها", icon: ShieldCheck, roles: ["clinic_admin"] },
      { href: "settings/modules", label: "ماژول‌ها", icon: LayoutGrid, roles: ["clinic_admin"] },
      { href: "settings/logs", label: "لاگ تغییرات", icon: History, roles: ["clinic_admin"] },
    ],
  },
];
 