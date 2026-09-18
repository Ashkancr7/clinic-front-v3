# سامانه مدیریت کلینیک — فرانت‌اند

## راه‌اندازی

```bash
npm install
cp .env.example .env.local   # آدرس API بک‌اند رو تنظیم کن
npm run dev
```

پروژه روی `http://localhost:3000` بالا میاد.

## چیزهایی که هنوز باید انجام بشه (TODO های علامت‌گذاری‌شده تو کد)

- [ ] اتصال واقعی `src/lib/auth/session.ts` و `src/lib/auth/clinic-context.ts` به بک‌اند
- [ ] فونت Vazirmatn را در `src/styles/fonts` قرار بده و در `src/app/layout.tsx` با `next/font/local` لود کن
- [ ] پیاده‌سازی صفحه‌ی ورود/OTP واقعی با `react-hook-form`
- [ ] پیاده‌سازی فرم پذیرش مرحله‌ای با چک پرونده‌ی مرکزی بیمار (`lookupPatientByPhone`)
- [ ] تکمیل مودال‌ها در `src/components/modals`
- [ ] اتصال `middleware.ts` به سیستم واقعی session (در حال حاضر placeholder است)

## نکات معماری مهم (قبل از کدزنی حتماً بخون)

1. **هرگز `clinic_id` فعال را در `localStorage` ذخیره نکن.** تنها منبع حقیقت، پارامتر `[clinicSlug]` در URL است.
2. **هر `useQuery` باید `clinicSlug` را در `queryKey` داشته باشد.** از `src/lib/query/keys.ts` استفاده کن.
3. جستجوی بیمار با موبایل (`lookupPatientByPhone`) **سراسری** است و به کلینیک وابسته نیست؛ اما سایر داده‌های بیمار (پرونده پزشکی، نوبت‌ها) **per-clinic** هستند.
# clinic-front-v3
