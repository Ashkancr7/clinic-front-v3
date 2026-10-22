"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarPlus,
  Clock3,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  AlertTriangle,
  MapPin,
  ChevronDown,
  Check,
} from "lucide-react";
import { PatientHeader } from "@/components/layout/PatientHeader";
import { getPatientAppointments, requestPatientAppointment } from "@/lib/api/patient-portal";
import { queryKeys } from "@/lib/query/keys";

import DatePicker from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import Body, { type ExtendedBodyPart } from "react-muscle-highlighter";

const TABS = [
  { key: "upcoming", label: "نوبت‌های آینده" },
  { key: "past", label: "نوبت‌های گذشته" },
  { key: "canceled", label: "لغوشده‌ها" },
] as const;

function formatJalaliDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}
function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

interface KnownService {
  id: string;
  name: string;
}

// پزشکانی که قبلاً برای این بیمار (و این خدمت) نوبت داشته‌اند
interface KnownDoctor {
  id: string;
  name: string;
  serviceId: string;
}

/* ====================================================================
   ناحیه‌ی درمان (نقشه‌ی بدن) — همان منطق و ظاهر صفحه‌ی ثبت نوبت کلینیک
==================================================================== */

type BodyArea = { slug: string; side?: "left" | "right" };

type BodyAreaSelection = { areas: BodyArea[]; fullBody: boolean };

const EMPTY_BODY_SELECTION: BodyAreaSelection = { areas: [], fullBody: false };

const BODY_AREA_FA: Record<string, string> = {
  head: "صورت / سر",
  neck: "گردن",
  chest: "قفسه سینه",
  abs: "شکم",
  obliques: "پهلو",
  biceps: "بازو (جلو)",
  triceps: "بازو (پشت)",
  forearm: "ساعد",
  "front-deltoids": "شانه (جلو)",
  "back-deltoids": "شانه (پشت)",
  trapezius: "پشت گردن",
  "upper-back": "پشت (بالا)",
  "lower-back": "کمر",
  gluteal: "باسن",
  adductor: "ران داخلی",
  quadriceps: "ران (جلو)",
  hamstring: "ران (پشت)",
  abductors: "ران بیرونی",
  calves: "ساق پا",
  knees: "زانو",
  hands: "دست",
  feet: "پا",
};

const BODY_SIDE_FA = { left: "چپ", right: "راست" } as const;

/* قیمت‌ها فعلاً ثابت (نمونه) هستند و بعداً از API گرفته می‌شوند. واحد: تومان */
const UNPAIRED_AREAS = ["head", "neck", "abs"];

const AREA_PRICES: Record<string, number> = {
  head: 1_500_000,
  neck: 800_000,
  chest: 1_200_000,
  abs: 1_000_000,
  obliques: 700_000,
  biceps: 600_000,
  triceps: 600_000,
  forearm: 700_000,
  "front-deltoids": 500_000,
  "back-deltoids": 500_000,
  trapezius: 600_000,
  "upper-back": 1_200_000,
  "lower-back": 1_000_000,
  gluteal: 1_100_000,
  adductor: 700_000,
  quadriceps: 1_300_000,
  hamstring: 1_300_000,
  abductors: 700_000,
  calves: 1_000_000,
  knees: 400_000,
  hands: 400_000,
  feet: 400_000,
};

const DEFAULT_AREA_PRICE = 500_000;
const FULL_BODY_PRICE = 12_000_000;

const ALL_BODY_SLUGS = Object.keys(BODY_AREA_FA);

const bodyAreaLabel = (a: BodyArea) =>
  `${BODY_AREA_FA[a.slug] ?? a.slug}${a.side ? " " + BODY_SIDE_FA[a.side] : ""}`;

const sameBodyArea = (a: BodyArea, b: BodyArea) =>
  a.slug === b.slug && a.side === b.side;

const bodyAreaPrice = (a: BodyArea) => AREA_PRICES[a.slug] ?? DEFAULT_AREA_PRICE;

const formatPrice = (n: number) => `${n.toLocaleString("fa-IR")} تومان`;

// یک ناحیه از دراپ‌دون → آیتم‌های انتخاب (جفت‌ها: چپ و راست)
const zoneToAreas = (slug: string): BodyArea[] =>
  UNPAIRED_AREAS.includes(slug)
    ? [{ slug }]
    : [
        { slug, side: "left" },
        { slug, side: "right" },
      ];

const bodySelectionTotal = (s: BodyAreaSelection) =>
  s.fullBody ? FULL_BODY_PRICE : s.areas.reduce((sum, a) => sum + bodyAreaPrice(a), 0);

const hasBodySelection = (s: BodyAreaSelection) => s.fullBody || s.areas.length > 0;

// متن نواحی + مبلغ تخمینی برای ذخیره در یادداشت نوبت (مثل صفحه‌ی کلینیک)
function buildBodyAreaNotes(s: BodyAreaSelection): string {
  const areasText = s.fullBody
    ? "ناحیه‌ی درمان: فول بادی"
    : s.areas.length
      ? `نواحی درمان: ${s.areas.map(bodyAreaLabel).join("، ")}`
      : "";

  const priceText = areasText ? `مبلغ تخمینی نواحی: ${formatPrice(bodySelectionTotal(s))}` : "";

  return [areasText, priceText].filter(Boolean).join("\n");
}

// آیا خدمتِ انتخاب‌شده به «ناحیه‌ی بدن» نیاز دارد؟ (همان تشخیص صفحه‌ی کلینیک)
const serviceNeedsBodyArea = (name?: string | null) =>
  !!name && /لیزر|مزو|تزریق|بوتاکس|فیلر/.test(name);

function BodyAreaPicker({
  value,
  onChange,
}: {
  value: BodyAreaSelection;
  onChange: (next: BodyAreaSelection) => void;
}) {
  const { areas: bodyAreas, fullBody } = value;

  const [bodyGender, setBodyGender] = useState<"male" | "female">("female");
  const [bodySide, setBodySide] = useState<"front" | "back">("front");
  const [bodyMenuOpen, setBodyMenuOpen] = useState(false);
  const bodyMenuRef = useRef<HTMLDivElement>(null);

  // بستن دراپ‌دون با کلیک بیرون از آن
  useEffect(() => {
    if (!bodyMenuOpen) return;

    const onDown = (e: MouseEvent) => {
      if (!bodyMenuRef.current?.contains(e.target as Node)) {
        setBodyMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [bodyMenuOpen]);

  const setAreas = (areas: BodyArea[]) => onChange({ areas, fullBody });

  // کلیک روی بدن: اگر انتخاب شده بود حذف، وگرنه اضافه (در فول بادی غیرفعال)
  const toggleBodyArea = (part: ExtendedBodyPart, s?: "left" | "right") => {
    if (fullBody) return;

    const area: BodyArea = { slug: String(part.slug), side: s };

    // اگر کل ناحیه (بدون سمت) از دراپ‌دون انتخاب شده بود، کلیک آن را برمی‌دارد
    const whole = bodyAreas.find((a) => a.slug === area.slug && !a.side);
    if (whole && area.side) {
      setAreas(bodyAreas.filter((a) => a !== whole));
      return;
    }

    setAreas(
      bodyAreas.some((a) => sameBodyArea(a, area))
        ? bodyAreas.filter((a) => !sameBodyArea(a, area))
        : [...bodyAreas, area]
    );
  };

  // انتخاب/حذف یک ناحیه از دراپ‌دون
  const toggleZone = (slug: string) => {
    if (fullBody) {
      onChange({ areas: zoneToAreas(slug), fullBody: false });
      return;
    }

    setAreas(
      bodyAreas.some((a) => a.slug === slug)
        ? bodyAreas.filter((a) => a.slug !== slug)
        : [...bodyAreas, ...zoneToAreas(slug)]
    );
  };

  const toggleFullBody = () => onChange({ areas: [], fullBody: !fullBody });

  // داده‌ی هایلایت: آیتم‌های هم‌اسلاگ ادغام می‌شوند تا چپ و راست هر دو رنگ بگیرند
  const bodyData = useMemo(() => {
    if (fullBody) {
      return ALL_BODY_SLUGS.map((slug) => ({
        slug,
        color: "#14b8a6",
        intensity: 1,
      })) as ExtendedBodyPart[];
    }

    const bySlug = new Map<string, Set<string>>();

    bodyAreas.forEach((a) => {
      const sides = bySlug.get(a.slug) ?? new Set<string>();
      sides.add(a.side ?? "both");
      bySlug.set(a.slug, sides);
    });

    return Array.from(bySlug, ([slug, sides]) => {
      const only =
        sides.size === 1 && !sides.has("both")
          ? ([...sides][0] as "left" | "right")
          : undefined;

      return { slug, side: only, color: "#14b8a6", intensity: 1 };
    }) as ExtendedBodyPart[];
  }, [bodyAreas, fullBody]);

  const bodyTotal = bodySelectionTotal(value);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.06]">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-800 dark:text-gray-100">
        <MapPin className="h-4 w-4 text-primary-dark dark:text-primary-light" />
        ناحیه‌ی درمان
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Body */}
        <div className="flex flex-col items-center">
          <div className="mb-2 flex flex-wrap justify-center gap-1">
            {(
              [
                ["female", "زن", bodyGender, setBodyGender],
                ["male", "مرد", bodyGender, setBodyGender],
                ["front", "جلو", bodySide, setBodySide],
                ["back", "پشت", bodySide, setBodySide],
              ] as const
            ).map(([val, label, current, setter]) => (
              <button
                key={val}
                type="button"
                onClick={() => (setter as (v: string) => void)(val)}
                className={`rounded-lg px-3 py-1.5 text-xs transition ${
                  current === val
                    ? "bg-primary-light/20 font-medium text-primary-dark dark:bg-primary-light/10 dark:text-primary-light"
                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <Body
            data={bodyData}
            gender={bodyGender}
            side={bodySide}
            scale={1.3}
            onBodyPartPress={toggleBodyArea}
          />
        </div>

        {/* Dropdown + selected areas */}
        <div className="space-y-3">
          <div className="relative" ref={bodyMenuRef}>
            <button
              type="button"
              onClick={() => setBodyMenuOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-700 transition hover:border-primary/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-200 dark:hover:border-primary-light/30"
            >
              <span>
                {fullBody
                  ? "فول بادی"
                  : bodyAreas.length > 0
                    ? `${new Set(bodyAreas.map((a) => a.slug)).size} ناحیه انتخاب شده`
                    : "انتخاب ناحیه از لیست"}
              </span>

              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  bodyMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {bodyMenuOpen && (
              <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#11151c]">
                <button
                  type="button"
                  onClick={toggleFullBody}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-right text-xs font-semibold transition ${
                    fullBody
                      ? "bg-primary-light/15 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {fullBody && <Check className="h-3.5 w-3.5" />}
                    فول بادی
                  </span>

                  <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500">
                    {formatPrice(FULL_BODY_PRICE)}
                  </span>
                </button>

                <div className="my-1 border-t border-gray-100 dark:border-white/10" />

                {ALL_BODY_SLUGS.map((slug) => {
                  const selected = !fullBody && bodyAreas.some((a) => a.slug === slug);

                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => toggleZone(slug)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-xs transition ${
                        selected
                          ? "bg-primary-light/15 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light"
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/10"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {selected && <Check className="h-3.5 w-3.5" />}
                        {BODY_AREA_FA[slug]}
                      </span>

                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {formatPrice(AREA_PRICES[slug] ?? DEFAULT_AREA_PRICE)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {fullBody
              ? "برای انتخاب ناحیه‌ی خاص، فول بادی را بردارید."
              : "از لیست یا با کلیک روی بدن ناحیه اضافه یا حذف کنید."}
          </p>

          {/* Selected chips */}
          {fullBody ? (
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 rounded-full bg-primary-light/15 px-2.5 py-1 text-[11px] text-primary-dark dark:bg-primary-light/10 dark:text-primary-light">
                فول بادی
                <button
                  type="button"
                  onClick={() => onChange({ areas: [], fullBody: false })}
                  aria-label="حذف فول بادی"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </div>
          ) : bodyAreas.length === 0 ? (
            <p className="text-[11px] text-gray-300 dark:text-gray-600">
              هنوز ناحیه‌ای انتخاب نشده است.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {bodyAreas.map((area) => (
                <span
                  key={`${area.slug}:${area.side ?? "both"}`}
                  className="flex items-center gap-1 rounded-full bg-primary-light/15 px-2.5 py-1 text-[11px] text-primary-dark dark:bg-primary-light/10 dark:text-primary-light"
                >
                  {bodyAreaLabel(area)}

                  <button
                    type="button"
                    onClick={() => setAreas(bodyAreas.filter((a) => !sameBodyArea(a, area)))}
                    aria-label="حذف ناحیه"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Total */}
          {hasBodySelection(value) && (
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-xs dark:bg-white/[0.05]">
              <span className="text-gray-500 dark:text-gray-400">جمع نواحی انتخابی</span>

              <span className="font-semibold text-primary-dark dark:text-primary-light">
                {formatPrice(bodyTotal)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==================================================================== */

function NewAppointmentModal({
  clinicSlug,
  knownServices,
  knownDoctors,
  initialServiceId,
  onClose,
}: {
  clinicSlug: string;
  knownServices: KnownService[];
  knownDoctors: KnownDoctor[];
  initialServiceId?: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
  const [doctorId, setDoctorId] = useState("");
  const [dateValue, setDateValue] = useState<DateObject | null>(null);
  const [notes, setNotes] = useState("");
  const [bodySelection, setBodySelection] = useState<BodyAreaSelection>(EMPTY_BODY_SELECTION);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedService = knownServices.find((s) => s.id === serviceId);
  const needsBodyArea = serviceNeedsBodyArea(selectedService?.name);

  useEffect(() => {
    if (!needsBodyArea) setBodySelection(EMPTY_BODY_SELECTION);
  }, [needsBodyArea]);

  // پزشکانِ قابل انتخاب برای خدمتِ انتخاب‌شده (بدون تکرار)
  const doctorsForService = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of knownDoctors) {
      if (d.serviceId === serviceId && !map.has(d.id)) map.set(d.id, d.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [knownDoctors, serviceId]);

  // با تغییر خدمت، پزشک قبلی دیگر معتبر نیست
  useEffect(() => {
    setDoctorId("");
  }, [serviceId]);

  const selectedDoctor = doctorsForService.find((d) => d.id === doctorId);

  const mutation = useMutation({
    mutationFn: () => {
      // نواحی بدن فعلاً داخل یادداشت نوبت ذخیره می‌شوند (مثل صفحه‌ی کلینیک)
      // پزشک مورد نظر هم در یادداشت می‌آید تا حتی اگر بک‌اند هنوز doctor_user_id را
      // نپذیرد، پذیرش کلینیک ترجیح بیمار را ببیند.
      const finalNotes = [
        selectedDoctor ? `پزشک مورد نظر: ${selectedDoctor.name}` : "",
        needsBodyArea ? buildBodyAreaNotes(bodySelection) : "",
        notes.trim(),
      ]
        .filter(Boolean)
        .join("\n");

      return requestPatientAppointment(clinicSlug, {
        serviceId,
        doctorId: doctorId || undefined,
        startTime: (dateValue as DateObject).toDate().toISOString(),
        notes: finalNotes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patientPortal.appointments(clinicSlug) });
      onClose();
    },
    onError: (err: unknown) => {
      setErrorMsg(err instanceof Error ? err.message : "خطا در ثبت درخواست نوبت");
    },
  });

  const canSubmit = !!serviceId && !!dateValue && !mutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-white p-5 dark:bg-gray-900 ${
          needsBodyArea ? "max-w-3xl" : "max-w-md"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">درخواست نوبت جدید</h3>
          <button onClick={onClose} aria-label="بستن" className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/*
          TODO موقتی: endpoint عمومی /services برای نقش بیمار 403 می‌دهد (فقط staff دسترسی دارد).
          تا وقتی بک‌اند یک endpoint مخصوص پرتال بیمار اضافه کند (مثلاً GET /patient-portal/services)،
          فقط خدماتی که قبلاً برای این بیمار نوبت داشته‌اند قابل انتخابند.
        */}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-gray-500 dark:text-gray-400">خدمت مورد نظر</label>
            {knownServices.length === 0 && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[11px] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  فعلاً لیست خدمات کلینیک برای شما در دسترس نیست. برای درخواست نوبت جدید با پذیرش کلینیک تماس بگیرید.
                </span>
              </div>
            )}
            {knownServices.length > 0 && (
              <>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-primary/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-200"
                >
                  <option value="">انتخاب کنید...</option>
                  {knownServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-gray-400">
                  فقط خدماتی که پیش‌تر برایتان رزرو شده نمایش داده می‌شود.
                </p>
              </>
            )}
          </div>

          {/* پزشک مورد نظر (اختیاری) */}
          {serviceId && doctorsForService.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs text-gray-500 dark:text-gray-400">
                پزشک مورد نظر (اختیاری)
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-primary/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-200"
              >
                <option value="">بدون ترجیح (هر پزشکی)</option>
                {doctorsForService.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-gray-400">
                فقط پزشکانی که پیش‌تر برای این خدمت به شما نوبت داده‌اند نمایش داده می‌شود؛ تایید نهایی با کلینیک است.
              </p>
            </div>
          )}

          {/* ناحیه‌ی درمان (لیزر / مزوتراپی / تزریق) */}
          {needsBodyArea && <BodyAreaPicker value={bodySelection} onChange={setBodySelection} />}

          <div>
            <label className="mb-1.5 block text-xs text-gray-500 dark:text-gray-400">تاریخ و ساعت پیشنهادی</label>
            <DatePicker
              value={dateValue}
              onChange={(val) => setDateValue(val as DateObject)}
              calendar={persian}
              locale={persian_fa}
              format="YYYY/MM/DD HH:mm"
              calendarPosition="bottom-right"
              plugins={[<TimePicker key="time-picker" position="bottom" hideSeconds />]}
              className="patient-appointment-picker"
              containerClassName="w-full"
              inputClass="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-primary/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-200"
              placeholder="تاریخ و ساعت را انتخاب کنید"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-gray-500 dark:text-gray-400">توضیحات (اختیاری)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-primary/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-200"
              placeholder="توضیح مختصری از دلیل مراجعه..."
            />
          </div>

          {errorMsg && <div className="text-xs text-danger">{errorMsg}</div>}

          <button
            disabled={!canSubmit}
            onClick={() => mutation.mutate()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary/90 dark:hover:bg-primary"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            ثبت درخواست
          </button>

          <p className="text-center text-[10px] text-gray-400">
            این یک درخواست است؛ نوبت پس از تایید کلینیک قطعی می‌شود.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsPage({ params }: { params: Promise<{ clinicSlug: string }> }) {
  const { clinicSlug } = use(params);
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get("service") ?? undefined;

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("upcoming");
  const [modalOpen, setModalOpen] = useState(false);

  // دیپ‌لینک از صفحه‌ی «خدمات من»: /appointments?service=<id>&open=1
  useEffect(() => {
    if (searchParams.get("open") === "1") {
      setModalOpen(true);
    }
  }, [searchParams]);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: queryKeys.patientPortal.appointments(clinicSlug),
    queryFn: () => getPatientAppointments(clinicSlug),
    enabled: !!clinicSlug,
  });

  const now = Date.now();
  const upcoming = useMemo(
    () =>
      appointments
        .filter((a) => a.status !== "canceled" && new Date(a.startTime).getTime() >= now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [appointments, now]
  );
  const past = useMemo(
    () =>
      appointments
        .filter((a) => a.status !== "canceled" && new Date(a.startTime).getTime() < now)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [appointments, now]
  );
  const canceled = useMemo(() => appointments.filter((a) => a.status === "canceled"), [appointments]);

  const knownServices = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of appointments) {
      if (a.serviceId && !map.has(a.serviceId)) map.set(a.serviceId, a.serviceName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [appointments]);

  const knownDoctors = useMemo(() => {
    const seen = new Set<string>();
    const list: KnownDoctor[] = [];
    for (const a of appointments) {
      if (!a.doctorId || !a.serviceId || a.doctorName === "-") continue;
      const key = `${a.doctorId}:${a.serviceId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({ id: a.doctorId, name: a.doctorName, serviceId: a.serviceId });
    }
    return list;
  }, [appointments]);

  const typeLabel = (t: string) => (t === "online" ? "آنلاین" : "حضوری");
  const statusLabel: Record<string, string> = {
    pending: "در انتظار تایید",
    confirmed: "تایید شده",
    completed: "انجام‌شده",
    canceled: "لغوشده",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent">
      <PatientHeader clinicSlug={clinicSlug} />
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">نوبت‌های من</h1>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">مدیریت و پیگیری نوبت‌های رزروشده</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark dark:bg-primary/90 dark:hover:bg-primary"
          >
            <CalendarPlus className="h-4 w-4" />
            درخواست نوبت جدید
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white px-4 dark:border-white/10 dark:bg-white/[0.06]">
          <div className="flex min-w-max items-center gap-6 text-sm">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap border-b-2 py-3 transition-colors ${
                  activeTab === tab.key
                    ? "border-primary font-medium text-primary-dark dark:border-primary-light dark:text-primary-light"
                    : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && <div className="py-10 text-center text-xs text-gray-400">در حال بارگذاری...</div>}

        {!isLoading && activeTab === "upcoming" && (
          <div className="space-y-4">
            {upcoming.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.08]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light/20 dark:bg-primary-light/10">
                      <Clock3 className="h-5 w-5 text-primary-dark dark:text-primary-light" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{a.serviceName}</div>
                      <div className="text-xs text-gray-400">{a.doctorName}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatJalaliDate(a.startTime)} - {formatTime(a.startTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] ${
                        a.appointmentType === "online"
                          ? "bg-secondary-blue/40 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
                          : "bg-primary-light/20 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light"
                      }`}
                    >
                      {typeLabel(a.appointmentType)}
                    </span>
                    <span className="rounded-full bg-gray-50 px-3 py-1 text-[11px] text-gray-500 dark:bg-white/10 dark:text-gray-300">
                      {statusLabel[a.status] ?? a.status}
                    </span>
                    <button
                      aria-label="گزینه‌های بیشتر"
                      className="rounded-lg border border-gray-200 p-2 text-gray-400 transition hover:border-primary hover:text-primary dark:border-white/15 dark:hover:border-primary-light dark:hover:text-primary-light"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && (
              <div className="py-10 text-center text-xs text-gray-300 dark:text-gray-500">نوبت آینده‌ای ثبت نشده.</div>
            )}
          </div>
        )}

        {!isLoading && activeTab === "past" && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-white/[0.06]">
            {past.map((a, i) => (
              <div
                key={a.id}
                className={`flex items-center justify-between p-4 ${
                  i !== past.length - 1 ? "border-b border-gray-50 dark:border-white/10" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary-dark dark:text-primary-light" />
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{a.serviceName}</div>
                    <div className="text-xs text-gray-400">
                      {a.doctorName} · {formatJalaliDate(a.startTime)}
                    </div>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] ${
                    a.status === "completed"
                      ? "bg-primary-light/20 text-primary-dark dark:bg-primary-light/10 dark:text-primary-light"
                      : "bg-gray-50 text-gray-500 dark:bg-white/10 dark:text-gray-300"
                  }`}
                >
                  {statusLabel[a.status] ?? a.status}
                </span>
              </div>
            ))}
            {past.length === 0 && (
              <div className="py-10 text-center text-xs text-gray-300 dark:text-gray-500">نوبت گذشته‌ای ثبت نشده.</div>
            )}
          </div>
        )}

        {!isLoading && activeTab === "canceled" && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-white/[0.06]">
            {canceled.map((a, i) => (
              <div
                key={a.id}
                className={`flex items-center justify-between p-4 ${
                  i !== canceled.length - 1 ? "border-b border-gray-50 dark:border-white/10" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <XCircle className="h-4 w-4 text-danger" />
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{a.serviceName}</div>
                    <div className="text-xs text-gray-400">
                      {a.doctorName} · {formatJalaliDate(a.startTime)}
                    </div>
                    {a.cancellationReason && (
                      <div className="mt-1 text-[10px] text-gray-400">دلیل: {a.cancellationReason}</div>
                    )}
                  </div>
                </div>
                <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] text-danger dark:bg-red-500/15 dark:text-red-300">
                  لغوشده
                </span>
              </div>
            ))}
            {canceled.length === 0 && (
              <div className="py-10 text-center text-xs text-gray-300 dark:text-gray-500">نوبت لغوشده‌ای ثبت نشده.</div>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <NewAppointmentModal
          clinicSlug={clinicSlug}
          knownServices={knownServices}
          knownDoctors={knownDoctors}
          initialServiceId={preselectedServiceId}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}