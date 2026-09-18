
const PROXY_BASE = "/api/proxy";

interface RequestOptions extends RequestInit {
  /**
   * برای APIهایی که بر اساس slug کلینیک کار می‌کنند.
   */
  clinicSlug?: string;

  /**
   * فقط برای APIهای قدیمی که نیاز دارند
   * clinic ID از طریق header ارسال شود.
   *
   * APIهای جدید Super Admin مثل:
   *
   * /super-admin/clinics/{clinic}/modules
   *
   * نیازی به این گزینه ندارند.
   */
  directClinicId?: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(
    message: string,
    status: number,
    code?: string
  ) {
    super(message);

    this.status = status;
    this.code = code;
    this.name = "ApiError";
  }
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    clinicSlug,
    directClinicId,
    headers,
    ...rest
  } = options;

  /**
   * =========================================================
   * Request Headers
   * =========================================================
   */

  /**
   * اگر body از نوع FormData باشد، نباید Content-Type را
   * دستی تنظیم کنیم.
   *
   * مرورگر خودش Content-Type مناسب را به همراه
   * multipart boundary ایجاد می‌کند.
   */
  const isFormData =
    typeof FormData !== "undefined" &&
    rest.body instanceof FormData;

  const requestHeaders: HeadersInit = {
    /**
     * پاسخ API را JSON می‌خواهیم.
     */
    Accept: "application/json",

    /**
     * برای درخواست‌های معمولی JSON،
     * Content-Type را مشخص می‌کنیم.
     *
     * برای FormData این header حذف می‌شود تا
     * مرورگر boundary صحیح را خودش ایجاد کند.
     */
    ...(isFormData
      ? {}
      : {
          "Content-Type": "application/json",
        }),

    /**
     * Header مربوط به clinic slug
     */
    ...(clinicSlug
      ? {
          "X-Clinic-Slug": clinicSlug,
        }
      : {}),

    /**
     * فقط برای APIهای قدیمی که نیاز به Clinic ID دارند.
     *
     * Endpointهای جدید Super Admin مثل:
     *
     * /super-admin/clinics/{clinic}/modules
     *
     * نباید از این گزینه استفاده کنند.
     */
    ...(directClinicId
      ? {
          "X-Direct-Clinic-Id": directClinicId,
        }
      : {}),

    /**
     * اجازه می‌دهیم caller بتواند headerهای اضافی
     * خودش را نیز ارسال کند.
     *
     * این مورد عمداً در انتها قرار گرفته تا در صورت نیاز
     * caller بتواند headerهای پیش‌فرض را override کند.
     */
    ...(headers ?? {}),
  };

  /**
   * =========================================================
   * Request
   * =========================================================
   */

  const res = await fetch(
    `${PROXY_BASE}${path}`,
    {
      ...rest,
      headers: requestHeaders,
      credentials: "include",
    }
  );

  /**
   * =========================================================
   * Response Body
   * =========================================================
   */

  /**
   * بعضی endpointها ممکن است body نداشته باشند،
   * بنابراین اگر JSON نبود، null دریافت می‌کنیم.
   */
  const body = await res
    .json()
    .catch(() => null);

  /**
   * =========================================================
   * Error Handling
   * =========================================================
   */

  if (!res.ok) {
    /**
     * Backend جدید:
     *
     * {
     *   success: false,
     *   error: {
     *     code: "SOME_ERROR",
     *     message: "..."
     *   }
     * }
     *
     * Backend قدیمی:
     *
     * {
     *   message: "..."
     * }
     */

    const message: string | undefined =
      body?.error?.message ??
      body?.message;

    const code: string | undefined =
      body?.error?.code;

    /**
     * خطاهای احراز هویت و دسترسی معمولاً
     * خطاهای مورد انتظار هستند.
     *
     * مثل:
     * 401 → کاربر احراز هویت نشده
     * 403 → کاربر مجوز لازم را ندارد
     *
     * بنابراین به‌جای console.error از console.warn
     * استفاده می‌کنیم تا در کنسول به شکل خطای غیرمنتظره
     * نمایش داده نشوند.
     */
    const logger =
      res.status === 401 || res.status === 403
        ? console.warn
        : console.error;

    logger(
      `API error [${res.status}]${
        code ? ` (${code})` : ""
      } ${path}:`,
      JSON.stringify(
        body,
        null,
        2
      )
    );

    /**
     * ApiError علاوه بر message و status،
     * کد خطای Backend را نیز در اختیار caller قرار می‌دهد.
     */
    throw new ApiError(
      message ??
        `خطای درخواست: ${res.status}`,
      res.status,
      code
    );
  }

  /**
   * =========================================================
   * Success
   * =========================================================
   */

  return body as T;
}

