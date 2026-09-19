
/**
 * تمام کلیدهای React Query باید از این فکتوری ساخته شوند، نه دستی نوشته شوند.
 *
 * دلیل:
 * اگر clinicSlug فراموش شود، ممکن است بعد از سوییچ کلینیک،
 * داده‌ی کلینیک قبلی همچنان از کش نمایش داده شود
 * (باگ جدی حریم خصوصی داده).
 *
 * نکات:
 * - تمام Query Keyهای وابسته به کلینیک باید clinicSlug داشته باشند.
 * - Query Keyهای SuperAdmin بر اساس clinicId هستند.
 * - Query Keyهای عمومی مثل notifications و memberships
 *   عمداً clinicSlug ندارند.
 */

export const queryKeys = {
  // =========================================================
  // Patients
  // =========================================================

  patients: {
    list: (
      clinicSlug: string,
      filters?: Record<string, unknown>
    ) =>
      ["patients", clinicSlug, "list", filters] as const,

    detail: (
      clinicSlug: string,
      patientId: string
    ) =>
      ["patients", clinicSlug, "detail", patientId] as const,

    medicalProfile: (
      clinicSlug: string,
      patientId: string
    ) =>
      ["patients", clinicSlug, "medical-profile", patientId] as const,

    lookup: (
      phone: string
    ) =>
      ["patients", "lookup", phone] as const,
  },



  subscription: {
  current: (
    clinicSlug: string
  ) =>
    [
      "subscription",
      clinicSlug,
      "current",
    ] as const,
},

  // =========================================================
  // Appointments
  // =========================================================

  appointments: {
    list: (
      clinicSlug: string,
      date?: string
    ) =>
      ["appointments", clinicSlug, "list", date] as const,

    detail: (
      clinicSlug: string,
      appointmentId: string
    ) =>
      ["appointments", clinicSlug, "detail", appointmentId] as const,
  },

  // =========================================================
  // Clinics
  // =========================================================

  clinics: {
    myMemberships: () =>
      ["clinics", "my-memberships"] as const,

    detail: (
      clinicSlug: string
    ) =>
      ["clinics", clinicSlug, "detail"] as const,

    services: (
      clinicSlug: string
    ) =>
      ["clinics", clinicSlug, "services"] as const,
  },

  // =========================================================
  // Chat
  // =========================================================

  chat: {
    conversations: (
      clinicSlug: string
    ) =>
      ["chat", clinicSlug, "conversations"] as const,

    conversationDetail: (
      clinicSlug: string,
      conversationId: string
    ) =>
      [
        "chat",
        clinicSlug,
        "conversation-detail",
        conversationId,
      ] as const,

    messages: (
      clinicSlug: string,
      conversationId: string
    ) =>
      [
        "chat",
        clinicSlug,
        "messages",
        conversationId,
      ] as const,

    shares: (
      clinicSlug: string,
      conversationId: string
    ) =>
      [
        "chat",
        clinicSlug,
        "shares",
        conversationId,
      ] as const,
  },

  // =========================================================
  // Files
  // =========================================================

  files: {
    byPatient: (
      clinicSlug: string,
      patientId: string
    ) =>
      [
        "files",
        clinicSlug,
        "by-patient",
        patientId,
      ] as const,

    byVisit: (
      clinicSlug: string,
      visitId: string
    ) =>
      [
        "files",
        clinicSlug,
        "by-visit",
        visitId,
      ] as const,
  },

  // =========================================================
  // Doctor Schedules
  // =========================================================

  doctorSchedules: {
    list: (
      clinicSlug: string,
      doctorUserId?: number
    ) =>
      [
        "doctor-schedules",
        clinicSlug,
        "list",
        doctorUserId ?? "all",
      ] as const,
  },

  // =========================================================
  // Super Admin
  // =========================================================

  superAdmin: {
    clinics: {
      list: () =>
        [
          "super-admin",
          "clinics",
          "list",
        ] as const,

      detail: (
        clinicId: string
      ) =>
        [
          "super-admin",
          "clinics",
          "detail",
          clinicId,
        ] as const,
    },

    plans: {
      list: () =>
        [
          "super-admin",
          "plans",
          "list",
        ] as const,
    },
  },

  // =========================================================
  // Dashboard
  // =========================================================

  dashboard: {
    clinic: (
      clinicSlug: string
    ) =>
      [
        "dashboard",
        clinicSlug,
        "clinic",
      ] as const,

    upcomingAppointments: (
      clinicSlug: string
    ) =>
      [
        "dashboard",
        clinicSlug,
        "upcoming-appointments",
      ] as const,
  },

  // =========================================================
  // Modules
  // =========================================================

  modules: {
    list: (
      clinicSlug: string
    ) =>
      [
        "modules",
        clinicSlug,
        "list",
      ] as const,
  },

  // =========================================================
  // Appointments Calendar
  // =========================================================

  appointmentsCalendar: {
    list: (
      clinicSlug: string,
      date: string,
      doctorId?: number
    ) =>
      [
        "appointments-calendar",
        clinicSlug,
        "list",
        date,
        doctorId,
      ] as const,

    detail: (
      clinicSlug: string,
      appointmentId: string
    ) =>
      [
        "appointments-calendar",
        clinicSlug,
        "detail",
        appointmentId,
      ] as const,

    doctors: (
      clinicSlug: string
    ) =>
      [
        "appointments-calendar",
        clinicSlug,
        "doctors",
      ] as const,

    availability: (
      clinicSlug: string,
      doctorId: number,
      date: string
    ) =>
      [
        "appointments-calendar",
        clinicSlug,
        "availability",
        doctorId,
        date,
      ] as const,
  },

  // =========================================================
  // Services
  // =========================================================

  services: {
    list: (
      clinicSlug: string
    ) =>
      [
        "services",
        clinicSlug,
        "list",
      ] as const,
  },

  // =========================================================
  // Session
  // =========================================================

  session: {
    currentUser: (
      clinicSlug: string
    ) =>
      [
        "session",
        clinicSlug,
        "current-user",
      ] as const,
  },

  // =========================================================
  // Notifications
  // =========================================================

  notifications: {
    unreadCount: () =>
      [
        "notifications",
        "unread-count",
      ] as const,
  },

  notificationsList: {
    all: () =>
      [
        "notifications",
        "list",
      ] as const,
  },

  // =========================================================
  // Patient Portal
  // =========================================================

  patientPortal: {
    dashboard: (
      clinicSlug: string
    ) =>
      [
        "patient-portal",
        clinicSlug,
        "dashboard",
      ] as const,

    appointments: (
      clinicSlug: string
    ) =>
      [
        "patient-portal",
        clinicSlug,
        "appointments",
      ] as const,

    images: (
      clinicSlug: string
    ) =>
      [
        "patient-portal",
        clinicSlug,
        "images",
      ] as const,

    consents: (
      clinicSlug: string
    ) =>
      [
        "patient-portal",
        clinicSlug,
        "consents",
      ] as const,

    clinics: () =>
      [
        "patient-portal",
        "clinics",
      ] as const,

    conversations: (
      clinicSlug: string
    ) =>
      [
        "patient-portal",
        clinicSlug,
        "conversations",
      ] as const,

    invoices: (
      clinicSlug: string
    ) =>
      [
        "patient-portal",
        clinicSlug,
        "invoices",
      ] as const,

    invoiceDetail: (
      clinicSlug: string,
      invoiceId: string
    ) =>
      [
        "patient-portal",
        clinicSlug,
        "invoices",
        invoiceId,
      ] as const,
  },

  // =========================================================
  // Super Admin Reports & Dashboard
  // =========================================================

  superAdminReports: {
    dashboard: () =>
      ["super-admin", "dashboard"] as const,

    dashboardAlerts: (status?: string) =>
      ["super-admin", "dashboard", "alerts", status ?? "all"] as const,

    clinicsReport: (filters?: Record<string, unknown>) =>
      ["super-admin", "reports", "clinics", filters] as const,

    subscriptionsReport: (filters?: Record<string, unknown>) =>
      ["super-admin", "reports", "subscriptions", filters] as const,

    usageReport: (filters?: Record<string, unknown>) =>
      ["super-admin", "reports", "usage", filters] as const,

    revenueReport: (filters?: Record<string, unknown>) =>
      ["super-admin", "reports", "revenue", filters] as const,

    modulesReport: () =>
      ["super-admin", "reports", "modules"] as const,

    smsReport: (filters?: Record<string, unknown>) =>
      ["super-admin", "reports", "sms", filters] as const,

    growthReport: (months?: number) =>
      ["super-admin", "reports", "growth", months ?? 12] as const,

    auditLogs: (filters?: Record<string, unknown>) =>
      ["super-admin", "reports", "audit-logs", filters] as const,
  },

  // =========================================================
  // Super Admin Modules
  // =========================================================

  superAdminModules: {
    list: (
      clinicId: string
    ) =>
      [
        "super-admin",
        "modules",
        clinicId,
      ] as const,
  },

  // =========================================================
  // Reports
  // =========================================================

  reports: {
    services: (
      clinicSlug: string,
      from: string,
      to: string
    ) =>
      [
        "reports",
        clinicSlug,
        "services",
        from,
        to,
      ] as const,

    appointments: (
      clinicSlug: string,
      from: string,
      to: string
    ) =>
      [
        "reports",
        clinicSlug,
        "appointments",
        from,
        to,
      ] as const,

    patients: (
      clinicSlug: string,
      from: string,
      to: string
    ) =>
      [
        "reports",
        clinicSlug,
        "patients",
        from,
        to,
      ] as const,

    doctors: (
      clinicSlug: string,
      from: string,
      to: string
    ) =>
      [
        "reports",
        clinicSlug,
        "doctors",
        from,
        to,
      ] as const,

    returnRate: (
      clinicSlug: string,
      from: string,
      to: string
    ) =>
      [
        "reports",
        clinicSlug,
        "return-rate",
        from,
        to,
      ] as const,

    sms: (
      clinicSlug: string
    ) =>
      [
        "reports",
        clinicSlug,
        "sms",
      ] as const,

    finance: (
      clinicSlug: string
    ) =>
      [
        "reports",
        clinicSlug,
        "finance",
      ] as const,
  },

  // =========================================================
  // Service Detail
  // =========================================================

  serviceDetail: {
    detail: (
      clinicSlug: string,
      serviceId: string
    ) =>
      [
        "service-detail",
        clinicSlug,
        serviceId,
      ] as const,
  },

  // =========================================================
  // Visits
  // =========================================================

  visits: {
    listByPatient: (
      clinicSlug: string,
      patientId: string
    ) =>
      [
        "visits",
        clinicSlug,
        "by-patient",
        patientId,
      ] as const,

    detail: (
      clinicSlug: string,
      visitId: string
    ) =>
      [
        "visits",
        clinicSlug,
        "detail",
        visitId,
      ] as const,
  },

  // =========================================================
  // Staff
  // =========================================================

  staff: {
    list: (
      clinicSlug: string
    ) =>
      [
        "staff",
        clinicSlug,
        "list",
      ] as const,

    assignedDoctors: (
      clinicSlug: string,
      userId: number
    ) =>
      [
        "staff",
        clinicSlug,
        "assigned-doctors",
        userId,
      ] as const,

    myAssignedDoctors: (
      clinicSlug: string
    ) =>
      [
        "staff",
        clinicSlug,
        "my-assigned-doctors",
      ] as const,
  },

  // =========================================================
  // Roles
  // =========================================================

  roles: {
    list: (
      clinicSlug: string
    ) =>
      [
        "roles",
        clinicSlug,
        "list",
      ] as const,
  },

  // =========================================================
  // Finance
  // =========================================================

  finance: {
    invoices: (
      clinicSlug: string,
      status?: string,
      patientId?: string
    ) =>
      [
        "finance",
        clinicSlug,
        "invoices",
        status ?? "all",
        patientId ?? "all",
      ] as const,

    invoiceDetail: (
      clinicSlug: string,
      invoiceId: string
    ) =>
      [
        "finance",
        clinicSlug,
        "invoice-detail",
        invoiceId,
      ] as const,

    payments: (
      clinicSlug: string,
      status?: string
    ) =>
      [
        "finance",
        clinicSlug,
        "payments",
        status ?? "all",
      ] as const,
  },

  // =========================================================
  // SMS Templates
  // =========================================================

  smsTemplates: {
    list: (
      clinicSlug: string
    ) =>
      [
        "sms-templates",
        clinicSlug,
        "list",
      ] as const,

    detail: (
      clinicSlug: string,
      templateId: string
    ) =>
      [
        "sms-templates",
        clinicSlug,
        "detail",
        templateId,
      ] as const,
  },

  // =========================================================
  // SMS Rules
  // =========================================================

  smsRules: {
    list: (
      clinicSlug: string
    ) =>
      [
        "sms-rules",
        clinicSlug,
        "list",
      ] as const,
  },

  // =========================================================
  // SMS Messages
  // =========================================================

  smsMessages: {
    list: (
      clinicSlug: string
    ) =>
      [
        "sms-messages",
        clinicSlug,
        "list",
      ] as const,
  },

  // =========================================================
  // Clinic Settings
  // =========================================================

  clinicSettings: {
    detail: (
      clinicSlug: string
    ) =>
      [
        "clinic-settings",
        clinicSlug,
      ] as const,
  },

  // =========================================================
  // Public Clinic
  // =========================================================

  publicClinic: {
    info: (
      clinicSlug: string
    ) =>
      [
        "public-clinic",
        clinicSlug,
        "info",
      ] as const,

    partnerAds: (
      clinicSlug: string
    ) =>
      [
        "public-clinic",
        clinicSlug,
        "partner-ads",
      ] as const,
  },

  // =========================================================
  // Consents
  // =========================================================

  consents: {
    templates: (
      clinicSlug: string
    ) =>
      [
        "consents",
        clinicSlug,
        "templates",
      ] as const,

    versions: (
      clinicSlug: string,
      templateId: string
    ) =>
      [
        "consents",
        clinicSlug,
        "versions",
        templateId,
      ] as const,

    byPatient: (
      clinicSlug: string,
      patientId: string
    ) =>
      [
        "consents",
        clinicSlug,
        "by-patient",
        patientId,
      ] as const,
  },

  // =========================================================
  // Intake Forms
  // =========================================================

  intakeForms: {
    list: (
      clinicSlug: string
    ) =>
      [
        "intake-forms",
        clinicSlug,
        "list",
      ] as const,
  },

  // =========================================================
  // Intake Submissions
  // =========================================================

  intakeSubmissions: {
    list: (
      clinicSlug: string,
      status?: string
    ) =>
      [
        "intake-submissions",
        clinicSlug,
        "list",
        status ?? "all",
      ] as const,

    detail: (
      clinicSlug: string,
      submissionId: string
    ) =>
      [
        "intake-submissions",
        clinicSlug,
        "detail",
        submissionId,
      ] as const,
  },

  // =========================================================
  // Public Intake
  // =========================================================

  publicIntake: {
    form: (
      clinicSlug: string
    ) =>
      [
        "public-intake",
        clinicSlug,
        "form",
      ] as const,
  },
} as const;


