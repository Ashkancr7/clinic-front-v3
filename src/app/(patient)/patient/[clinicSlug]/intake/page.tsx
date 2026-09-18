"use client";

import { use, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";

import { useMutation, useQuery } from "@tanstack/react-query";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import type DateObject from "react-date-object";

import SignatureField from "@/components/forms/SignatureField";
import { PatientHeader } from "@/components/layout/PatientHeader";

import {
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Headset,
  Loader2,
  Lock,
  Pencil,
  Save,
  Settings2,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import {
  getPublicIntakeForm,
  submitPublicIntake,
  type PublicIntakeField,
} from "@/lib/api/public-intake";
import { uploadFile } from "@/lib/api/files";
import { toLocalIsoDate } from "@/lib/api/appointments";
import { queryKeys } from "@/lib/query/keys";

/* -------------------------------------------------------------------------- */
/*                            STATIC SIDEBAR CONTENT                          */
/* -------------------------------------------------------------------------- */
/* این‌ها صرفاً تزئینی‌اند و از فرم پویا مستقل‌اند — نیازی به داده از بک‌اند ندارند. */

const SIDEBAR_INFO = [
  { icon: Lock, title: "اطلاعات محرمانه", desc: "کلیه اطلاعات شما محفوظ و رمزگذاری شده است." },
  { icon: Settings2, title: "فرآیند هوشمند", desc: "فرم بر اساس پاسخ‌های شما شخصی‌سازی می‌شود." },
  { icon: Save, title: "دسترسی آسان", desc: "در هر زمان می‌توانید ادامه دهید و ذخیره کنید." },
  { icon: Headset, title: "پشتیبانی", desc: "در صورت سوال، تیم ما در کنار شما هستند." },
];

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type AnswerValue = string | number | boolean | string[] | null;
type Answers = Record<string, AnswerValue>;

/* -------------------------------------------------------------------------- */
/*                                MAIN PAGE                                   */
/* -------------------------------------------------------------------------- */

export default function PatientIntakePage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);

  const {
    data: form,
    isLoading: formLoading,
    error: formError,
  } = useQuery({
    queryKey: queryKeys.publicIntake.form(clinicSlug),
    queryFn: () => getPublicIntakeForm(clinicSlug),
    enabled: !!clinicSlug,
    retry: false,
  });

  const [answers, setAnswers] = useState<Answers>({});
  const [agreed, setAgreed] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function setAnswer(key: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  /*
   * اسپک فیلد category/section ندارد، فقط field_type و display_order.
   * برای حفظ همون تجربه‌ی چندمرحله‌ای قبلی، مرحله‌بندی رو صرفاً بر اساس
   * نوع فیلد می‌سازیم: فیلدهای معمولی -> مرحله ۱، فیلد(های) امضا -> مرحله ۲،
   * بررسی نهایی -> مرحله ۳. اگر فرم اصلاً فیلد امضا نداشته باشد، مرحله ۲ حذف می‌شود.
   */
  const sortedFields = useMemo(
    () => (form?.fields ?? []).slice().sort((a, b) => a.displayOrder - b.displayOrder),
    [form]
  );
  const dataFields = sortedFields.filter((f) => f.fieldType !== "signature");
  const signatureFields = sortedFields.filter((f) => f.fieldType === "signature");
  const hasSignatureStep = signatureFields.length > 0;

  const STEPS = useMemo(() => {
    const steps = [{ number: 1, label: "اطلاعات و سوابق" }];
    if (hasSignatureStep) steps.push({ number: 2, label: "رضایت‌نامه و امضا" });
    steps.push({ number: steps.length + 1, label: "بررسی و ثبت نهایی" });
    return steps;
  }, [hasSignatureStep]);
  const totalSteps = STEPS.length;
  const reviewStepNumber = totalSteps;

  function isFieldVisible(field: PublicIntakeField): boolean {
    const rule = field.conditionalRules;
    if (!rule || typeof rule.depends_on !== "string") return true;
    return answers[rule.depends_on] === rule.equals;
  }

  function isFieldMissing(field: PublicIntakeField): boolean {
    if (!field.isRequired || !isFieldVisible(field)) return false;
    const value = answers[field.fieldKey];
    if (Array.isArray(value)) return value.length === 0;
    return value === undefined || value === null || value === "";
  }

  const visibleDataFields = dataFields.filter(isFieldVisible);
  const step1Incomplete = visibleDataFields.some(isFieldMissing);

  async function handleFileChange(field: PublicIntakeField, file: File | null) {
    if (!file) return;
    setUploadingKey(field.fieldKey);
    setSubmitError(null);
    try {
      // توجه: /files/upload طبق اسپک نیاز به احراز هویت دارد و اندپوینت
      // عمومیِ آپلود فایل برای بیمارِ بدون‌حساب وجود ندارد. این صفحه پشتِ
      // لایه‌ی پورتال بیمار (نیازمند ورود) قرار دارد، پس این فرض معتبر است؛
      // اگر قرار باشد لینک این فرم بدون ورود هم در دسترس باشد، این بخش کار نخواهد کرد
      // تا یک اندپوینت عمومیِ آپلود اضافه شود.
      const uploaded = await uploadFile(clinicSlug, file, "document", "internal");
      setAnswer(field.fieldKey, uploaded.id);
    } catch {
      setSubmitError("آپلود فایل ناموفق بود. دوباره تلاش کنید.");
    } finally {
      setUploadingKey(null);
    }
  }

  const saveDraftMutation = useMutation({
    mutationFn: () => submitPublicIntake(clinicSlug, { submitted_data: answers, finalize: false }),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitPublicIntake(clinicSlug, {
        submitted_data: answers,
        finalize: true,
        accepted: hasSignatureStep ? agreed : undefined,
        // consent_version_id: اسپک هیچ فیلدی در پاسخ GET /public/clinics/{slug}/intake-form
        // برای شناسه‌ی نسخه‌ی رضایت‌نامه‌ی قابل‌اعمال برنمی‌گرداند؛ تا وقتی این مقدار
        // از بک‌اند در دسترس نباشد، ارسال نمی‌شود و ثبتِ رضایت‌نامه ممکن است با خطای
        // CONSENT_REQUIRED مواجه شود.
      }),
    onSuccess: () => setSubmitted(true),
    onError: (err) => setSubmitError(err instanceof Error ? err.message : "ثبت نهایی ناموفق بود."),
  });

  function goNext() {
    setCurrentStep((step) => Math.min(step + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPrev() {
    setCurrentStep((step) => Math.max(step - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const signatureStepNumber = hasSignatureStep ? 2 : -1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent">
      <PatientHeader clinicSlug={clinicSlug} />

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 lg:flex-row">
        {/* ============================ MAIN ============================ */}

        <main className="min-w-0 flex-1 space-y-6">
          {/* حالت بارگذاری */}
          {formLoading && (
            <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white p-16 dark:border-white/10 dark:bg-white/[0.04]">
              <Loader2 className="h-6 w-6 animate-spin text-gray-300 dark:text-gray-600" />
            </div>
          )}

          {/* فرم پذیرش فعالی وجود ندارد (۴۰۴) */}
          {!formLoading && formError && (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                فعلاً فرم پذیرش آنلاینی برای این کلینیک فعال نشده است. لطفاً با کلینیک تماس بگیرید.
              </p>
            </div>
          )}

          {/* ثبت نهایی موفق */}
          {!formLoading && !formError && submitted && (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center dark:border-white/10 dark:bg-white/[0.04]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">فرم شما با موفقیت ثبت شد</h2>
              <p className="mt-2 text-xs leading-6 text-gray-400 dark:text-gray-500">
                اطلاعات شما برای کلینیک ارسال شد. می‌توانید این صفحه را ببندید.
              </p>
            </div>
          )}

          {!formLoading && !formError && form && !submitted && (
            <>
              {/* ============================ STEPPER ============================ */}

              <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex min-w-max items-center justify-center gap-3 lg:justify-start">
                  {STEPS.map((step, index) => {
                    const isCompleted = step.number < currentStep;
                    const isActive = step.number === currentStep;

                    return (
                      <div key={step.number} className="flex items-center gap-3">
                        {index > 0 && (
                          <div
                            className={`h-px w-8 transition-colors ${
                              step.number <= currentStep ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
                            }`}
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (isCompleted) {
                              setCurrentStep(step.number);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }
                          }}
                          className="flex flex-col items-center gap-1"
                        >
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                              isCompleted
                                ? "bg-primary text-white"
                                : isActive
                                  ? "bg-primary text-white ring-4 ring-primary/20"
                                  : "border border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-transparent"
                            }`}
                          >
                            {isCompleted ? <Check className="h-4 w-4" /> : step.number}
                          </div>

                          <span
                            className={`whitespace-nowrap text-[11px] transition-colors ${
                              isActive
                                ? "font-medium text-primary"
                                : isCompleted
                                  ? "text-primary"
                                  : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {step.label}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ============================ PAGE TITLE ============================ */}

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-6">
                <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white md:text-xl">
                  <Pencil className="h-4 w-4 text-primary" />
                  {form.title}
                </h1>

                {form.description && (
                  <p className="mt-2 text-xs leading-6 text-gray-400 dark:text-gray-500 md:text-sm">
                    {form.description}
                  </p>
                )}
              </div>

              {/* ============================ STEP 1: DATA FIELDS ============================ */}

              {currentStep === 1 && (
                <FormSection icon={UserRound} title="اطلاعات و سوابق">
                  {visibleDataFields.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500">فیلدی برای تکمیل تعریف نشده است.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {visibleDataFields.map((field) => (
                        <DynamicField
                          key={field.id}
                          field={field}
                          value={answers[field.fieldKey] ?? null}
                          onChange={(v) => setAnswer(field.fieldKey, v)}
                          onFileChange={(file) => handleFileChange(field, file)}
                          uploading={uploadingKey === field.fieldKey}
                        />
                      ))}
                    </div>
                  )}
                </FormSection>
              )}

              {/* ============================ STEP 2: SIGNATURE / CONSENT ============================ */}

              {hasSignatureStep && currentStep === signatureStepNumber && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">رضایت‌نامه و تعهد</span>
                    </div>

                    <p className="mb-4 text-[11px] leading-6 text-gray-400 dark:text-gray-500">
                      اینجانب با آگاهی کامل اعلام می‌کنم که اطلاعات ارائه‌شده صحیح و به‌روز است و رضایت خود را جهت
                      انجام خدمات در کلینیک اعلام می‌دارم.
                    </p>

                    <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-5 text-gray-500 dark:text-gray-400">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(event) => setAgreed(event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 accent-primary"
                      />
                      <span>من ضمن مطالعه کامل، رضایت و تعهد خود را اعلام می‌کنم.</span>
                    </label>
                  </div>

                  {signatureFields.map((field) => (
                    <div
                      key={field.id}
                      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
                    >
                      <SignatureField onChange={(sig) => setAnswer(field.fieldKey, sig || null)} />
                    </div>
                  ))}

                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="mb-3 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">اطلاعات شما امن است</span>
                    </div>
                    <p className="text-xs leading-6 text-gray-400 dark:text-gray-500">
                      کلیه اطلاعات شما مطابق با استانداردهای امنیتی رمزگذاری و محافظت می‌شود.
                    </p>
                  </div>
                </div>
              )}

              {/* ============================ REVIEW STEP ============================ */}

              {currentStep === reviewStepNumber && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <ClipboardCheck className="h-7 w-7 text-primary" />
                  </div>

                  <h2 className="text-base font-bold text-gray-900 dark:text-white">بررسی نهایی اطلاعات</h2>

                  <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-gray-400 dark:text-gray-500">
                    پیش از ثبت نهایی، در صورت نیاز می‌توانید به مرحله قبل بازگردید و اطلاعات را ویرایش کنید.
                  </p>

                  {step1Incomplete && (
                    <p className="mt-3 text-xs font-medium text-danger">
                      برخی فیلدهای الزامی هنوز تکمیل نشده‌اند — لطفاً به مرحله «اطلاعات و سوابق» بازگردید.
                    </p>
                  )}

                  {hasSignatureStep && !agreed && (
                    <p className="mt-1 text-xs font-medium text-danger">هنوز رضایت‌نامه را تأیید نکرده‌اید.</p>
                  )}

                  {submitError && <p className="mt-3 text-xs font-medium text-danger">{submitError}</p>}
                </div>
              )}

              {/* ============================ ACTIONS ============================ */}

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    {currentStep < totalSteps ? (
                      <button
                        type="button"
                        onClick={goNext}
                        disabled={currentStep === 1 && step1Incomplete}
                        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ثبت و ادامه
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => submitMutation.mutate()}
                        disabled={
                          submitMutation.isPending || step1Incomplete || (hasSignatureStep && !agreed)
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {submitMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        ثبت نهایی
                      </button>
                    )}

                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={goPrev}
                        className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.06]"
                      >
                        مرحله قبل
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => saveDraftMutation.mutate()}
                    disabled={saveDraftMutation.isPending}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.06]"
                  >
                    {saveDraftMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    ذخیره موقت
                  </button>
                </div>

                {saveDraftMutation.isSuccess && (
                  <p className="mt-3 text-center text-xs text-primary">تغییرات به‌صورت موقت ذخیره شد.</p>
                )}

                <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-gray-400 dark:text-gray-500">
                  <Lock className="h-3.5 w-3.5" />
                  اطلاعات شما نزد ما امن است و به هیچ عنوان در اختیار شخص ثالث قرار نمی‌گیرد.
                </p>
              </div>
            </>
          )}
        </main>

        {/* ============================ SIDEBAR ============================ */}

        <aside className="hidden w-full shrink-0 space-y-4 rounded-2xl border border-gray-100 bg-white/60 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03] lg:block lg:w-80">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center dark:border-white/10 dark:bg-transparent">
            <Image
              src="/image/rigester.png"
              alt="نمای داشبورد و پنل مدیریت کلینیک"
              width={800}
              height={800}
              unoptimized
              className="mx-auto mb-4 w-full max-w-[230px] rounded-xl object-contain"
            />
            <div className="font-semibold text-gray-900 dark:text-white">تکمیل سریع و امن</div>
            <p className="mt-2 text-xs leading-6 text-gray-400 dark:text-gray-500">
              با تکمیل این فرم، روند ارائه خدمات برای شما سریع‌تر، آسان‌تر و دقیق‌تر خواهد بود.
            </p>
          </div>

          <div className="space-y-2">
            {SIDEBAR_INFO.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 dark:border-white/10 dark:bg-transparent"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-900 dark:text-white">{item.title}</div>
                    <div className="mt-1 text-[11px] leading-5 text-gray-400 dark:text-gray-500">{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-transparent">
            <div className="mb-2 flex items-center gap-2">
              <Headset className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-gray-900 dark:text-white">نیاز به راهنمایی دارید؟</span>
            </div>
            <p className="mb-3 text-[11px] leading-5 text-gray-400 dark:text-gray-500">
              پشتیبانی ما آماده پاسخگویی به سوالات شماست.
            </p>
            <a
              href="tel:02112345678"
              dir="ltr"
              className="block rounded-xl bg-gray-50 py-2.5 text-center text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:bg-white/[0.06] dark:text-gray-200"
            >
              021-12345678
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            HELPER COMPONENTS                               */
/* -------------------------------------------------------------------------- */

function FormSection({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-6">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

const inputClasses =
  "w-full bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-300 dark:text-gray-100 dark:placeholder:text-gray-600";
const fieldWrapClasses =
  "flex min-h-[42px] items-center rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition-colors focus-within:border-primary dark:border-gray-700 dark:bg-transparent";

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-200">
      {label}
      {required && <span className="mr-1 text-danger">*</span>}
    </label>
  );
}

/**
 * رندر یک فیلد از روی تعریف پویای بک‌اند (field_type) — جایگزین رندر
 * hardcoded قبلی. مقادیر multi_select به صورت string[]، yes_no به صورت
 * boolean، و بقیه به صورت string/number در answers ذخیره می‌شوند.
 */
function DynamicField({
  field,
  value,
  onChange,
  onFileChange,
  uploading,
}: {
  field: PublicIntakeField;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  onFileChange: (file: File | null) => void;
  uploading: boolean;
}) {
  const { fieldType, label, isRequired, options } = field;

  if (fieldType === "yes_no") {
    return (
      <div>
        <FieldLabel label={label} required={isRequired} />
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="radio"
              name={field.id}
              checked={value === true}
              onChange={() => onChange(true)}
              className="h-3.5 w-3.5 accent-primary"
            />
            بله
          </label>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="radio"
              name={field.id}
              checked={value === false}
              onChange={() => onChange(false)}
              className="h-3.5 w-3.5 accent-primary"
            />
            خیر
          </label>
        </div>
      </div>
    );
  }

  if (fieldType === "select") {
    return (
      <div>
        <FieldLabel label={label} required={isRequired} />
        <div className={fieldWrapClasses}>
          <select
            className={`${inputClasses} cursor-pointer`}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
          >
            <option value="" disabled>
              انتخاب کنید
            </option>
            {(options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (fieldType === "multi_select") {
    const selected = Array.isArray(value) ? value : [];
    function toggle(opt: string) {
      const next = selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt];
      onChange(next);
    }
    return (
      <div className="sm:col-span-2">
        <FieldLabel label={label} required={isRequired} />
        <div className="flex flex-wrap gap-2">
          {(options ?? []).map((opt) => (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] transition-colors ${
                selected.includes(opt)
                  ? "border-primary bg-primary-light/10 text-primary-dark dark:text-primary-light"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="h-3.5 w-3.5 accent-primary"
              />
              {opt}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (fieldType === "date") {
    return (
      <div>
        <FieldLabel label={label} required={isRequired} />
        <div className={fieldWrapClasses}>
          <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
          <DatePicker
            calendar={persian}
            locale={persian_fa}
            calendarPosition="bottom-right"
            editable={false}
            value={(value as string) || undefined}
            onChange={(date: DateObject | null) => onChange(date ? toLocalIsoDate(date.toDate()) : null)}
            render={(dateValue, openCalendar) => (
              <input
                readOnly
                value={dateValue}
                onClick={openCalendar}
                placeholder="انتخاب تاریخ"
                className={`${inputClasses} mr-2 w-full cursor-pointer`}
              />
            )}
          />
        </div>
      </div>
    );
  }

  if (fieldType === "file") {
    return (
      <div>
        <FieldLabel label={label} required={isRequired} />
        <div className={fieldWrapClasses}>
          <input
            type="file"
            disabled={uploading}
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            className="w-full text-xs text-gray-500 file:ml-2 file:rounded-lg file:border-0 file:bg-primary-light/15 file:px-2.5 file:py-1 file:text-primary-dark dark:text-gray-300 dark:file:text-primary-light"
          />
          {uploading && <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-gray-400" />}
        </div>
        {typeof value === "string" && value && !uploading && (
          <p className="mt-1 text-[10px] text-primary">فایل آپلود شد.</p>
        )}
      </div>
    );
  }

  // text / number (پیش‌فرض)
  return (
    <div>
      <FieldLabel label={label} required={isRequired} />
      <div className={fieldWrapClasses}>
        <input
          type={fieldType === "number" ? "number" : "text"}
          value={(value as string | number) ?? ""}
          onChange={(e) => onChange(fieldType === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)}
          placeholder={label}
          className={inputClasses}
        />
      </div>
    </div>
  );
}
