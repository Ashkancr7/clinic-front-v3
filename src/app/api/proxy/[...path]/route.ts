
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.hessjr.com/api/v1";

async function forward(
  req: NextRequest,
  pathParts: string[]
) {
  const cookieStore = await cookies();

  // توکن کاربر
  const token = cookieStore.get("access_token")?.value;

  // نوع کاربر
  const userType = cookieStore.get("user_type")?.value;

  // کلینیک از طریق slug
  const clinicSlugHeader = req.headers.get("X-Clinic-Slug");

  // برای APIهای قدیمی که clinic id را از header می‌گیرند
  const directClinicIdHeader = req.headers.get(
    "X-Direct-Clinic-Id"
  );

  let clinicId: string | undefined;

  /**
   * =========================================================
   * Direct Clinic ID
   * =========================================================
   *
   * فقط Super Admin اجازه دارد clinic ID دلخواه ارسال کند.
   *
   * این قسمت برای APIهای قدیمی پروژه نگه داشته شده است.
   */
  if (directClinicIdHeader) {
    if (userType !== "super_admin") {
      return NextResponse.json(
        {
          message: "فقط سوپرادمین مجاز است",
        },
        {
          status: 403,
        }
      );
    }

    clinicId = directClinicIdHeader;
  }

  /**
   * =========================================================
   * Clinic Slug
   * =========================================================
   *
   * برای کاربران عادی / کلینیک جاری
   */
  else if (clinicSlugHeader) {
    try {
      const clinicsRaw = cookieStore.get("clinics")?.value;

      const clinics: {
        id: string;
        slug: string;
      }[] = clinicsRaw
        ? JSON.parse(clinicsRaw)
        : [];

      clinicId = clinics.find(
        (clinic) => clinic.slug === clinicSlugHeader
      )?.id;

      if (!clinicId) {
        return NextResponse.json(
          {
            message: "دسترسی به این کلینیک وجود ندارد",
          },
          {
            status: 403,
          }
        );
      }
    } catch {
      return NextResponse.json(
        {
          message: "اطلاعات کلینیک نامعتبر است",
        },
        {
          status: 403,
        }
      );
    }
  }

  /**
   * =========================================================
   * Target URL
   * =========================================================
   */

  const targetUrl =
    `${API_URL}/${pathParts.join("/")}` +
    req.nextUrl.search;

  const method = req.method;

  /**
   * GET / HEAD / DELETE معمولاً body ندارند.
   */
  const hasBody =
    method !== "GET" &&
    method !== "HEAD" &&
    method !== "DELETE";

  /**
   * =========================================================
   * Headers
   * =========================================================
   */

  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),

    /**
     * فقط زمانی ارسال می‌شود که API فعلی
     * به X-Clinic-Id نیاز داشته باشد.
     *
     * endpointهای جدید Super Admin
     * clinicId را از URL می‌گیرند و نیازی به این header ندارند.
     */
    ...(clinicId
      ? {
          "X-Clinic-Id": clinicId,
        }
      : {}),
  };

  /**
   * =========================================================
   * Forward Request
   * =========================================================
   */

  let upstream: Response;

  try {
    upstream = await fetch(targetUrl, {
      method,
      headers,
      body: hasBody ? await req.text() : undefined,
      cache: "no-store",
    });
  } catch (error) {
    console.error(
      "API Proxy Error:",
      error
    );

    return NextResponse.json(
      {
        message: "ارتباط با سرور API برقرار نشد",
      },
      {
        status: 502,
      }
    );
  }

  const data = await upstream.text();

  /**
   * =========================================================
   * Unauthorized
   * =========================================================
   *
   * اگر backend بگوید token نامعتبر یا منقضی شده،
   * session cookies پاک می‌شوند.
   */
  if (upstream.status === 401) {
    const response = new NextResponse(data, {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });

    response.cookies.delete("access_token");
    response.cookies.delete("user_type");
    response.cookies.delete("clinics");

    return response;
  }

  /**
   * =========================================================
   * Response
   * =========================================================
   */

  return new NextResponse(data, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ??
        "application/json",
    },
  });
}

/**
 * GET
 */
export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      path: string[];
    }>;
  }
) {
  return forward(
    req,
    (await params).path
  );
}

/**
 * POST
 */
export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      path: string[];
    }>;
  }
) {
  return forward(
    req,
    (await params).path
  );
}

/**
 * PATCH
 */
export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      path: string[];
    }>;
  }
) {
  return forward(
    req,
    (await params).path
  );
}

/**
 * DELETE
 */
export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      path: string[];
    }>;
  }
) {
  return forward(
    req,
    (await params).path
  );
}

