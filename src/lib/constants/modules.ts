export const MODULE_KEYS = [
  "appointments",
  "chat",
  "consents",
  "files",
  "finance",
  "intake",
  "patients",
  "reports",
  "services",
  "sms",
  "video",
  "visits",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export const MODULE_LABELS: Record<string, string> = {
  appointments: "نوبت‌دهی",
  chat: "چت",
  consents: "رضایت‌نامه‌ها",
  files: "فایل‌ها و تصاویر",
  finance: "مالی",
  intake: "فرم پذیرش",
  patients: "مراجعین",
  reports: "گزارش‌ها",
  services: "خدمات",
  sms: "پیامک",
  video: "تماس تصویری",
  visits: "جلسات درمان",
};
