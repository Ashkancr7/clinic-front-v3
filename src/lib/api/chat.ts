import { apiClient } from "./client";

interface LaravelEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === "object") {
    const outer = res as Record<string, unknown>;
    if (Array.isArray(outer.data)) return outer.data as T[];
    if (outer.data && typeof outer.data === "object") {
      const inner = outer.data as Record<string, unknown>;
      if (Array.isArray(inner.data)) return inner.data as T[];
    }
  }
  return [];
}

function unwrapObject<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in (res as Record<string, unknown>)) {
    return (res as { data: unknown }).data as T;
  }
  return res as T;
}

export type ConversationType = "patient_clinic" | "patient_doctor" | "support";
export type ConversationStatus = "open" | "closed" | "archived";
export type MessageType = "text" | "file" | "image" | "system";
export type MessageVisibility = "patient_visible" | "internal_note";
export type MessageStatus = "sent" | "delivered" | "read" | "failed";

export interface Conversation {
  id: string;
  patientId: string;
  patientName: string | null;
  patientPhone: string | null;
  conversationType: ConversationType;
  status: ConversationStatus;
  lastMessageAt: string | null;
  lastMessageBody: string | null;
  unreadCount: number;
}

function mapConversation(c: Record<string, unknown>): Conversation {
  const patient = c.patient as Record<string, unknown> | undefined;
  const lastMessage = c.last_message as Record<string, unknown> | undefined;
  return {
    id: String(c.id ?? ""),
    patientId: String(c.patient_id ?? ""),
    patientName: patient
      ? `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || null
      : null,
    patientPhone: (patient?.phone as string | undefined) ?? null,
    conversationType: (c.conversation_type as ConversationType) ?? "patient_clinic",
    status: (c.status as ConversationStatus) ?? "open",
    lastMessageAt: (c.last_message_at as string | null) ?? null,
    lastMessageBody: (lastMessage?.body as string | undefined) ?? null,
    unreadCount: Number(c.unread_count ?? 0),
  };
}

// --- لیست گفتگوها ---
export async function getConversations(clinicSlug: string): Promise<Conversation[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    "/conversations",
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapConversation);
}

// --- ایجاد گفتگوی جدید با یک بیمار ---
export async function createConversation(
  clinicSlug: string,
  patientId: string,
  conversationType: ConversationType = "patient_clinic"
): Promise<Conversation> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    "/conversations",
    { method: "POST", body: JSON.stringify({ patient_id: patientId, conversation_type: conversationType }), clinicSlug }
  );
  return mapConversation(unwrapObject<Record<string, unknown>>(res));
}

// --- جزئیات گفتگو ---
export async function getConversationDetail(clinicSlug: string, conversationId: string): Promise<Conversation> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/conversations/${conversationId}`,
    { clinicSlug }
  );
  return mapConversation(unwrapObject<Record<string, unknown>>(res));
}

// --- بستن یا آرشیوکردن گفتگو ---
export async function updateConversationStatus(
  clinicSlug: string,
  conversationId: string,
  status: ConversationStatus
): Promise<Conversation> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/conversations/${conversationId}/status`,
    { method: "PATCH", body: JSON.stringify({ status }), clinicSlug }
  );
  return mapConversation(unwrapObject<Record<string, unknown>>(res));
}

// --- اشتراک‌گذاری گفتگو با منشی تخصیص‌یافته (فقط توسط پزشک عضو گفتگو) ---
export async function shareConversation(clinicSlug: string, conversationId: string, receptionistUserId: number) {
  return apiClient(`/conversations/${conversationId}/share`, {
    method: "POST",
    body: JSON.stringify({ receptionist_user_id: receptionistUserId }),
    clinicSlug,
  });
}

// --- لغو اشتراک‌گذاری گفتگو با یک منشی ---
export async function unshareConversation(clinicSlug: string, conversationId: string, receptionistId: number) {
  return apiClient(`/conversations/${conversationId}/share/${receptionistId}`, {
    method: "DELETE",
    clinicSlug,
  });
}

export interface ConversationShare {
  userId: number;
  fullName: string;
}

// --- لیست منشی‌هایی که این گفتگو با آن‌ها به اشتراک گذاشته شده ---
export async function getConversationShares(
  clinicSlug: string,
  conversationId: string
): Promise<ConversationShare[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/conversations/${conversationId}/shares`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map((s) => {
    const user = (s.user as Record<string, unknown> | undefined) ?? s;
    return {
      userId: Number(s.receptionist_user_id ?? user.id ?? 0),
      fullName: (user.full_name as string | undefined) ?? "",
    };
  });
}

export interface MessageAttachment {
  id: string;
  fileId: string;
  originalName: string | null;
  mimeType: string | null;
}

function mapAttachment(a: Record<string, unknown>): MessageAttachment {
  const file = a.file as Record<string, unknown> | undefined;
  return {
    id: String(a.id ?? ""),
    fileId: String(a.file_id ?? ""),
    originalName: (file?.original_name as string | undefined) ?? null,
    mimeType: (file?.mime_type as string | undefined) ?? null,
  };
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderUserId: number;
  senderName: string | null;
  messageType: MessageType;
  visibility: MessageVisibility;
  body: string | null;
  status: MessageStatus;
  createdAt: string;
  attachments: MessageAttachment[];
}

function mapMessage(m: Record<string, unknown>): ChatMessage {
  const sender = m.sender as Record<string, unknown> | undefined;
  const attachmentsRaw = (m.attachments as Record<string, unknown>[]) ?? [];
  return {
    id: String(m.id ?? ""),
    conversationId: String(m.conversation_id ?? ""),
    senderUserId: Number(m.sender_user_id ?? 0),
    senderName: (sender?.full_name as string | undefined) ?? null,
    messageType: (m.message_type as MessageType) ?? "text",
    visibility: (m.visibility as MessageVisibility) ?? "patient_visible",
    body: (m.body as string | null) ?? null,
    status: (m.status as MessageStatus) ?? "sent",
    createdAt: String(m.created_at ?? ""),
    attachments: attachmentsRaw.map(mapAttachment),
  };
}

// --- پیام‌های یک گفتگو ---
export async function getMessages(clinicSlug: string, conversationId: string): Promise<ChatMessage[]> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]>(
    `/conversations/${conversationId}/messages`,
    { clinicSlug }
  );
  return unwrapList<Record<string, unknown>>(res).map(mapMessage);
}

export interface SendMessagePayload {
  body: string;
  message_type?: MessageType;
  visibility?: MessageVisibility;
}

// --- ارسال پیام در گفتگو (متن یا پیوست فایل) ---
export async function sendMessage(
  clinicSlug: string,
  conversationId: string,
  payload: SendMessagePayload
): Promise<ChatMessage> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/conversations/${conversationId}/messages`,
    { method: "POST", body: JSON.stringify(payload), clinicSlug }
  );
  return mapMessage(unwrapObject<Record<string, unknown>>(res));
}

// --- علامت‌گذاری پیام به‌عنوان خوانده‌شده ---
export async function markMessageRead(clinicSlug: string, messageId: string) {
  return apiClient(`/messages/${messageId}/read`, { method: "POST", clinicSlug });
}

// --- افزودن پیوست به پیام موجود ---
export async function addMessageAttachment(
  clinicSlug: string,
  messageId: string,
  fileId: string
): Promise<MessageAttachment> {
  const res = await apiClient<LaravelEnvelope<Record<string, unknown>> | Record<string, unknown>>(
    `/messages/${messageId}/attachments`,
    { method: "POST", body: JSON.stringify({ file_id: fileId }), clinicSlug }
  );
  return mapAttachment(unwrapObject<Record<string, unknown>>(res));
}

// --- حذف نمایشی/آرشیو پیام (هرگز فیزیکی حذف نمی‌شود) ---
export async function deleteMessage(clinicSlug: string, messageId: string) {
  return apiClient(`/messages/${messageId}`, { method: "DELETE", clinicSlug });
}
