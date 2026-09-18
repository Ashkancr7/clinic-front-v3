"use client";

import { use, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Clock, Plus, X, Loader2, Pencil } from "lucide-react";

import { getDoctors, type DoctorOption } from "@/lib/api/appointments";

import {
  getDoctorSchedules,
  createDoctorSchedule,
  updateDoctorSchedule,
  WEEKDAY_LABELS,
  type DoctorSchedule,
  type Weekday,
} from "@/lib/api/doctor";

import { queryKeys } from "@/lib/query/keys";

const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export default function DoctorSchedulesPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);
  const queryClient = useQueryClient();

  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [addingForWeekday, setAddingForWeekday] = useState<Weekday | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<DoctorSchedule | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: doctors = [], isLoading: doctorsLoading } = useQuery({
    queryKey: queryKeys.appointmentsCalendar.doctors(clinicSlug),
    queryFn: () => getDoctors(clinicSlug),
    enabled: !!clinicSlug,
  });

  const doctorId = selectedDoctorId ?? doctors[0]?.userId ?? null;

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: queryKeys.doctorSchedules.list(clinicSlug, doctorId ?? undefined),
    queryFn: () => getDoctorSchedules(clinicSlug, doctorId!),
    enabled: !!clinicSlug && !!doctorId,
  });

  const byWeekday = useMemo(() => {
    const map = new Map<Weekday, DoctorSchedule[]>();
    WEEKDAYS.forEach((w) => map.set(w, []));
    schedules.forEach((s) => map.get(s.weekday)?.push(s));
    return map;
  }, [schedules]);

  function invalidateSchedules() {
    queryClient.invalidateQueries({ queryKey: queryKeys.doctorSchedules.list(clinicSlug, doctorId ?? undefined) });
  }

  const toggleActiveMutation = useMutation({
    mutationFn: (schedule: DoctorSchedule) =>
      updateDoctorSchedule(clinicSlug, schedule.id, { is_active: !schedule.isActive }),
    onSuccess: () => {
      setActionError(null);
      invalidateSchedules();
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "تغییر وضعیت ناموفق بود"),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <Clock className="h-5 w-5 text-primary-dark dark:text-primary-light" /> برنامه‌ی کاری پزشکان
        </h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          ساعات کاری هفتگی هر پزشک؛ پایه‌ی محاسبه‌ی زمان‌های آزاد نوبت‌دهی
        </p>
      </div>

      {actionError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500 dark:bg-red-500/10 dark:text-red-300">
          {actionError}
        </p>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        {doctorsLoading ? (
          <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</p>
        ) : doctors.length === 0 ? (
          <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">پزشکی ثبت نشده است.</p>
        ) : (
          <>
            <div className="mb-4 max-w-xs">
              <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">پزشک</label>
              <select
                value={doctorId ?? ""}
                onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
              >
                {doctors.map((d: DoctorOption) => (
                  <option key={d.userId} value={d.userId}>
                    {d.fullName}
                  </option>
                ))}
              </select>
            </div>

            {schedulesLoading ? (
              <p className="py-10 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</p>
            ) : (
              <div className="space-y-2">
                {WEEKDAYS.map((w) => (
                  <div
                    key={w}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 p-3 dark:border-gray-800"
                  >
                    <span className="w-20 shrink-0 text-xs font-medium text-gray-700 dark:text-gray-200">
                      {WEEKDAY_LABELS[w]}
                    </span>

                    <div className="flex flex-1 flex-wrap items-center gap-1.5">
                      {(byWeekday.get(w) ?? []).length === 0 && (
                        <span className="text-[11px] text-gray-300 dark:text-gray-600">تعطیل</span>
                      )}

                      {(byWeekday.get(w) ?? []).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setEditingSchedule(s)}
                          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition ${
                            s.isActive
                              ? "border-primary-light/40 bg-primary-light/10 text-primary-dark dark:border-primary/30 dark:bg-primary/10 dark:text-primary-light"
                              : "border-gray-200 bg-gray-50 text-gray-400 line-through dark:border-gray-700 dark:bg-white/5 dark:text-gray-500"
                          }`}
                        >
                          <Pencil className="h-3 w-3" />
                          {s.startTime} تا {s.endTime}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setAddingForWeekday(w)}
                      className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[10px] text-gray-500 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/10"
                    >
                      <Plus className="h-3 w-3" /> افزودن بازه
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {addingForWeekday !== null && doctorId && (
        <ScheduleFormModal
          clinicSlug={clinicSlug}
          doctorUserId={doctorId}
          weekday={addingForWeekday}
          onClose={() => setAddingForWeekday(null)}
          onSaved={() => {
            setAddingForWeekday(null);
            invalidateSchedules();
          }}
        />
      )}

      {editingSchedule && (
        <ScheduleFormModal
          clinicSlug={clinicSlug}
          existingSchedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSaved={() => {
            setEditingSchedule(null);
            invalidateSchedules();
          }}
          onToggleActive={() => toggleActiveMutation.mutate(editingSchedule)}
          isToggling={toggleActiveMutation.isPending}
        />
      )}
    </div>
  );
}

function ScheduleFormModal({
  clinicSlug,
  doctorUserId,
  weekday,
  existingSchedule,
  onClose,
  onSaved,
  onToggleActive,
  isToggling,
}: {
  clinicSlug: string;
  doctorUserId?: number;
  weekday?: Weekday;
  existingSchedule?: DoctorSchedule;
  onClose: () => void;
  onSaved: () => void;
  onToggleActive?: () => void;
  isToggling?: boolean;
}) {
  const isEdit = !!existingSchedule;
  const [startTime, setStartTime] = useState(existingSchedule?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(existingSchedule?.endTime ?? "17:00");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (isEdit) {
        return updateDoctorSchedule(clinicSlug, existingSchedule!.id, { start_time: startTime, end_time: endTime });
      }
      return createDoctorSchedule(clinicSlug, {
        doctor_user_id: doctorUserId!,
        weekday: weekday!,
        start_time: startTime,
        end_time: endTime,
      });
    },
    onSuccess: () => onSaved(),
    onError: (e) => setFormError(e instanceof Error ? e.message : "ذخیره بازه‌ی کاری ناموفق بود"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px] dark:bg-black/60">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#18201e]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {isEdit ? `ویرایش بازه‌ی ${WEEKDAY_LABELS[existingSchedule!.weekday]}` : `بازه‌ی کاری ${WEEKDAY_LABELS[weekday!]}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {formError && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500 dark:bg-red-500/10 dark:text-red-300">
            {formError}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">ساعت شروع</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">ساعت پایان</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
            />
          </div>
        </div>

        {isEdit && onToggleActive && (
          <button
            type="button"
            onClick={onToggleActive}
            disabled={isToggling}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
          >
            {isToggling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {existingSchedule!.isActive ? "غیرفعال کردن این بازه" : "فعال کردن این بازه"}
          </button>
        )}

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
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isPending ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </div>
    </div>
  );
}