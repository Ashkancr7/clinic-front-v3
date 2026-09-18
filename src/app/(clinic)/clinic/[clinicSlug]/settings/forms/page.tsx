"use client";

import { use, useState, type ReactNode } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  CheckCircle2,
  UserRound,
  PenLine,
  Trash2,
  Plus,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  ListChecks,
  ChevronDown,
  Upload,
  Fingerprint,
  X,
  Loader2,
  ArrowUp,
  ArrowDown,
  ClipboardList,
  Filter,
  ShieldQuestion,
  ShieldCheck,
  ShieldX,
  Phone,
} from "lucide-react";

import {
  getConsentTemplates,
  getConsentVersions,
  createConsentTemplate,
  updateConsentTemplate,
  createConsentVersion,
  type ConsentTemplate,
} from "@/lib/api/consents";

import {
  getIntakeForms,
  createIntakeForm,
  updateIntakeForm,
  publishIntakeForm,
  type IntakeForm,
  type IntakeFormField,
  type IntakeFieldType,
  type IntakeFieldUpdateInput,
} from "@/lib/api/intake-forms";

import {
  getIntakeSubmissions,
  getIntakeSubmissionDetail,
  reviewIntakeSubmission,
  type IntakeSubmission,
  type IntakeSubmissionStatus,
  type IntakeReviewStatus,
} from "@/lib/api/intake-submissions";

import { getPatientDetail } from "@/lib/api/patients";
import { getServices } from "@/lib/api/services";
import { queryKeys } from "@/lib/query/keys";

/* -------------------------------------------------------------------------- */
/*                             FIELD TYPE CATALOG                             */
/* -------------------------------------------------------------------------- */

const FIELD_TYPE_OPTIONS: { value: IntakeFieldType; label: string; icon: typeof Type }[] = [
  { value: "text", label: "متن کوتاه", icon: Type },
  { value: "number", label: "عدد", icon: Hash },
  { value: "date", label: "تاریخ", icon: Calendar },
  { value: "select", label: "کشویی (تک‌انتخابی)", icon: ChevronDown },
  { value: "multi_select", label: "چندانتخابی", icon: ListChecks },
  { value: "yes_no", label: "بله / خیر", icon: CheckSquare },
  { value: "file", label: "بارگذاری فایل", icon: Upload },
  { value: "signature", label: "امضای دیجیتال", icon: Fingerprint },
];

function fieldTypeMeta(type: IntakeFieldType) {
  return FIELD_TYPE_OPTIONS.find((f) => f.value === type) ?? FIELD_TYPE_OPTIONS[0];
}

const SUBMISSION_STATUS_LABELS: Record<IntakeSubmissionStatus, string> = {
  draft: "پیش‌نویس",
  submitted: "ارسال‌شده",
  needs_review: "نیازمند بررسی",
  verified: "تاییدشده",
  rejected: "ردشده",
};

const SUBMISSION_STATUS_CLASSES: Record<IntakeSubmissionStatus, string> = {
  draft: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  submitted: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
  needs_review: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  verified: "bg-primary-light/20 text-primary-dark dark:bg-primary/15 dark:text-primary-light",
  rejected: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-300",
};

/* -------------------------------------------------------------------------- */
/*                                 MAIN PAGE                                  */
/* -------------------------------------------------------------------------- */

type Tab = "intake" | "consents" | "submissions";

export default function FormBuilderPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("intake");

  /* --------------------------- Consents state (بدون تغییر) --------------------------- */

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showEditTemplateInfo, setShowEditTemplateInfo] = useState(false);
  const [showNewVersion, setShowNewVersion] = useState(false);
  const [consentsError, setConsentsError] = useState<string | null>(null);

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: queryKeys.consents.templates(clinicSlug),
    queryFn: () => getConsentTemplates(clinicSlug),
    enabled: !!clinicSlug && activeTab === "consents",
  });

  const selectedTemplate: ConsentTemplate | null =
    templates.find((t) => t.id === selectedTemplateId) ?? templates[0] ?? null;

  const { data: versions = [], isLoading: versionsLoading } = useQuery({
    queryKey: queryKeys.consents.versions(clinicSlug, selectedTemplate?.id ?? ""),
    queryFn: () => getConsentVersions(clinicSlug, selectedTemplate!.id),
    enabled: !!clinicSlug && !!selectedTemplate,
  });

  function invalidateTemplates() {
    queryClient.invalidateQueries({ queryKey: queryKeys.consents.templates(clinicSlug) });
  }

  function invalidateVersions() {
    if (selectedTemplate) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.consents.versions(clinicSlug, selectedTemplate.id),
      });
    }
  }

  /* --------------------------------- Intake state --------------------------------- */

  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditFormInfo, setShowEditFormInfo] = useState(false);
  const [fieldModal, setFieldModal] = useState<{ field: IntakeFormField | null } | null>(null);
  const [intakeError, setIntakeError] = useState<string | null>(null);

  const { data: forms = [], isLoading: formsLoading } = useQuery({
    queryKey: queryKeys.intakeForms.list(clinicSlug),
    queryFn: () => getIntakeForms(clinicSlug),
    enabled: !!clinicSlug && (activeTab === "intake" || activeTab === "submissions"),
  });

  const selectedForm: IntakeForm | null = forms.find((f) => f.id === selectedFormId) ?? forms[0] ?? null;
  const sortedFields = selectedForm ? [...selectedForm.fields].sort((a, b) => a.displayOrder - b.displayOrder) : [];

  function invalidateForms() {
    queryClient.invalidateQueries({ queryKey: queryKeys.intakeForms.list(clinicSlug) });
  }

  const publishMutation = useMutation({
    mutationFn: (formId: string) => publishIntakeForm(clinicSlug, formId),
    onSuccess: () => {
      setIntakeError(null);
      invalidateForms();
    },
    onError: (e) => setIntakeError(e instanceof Error ? e.message : "انتشار فرم ناموفق بود"),
  });

  const saveFieldsMutation = useMutation({
    mutationFn: (fields: IntakeFieldUpdateInput[]) => {
      if (!selectedForm) throw new Error("فرمی انتخاب نشده");

      return updateIntakeForm(clinicSlug, selectedForm.id, {
        title: selectedForm.title,
        description: selectedForm.description ?? undefined,
        fields,
      });
    },

    onSuccess: () => {
      setIntakeError(null);
      invalidateForms();
    },

    onError: (e) =>
      setIntakeError(
        e instanceof Error ? e.message : "ذخیره‌ی فیلد ناموفق بود"
      ),
  });

  function fieldsToUpdatePayload(
    fields: IntakeFormField[]
  ): IntakeFieldUpdateInput[] {
    return fields.map((f, index) => ({
      id: f.id,
      field_key: f.fieldKey,
      label: f.label,
      field_type: f.fieldType,
      is_required: f.isRequired,
      options: f.options ?? undefined,
      validation_rules: f.validationRules ?? undefined,
      conditional_rules: f.conditionalRules ?? undefined,
      display_order: index,
    }));
  }

  function handleDeleteField(field: IntakeFormField) {
    if (!selectedForm) return;
    if (!window.confirm(`فیلد «${field.label}» حذف شود؟`)) return;
    const next = sortedFields.filter((f) => f.id !== field.id);
    saveFieldsMutation.mutate(fieldsToUpdatePayload(next));
  }

  function handleMoveField(field: IntakeFormField, direction: "up" | "down") {
    if (!selectedForm) return;
    const index = sortedFields.findIndex((f) => f.id === field.id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= sortedFields.length) return;
    const next = [...sortedFields];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    saveFieldsMutation.mutate(fieldsToUpdatePayload(next));
  }

  function handleSaveField(field: IntakeFieldUpdateInput) {
    if (!selectedForm) return;
    const existingIndex = sortedFields.findIndex((f) => f.id === field.id);
    let nextFields: IntakeFieldUpdateInput[];
    if (existingIndex >= 0) {
      nextFields = fieldsToUpdatePayload(sortedFields);
      nextFields[existingIndex] = field;
    } else {
      nextFields = [...fieldsToUpdatePayload(sortedFields), { ...field, display_order: sortedFields.length }];
    }
    saveFieldsMutation.mutate(nextFields, { onSuccess: () => setFieldModal(null) });
  }

  /* ------------------------------- Submissions state ------------------------------- */

  const [statusFilter, setStatusFilter] = useState<IntakeSubmissionStatus | "all">("needs_review");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: queryKeys.intakeSubmissions.list(clinicSlug, statusFilter === "all" ? undefined : statusFilter),
    queryFn: () => getIntakeSubmissions(clinicSlug, statusFilter === "all" ? undefined : statusFilter),
    enabled: !!clinicSlug && activeTab === "submissions",
  });

  function invalidateSubmissions() {
    queryClient.invalidateQueries({ queryKey: ["intake-submissions", clinicSlug] });
  }

  /* --------------------------------------------------------------------------- */

  return (
    <div className="space-y-4 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">فرم‌ساز پذیرش و رضایت‌نامه‌ها</h1>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">تنظیمات ‹ فرم‌ساز پذیرش و رضایت‌نامه‌ها</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-100 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
        <TabButton active={activeTab === "intake"} onClick={() => setActiveTab("intake")}>
          فرم پذیرش
        </TabButton>
        <TabButton active={activeTab === "consents"} onClick={() => setActiveTab("consents")}>
          رضایت‌نامه‌ها
        </TabButton>
        <TabButton active={activeTab === "submissions"} onClick={() => setActiveTab("submissions")}>
          درخواست‌های ثبت‌شده
        </TabButton>
      </div>

      {/* =========================== INTAKE TAB =========================== */}
      {activeTab === "intake" && (
        <div className="space-y-4">
          {intakeError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500 dark:bg-red-500/10 dark:text-red-300">
              {intakeError}
            </p>
          )}

          {formsLoading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-xs text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-500">
              در حال بارگذاری...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              {/* Form info */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-3 text-xs font-bold text-gray-800 dark:text-gray-100">اطلاعات فرم</h3>

                {!selectedForm ? (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">ابتدا یک فرم پذیرش بسازید.</p>
                ) : (
                  <>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">عنوان</div>
                    <div className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-200">
                      {selectedForm.title}
                    </div>

                    {selectedForm.description && (
                      <p className="mt-2 text-[10px] leading-5 text-gray-400 dark:text-gray-500">
                        {selectedForm.description}
                      </p>
                    )}

                    <div className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">وضعیت</div>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] ${selectedForm.status === "active"
                          ? "bg-primary-light/20 text-primary-dark dark:bg-primary/15 dark:text-primary-light"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                    >
                      {selectedForm.status === "active"
                        ? "فعال"
                        : selectedForm.status === "draft"
                          ? "پیش‌نویس"
                          : "غیرفعال"}
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowEditFormInfo(true)}
                      className="mt-3 flex items-center gap-1 text-[10px] text-primary-dark dark:text-primary-light"
                    >
                      <PenLine className="h-3 w-3" />
                      ویرایش عنوان / توضیح
                    </button>

                    <button
                      type="button"
                      disabled={selectedForm.status === "active" || publishMutation.isPending}
                      onClick={() => publishMutation.mutate(selectedForm.id)}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[11px] font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {publishMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      {selectedForm.status === "active" ? "این فرم فعال است" : "انتشار و فعال‌سازی"}
                    </button>
                  </>
                )}
              </div>

              {/* Fields list */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100">
                    {selectedForm ? `فیلدهای «${selectedForm.title}»` : "فیلدها"}
                  </h3>

                  <button
                    type="button"
                    disabled={!selectedForm}
                    onClick={() => setFieldModal({ field: null })}
                    className="flex items-center gap-1 rounded-lg bg-primary-light/15 px-2 py-1 text-[10px] text-primary-dark disabled:opacity-40 dark:bg-primary/10 dark:text-primary-light"
                  >
                    <Plus className="h-3 w-3" />
                    افزودن فیلد
                  </button>
                </div>

                {!selectedForm ? (
                  <p className="py-6 text-center text-[11px] text-gray-400 dark:text-gray-500">فرمی انتخاب نشده.</p>
                ) : sortedFields.length === 0 ? (
                  <p className="py-6 text-center text-[11px] text-gray-400 dark:text-gray-500">
                    هنوز فیلدی به این فرم اضافه نشده.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sortedFields.map((field, index) => {
                      const meta = fieldTypeMeta(field.fieldType);
                      const Icon = meta.icon;
                      return (
                        <div
                          key={field.id}
                          className="flex items-center gap-2 rounded-xl border border-gray-100 p-2.5 dark:border-gray-800"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
                            <Icon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-200">
                              {field.label}
                              {field.isRequired && <span className="text-danger">*</span>}
                            </div>
                            <div className="text-[9px] text-gray-400 dark:text-gray-500">
                              {meta.label} · {field.fieldKey}
                              {field.conditionalRules && " · شرطی"}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-0.5 text-gray-300 dark:text-gray-600">
                            <button
                              type="button"
                              disabled={index === 0 || saveFieldsMutation.isPending}
                              onClick={() => handleMoveField(field, "up")}
                              className="rounded p-1 hover:bg-gray-50 hover:text-gray-500 disabled:opacity-30 dark:hover:bg-gray-800"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === sortedFields.length - 1 || saveFieldsMutation.isPending}
                              onClick={() => handleMoveField(field, "down")}
                              className="rounded p-1 hover:bg-gray-50 hover:text-gray-500 disabled:opacity-30 dark:hover:bg-gray-800"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setFieldModal({ field })}
                              className="rounded p-1 hover:bg-gray-50 hover:text-gray-500 dark:hover:bg-gray-800"
                            >
                              <PenLine className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={saveFieldsMutation.isPending}
                              onClick={() => handleDeleteField(field)}
                              className="rounded p-1 hover:bg-red-50 hover:text-red-400 dark:hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Forms list */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100">فرم‌های پذیرش</h3>

                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-1 rounded-lg bg-primary-light/15 px-2 py-1 text-[10px] text-primary-dark dark:bg-primary/10 dark:text-primary-light"
                  >
                    <Plus className="h-3 w-3" />
                    فرم جدید
                  </button>
                </div>

                {forms.length === 0 ? (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">فرمی ثبت نشده.</p>
                ) : (
                  <div className="space-y-1.5">
                    {forms.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFormId(f.id)}
                        className={`w-full rounded-xl border p-2.5 text-right transition ${selectedForm?.id === f.id
                            ? "border-primary bg-primary-light/5 dark:bg-primary/10"
                            : "border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                          }`}
                      >
                        <div className="text-[11px] font-medium text-gray-700 dark:text-gray-200">{f.title}</div>
                        <div className="text-[9px] text-gray-400 dark:text-gray-500">
                          {f.fields.length} فیلد ·{" "}
                          {f.status === "active" ? "فعال" : f.status === "draft" ? "پیش‌نویس" : "غیرفعال"}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================== CONSENTS TAB (بدون تغییر) =========================== */}
      {activeTab === "consents" && (
        <div className="space-y-4">
          {consentsError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500 dark:bg-red-500/10 dark:text-red-300">
              {consentsError}
            </p>
          )}

          {templatesLoading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-xs text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-500">
              در حال بارگذاری...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              {/* Template info */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-3 text-xs font-bold text-gray-800 dark:text-gray-100">اطلاعات قالب</h3>

                {!selectedTemplate ? (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">ابتدا یک قالب رضایت‌نامه بسازید.</p>
                ) : (
                  <>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">خدمت مرتبط</div>
                    <div className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-200">
                      {selectedTemplate.serviceName ?? "بدون خدمت خاص (عمومی)"}
                    </div>

                    <div className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">وضعیت قالب</div>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] ${selectedTemplate.status === "active"
                          ? "bg-primary-light/20 text-primary-dark dark:bg-primary/15 dark:text-primary-light"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                    >
                      {selectedTemplate.status === "active"
                        ? "فعال"
                        : selectedTemplate.status === "draft"
                          ? "پیش‌نویس"
                          : "غیرفعال"}
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowEditTemplateInfo(true)}
                      className="mt-3 flex items-center gap-1 text-[10px] text-primary-dark dark:text-primary-light"
                    >
                      <PenLine className="h-3 w-3" />
                      ویرایش عنوان / خدمت
                    </button>
                  </>
                )}
              </div>

              {/* Versions */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100">
                    {selectedTemplate ? selectedTemplate.title : "نسخه‌ها"}
                  </h3>
                </div>

                {!selectedTemplate ? (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">قالبی انتخاب نشده.</p>
                ) : versionsLoading ? (
                  <p className="py-6 text-center text-[11px] text-gray-400 dark:text-gray-500">در حال بارگذاری...</p>
                ) : versions.length === 0 ? (
                  <p className="py-6 text-center text-[11px] text-gray-400 dark:text-gray-500">
                    نسخه‌ای برای این قالب ثبت نشده.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-[10px]">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 dark:border-gray-800">
                          <th className="pb-2 font-medium">نسخه</th>
                          <th className="pb-2 font-medium">وضعیت</th>
                          <th className="pb-2 font-medium">متن</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...versions]
                          .sort((a, b) => b.versionNumber - a.versionNumber)
                          .map((v) => (
                            <tr key={v.id} className="border-b border-gray-50 dark:border-gray-800">
                              <td className="py-2 text-gray-700 dark:text-gray-200">
                                {v.versionNumber.toLocaleString("fa-IR")}
                              </td>
                              <td className="py-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 ${v.status === "active"
                                      ? "bg-primary-light/20 text-primary-dark dark:bg-primary/15 dark:text-primary-light"
                                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                    }`}
                                >
                                  {v.status === "active" ? "فعال" : v.status === "draft" ? "پیش‌نویس" : "بایگانی"}
                                </span>
                              </td>
                              <td className="max-w-[220px] truncate py-2 text-gray-500 dark:text-gray-400">
                                {v.content}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-end">
                  <button
                    type="button"
                    disabled={!selectedTemplate}
                    onClick={() => setShowNewVersion(true)}
                    className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[10px] font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
                  >
                    <Plus className="h-3 w-3" />
                    نسخه جدید
                  </button>
                </div>
              </div>

              {/* Templates list */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100">قالب‌های رضایت‌نامه</h3>

                  <button
                    type="button"
                    onClick={() => setShowCreateTemplate(true)}
                    className="flex items-center gap-1 rounded-lg bg-primary-light/15 px-2 py-1 text-[10px] text-primary-dark dark:bg-primary/10 dark:text-primary-light"
                  >
                    <Plus className="h-3 w-3" />
                    قالب جدید
                  </button>
                </div>

                {templates.length === 0 ? (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">قالبی ثبت نشده.</p>
                ) : (
                  <div className="space-y-1.5">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(t.id)}
                        className={`w-full rounded-xl border p-2.5 text-right transition ${selectedTemplate?.id === t.id
                            ? "border-primary bg-primary-light/5 dark:bg-primary/10"
                            : "border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                          }`}
                      >
                        <div className="text-[11px] font-medium text-gray-700 dark:text-gray-200">{t.title}</div>
                        <div className="text-[9px] text-gray-400 dark:text-gray-500">
                          {t.serviceName ?? "عمومی"} ·{" "}
                          {t.status === "active" ? "فعال" : t.status === "draft" ? "پیش‌نویس" : "غیرفعال"}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================== SUBMISSIONS TAB =========================== */}
      {activeTab === "submissions" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            {(
              [
                ["all", "همه"],
                ["needs_review", "نیازمند بررسی"],
                ["submitted", "ارسال‌شده"],
                ["verified", "تاییدشده"],
                ["rejected", "ردشده"],
                ["draft", "پیش‌نویس"],
              ] as [IntakeSubmissionStatus | "all", string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`rounded-lg px-2.5 py-1 text-[11px] transition ${statusFilter === value
                    ? "bg-primary text-white"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
            {submissionsLoading ? (
              <div className="p-10 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</div>
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-10 text-center text-xs text-gray-400 dark:text-gray-500">
                <ClipboardList className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                فرمی در این وضعیت وجود ندارد.
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {submissions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSubmissionId(s.id)}
                    className="flex w-full items-center justify-between gap-3 p-3.5 text-right transition hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-200">
                        پرونده {s.patientId.slice(0, 8)}…
                      </div>
                      <div className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                        {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString("fa-IR") : "هنوز ارسال نشده"}
                      </div>
                    </div>

                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${SUBMISSION_STATUS_CLASSES[s.status]}`}>
                      {SUBMISSION_STATUS_LABELS[s.status]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================== MODALS =========================== */}

      {showCreateTemplate && (
        <CreateTemplateModal
          clinicSlug={clinicSlug}
          onClose={() => setShowCreateTemplate(false)}
          onCreated={(templateId) => {
            setShowCreateTemplate(false);
            setSelectedTemplateId(templateId);
            setConsentsError(null);
            invalidateTemplates();
          }}
        />
      )}

      {showEditTemplateInfo && selectedTemplate && (
        <EditTemplateInfoModal
          clinicSlug={clinicSlug}
          template={selectedTemplate}
          onClose={() => setShowEditTemplateInfo(false)}
          onSaved={() => {
            setShowEditTemplateInfo(false);
            setConsentsError(null);
            invalidateTemplates();
          }}
        />
      )}

      {showNewVersion && selectedTemplate && (
        <CreateVersionModal
          clinicSlug={clinicSlug}
          template={selectedTemplate}
          onClose={() => setShowNewVersion(false)}
          onSaved={() => {
            setShowNewVersion(false);
            setConsentsError(null);
            invalidateVersions();
            invalidateTemplates();
          }}
        />
      )}

      {showCreateForm && (
        <CreateIntakeFormModal
          clinicSlug={clinicSlug}
          onClose={() => setShowCreateForm(false)}
          onCreated={(formId) => {
            setShowCreateForm(false);
            setSelectedFormId(formId);
            setIntakeError(null);
            invalidateForms();
          }}
        />
      )}

      {showEditFormInfo && selectedForm && (
        <EditIntakeFormInfoModal
          clinicSlug={clinicSlug}
          form={selectedForm}
          onClose={() => setShowEditFormInfo(false)}
          onSaved={() => {
            setShowEditFormInfo(false);
            setIntakeError(null);
            invalidateForms();
          }}
        />
      )}

      {fieldModal && (
        <IntakeFieldModal
          field={fieldModal.field}
          otherFields={sortedFields.filter((f) => f.id !== fieldModal.field?.id)}
          isSaving={saveFieldsMutation.isPending}
          onClose={() => setFieldModal(null)}
          onSave={handleSaveField}
        />
      )}

      {selectedSubmissionId && (
        <SubmissionDetailModal
          clinicSlug={clinicSlug}
          submissionId={selectedSubmissionId}
          forms={forms}
          onClose={() => setSelectedSubmissionId(null)}
          onReviewed={() => {
            invalidateSubmissions();
            setSelectedSubmissionId(null);
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SHARED HELPERS                                */
/* -------------------------------------------------------------------------- */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 pb-2 text-sm transition ${active
          ? "border-primary font-medium text-primary-dark dark:text-primary-light"
          : "border-transparent text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        }`}
    >
      {children}
    </button>
  );
}

function ModalShell({
  title,
  onClose,
  error,
  children,
  maxWidth = "max-w-md",
}: {
  title: string;
  onClose: () => void;
  error?: string | null;
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px] dark:bg-black/60">
      <div className={`max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#18201e]`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        )}

        {children}
      </div>
    </div>
  );
}

const modalInputClasses =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200";

/* -------------------------------------------------------------------------- */
/*                         CONSENTS MODALS (بدون تغییر)                       */
/* -------------------------------------------------------------------------- */

function CreateTemplateModal({
  clinicSlug,
  onClose,
  onCreated,
}: {
  clinicSlug: string;
  onClose: () => void;
  onCreated: (templateId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [content, setContent] = useState("");
  const [activate, setActivate] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: services = [] } = useQuery({
    queryKey: ["services", clinicSlug, "for-consent-template"],
    queryFn: () => getServices(clinicSlug),
    enabled: !!clinicSlug,
  });

  const mutation = useMutation({
    mutationFn: () => {
      if (!title.trim()) throw new Error("عنوان قالب الزامی است.");
      if (!content.trim()) throw new Error("متن رضایت‌نامه الزامی است.");
      return createConsentTemplate(clinicSlug, {
        title: title.trim(),
        service_id: serviceId || undefined,
        content: content.trim(),
        activate,
      });
    },
    onSuccess: (template) => onCreated(template.id),
    onError: (e) => setFormError(e instanceof Error ? e.message : "ایجاد قالب ناموفق بود"),
  });

  return (
    <ModalShell title="قالب رضایت‌نامه جدید" onClose={onClose} error={formError}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">عنوان</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: رضایت‌نامه تزریقات زیبایی"
            className={modalInputClasses}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">خدمت مرتبط (اختیاری)</label>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={modalInputClasses}>
            <option value="">عمومی (بدون خدمت خاص)</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">متن رضایت‌نامه (نسخه اول)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className={`${modalInputClasses} resize-none`}
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={activate}
            onChange={(e) => setActivate(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-gray-300"
          />
          بلافاصله فعال شود
        </label>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
        >
          انصراف
        </button>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mutation.isPending ? "در حال ثبت..." : "ایجاد قالب"}
        </button>
      </div>
    </ModalShell>
  );
}

function EditTemplateInfoModal({
  clinicSlug,
  template,
  onClose,
  onSaved,
}: {
  clinicSlug: string;
  template: ConsentTemplate;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(template.title);
  const [serviceId, setServiceId] = useState(template.serviceId ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: services = [] } = useQuery({
    queryKey: ["services", clinicSlug, "for-consent-template"],
    queryFn: () => getServices(clinicSlug),
    enabled: !!clinicSlug,
  });

  const mutation = useMutation({
    mutationFn: () => {
      if (!title.trim()) throw new Error("عنوان قالب الزامی است.");
      return updateConsentTemplate(clinicSlug, template.id, {
        title: title.trim(),
        service_id: serviceId || null,
      });
    },
    onSuccess: () => onSaved(),
    onError: (e) => setFormError(e instanceof Error ? e.message : "ویرایش قالب ناموفق بود"),
  });

  return (
    <ModalShell title="ویرایش قالب" onClose={onClose} error={formError} maxWidth="max-w-sm">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">عنوان</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={modalInputClasses} />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">خدمت مرتبط</label>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={modalInputClasses}>
            <option value="">عمومی (بدون خدمت خاص)</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
        >
          انصراف
        </button>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </div>
    </ModalShell>
  );
}

function CreateVersionModal({
  clinicSlug,
  template,
  onClose,
  onSaved,
}: {
  clinicSlug: string;
  template: ConsentTemplate;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [content, setContent] = useState("");
  const [activate, setActivate] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!content.trim()) throw new Error("متن نسخه‌ی جدید الزامی است.");
      return createConsentVersion(clinicSlug, template.id, { content: content.trim(), activate });
    },
    onSuccess: () => onSaved(),
    onError: (e) => setFormError(e instanceof Error ? e.message : "ایجاد نسخه‌ی جدید ناموفق بود"),
  });

  return (
    <ModalShell title={`نسخه‌ی جدید «${template.title}»`} onClose={onClose} error={formError}>
      <p className="mb-2 text-[10px] text-gray-400 dark:text-gray-500">
        نسخه‌های قبلی هرگز تغییر نمی‌کنند؛ این متن به‌عنوان نسخه‌ی جدید ثبت می‌شود.
      </p>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        className={`${modalInputClasses} resize-none`}
      />

      <label className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
        <input
          type="checkbox"
          checked={activate}
          onChange={(e) => setActivate(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-gray-300"
        />
        این نسخه فعال شود (نسخه‌ی فعال قبلی غیرفعال می‌شود)
      </label>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
        >
          انصراف
        </button>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mutation.isPending ? "در حال ثبت..." : "ثبت نسخه جدید"}
        </button>
      </div>
    </ModalShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                              INTAKE MODALS                                 */
/* -------------------------------------------------------------------------- */

function CreateIntakeFormModal({
  clinicSlug,
  onClose,
  onCreated,
}: {
  clinicSlug: string;
  onClose: () => void;
  onCreated: (formId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!title.trim()) throw new Error("عنوان فرم الزامی است.");
      return createIntakeForm(clinicSlug, { title: title.trim(), description: description.trim() || undefined });
    },
    onSuccess: (form) => onCreated(form.id),
    onError: (e) => setFormError(e instanceof Error ? e.message : "ایجاد فرم ناموفق بود"),
  });

  return (
    <ModalShell title="فرم پذیرش جدید" onClose={onClose} error={formError}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">عنوان</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: فرم پذیرش اولیه"
            className={modalInputClasses}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">توضیح (اختیاری)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`${modalInputClasses} resize-none`}
          />
        </div>
      </div>

      <p className="mt-3 text-[10px] leading-5 text-gray-400 dark:text-gray-500">
        فیلدها را بعد از ساخت فرم، از پنل «فیلدهای فرم» اضافه کنید.
      </p>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
        >
          انصراف
        </button>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mutation.isPending ? "در حال ثبت..." : "ایجاد فرم"}
        </button>
      </div>
    </ModalShell>
  );
}

function EditIntakeFormInfoModal({
  clinicSlug,
  form,
  onClose,
  onSaved,
}: {
  clinicSlug: string;
  form: IntakeForm;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!title.trim()) throw new Error("عنوان فرم الزامی است.");
      return updateIntakeForm(clinicSlug, form.id, { title: title.trim(), description: description.trim() });
    },
    onSuccess: () => onSaved(),
    onError: (e) => setFormError(e instanceof Error ? e.message : "ویرایش فرم ناموفق بود"),
  });

  return (
    <ModalShell title="ویرایش فرم" onClose={onClose} error={formError} maxWidth="max-w-sm">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">عنوان</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={modalInputClasses} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">توضیح</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`${modalInputClasses} resize-none`}
          />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
        >
          انصراف
        </button>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </div>
    </ModalShell>
  );
}

function IntakeFieldModal({
  field,
  otherFields,
  isSaving,
  onClose,
  onSave,
}: {
  field: IntakeFormField | null;
  otherFields: IntakeFormField[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (field: IntakeFieldUpdateInput) => void;
}) {
  const isEdit = !!field;

  const [fieldKey, setFieldKey] = useState(field?.fieldKey ?? "");
  const [label, setLabel] = useState(field?.label ?? "");
  const [fieldType, setFieldType] = useState<IntakeFieldType>(field?.fieldType ?? "text");
  const [isRequired, setIsRequired] = useState(field?.isRequired ?? false);
  const [optionsText, setOptionsText] = useState((field?.options ?? []).join("\n"));

  const [isConditional, setIsConditional] = useState(!!field?.conditionalRules);
  const [dependsOn, setDependsOn] = useState((field?.conditionalRules?.depends_on as string) ?? "");
  const [equalsValue, setEqualsValue] = useState(
    field?.conditionalRules?.equals !== undefined ? String(field.conditionalRules.equals) : ""
  );

  const [formError, setFormError] = useState<string | null>(null);

  const needsOptions = fieldType === "select" || fieldType === "multi_select";
  const dependsOnField = otherFields.find((f) => f.fieldKey === dependsOn);

  function handleSubmit() {
    setFormError(null);
    if (!fieldKey.trim()) return setFormError("کلید فیلد الزامی است.");
    if (!/^[a-zA-Z0-9_]+$/.test(fieldKey.trim())) return setFormError("کلید فیلد فقط باید انگلیسی، عدد یا _ باشد.");
    if (!label.trim()) return setFormError("برچسب فیلد الزامی است.");

    const options = needsOptions
      ? optionsText
        .split("\n")
        .map((o) => o.trim())
        .filter(Boolean)
      : undefined;
    if (needsOptions && (!options || options.length === 0)) return setFormError("حداقل یک گزینه اضافه کنید.");

    let conditionalRules: Record<string, unknown> | undefined;
    if (isConditional) {
      if (!dependsOn) return setFormError("فیلد وابسته را انتخاب کنید.");
      const equals =
        dependsOnField?.fieldType === "yes_no" ? equalsValue === "true" : equalsValue;
      conditionalRules = { depends_on: dependsOn, equals };
    }

    onSave({
      id: field?.id,
      field_key: fieldKey.trim(),
      label: label.trim(),
      field_type: fieldType,
      is_required: isRequired,
      options,
      conditional_rules: conditionalRules,
      display_order: field?.displayOrder,
    });
  }

  return (
    <ModalShell title={isEdit ? "ویرایش فیلد" : "فیلد جدید"} onClose={onClose} error={formError}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">برچسب (نمایشی)</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="مثلاً: آیا سابقه حساسیت دارید؟"
            className={modalInputClasses}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">کلید فیلد (انگلیسی، یکتا)</label>
          <input
            value={fieldKey}
            onChange={(e) => setFieldKey(e.target.value)}
            placeholder="مثلاً: has_allergy"
            dir="ltr"
            className={`${modalInputClasses} text-left`}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">نوع فیلد</label>
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value as IntakeFieldType)}
            className={modalInputClasses}
          >
            {FIELD_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {needsOptions && (
          <div>
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">
              گزینه‌ها (هر خط یک گزینه)
            </label>
            <textarea
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              rows={4}
              placeholder={"گزینه اول\nگزینه دوم"}
              className={`${modalInputClasses} resize-none`}
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-gray-300"
          />
          تکمیل این فیلد الزامی است
        </label>

        <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isConditional}
              onChange={(e) => setIsConditional(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300"
            />
            نمایش این فیلد شرطی است
          </label>

          {isConditional && (
            <div className="mt-3 space-y-2">
              <div>
                <label className="mb-1 block text-[10px] text-gray-500 dark:text-gray-400">وابسته به فیلد</label>
                <select value={dependsOn} onChange={(e) => setDependsOn(e.target.value)} className={modalInputClasses}>
                  <option value="">انتخاب کنید</option>
                  {otherFields.map((f) => (
                    <option key={f.id} value={f.fieldKey}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] text-gray-500 dark:text-gray-400">فقط وقتی مقدار آن</label>
                {dependsOnField?.fieldType === "yes_no" ? (
                  <select value={equalsValue} onChange={(e) => setEqualsValue(e.target.value)} className={modalInputClasses}>
                    <option value="true">بله باشد</option>
                    <option value="false">خیر باشد</option>
                  </select>
                ) : (
                  <input
                    value={equalsValue}
                    onChange={(e) => setEqualsValue(e.target.value)}
                    placeholder="مقدار مورد نظر"
                    className={modalInputClasses}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
        >
          انصراف
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving ? "در حال ذخیره..." : isEdit ? "ذخیره فیلد" : "افزودن فیلد"}
        </button>
      </div>
    </ModalShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                          SUBMISSION DETAIL MODAL                           */
/* -------------------------------------------------------------------------- */

function SubmissionDetailModal({
  clinicSlug,
  submissionId,
  forms,
  onClose,
  onReviewed,
}: {
  clinicSlug: string;
  submissionId: string;
  forms: IntakeForm[];
  onClose: () => void;
  onReviewed: () => void;
}) {
  const [reviewError, setReviewError] = useState<string | null>(null);

  const { data: submission, isLoading } = useQuery({
    queryKey: queryKeys.intakeSubmissions.detail(clinicSlug, submissionId),
    queryFn: () => getIntakeSubmissionDetail(clinicSlug, submissionId),
  });

  const { data: patientInfo } = useQuery({
    queryKey: ["patients", clinicSlug, "detail-for-intake", submission?.patientId],
    queryFn: () => getPatientDetail(clinicSlug, submission!.patientId),
    enabled: !!submission?.patientId,
  });

  const form = forms.find((f) => f.id === submission?.formId) ?? null;

  function fieldLabel(key: string) {
    return form?.fields.find((f) => f.fieldKey === key)?.label ?? key;
  }

  const reviewMutation = useMutation({
    mutationFn: (status: IntakeReviewStatus) => reviewIntakeSubmission(clinicSlug, submissionId, status),
    onSuccess: () => onReviewed(),
    onError: (e) => setReviewError(e instanceof Error ? e.message : "ثبت نتیجه‌ی بررسی ناموفق بود"),
  });

  return (
    <ModalShell title="بررسی فرم پذیرش" onClose={onClose} error={reviewError} maxWidth="max-w-lg">
      {isLoading || !submission ? (
        <div className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</div>
      ) : (
        <>
          {patientInfo && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <UserRound className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  {patientInfo.patient.firstName} {patientInfo.patient.lastName}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                  <Phone className="h-3 w-3" />
                  {patientInfo.patient.phone}
                </div>
              </div>
            </div>
          )}

          <span className={`mb-4 inline-block rounded-full px-2 py-0.5 text-[10px] ${SUBMISSION_STATUS_CLASSES[submission.status]}`}>
            {SUBMISSION_STATUS_LABELS[submission.status]}
          </span>

          <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-gray-100 p-3 dark:border-gray-800">
            {Object.entries(submission.submittedData).length === 0 ? (
              <p className="text-[11px] text-gray-400 dark:text-gray-500">داده‌ای ثبت نشده.</p>
            ) : (
              Object.entries(submission.submittedData).map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-3 text-xs">
                  <span className="shrink-0 text-gray-400 dark:text-gray-500">{fieldLabel(key)}</span>
                  <span className="text-left text-gray-700 dark:text-gray-200">
                    {Array.isArray(value) ? value.join("، ") : String(value ?? "—")}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate("verified")}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              تایید
            </button>
            <button
              type="button"
              disabled={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate("needs_review")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-xs text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <ShieldQuestion className="h-3.5 w-3.5" />
              بررسی بیشتر
            </button>
            <button
              type="button"
              disabled={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate("rejected")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2.5 text-xs text-red-500 transition hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
            >
              <ShieldX className="h-3.5 w-3.5" />
              رد
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}
