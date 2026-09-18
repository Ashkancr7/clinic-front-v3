"use client";

import { use, useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Send,
  ArrowRight,
  Loader2,
  Plus,
  X,
  Search,
  UserRound,
  Paperclip,
  Trash2,
  Share2,
  ChevronDown,
  StickyNote,
  Download,
} from "lucide-react";

import {
  getConversations,
  createConversation,
  getConversationDetail,
  updateConversationStatus,
  getConversationShares,
  shareConversation,
  unshareConversation,
  getMessages,
  sendMessage,
  markMessageRead,
  deleteMessage,
  addMessageAttachment,
  type ConversationStatus,
  type MessageVisibility,
} from "@/lib/api/chat";

import { getCurrentClinicUser } from "@/lib/api/session";
import { getStaffMembers } from "@/lib/api/staff";
import { searchPatients, type PatientSearchResult } from "@/lib/api/patients";
import { uploadFile, getFileSignedUrl } from "@/lib/api/files";
import { queryKeys } from "@/lib/query/keys";

const STATUS_LABEL: Record<ConversationStatus, string> = {
  open: "باز",
  closed: "بسته",
  archived: "بایگانی",
};

function formatTime(iso: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ClinicChatPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = use(params);
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [messageText, setMessageText] = useState("");
  const [visibility, setVisibility] = useState<MessageVisibility>("patient_visible");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: currentUser } = useQuery({
    queryKey: queryKeys.session.currentUser(clinicSlug),
    queryFn: () => getCurrentClinicUser(clinicSlug),
    enabled: !!clinicSlug,
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: queryKeys.chat.conversations(clinicSlug),
    queryFn: () => getConversations(clinicSlug),
    enabled: !!clinicSlug,
  });

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const { data: detail } = useQuery({
    queryKey: queryKeys.chat.conversationDetail(clinicSlug, selected?.id ?? ""),
    queryFn: () => getConversationDetail(clinicSlug, selected!.id),
    enabled: !!clinicSlug && !!selected,
  });

  const conversation = detail ?? selected;

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: queryKeys.chat.messages(clinicSlug, conversation?.id ?? ""),
    queryFn: () => getMessages(clinicSlug, conversation!.id),
    enabled: !!clinicSlug && !!conversation,
  });

  const { data: shares = [] } = useQuery({
    queryKey: queryKeys.chat.shares(clinicSlug, conversation?.id ?? ""),
    queryFn: () => getConversationShares(clinicSlug, conversation!.id),
    enabled: !!clinicSlug && !!conversation,
  });

  const { data: staff = [] } = useQuery({
    queryKey: queryKeys.staff.list(clinicSlug),
    queryFn: () => getStaffMembers(clinicSlug),
    enabled: !!clinicSlug && showShareModal,
  });
  const receptionists = staff.filter((s) => s.roleKey === "receptionist");

  function invalidateConversations() {
    queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations(clinicSlug) });
  }
  function invalidateMessages() {
    if (conversation) {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(clinicSlug, conversation.id) });
    }
  }

  // علامت‌گذاری پیام‌های دریافتی‌ی خوانده‌نشده به‌عنوان خوانده‌شده، وقتی گفتگو باز می‌شود
  useEffect(() => {
    if (!currentUser?.userId || messages.length === 0) return;
    messages
      .filter((m) => m.senderUserId !== currentUser.userId && m.status !== "read")
      .forEach((m) => {
        markMessageRead(clinicSlug, m.id).catch(() => {});
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentUser?.userId, clinicSlug]);

  const sendMutation = useMutation({
    mutationFn: () => {
      if (!conversation) throw new Error("گفتگویی انتخاب نشده.");
      return sendMessage(clinicSlug, conversation.id, { body: messageText.trim(), visibility });
    },
    onSuccess: () => {
      setActionError(null);
      setMessageText("");
      invalidateMessages();
      invalidateConversations();
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "ارسال پیام ناموفق بود"),
  });

  const statusMutation = useMutation({
    mutationFn: (status: ConversationStatus) => {
      if (!conversation) throw new Error("گفتگویی انتخاب نشده.");
      return updateConversationStatus(clinicSlug, conversation.id, status);
    },
    onSuccess: () => {
      setActionError(null);
      invalidateConversations();
      if (conversation) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversationDetail(clinicSlug, conversation.id) });
      }
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "تغییر وضعیت ناموفق بود"),
  });

  const shareMutation = useMutation({
    mutationFn: (receptionistUserId: number) => {
      if (!conversation) throw new Error("گفتگویی انتخاب نشده.");
      return shareConversation(clinicSlug, conversation.id, receptionistUserId);
    },
    onSuccess: () => {
      setActionError(null);
      if (conversation) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.shares(clinicSlug, conversation.id) });
      }
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "اشتراک‌گذاری ناموفق بود"),
  });

  const unshareMutation = useMutation({
    mutationFn: (receptionistId: number) => {
      if (!conversation) throw new Error("گفتگویی انتخاب نشده.");
      return unshareConversation(clinicSlug, conversation.id, receptionistId);
    },
    onSuccess: () => {
      setActionError(null);
      if (conversation) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.shares(clinicSlug, conversation.id) });
      }
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "لغو اشتراک ناموفق بود"),
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) => deleteMessage(clinicSlug, messageId),
    onSuccess: () => {
      setActionError(null);
      invalidateMessages();
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "حذف پیام ناموفق بود"),
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendFileMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!conversation) throw new Error("گفتگویی انتخاب نشده.");
      const uploaded = await uploadFile(
        clinicSlug,
        file,
        file.type.startsWith("image/") ? "image" : "document",
        "patient_visible"
      );
      const msg = await sendMessage(clinicSlug, conversation.id, {
        body: uploaded.originalName,
        message_type: uploaded.fileType === "image" ? "image" : "file",
        visibility,
      });
      await addMessageAttachment(clinicSlug, msg.id, uploaded.id);
      return msg;
    },
    onSuccess: () => {
      setActionError(null);
      invalidateMessages();
      invalidateConversations();
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "ارسال فایل ناموفق بود"),
  });

  async function handleDownloadAttachment(fileId: string) {
    try {
      const url = await getFileSignedUrl(clinicSlug, fileId);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else setActionError("لینک دانلود در دسترس نیست.");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "دریافت لینک فایل ناموفق بود");
    }
  }

  const handleSend = () => {
    if (!messageText.trim() || sendMutation.isPending) return;
    sendMutation.mutate();
  };

  const openThread = (id: string) => {
    setSelectedId(id);
    setMobileView("thread");
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex flex-1 overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
        {/* لیست گفتگوها */}
        <div
          className={`w-full shrink-0 border-l border-gray-100 dark:border-gray-800 md:flex md:w-80 md:flex-col ${
            mobileView === "list" ? "flex flex-col" : "hidden"
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 p-3 dark:border-gray-800">
            <h1 className="text-sm font-bold text-gray-800 dark:text-gray-100">گفتگوهای داخلی</h1>
            <button
              type="button"
              onClick={() => setShowNewConversation(true)}
              className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-primary-dark"
            >
              <Plus className="h-3.5 w-3.5" /> جدید
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversationsLoading && (
              <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری...</div>
            )}

            {!conversationsLoading && conversations.length === 0 && (
              <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">
                هنوز گفتگویی ثبت نشده.
              </div>
            )}

            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openThread(c.id)}
                className={`flex w-full items-center gap-3 border-b border-gray-50 p-3.5 text-right transition-colors dark:border-white/[0.06] ${
                  selected?.id === c.id
                    ? "bg-primary-light/10 dark:bg-primary-light/10"
                    : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                      {c.patientName ?? "بیمار"}
                    </span>
                    <span className="shrink-0 text-[10px] text-gray-300 dark:text-gray-500">
                      {formatTime(c.lastMessageAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">
                    {c.lastMessageBody ?? "بدون پیام"}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-white">
                    {c.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* پنجره گفتگو */}
        <div className={`flex-1 flex-col ${mobileView === "thread" ? "flex" : "hidden"} md:flex`}>
          {!conversation ? (
            <div className="flex flex-1 items-center justify-center text-xs text-gray-300 dark:text-gray-600">
              یک گفتگو را انتخاب کنید یا گفتگوی جدید بسازید.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-gray-100 p-3 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setMobileView("list")}
                    className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-white/[0.06] dark:hover:text-gray-200 md:hidden"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500">
                    <UserRound className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {conversation.patientName ?? "بیمار"}
                    </div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500" dir="ltr">
                      {conversation.patientPhone ?? ""}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {currentUser?.roleKey === "doctor" && (
                    <button
                      type="button"
                      onClick={() => setShowShareModal(true)}
                      title="اشتراک‌گذاری با منشی"
                      className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      {shares.length > 0 && (
                        <span className="text-[10px] text-gray-400">({shares.length.toLocaleString("fa-IR")})</span>
                      )}
                    </button>
                  )}

                  <div className="relative">
                    <select
                      value={conversation.status}
                      onChange={(e) => statusMutation.mutate(e.target.value as ConversationStatus)}
                      disabled={statusMutation.isPending}
                      className="appearance-none rounded-lg border border-gray-200 bg-white py-1.5 pl-6 pr-2.5 text-[11px] text-gray-600 outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-300"
                    >
                      {(Object.keys(STATUS_LABEL) as ConversationStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-300" />
                  </div>
                </div>
              </div>

              {actionError && (
                <p className="mx-3 mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500 dark:bg-red-500/10 dark:text-red-300">
                  {actionError}
                </p>
              )}

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/40 p-4 dark:bg-transparent">
                {messagesLoading && (
                  <div className="py-10 text-center text-xs text-gray-300 dark:text-gray-500">
                    در حال بارگذاری پیام‌ها...
                  </div>
                )}

                {!messagesLoading && messages.length === 0 && (
                  <div className="py-10 text-center text-xs text-gray-300 dark:text-gray-500">
                    هنوز پیامی رد و بدل نشده.
                  </div>
                )}

                {messages.map((m) => {
                  const isMine = currentUser?.userId != null && m.senderUserId === currentUser.userId;
                  const isNote = m.visibility === "internal_note";
                  return (
                    <div key={m.id} className={`group flex ${isMine ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm sm:max-w-md ${
                          isNote
                            ? "rounded-bl-sm border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
                            : isMine
                              ? "rounded-bl-sm bg-primary text-white"
                              : "rounded-br-sm border border-gray-100 bg-white text-gray-700 dark:border-white/10 dark:bg-white/[0.08] dark:text-gray-200"
                        }`}
                      >
                        {isNote && (
                          <div className="mb-1 flex items-center gap-1 text-[9px] font-medium opacity-80">
                            <StickyNote className="h-3 w-3" /> یادداشت داخلی
                          </div>
                        )}
                        {!isMine && m.senderName && (
                          <div className="mb-0.5 text-[9px] font-medium text-gray-400 dark:text-gray-500">
                            {m.senderName}
                          </div>
                        )}
                        {m.body}
                        {m.attachments.length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {m.attachments.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => handleDownloadAttachment(a.fileId)}
                                className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] transition ${
                                  isMine && !isNote
                                    ? "bg-white/15 hover:bg-white/25"
                                    : "bg-gray-50 hover:bg-gray-100 dark:bg-white/10 dark:hover:bg-white/20"
                                }`}
                              >
                                <Download className="h-3 w-3" />
                                {a.originalName ?? "پیوست"}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`text-[9px] ${
                              isMine && !isNote ? "text-white/70" : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {formatTime(m.createdAt)}
                          </span>
                          {isMine && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("این پیام حذف شود؟")) deleteMutation.mutate(m.id);
                              }}
                              className="hidden text-[9px] opacity-70 hover:opacity-100 group-hover:inline-flex"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Composer */}
              <div className="border-t border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="mb-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setVisibility("patient_visible")}
                    className={`rounded-full px-2.5 py-1 text-[10px] transition ${
                      visibility === "patient_visible"
                        ? "bg-primary-light/20 text-primary-dark dark:bg-primary/15 dark:text-primary-light"
                        : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                    }`}
                  >
                    قابل مشاهده برای بیمار
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility("internal_note")}
                    className={`rounded-full px-2.5 py-1 text-[10px] transition ${
                      visibility === "internal_note"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                        : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                    }`}
                  >
                    یادداشت داخلی
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) sendFileMutation.mutate(file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sendFileMutation.isPending}
                    title="پیوست فایل"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 disabled:opacity-50 dark:border-white/10 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-300"
                  >
                    {sendFileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="پیام خود را بنویسید..."
                    className="h-10 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-primary/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-200 dark:placeholder:text-gray-500"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sendMutation.isPending || !messageText.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 -scale-x-100" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showNewConversation && (
        <NewConversationModal
          clinicSlug={clinicSlug}
          onClose={() => setShowNewConversation(false)}
          onCreated={(conv) => {
            setShowNewConversation(false);
            openThread(conv.id);
            invalidateConversations();
          }}
        />
      )}

      {showShareModal && conversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px] dark:bg-black/60">
          <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#18201e]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">اشتراک‌گذاری با منشی</h2>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {receptionists.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500">منشی‌ای در این کلینیک ثبت نشده.</p>
            ) : (
              <div className="max-h-64 space-y-1.5 overflow-y-auto">
                {receptionists.map((r) => {
                  const isShared = shares.some((s) => s.userId === r.userId);
                  return (
                    <label
                      key={r.userId}
                      className="flex items-center justify-between rounded-xl border border-gray-100 p-2.5 text-xs dark:border-gray-800"
                    >
                      <span className="text-gray-700 dark:text-gray-200">{r.fullName}</span>
                      <input
                        type="checkbox"
                        checked={isShared}
                        disabled={shareMutation.isPending || unshareMutation.isPending}
                        onChange={() =>
                          isShared ? unshareMutation.mutate(r.userId) : shareMutation.mutate(r.userId)
                        }
                        className="h-3.5 w-3.5 rounded border-gray-300"
                      />
                    </label>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              className="mt-5 w-full rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewConversationModal({
  clinicSlug,
  onClose,
  onCreated,
}: {
  clinicSlug: string;
  onClose: () => void;
  onCreated: (conversation: { id: string }) => void;
}) {
  const [patientQuery, setPatientQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: results = [], isFetching } = useQuery({
    queryKey: [...queryKeys.patients.lookup(patientQuery), clinicSlug],
    queryFn: () => searchPatients(clinicSlug, patientQuery.trim()),
    enabled: patientQuery.trim().length >= 2 && !!clinicSlug,
  });

  const mutation = useMutation({
    mutationFn: () => {
      if (!selectedPatient) throw new Error("لطفاً یک بیمار انتخاب کنید.");
      return createConversation(clinicSlug, selectedPatient.id);
    },
    onSuccess: (conv) => onCreated(conv),
    onError: (e) => setFormError(e instanceof Error ? e.message : "ایجاد گفتگو ناموفق بود"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px] dark:bg-black/60">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#18201e]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">گفتگوی جدید</h2>
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

        <div className="relative">
          <label className="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">بیمار</label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 dark:border-white/10">
            <input
              value={patientQuery}
              onChange={(e) => {
                setPatientQuery(e.target.value);
                setSelectedPatient(null);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="جستجوی نام یا موبایل بیمار..."
              className="w-full bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-300 dark:text-gray-200"
            />
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-300" />
          </div>

          {showResults && !selectedPatient && patientQuery.trim().length >= 2 && (
            <div className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#11151c]">
              {isFetching && (
                <div className="px-3 py-3 text-center text-[11px] text-gray-400 dark:text-gray-500">
                  در حال جستجو...
                </div>
              )}
              {!isFetching && results.length === 0 && (
                <div className="px-3 py-3 text-center text-[11px] text-gray-400 dark:text-gray-500">
                  بیماری با این مشخصات پیدا نشد.
                </div>
              )}
              {!isFetching &&
                results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPatient(p);
                      setPatientQuery(p.fullName);
                      setShowResults(false);
                      setFormError(null);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-right text-xs transition hover:bg-gray-50 dark:hover:bg-white/10"
                  >
                    <span className="font-medium text-gray-700 dark:text-gray-200">{p.fullName}</span>
                    <span className="text-gray-400 dark:text-gray-500" dir="ltr">
                      {p.phone}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

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
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !selectedPatient}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isPending ? "در حال ایجاد..." : "شروع گفتگو"}
          </button>
        </div>
      </div>
    </div>
  );
}