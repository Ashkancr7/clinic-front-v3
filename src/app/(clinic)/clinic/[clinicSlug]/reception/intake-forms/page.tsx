"use client";

import { use, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Filter, ClipboardList, UserRound, Phone, X, ShieldCheck, ShieldQuestion, ShieldX } from "lucide-react";

import {
  getIntakeSubmissions,
  getIntakeSubmissionDetail,
  reviewIntakeSubmission,
  type IntakeSubmissionStatus,
  type IntakeReviewStatus,
} from "@/lib/api/intake-submissions";
import { getIntakeForms, type IntakeForm } from "@/lib/api/intake-forms";
import { getPatientDetail } from "@/lib/api/patients";
import { queryKeys } from "@/lib/query/keys";

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

const FILTERS: [IntakeSubmissionStatus | "all", string][] = [
  ["needs_review", "نیازمند بررسی"],
  ["submitted", "ارسال‌شده"],
  ["verified", "تاییدشده"],
  ["rejected", "ردشده"],
  ["draft", "پیش‌نویس"],
  ["all", "همه"],
];

export default function ReceptionIntakeFormsPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<IntakeSubmissionStatus | "all">("needs_review");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const { data: forms = [] } = useQuery({
    queryKey: queryKeys.intakeForms.list(clinicSlug),
    queryFn: () => getIntakeForms(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: queryKeys.intakeSubmissions.list(clinicSlug, statusFilter === "all" ? undefined : statusFilter),
    queryFn: () => getIntakeSubmissions(clinicSlug, statusFilter === "all" ? undefined : statusFilter),
    enabled: !!clinicSlug,
  });

  function invalidateSubmissions() {
    queryClient.invalidateQueries({ queryKey: ["intake-submissions", clinicSlug] });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">فرم‌های پذیرش</h1>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          بررسی و تایید فرم‌های پذیرشی که بیماران تکمیل کرده‌اند
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-white p-3 dark:border-white/10 dark:bg-white/[0.06]">
        <Filter className="h-3.5 w-3.5 text-gray-400" />
        {FILTERS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            className={`rounded-lg px-2.5 py-1 text-[11px] transition ${
              statusFilter === value
                ? "bg-primary text-white"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-white/[0.06]">
        {isLoading ? (
          <div className="p-10 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-xs text-gray-400 dark:text-gray-500">
            <ClipboardList className="h-6 w-6 text-gray-300 dark:text-gray-600" />
            فرمی در این وضعیت وجود ندارد.
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/10">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px] dark:bg-black/60">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#18201e]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">بررسی فرم پذیرش</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {reviewError && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500 dark:bg-red-500/10 dark:text-red-300">
            {reviewError}
          </p>
        )}

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
      </div>
    </div>
  );
}
