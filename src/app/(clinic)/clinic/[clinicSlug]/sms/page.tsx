"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Send, Settings2, X } from "lucide-react";

import {
  getAutomationRules,
  createAutomationRule,
  updateAutomationRule,
  getSmsMessages,
  sendSmsNow,
  getSmsTemplates,
  type TriggerEvent,
} from "@/lib/api/sms";
import { queryKeys } from "@/lib/query/keys";

const TRIGGER_LABEL: Record<TriggerEvent, string> = {
  appointment_reminder: "یادآوری نوبت",
  appointment_created: "ثبت نوبت جدید",
  appointment_cancelled: "لغو نوبت",
  birthday: "تبریک تولد",
  post_service_followup: "پیگیری پس از خدمت",
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "زمان‌بندی‌شده",
  sent: "ارسال‌شده",
  delivered: "تحویل‌شده",
  failed: "ناموفق",
  cancelled: "لغوشده",
};
const STATUS_TONE: Record<string, string> = {
  scheduled: "bg-amber-50 text-warning",
  sent: "bg-blue-50 text-blue-600",
  delivered: "bg-primary-light/20 text-primary-dark",
  failed: "bg-red-50 text-danger",
  cancelled: "bg-gray-100 text-gray-500",
};

function formatOffset(minutes: number | null) {
  if (minutes == null) return "بلافاصله";
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const dir = minutes < 0 ? "قبل" : "بعد";
  if (hours >= 24 && hours % 24 === 0) return `${hours / 24} روز ${dir}`;
  if (hours > 0) return `${hours} ساعت ${dir}`;
  return `${abs} دقیقه ${dir}`;
}

export default function SmsPage({ params }: { params: Promise<{ clinicSlug: string }> }) {
  const { clinicSlug } = use(params);
  const queryClient = useQueryClient();
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: queryKeys.smsRules.list(clinicSlug),
    queryFn: () => getAutomationRules(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: templates = [] } = useQuery({
    queryKey: queryKeys.smsTemplates.list(clinicSlug),
    queryFn: () => getSmsTemplates(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: queryKeys.smsMessages.list(clinicSlug),
    queryFn: () => getSmsMessages(clinicSlug),
    enabled: !!clinicSlug,
  });

  const toggleRuleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateAutomationRule(clinicSlug, id, { is_active: isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.smsRules.list(clinicSlug) }),
  });

  const createRuleMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createAutomationRule>[1]) => createAutomationRule(clinicSlug, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.smsRules.list(clinicSlug) });
      setShowCreateRule(false);
    },
  });

  const sendMutation = useMutation({
    mutationFn: (payload: Parameters<typeof sendSmsNow>[1]) => sendSmsNow(clinicSlug, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.smsMessages.list(clinicSlug) });
      setShowSendModal(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">پیامک‌ها</h1>
          <p className="mt-1 text-xs text-gray-400">قوانین اتوماسیون، ارسال دستی و تاریخچه‌ی پیامک‌های ارسال‌شده</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/clinic/${clinicSlug}/settings/message-templates`}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50"
          >
            <Settings2 className="h-3.5 w-3.5" /> مدیریت قالب‌ها
          </Link>
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-medium text-white hover:bg-primary-dark"
          >
            <Send className="h-3.5 w-3.5" /> ارسال دستی پیامک
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">قوانین اتوماسیون</h2>
          <button
            onClick={() => setShowCreateRule(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" /> قانون جدید
          </button>
        </div>

        {rulesLoading && <div className="py-10 text-center text-sm text-gray-400">در حال بارگذاری...</div>}

        {!rulesLoading && (
          <div className="space-y-2">
            {rules.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 text-xs">
                <div>
                  <div className="font-medium text-gray-800">
                    {TRIGGER_LABEL[r.triggerEvent] ?? r.triggerEvent} · {formatOffset(r.offsetMinutes)}
                  </div>
                  <div className="text-[10px] text-gray-400">قالب: {r.templateTitle}</div>
                </div>
                <button
                  onClick={() => toggleRuleMutation.mutate({ id: r.id, isActive: !r.isActive })}
                  disabled={toggleRuleMutation.isPending}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${r.isActive ? "bg-primary" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${r.isActive ? "right-0.5" : "right-4"}`} />
                </button>
              </div>
            ))}
            {rules.length === 0 && <div className="py-6 text-center text-xs text-gray-300">هیچ قانون اتوماسیونی تعریف نشده.</div>}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="mb-4 text-sm font-bold text-gray-800">تاریخچه‌ی پیامک‌ها</h2>

        {messagesLoading && <div className="py-10 text-center text-sm text-gray-400">در حال بارگذاری...</div>}

        {!messagesLoading && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400">
                  <th className="pb-2 font-medium">گیرنده</th>
                  <th className="pb-2 font-medium">متن</th>
                  <th className="pb-2 font-medium">وضعیت</th>
                  <th className="pb-2 font-medium">زمان</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="py-2 text-gray-700" dir="ltr">
                      {m.phone}
                    </td>
                    <td className="max-w-xs truncate py-2 text-gray-500">{m.content}</td>
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${STATUS_TONE[m.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {STATUS_LABEL[m.status] ?? m.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-400">{m.sentAt ? new Date(m.sentAt).toLocaleString("fa-IR") : m.scheduledAt ? new Date(m.scheduledAt).toLocaleString("fa-IR") : "—"}</td>
                  </tr>
                ))}
                {messages.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-300">
                      پیامکی ثبت نشده.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateRule && (
        <CreateRuleModal
          templates={templates}
          onClose={() => setShowCreateRule(false)}
          onSubmit={(payload) => createRuleMutation.mutate(payload)}
          isSubmitting={createRuleMutation.isPending}
          error={createRuleMutation.error instanceof Error ? createRuleMutation.error.message : null}
        />
      )}

      {showSendModal && (
        <SendSmsModal
          onClose={() => setShowSendModal(false)}
          onSubmit={(payload) => sendMutation.mutate(payload)}
          isSubmitting={sendMutation.isPending}
          error={sendMutation.error instanceof Error ? sendMutation.error.message : null}
        />
      )}
    </div>
  );
}

function CreateRuleModal({
  templates,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  templates: { id: string; title: string }[];
  onClose: () => void;
  onSubmit: (payload: { template_id: string; trigger_event: TriggerEvent; offset_minutes?: number }) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [templateId, setTemplateId] = useState("");
  const [triggerEvent, setTriggerEvent] = useState<TriggerEvent>("appointment_reminder");
  const [offsetHours, setOffsetHours] = useState("24");
  const [direction, setDirection] = useState<"before" | "after">("before");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">قانون اتوماسیون جدید</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-600">قالب پیامک</label>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none">
              <option value="">انتخاب قالب</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">رویداد</label>
            <select value={triggerEvent} onChange={(e) => setTriggerEvent(e.target.value as TriggerEvent)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none">
              {Object.entries(TRIGGER_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-gray-600">فاصله‌ی زمانی (ساعت)</label>
              <input type="number" value={offsetHours} onChange={(e) => setOffsetHours(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">جهت</label>
              <select value={direction} onChange={(e) => setDirection(e.target.value as "before" | "after")} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none">
                <option value="before">قبل</option>
                <option value="after">بعد</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            انصراف
          </button>
          <button
            disabled={!templateId || isSubmitting}
            onClick={() => {
              const minutes = Number(offsetHours) * 60 * (direction === "before" ? -1 : 1);
              onSubmit({ template_id: templateId, trigger_event: triggerEvent, offset_minutes: minutes });
            }}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {isSubmitting ? "در حال ثبت..." : "ثبت"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SendSmsModal({
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  onClose: () => void;
  onSubmit: (payload: { phone: string; content: string }) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [phone, setPhone] = useState("");
  const [content, setContent] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">ارسال دستی پیامک</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-600">شماره موبایل</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="09121234567" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">متن پیامک</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            انصراف
          </button>
          <button
            disabled={!phone || !content || isSubmitting}
            onClick={() => onSubmit({ phone, content })}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {isSubmitting ? "در حال ارسال..." : "ارسال"}
          </button>
        </div>
      </div>
    </div>
  );
}