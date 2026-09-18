"use client";

import { UserPlus, Clock3, CheckCircle2, Hourglass, Search, Phone } from "lucide-react";

const QUEUE = [
  { name: "سارا محمدی", time: "۱۰:۰۰", service: "مزوتراپی صورت", doctor: "دکتر سارا محمدی", status: "در انتظار" },
  { name: "نگین رضوی", time: "۱۰:۳۰", service: "بوتاکس", doctor: "دکتر سارا محمدی", status: "در حال ویزیت" },
  { name: "مریم اکبری", time: "۱۱:۱۵", service: "مشاوره پوست", doctor: "دکتر رضا کاویانی", status: "در انتظار" },
  { name: "الناز حیدری", time: "۱۳:۰۰", service: "لیزر موهای زائد", doctor: "دکتر آرش نیکنام", status: "تکمیل‌شده" },
];

const STATUS_TONE: Record<string, string> = {
  "در انتظار": "bg-amber-50 text-warning",
  "در حال ویزیت": "bg-secondary-blue/40 text-blue-600",
  "تکمیل‌شده": "bg-primary-light/20 text-primary-dark",
};

const STATS = [
  { icon: Hourglass, tone: "text-warning bg-amber-50", label: "در انتظار", value: "۶" },
  { icon: Clock3, tone: "text-blue-600 bg-secondary-blue/40", label: "در حال ویزیت", value: "۲" },
  { icon: CheckCircle2, tone: "text-primary-dark bg-primary-light/20", label: "تکمیل‌شده امروز", value: "۱۸" },
];

export default function ReceptionPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">پذیرش</h1>
          <p className="mt-1 text-sm text-gray-400">صف امروز و پذیرش سریع مراجعین</p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark">
          <UserPlus className="h-4 w-4" /> پذیرش سریع مراجع
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${s.tone}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold text-gray-800">صف امروز</h2>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 sm:w-64">
            <input type="text" placeholder="جستجوی مراجع..." className="w-full bg-transparent text-xs text-gray-600 outline-none placeholder:text-gray-300" />
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-300" />
          </div>
        </div>

        <div className="space-y-3">
          {QUEUE.map((q) => (
            <div key={q.name + q.time} className="flex flex-col gap-3 rounded-xl border border-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex w-12 shrink-0 flex-col items-center text-primary-dark">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium">{q.time}</span>
                </div>
                <div className="h-9 w-9 shrink-0 rounded-full bg-gray-100" />
                <div>
                  <div className="text-xs font-semibold text-gray-800">{q.name}</div>
                  <div className="text-[11px] text-gray-400">{q.service} · {q.doctor}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10px] ${STATUS_TONE[q.status]}`}>{q.status}</span>
                <button className="rounded-lg border border-gray-200 p-1.5 text-gray-400">
                  <Phone className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
