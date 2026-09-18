"use client";

import { use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, ArrowRight, Loader2 } from "lucide-react";

import { PatientHeader } from "@/components/layout/PatientHeader";
import Image from "next/image";
import { getPatientConversations, sendPatientMessage } from "@/lib/api/patient-portal";
import { queryKeys } from "@/lib/query/keys";

// پیام محلی برای این سشن (چون هنوز endpoint گرفتن تاریخچه‌ی کامل یک گفتگو تایید نشده)
interface LocalMessage {
  fromMe: boolean;
  text: string;
  time: string;
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ChatPage({ params }: { params: Promise<{ clinicSlug: string }> }) {
  const { clinicSlug } = use(params);
  const queryClient = useQueryClient();

  const [message, setMessage] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: queryKeys.patientPortal.conversations(clinicSlug),
    queryFn: () => getPatientConversations(clinicSlug),
    enabled: !!clinicSlug,
  });

  // فعلاً پرتال بیمار ظاهراً یک گفتگوی واحد با کلینیک دارد (نه به ازای هر پزشک)
  const conversation = conversations[0] ?? null;

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendPatientMessage(clinicSlug, body),
    onSuccess: (sent) => {
      setLocalMessages((prev) => [...prev, { fromMe: true, text: sent.body, time: new Date().toISOString() }]);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: queryKeys.patientPortal.conversations(clinicSlug) });
    },
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  const openThread = () => setMobileView("thread");

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-transparent">
      <PatientHeader clinicSlug={clinicSlug} />

      <div className="mx-auto flex w-full max-w-6xl flex-1 overflow-hidden px-0 py-0 md:px-8 md:py-6">
        <div className="flex w-full overflow-hidden bg-white md:rounded-2xl md:border md:border-gray-100 dark:bg-white/[0.06] dark:md:border-white/10">
          {/* لیست گفتگوها */}
          <div
            className={`w-full shrink-0 border-l border-gray-100 dark:border-white/10 md:flex md:w-80 md:flex-col ${
              mobileView === "list" ? "flex flex-col" : "hidden"
            }`}
          >
            <div className="flex-1 overflow-y-auto">
              {isLoading && <div className="p-4 text-center text-xs text-gray-400">در حال بارگذاری...</div>}

              {!isLoading && conversation && (
                <button
                  onClick={openThread}
                  className="flex w-full items-center gap-3 border-b border-gray-50 bg-primary-light/10 p-4 text-right transition-colors dark:border-white/[0.06] dark:bg-primary-light/10"
                >
                  <Image
                    src="/image/user.PNG"
                    alt="کلینیک"
                    width={44}
                    height={44}
                    unoptimized
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                        پیام به کلینیک
                      </span>
                      <span className="shrink-0 text-[10px] text-gray-300 dark:text-gray-500">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">
                      {conversation.lastMessageBody ?? "گفتگویی شروع کنید"}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-white">
                      {conversation.unreadCount}
                    </span>
                  )}
                </button>
              )}

              {!isLoading && !conversation && (
                <button
                  onClick={openThread}
                  className="flex w-full items-center gap-3 border-b border-gray-50 p-4 text-right transition-colors hover:bg-gray-50 dark:border-white/[0.06] dark:hover:bg-white/[0.04]"
                >
                  <Image
                    src="/image/user.PNG"
                    alt="کلینیک"
                    width={44}
                    height={44}
                    unoptimized
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">پیام به کلینیک</span>
                    <p className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">
                      هنوز گفتگویی شروع نشده. اولین پیام را بفرستید.
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* پنجره گفتگو */}
          <div className={`flex-1 flex-col ${mobileView === "thread" ? "flex" : "hidden"} md:flex`}>
            <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setMobileView("list")}
                  aria-label="بازگشت به گفتگوها"
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-white/[0.06] dark:hover:text-gray-200 md:hidden"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
                <Image
                  src="/image/user.PNG"
                  alt="کلینیک"
                  width={36}
                  height={36}
                  unoptimized
                  className="h-9 w-9 rounded-full object-cover"
                />
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">پیام به کلینیک</div>
                  <div className="text-[11px] text-gray-400 dark:text-gray-500">پزشکان و پذیرش</div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/40 p-4 dark:bg-transparent">
              {conversation?.lastMessageBody && localMessages.length === 0 && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm border border-gray-100 bg-white px-4 py-2.5 text-xs leading-relaxed text-gray-700 shadow-sm dark:border-white/10 dark:bg-white/[0.08] dark:text-gray-200 sm:max-w-md">
                    {conversation.lastMessageBody}
                    <div className="mt-1 text-[9px] text-gray-400 dark:text-gray-500">
                      {formatTime(conversation.lastMessageAt)}
                    </div>
                  </div>
                </div>
              )}

              {localMessages.map((m, index) => (
                <div key={index} className={`flex ${m.fromMe ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm sm:max-w-md ${
                      m.fromMe
                        ? "rounded-bl-sm bg-primary text-white"
                        : "rounded-br-sm border border-gray-100 bg-white text-gray-700 dark:border-white/10 dark:bg-white/[0.08] dark:text-gray-200"
                    }`}
                  >
                    {m.text}
                    <div className={`mt-1 text-[9px] ${m.fromMe ? "text-white/70" : "text-gray-400 dark:text-gray-500"}`}>
                      {formatTime(m.time)}
                    </div>
                  </div>
                </div>
              ))}

              {!conversation?.lastMessageBody && localMessages.length === 0 && (
                <div className="py-10 text-center text-xs text-gray-300 dark:text-gray-500">
                  هنوز پیامی رد و بدل نشده. اولین پیام را بفرستید.
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="flex items-center gap-2 border-t border-gray-100 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03] sm:p-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="پیام خود را بنویسید..."
                className="h-10 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-primary/40 dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-200 dark:placeholder:text-gray-500"
              />
              <button
                onClick={handleSend}
                disabled={sendMutation.isPending || !message.trim()}
                aria-label="ارسال پیام"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-primary-light"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 -scale-x-100" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}