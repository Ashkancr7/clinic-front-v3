"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Stethoscope, Layers, ListChecks, Plus, Trash2, X } from "lucide-react";

import { getDoctors } from "@/lib/api/appointments";
import {
  getServiceDetail,
  attachDoctorToService,
  detachDoctorFromService,
  createServiceOption,
  updateServiceOption,
  createServiceField,
  updateServiceField,
  type ServiceFieldItem,
} from "@/lib/api/services";
import { queryKeys } from "@/lib/query/keys";

const FIELD_TYPE_LABEL: Record<string, string> = {
  text: "متن",
  number: "عدد",
  select: "انتخابی",
  multi_select: "چندانتخابی",
  date: "تاریخ",
  yes_no: "بله/خیر",
  file: "فایل",
};

export default function ServiceDetailPage({ params }: { params: Promise<{ clinicSlug: string; serviceId: string }> }) {
  const { clinicSlug, serviceId } = use(params);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"doctors" | "options" | "fields">("doctors");
  const [showAddOption, setShowAddOption] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [selectedDoctorToAdd, setSelectedDoctorToAdd] = useState("");

  const { data: service, isLoading, error } = useQuery({
    queryKey: queryKeys.serviceDetail.detail(clinicSlug, serviceId),
    queryFn: () => getServiceDetail(clinicSlug, serviceId),
    enabled: !!clinicSlug && !!serviceId,
  });

  const { data: allDoctors = [] } = useQuery({
    queryKey: queryKeys.appointmentsCalendar.doctors(clinicSlug),
    queryFn: () => getDoctors(clinicSlug),
    enabled: !!clinicSlug,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.serviceDetail.detail(clinicSlug, serviceId) });
  }

  const attachMutation = useMutation({
    mutationFn: (doctorUserId: number) => attachDoctorToService(clinicSlug, serviceId, doctorUserId),
    onSuccess: invalidate,
  });
  const detachMutation = useMutation({
    mutationFn: (doctorUserId: number) => detachDoctorFromService(clinicSlug, serviceId, doctorUserId),
    onSuccess: invalidate,
  });

  const createOptionMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createServiceOption>[2]) => createServiceOption(clinicSlug, serviceId, payload),
    onSuccess: () => {
      invalidate();
      setShowAddOption(false);
    },
  });
  const toggleOptionMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateServiceOption(clinicSlug, id, { is_active: isActive }),
    onSuccess: invalidate,
  });

  const createFieldMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createServiceField>[2]) => createServiceField(clinicSlug, serviceId, payload),
    onSuccess: () => {
      invalidate();
      setShowAddField(false);
    },
  });
  const toggleFieldMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateServiceField(clinicSlug, id, { is_active: isActive }),
    onSuccess: invalidate,
  });

  if (isLoading) return <div className="py-20 text-center text-sm text-gray-400">در حال بارگذاری...</div>;
  if (error || !service) return <div className="py-20 text-center text-sm text-danger">خدمت یافت نشد.</div>;

  const availableDoctorsToAdd = allDoctors.filter((d) => !service.doctors.some((sd) => sd.doctorUserId === d.userId));

  return (
    <div className="space-y-4">
      <Link href={`/clinic/${clinicSlug}/services`} className="flex w-fit items-center gap-1.5 text-sm text-gray-500 hover:text-primary-dark">
        <ArrowRight className="h-4 w-4" /> بازگشت به لیست خدمات
      </Link>

            <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-900">{service.name}</h1>
          {service.categoryName && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
              style={{
                backgroundColor: service.categoryColor ? `${service.categoryColor}20` : "#f3f4f6",
                color: service.categoryColor ?? "#6b7280",
              }}
            >
              {service.categoryName}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400">{service.description ?? "بدون توضیحات"}</p>
      </div>

      <div className="flex gap-2 rounded-2xl border border-gray-100 bg-white p-1.5">
        <TabButton icon={Stethoscope} label="پزشکان مجاز" active={tab === "doctors"} onClick={() => setTab("doctors")} />
        <TabButton icon={Layers} label="زیرخدمات" active={tab === "options"} onClick={() => setTab("options")} />
        <TabButton icon={ListChecks} label="فیلدهای اختصاصی" active={tab === "fields"} onClick={() => setTab("fields")} />
      </div>

      {tab === "doctors" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <select
              value={selectedDoctorToAdd}
              onChange={(e) => setSelectedDoctorToAdd(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
            >
              <option value="">انتخاب پزشک برای افزودن...</option>
              {availableDoctorsToAdd.map((d) => (
                <option key={d.userId} value={d.userId}>
                  {d.fullName}
                </option>
              ))}
            </select>
            <button
              disabled={!selectedDoctorToAdd || attachMutation.isPending}
              onClick={() => {
                attachMutation.mutate(Number(selectedDoctorToAdd));
                setSelectedDoctorToAdd("");
              }}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> افزودن
            </button>
          </div>

          <div className="space-y-2">
            {service.doctors.map((d) => (
              <div key={d.doctorUserId} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 text-sm">
                <span className="text-gray-700">{d.fullName}</span>
                <button
                  onClick={() => detachMutation.mutate(d.doctorUserId)}
                  disabled={detachMutation.isPending}
                  className="rounded-lg border border-red-100 p-1.5 text-danger hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {service.doctors.length === 0 && <p className="py-6 text-center text-xs text-gray-300">هیچ پزشکی به این خدمت متصل نیست.</p>}
          </div>
        </div>
      )}

      {tab === "options" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">زیرخدمات</h3>
            <button
              onClick={() => setShowAddOption(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-dark"
            >
              <Plus className="h-3.5 w-3.5" /> افزودن زیرخدمت
            </button>
          </div>

          <div className="space-y-2">
            {service.optionsList.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 text-sm">
                <div>
                  <div className="font-medium text-gray-800">{o.name}</div>
                  <div className="text-[11px] text-gray-400">
                    {o.defaultDurationMinutes ? `${o.defaultDurationMinutes} دقیقه` : "—"} ·{" "}
                    {o.basePrice != null ? `${o.basePrice.toLocaleString("fa-IR")} تومان` : "—"}
                  </div>
                </div>
                <button
                  onClick={() => toggleOptionMutation.mutate({ id: o.id, isActive: !o.isActive })}
                  disabled={toggleOptionMutation.isPending}
                  className={`rounded-full px-3 py-1 text-[11px] ${o.isActive ? "bg-primary-light/20 text-primary-dark" : "bg-gray-100 text-gray-400"}`}
                >
                  {o.isActive ? "فعال" : "غیرفعال"}
                </button>
              </div>
            ))}
            {service.optionsList.length === 0 && <p className="py-6 text-center text-xs text-gray-300">زیرخدمتی ثبت نشده.</p>}
          </div>
        </div>
      )}

      {tab === "fields" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">فیلدهای اختصاصی</h3>
            <button
              onClick={() => setShowAddField(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-dark"
            >
              <Plus className="h-3.5 w-3.5" /> افزودن فیلد
            </button>
          </div>

          <div className="space-y-2">
            {service.fieldsList.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 text-sm">
                <div>
                  <div className="font-medium text-gray-800">
                    {f.label} {f.isRequired && <span className="text-danger">*</span>}
                  </div>
                  <div className="text-[11px] text-gray-400" dir="ltr">
                    {f.fieldKey} · {FIELD_TYPE_LABEL[f.fieldType] ?? f.fieldType}
                  </div>
                </div>
                <button
                  onClick={() => toggleFieldMutation.mutate({ id: f.id, isActive: !f.isActive })}
                  disabled={toggleFieldMutation.isPending}
                  className={`rounded-full px-3 py-1 text-[11px] ${f.isActive ? "bg-primary-light/20 text-primary-dark" : "bg-gray-100 text-gray-400"}`}
                >
                  {f.isActive ? "فعال" : "غیرفعال"}
                </button>
              </div>
            ))}
            {service.fieldsList.length === 0 && <p className="py-6 text-center text-xs text-gray-300">فیلد اختصاصی ثبت نشده.</p>}
          </div>
        </div>
      )}

      {showAddOption && (
        <AddOptionModal
          onClose={() => setShowAddOption(false)}
          onSubmit={(payload) => createOptionMutation.mutate(payload)}
          isSubmitting={createOptionMutation.isPending}
        />
      )}

      {showAddField && (
        <AddFieldModal
          onClose={() => setShowAddField(false)}
          onSubmit={(payload) => createFieldMutation.mutate(payload)}
          isSubmitting={createFieldMutation.isPending}
        />
      )}
    </div>
  );
}

function TabButton({ icon: Icon, label, active, onClick }: { icon: typeof Stethoscope; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition ${
        active ? "bg-primary-light/15 text-primary-dark" : "text-gray-500 hover:bg-gray-50"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function AddOptionModal({
  onClose,
  onSubmit,
  isSubmitting,
}: {
  onClose: () => void;
  onSubmit: (payload: { name: string; description?: string; default_duration_minutes?: number; base_price?: number }) => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">افزودن زیرخدمت</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-600">نام زیرخدمت</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">توضیحات (اختیاری)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-600">مدت (دقیقه)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">قیمت (تومان)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            انصراف
          </button>
          <button
            disabled={!name || isSubmitting}
            onClick={() =>
              onSubmit({
                name,
                description: description || undefined,
                default_duration_minutes: duration ? Number(duration) : undefined,
                base_price: price ? Number(price) : undefined,
              })
            }
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {isSubmitting ? "در حال ثبت..." : "ثبت"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddFieldModal({
  onClose,
  onSubmit,
  isSubmitting,
}: {
  onClose: () => void;
  onSubmit: (payload: { field_key: string; label: string; field_type: ServiceFieldItem["fieldType"]; is_required?: boolean; options?: string[] }) => void;
  isSubmitting: boolean;
}) {
  const [fieldKey, setFieldKey] = useState("");
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState<ServiceFieldItem["fieldType"]>("text");
  const [isRequired, setIsRequired] = useState(false);
  const [optionsText, setOptionsText] = useState("");

  const needsOptions = fieldType === "select" || fieldType === "multi_select";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">افزودن فیلد اختصاصی</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-600">برچسب فیلد</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="شدت لیزر" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">کلید فیلد (field_key)</label>
            <input value={fieldKey} onChange={(e) => setFieldKey(e.target.value)} dir="ltr" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="laser_intensity" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">نوع فیلد</label>
            <select value={fieldType} onChange={(e) => setFieldType(e.target.value as ServiceFieldItem["fieldType"])} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none">
              {Object.entries(FIELD_TYPE_LABEL).map(([key, lbl]) => (
                <option key={key} value={key}>
                  {lbl}
                </option>
              ))}
            </select>
          </div>
          {needsOptions && (
            <div>
              <label className="mb-1 block text-xs text-gray-600">گزینه‌ها (با ویرگول جدا کنید)</label>
              <input value={optionsText} onChange={(e) => setOptionsText(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="کم، متوسط، زیاد" />
            </div>
          )}
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />
            فیلد اجباری باشد
          </label>
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            انصراف
          </button> 
          <button
            disabled={!label || !fieldKey || isSubmitting}
            onClick={() =>
              onSubmit({
                field_key: fieldKey,
                label,
                field_type: fieldType,
                is_required: isRequired,
                options: needsOptions ? optionsText.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
              })
            }
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {isSubmitting ? "در حال ثبت..." : "ثبت"}
          </button>
        </div>
      </div>
    </div>
  );
}