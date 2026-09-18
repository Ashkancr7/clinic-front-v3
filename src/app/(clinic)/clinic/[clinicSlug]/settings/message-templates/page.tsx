"use client";

import { use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Send, X, Pencil, Loader2 } from "lucide-react";

import {
  getSmsTemplates,
  getSmsTemplate,
  createSmsTemplate,
  updateSmsTemplate,
  testSmsTemplate,
  type SmsTemplate,
} from "@/lib/api/sms";
import { queryKeys } from "@/lib/query/keys";

export default function MessageTemplatesPage({ params }: { params: Promise<{ clinicSlug: string }> }) {
  const { clinicSlug } = use(params);
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [testingTemplate, setTestingTemplate] = useState<SmsTemplate | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [loadEditError, setLoadEditError] = useState<string | null>(null);

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: queryKeys.smsTemplates.list(clinicSlug),
    queryFn: () => getSmsTemplates(clinicSlug),
    enabled: !!clinicSlug,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createSmsTemplate>[1]) => createSmsTemplate(clinicSlug, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.smsTemplates.list(clinicSlug) });
      setShowCreateModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateSmsTemplate>[2] }) =>
      updateSmsTemplate(clinicSlug, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.smsTemplates.list(clinicSlug) });
      setEditingTemplate(null);
    },
  });

  // قبل از باز کردن فرم ویرایش، آخرین نسخه‌ی قالب را از سرور می‌گیریم
  // (GET /sms/templates/{template}) تا با داده‌ی احتمالاً قدیمیِ لیست کش‌شده
  // فرم باز نشود.
  async function openEdit(template: SmsTemplate) {
    setLoadEditError(null);
    setLoadingEditId(template.id);
    try {
      const fresh = await getSmsTemplate(clinicSlug, template.id);
      queryClient.setQueryData(queryKeys.smsTemplates.detail(clinicSlug, template.id), fresh);
      setEditingTemplate(fresh);
    } catch (err) {
      setLoadEditError(err instanceof Error ? err.message : "دریافت اطلاعات قالب با خطا مواجه شد.");
      setEditingTemplate(template); // fallback به داده‌ی موجود در لیست
    } finally {
      setLoadingEditId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">قالب‌های پیامک</h1>
          <p className="mt-1 text-xs text-gray-400">مدیریت متن‌های پیامکی قابل استفاده در پیامک‌های خودکار یا دستی</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-medium text-white hover:bg-primary-dark"
        >
          <Plus className="h-3.5 w-3.5" /> قالب جدید
        </button>
      </div>

      {isLoading && <div className="py-10 text-center text-sm text-gray-400">در حال بارگذاری...</div>}
      {error && <div className="py-10 text-center text-sm text-danger">خطا در دریافت قالب‌ها</div>}
      {loadEditError && <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-500">{loadEditError}</div>}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">{t.title}</span>
                <span className={`h-2 w-2 rounded-full ${t.isActive ? "bg-primary" : "bg-gray-300"}`} />
              </div>
              <div className="mb-2 text-[10px] text-gray-400" dir="ltr">
                {t.templateKey}
              </div>
              <p className="mb-3 line-clamp-3 text-[11px] leading-relaxed text-gray-500">{t.content}</p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => openEdit(t)}
                  disabled={loadingEditId === t.id}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  {loadingEditId === t.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Pencil className="h-3 w-3" />
                  )}{" "}
                  ویرایش
                </button>
                <button
                  onClick={() => setTestingTemplate(t)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary-light/15 py-1.5 text-[11px] text-primary-dark hover:bg-primary-light/25"
                >
                  <Send className="h-3 w-3" /> ارسال تست
                </button>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
              هنوز قالبی ثبت نشده.
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <TemplateFormModal
          title="قالب جدید"
          onClose={() => setShowCreateModal(false)}
          onSubmit={(payload) => createMutation.mutate(payload)}
          isSubmitting={createMutation.isPending}
          error={createMutation.error instanceof Error ? createMutation.error.message : null}
        />
      )}

      {editingTemplate && (
        <TemplateFormModal
          title="ویرایش قالب"
          initial={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSubmit={(payload) => updateMutation.mutate({ id: editingTemplate.id, payload })}
          isSubmitting={updateMutation.isPending}
          error={updateMutation.error instanceof Error ? updateMutation.error.message : null}
        />
      )}

      {testingTemplate && (
        <TestSendModal clinicSlug={clinicSlug} template={testingTemplate} onClose={() => setTestingTemplate(null)} />
      )}
    </div>
  );
}

function TemplateFormModal({
  title,
  initial,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  title: string;
  initial?: SmsTemplate;
  onClose: () => void;
  onSubmit: (payload: { title: string; template_key: string; content: string; is_active?: boolean }) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [titleText, setTitleText] = useState(initial?.title ?? "");
  const [templateKey, setTemplateKey] = useState(initial?.templateKey ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-600">عنوان قالب</label>
            <input value={titleText} onChange={(e) => setTitleText(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">کلید قالب (template_key)</label>
            <input value={templateKey} onChange={(e) => setTemplateKey(e.target.value)} dir="ltr" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="appointment_reminder" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">متن پیامک</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="سلام {{patient_name}}، نوبت شما فردا ساعت {{appointment_time}} است."
            />
            <p className="mt-1 text-[10px] text-gray-400">می‌توانید از متغیرهایی مثل {"{{patient_name}}"} استفاده کنید.</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            قالب فعال باشد
          </label>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            انصراف
          </button>
          <button
            disabled={!titleText || !templateKey || !content || isSubmitting}
            onClick={() => onSubmit({ title: titleText, template_key: templateKey, content, is_active: isActive })}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {isSubmitting ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TestSendModal({ clinicSlug, template, onClose }: { clinicSlug: string; template: SmsTemplate; onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSend() {
    setStatus("sending");
    try {
      await testSmsTemplate(clinicSlug, template.id, phone);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">ارسال تست «{template.title}»</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {status === "sent" && <p className="mb-3 rounded-lg bg-primary-light/15 px-3 py-2 text-xs text-primary-dark">پیامک تست ارسال شد.</p>}
        {status === "error" && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">ارسال ناموفق بود.</p>}

        <label className="mb-1 block text-xs text-gray-600">شماره موبایل</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="09121234567" />

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            بستن
          </button>
          <button
            disabled={!phone || status === "sending"}
            onClick={handleSend}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {status === "sending" ? "در حال ارسال..." : "ارسال"}
          </button>
        </div>
      </div>
    </div>
  );
}