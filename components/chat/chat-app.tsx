"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { nowTime } from "@/lib/utils";
import {
  buildChatWebSocketUrl,
  clearChatHistory,
  fetchChatHistory,
  getChatServiceBaseUrl,
  normalizeChatMessage,
  type NormalizedChatMessage,
} from "@/lib/chat-service";
import Header from "./header";
import Welcome from "./welcome";
import InputBar from "./input-bar";
import Bubble from "@/components/messages/bubble";
import TypingIndicator from "@/components/messages/typing-indicator";
import ChipRow from "@/components/messages/chip-row";
import ActionRow from "@/components/messages/action-row";
import SystemDivider from "@/components/messages/system-divider";
import IntakeForm from "@/components/intake/intake-form";
import SummaryCard from "@/components/intake/summary-card";
import type { ChipItem } from "@/components/messages/chip-row";
import type { FormSubmitData } from "@/components/intake/intake-form";
import type { SummaryData } from "@/components/intake/summary-card";
import { buildSummaryRows } from "@/lib/debtFlow";

const AGENT_NAME = "เจ้าหน้าที่ ณัฐพล";

type ChatAppProps = {
  selectedUserId: string;
  selectedUserLabel: string;
};

type MsgBase = { id: string };
type TextMsg = MsgBase & { type: "user" | "bot" | "agent"; text: string; time: string };
type TypingMsg = MsgBase & { type: "typing"; who: "bot" | "agent" };
type ChipsMsg = MsgBase & { type: "chips"; items: ChipItem[] };
type ActionsMsg = MsgBase & { type: "actions" };
type SystemMsg = MsgBase & { type: "system"; text: string };
type FormMsg = MsgBase & { type: "form" } & ({ locked: false } | { locked: true; data: SummaryData });
type Message = TextMsg | TypingMsg | ChipsMsg | ActionsMsg | SystemMsg | FormMsg;

type WsPayload = {
  messageId?: string;
  id?: string;
  sessionId?: string;
  senderRole?: string;
  content?: string;
  messageType?: string;
  status?: string;
  createdAt?: string;
  error?: string;
};

const makeId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const formatMessageTime = (value?: string) => {
  if (!value) return nowTime();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return nowTime();
  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const isTypingMsg = (message: Message): message is TypingMsg => message.type === "typing";

const toTextMessage = (message: NormalizedChatMessage): TextMsg => ({
  id: message.id,
  type: message.senderRole === "bot" ? "bot" : message.senderRole === "agent" ? "agent" : "user",
  text: message.content,
  time: formatMessageTime(message.createdAt),
});

const buildFormPrompt = (data: FormSubmitData) => {
  const rows = buildSummaryRows(data.values)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
  return [
    "ขอคำปรึกษาปรับโครงสร้างหนี้",
    rows,
    `รหัสอ้างอิง: ${data.ref}`,
  ]
    .filter(Boolean)
    .join("\n");
};

export default function ChatApp({ selectedUserId, selectedUserLabel }: ChatAppProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<"bot" | "agent">("bot");
  const [busy, setBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"reset" | null>(null);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [connectionState, setConnectionState] = useState<"idle" | "connecting" | "open" | "closed" | "error">("idle");
  const [apiError, setApiError] = useState("");
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingTypingIdRef = useRef<string | null>(null);
  const sendLockRef = useRef(false);

  useEffect(() => {
    setMessages([]);
    setMode("bot");
    setBusy(false);
    setConfirmAction(null);
    setHeaderHidden(false);
    setHistoryLoading(true);
    setConnectionState("idle");
    setApiError("");
    pendingTypingIdRef.current = null;
    sendLockRef.current = false;
    lastScrollTopRef.current = 0;
  }, [selectedUserId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const current = el.scrollTop;
      const previous = lastScrollTopRef.current;
      const delta = current - previous;

      if (current <= 24) {
        setHeaderHidden(false);
      } else if (delta > 8) {
        setHeaderHidden(true);
      } else if (delta < -8) {
        setHeaderHidden(false);
      }

      lastScrollTopRef.current = current;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const abort = new AbortController();

    const loadHistory = async () => {
      setHistoryLoading(true);
      setApiError("");
      try {
        const history = await fetchChatHistory(selectedUserId, selectedUserId, 100, abort.signal);
        if (!alive) return;
        setMessages(history.map(toTextMessage));
      } catch (error) {
        if (!alive) return;
        const message = error instanceof Error ? error.message : "โหลดประวัติการสนทนาไม่สำเร็จ";
        setApiError(message);
      } finally {
        if (alive) setHistoryLoading(false);
      }
    };

    void loadHistory();

    return () => {
      alive = false;
      abort.abort();
    };
  }, [selectedUserId]);

  useEffect(() => {
    if (historyLoading) return;

    const baseUrl = getChatServiceBaseUrl();
    if (!baseUrl) {
      setConnectionState("error");
      setApiError("NEXT_PUBLIC_CHAT_SERVICE_URL ยังไม่ได้ตั้งค่า");
      return;
    }

    const socket = new WebSocket(buildChatWebSocketUrl(selectedUserId, baseUrl));
    wsRef.current = socket;
    setConnectionState("connecting");

    socket.onopen = () => {
      setConnectionState("open");
      setApiError("");
    };

    socket.onerror = () => {
      setConnectionState("error");
      setBusy(false);
      sendLockRef.current = false;
      if (pendingTypingIdRef.current) {
        setMessages((current) => current.filter((message) => message.id !== pendingTypingIdRef.current));
        pendingTypingIdRef.current = null;
      }
      setApiError(`เชื่อมต่อ chat-service ไม่สำเร็จ (${baseUrl})`);
    };

    socket.onclose = () => {
      setConnectionState("closed");
      setBusy(false);
      sendLockRef.current = false;
      if (pendingTypingIdRef.current) {
        setMessages((current) => current.filter((message) => message.id !== pendingTypingIdRef.current));
        pendingTypingIdRef.current = null;
      }
    };

    socket.onmessage = (event) => {
      let payload: WsPayload | null = null;
      try {
        payload = JSON.parse(event.data as string) as WsPayload;
      } catch {
        payload = null;
      }

      if (!payload) return;

      if (payload.error) {
        const errorText = payload.error || "chat-service ส่งข้อผิดพลาดกลับมา";
        setBusy(false);
        sendLockRef.current = false;
        if (pendingTypingIdRef.current) {
          setMessages((current) => current.filter((message) => message.id !== pendingTypingIdRef.current));
          pendingTypingIdRef.current = null;
        }
        setApiError(errorText);
        setMessages((current) => [
          ...current,
          { id: makeId("system"), type: "system", text: errorText },
        ]);
        return;
      }

      const normalized = normalizeChatMessage({
        id: payload.id,
        messageId: payload.messageId,
        sessionId: payload.sessionId,
        senderRole: payload.senderRole,
        content: payload.content,
        messageType: payload.messageType,
        status: payload.status,
        createdAt: payload.createdAt,
      });

      if (normalized.senderRole === "user") {
        setMessages((current) => {
          const next = [...current, toTextMessage(normalized)];
          if (sendLockRef.current && !pendingTypingIdRef.current) {
            const typingId = makeId("typing");
            pendingTypingIdRef.current = typingId;
            next.push({ id: typingId, type: "typing", who: "bot" });
          }
          return next;
        });
        return;
      }

      setMessages((current) => {
        const withoutTyping = pendingTypingIdRef.current
          ? current.filter((message) => message.id !== pendingTypingIdRef.current)
          : current;
        pendingTypingIdRef.current = null;
        sendLockRef.current = false;
        return [...withoutTyping, toTextMessage(normalized)];
      });

      if (normalized.senderRole === "bot" || normalized.senderRole === "agent") {
        setBusy(false);
      }
    };

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [historyLoading, selectedUserId]);

  const sendMessage = useCallback(
    (text: string) => {
      const socket = wsRef.current;

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        setApiError("chat-service ยังไม่พร้อมเชื่อมต่อ");
        return false;
      }
      if (sendLockRef.current) {
        return false;
      }

      sendLockRef.current = true;
      setBusy(true);
      setApiError("");

      try {
        socket.send(
          JSON.stringify({
            sessionId: selectedUserId,
            content: text,
            messageType: "TEXT",
          })
        );
        return true;
      } catch (error) {
        setBusy(false);
        sendLockRef.current = false;
        setApiError(error instanceof Error ? error.message : "ส่งข้อความไม่สำเร็จ");
        return false;
      }
    },
    [selectedUserId]
  );

  const dispatch = useCallback(
    (act: string, payload?: string) => {
      const textByAction: Record<string, string> = {
        restructure: "ปรึกษาปรับโครงสร้างหนี้",
        products: "ผลิตภัณฑ์สินเชื่อกรุงไทย",
        balance: "ตรวจสอบยอดและชำระ",
        agent: "ขอคุยกับเจ้าหน้าที่",
      };

      const text = payload || textByAction[act] || act;
      const sent = sendMessage(text);
      if (act === "agent" && sent) {
        setMode("agent");
      }
      return sent;
    },
    [sendMessage]
  );

  const onFormSubmit = useCallback(
    async (data: FormSubmitData) => {
      const text = buildFormPrompt(data);
      const sent = sendMessage(text);
      if (!sent) return;

      setMessages((current) =>
        current.map((message) =>
          message.type === "form" && !message.locked ? ({ ...message, locked: true, data } as FormMsg) : message
        )
      );
    },
    [sendMessage]
  );

  const onSend = useCallback((text: string) => sendMessage(text), [sendMessage]);

  const onChip = useCallback(
    (chipMsgId: string, chip: ChipItem) => {
      const sent = dispatch(chip.act, chip.text);
      if (sent) {
        setMessages((current) => current.filter((message) => message.id !== chipMsgId));
      }
    },
    [dispatch]
  );

  const onAction = useCallback((action: { label: string }) => dispatch(action.label, action.label), [dispatch]);

  const reset = useCallback(async () => {
    try {
      await clearChatHistory(selectedUserId, selectedUserId);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "ล้างบทสนทนาไม่สำเร็จ");
      return;
    }

    setMessages([]);
    setMode("bot");
    setBusy(false);
    setConfirmAction(null);
    pendingTypingIdRef.current = null;
    sendLockRef.current = false;
  }, [selectedUserId]);

  const goHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const openResetConfirm = useCallback(() => {
    setConfirmAction("reset");
  }, []);

  const confirmActionNow = useCallback(() => {
    if (confirmAction === "reset") {
      void reset();
    }
  }, [confirmAction, reset]);

  const cancelConfirm = useCallback(() => {
    setConfirmAction(null);
  }, []);

  const renderMsg = useCallback(
    (message: Message) => {
      switch (message.type) {
        case "user":
        case "bot":
        case "agent":
          return <Bubble key={message.id} kind={message.type} text={message.text} time={message.time} />;
        case "typing":
          return <TypingIndicator key={message.id} who={message.who} />;
        case "chips":
          return <ChipRow key={message.id} items={message.items} onTap={(chip) => onChip(message.id, chip)} />;
        case "actions":
          return <ActionRow key={message.id} onAction={onAction} />;
        case "system":
          return <SystemDivider key={message.id} text={message.text} />;
        case "form":
          return message.locked ? (
            <SummaryCard key={message.id} data={message.data} />
          ) : (
            <IntakeForm key={message.id} onSubmit={onFormSubmit} />
          );
        default:
          return null;
      }
    },
    [onAction, onChip, onFormSubmit]
  );

  const canSend = connectionState === "open" && !busy;

  return (
    <div className="chat-screen">
      <div className={`chat-headroom ${headerHidden ? "is-hidden" : ""}`}>
        <Header mode={mode} currentUser={selectedUserLabel} onBack={goHome} onReset={openResetConfirm} />
      </div>
      <div className="chat-scroll" ref={scrollRef}>
        {apiError ? <div className="chat-banner chat-banner-error">{apiError}</div> : null}
        {!historyLoading && messages.length === 0 ? (
          <Welcome selectedUser={selectedUserLabel} onPick={(act) => dispatch(act)} />
        ) : historyLoading ? (
          <div className="chat-loading">กำลังโหลดประวัติการสนทนา…</div>
        ) : (
          <>
            <div className="day-chip">วันนี้</div>
            {messages.map(renderMsg)}
          </>
        )}
      </div>
        <InputBar
          onSend={onSend}
          placeholder={mode === "agent" ? "พิมพ์ถึงเจ้าหน้าที่…" : "พิมพ์ข้อความถึงน้องฟิน…"}
        disabled={!canSend}
        />
      {confirmAction ? (
        <div className="exit-backdrop" role="presentation" onClick={cancelConfirm}>
          <div
            className="exit-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-title"
            aria-describedby="exit-desc"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="exit-title" id="exit-title">
              ล้างบทสนทนา
            </div>
            <div className="exit-desc" id="exit-desc">
              ต้องการล้างข้อความทั้งหมดและเริ่มใหม่หรือไม่
            </div>
            <div className="exit-actions">
              <button type="button" className="exit-btn secondary" onClick={cancelConfirm}>
                อยู่ต่อ
              </button>
              <button type="button" className="exit-btn primary" onClick={() => void confirmActionNow()}>
                ล้างบทสนทนา
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
