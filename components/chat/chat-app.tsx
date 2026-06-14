"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { nowTime, sleep } from "@/lib/utils";
import Header from "./header";
import Welcome from "./welcome";
import InputBar from "./input-bar";
import Bubble from "@/components/messages/bubble";
import TypingIndicator from "@/components/messages/typing-indicator";
import ChipRow from "@/components/messages/chip-row";
import ActionRow from "@/components/messages/action-row";
import Connecting from "@/components/messages/connecting";
import SystemDivider from "@/components/messages/system-divider";
import IntakeForm from "@/components/intake/intake-form";
import SummaryCard from "@/components/intake/summary-card";
import type { ChipItem } from "@/components/messages/chip-row";
import type { FormSubmitData } from "@/components/intake/intake-form";
import type { SummaryData } from "@/components/intake/summary-card";

const AGENT_NAME = "เจ้าหน้าที่ ณัฐพล";

type ChatAppProps = {
  selectedUser: string;
};

type StoredChatSession = {
  messages: PersistedMessage[];
  mode: "bot" | "agent";
};

// ---- Message type union -------------------------------------
type MsgBase = { id: number };
type TextMsg = MsgBase & { type: "user" | "bot" | "agent"; text: string; time: string };
type TypingMsg = MsgBase & { type: "typing"; who: "bot" | "agent" };
type ChipsMsg = MsgBase & { type: "chips"; items: ChipItem[] };
type ActionsMsg = MsgBase & { type: "actions" };
type ConnectingMsg = MsgBase & { type: "connecting" };
type SystemMsg = MsgBase & { type: "system"; text: string };
type FormMsg = MsgBase & { type: "form" } & ({ locked: false } | { locked: true; data: SummaryData });
export type Message = TextMsg | TypingMsg | ChipsMsg | ActionsMsg | ConnectingMsg | SystemMsg | FormMsg;
type PersistedMessage = Exclude<Message, TypingMsg | ConnectingMsg>;
type MsgInit = Message extends infer M ? M extends { id: number } ? Omit<M, "id"> : never : never;

const isPersistedMessage = (message: Message): message is PersistedMessage =>
  message.type !== "typing" && message.type !== "connecting";

export default function ChatApp({ selectedUser }: ChatAppProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<"bot" | "agent">("bot");
  const [busy, setBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"exit" | "reset" | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const storageKeyRef = useRef(`chat-session:${selectedUser}`);

  useEffect(() => {
    storageKeyRef.current = `chat-session:${selectedUser}`;
    setHydrated(false);
    setMessages([]);
    setMode("bot");
    setBusy(false);
    setConfirmAction(null);
    idRef.current = 1;

    try {
      const raw = window.localStorage.getItem(storageKeyRef.current);
      if (!raw) {
        setHydrated(true);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<StoredChatSession>;
      const savedMessages = Array.isArray(parsed.messages)
        ? parsed.messages.filter(
            (message): message is PersistedMessage => {
              const kind = (message as { type?: string } | null | undefined)?.type;
              return kind !== "typing" && kind !== "connecting";
            }
          )
        : [];
      const savedMode = parsed.mode === "agent" ? "agent" : "bot";

      setMessages(savedMessages as Message[]);
      setMode(savedMode);
      const maxId = savedMessages.reduce((max, message) => Math.max(max, message.id ?? 0), 0);
      idRef.current = maxId + 1;
    } catch {
      window.localStorage.removeItem(storageKeyRef.current);
    } finally {
      setHydrated(true);
    }
  }, [selectedUser]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        storageKeyRef.current,
        JSON.stringify({ messages: messages.filter(isPersistedMessage), mode } satisfies StoredChatSession)
      );
    } catch {
      // Ignore storage quota / privacy failures.
    }
  }, [messages, mode, hydrated]);

  const nid = () => idRef.current++;

  const add = useCallback((m: MsgInit): number => {
    const id = nid();
    setMessages((p) => [...p, { ...m, id } as Message]);
    return id;
  }, []);

  const remove = useCallback((id: number) => {
    setMessages((p) => p.filter((m) => m.id !== id));
  }, []);

  const say = useCallback(
    async (text: string, { who = "bot" as "bot" | "agent", delay = 950 } = {}) => {
      const tid = nid();
      setMessages((p) => [...p, { id: tid, type: "typing", who } as TypingMsg]);
      await sleep(delay);
      setMessages((p) =>
        p
          .filter((m) => m.id !== tid)
          .concat({ id: nid(), type: who, text, time: nowTime() } as TextMsg)
      );
    },
    []
  );

  const userSay = useCallback((text: string) => add({ type: "user", text, time: nowTime() }), [add]);

  // ---- flows -----------------------------------------------
  const runRestructure = useCallback(async () => {
    setBusy(true);
    await say("ยินดีค่ะ การปรับโครงสร้างหนี้ช่วยให้ภาระผ่อนต่อเดือนเบาลง เช่น ลดค่างวด ปิดหนี้เร็วขึ้น หรือรวมหนี้หลายก้อนเป็นก้อนเดียว");
    await say("รบกวนกรอกข้อมูล 3 ขั้นตอนสั้น ๆ เพื่อให้ทีมที่ปรึกษาประเมินแนวทางที่เหมาะกับคุณได้ค่ะ (ใช้เวลาไม่เกิน 1 นาที)", { delay: 1100 });
    add({ type: "form", locked: false });
    setBusy(false);
  }, [say, add]);

  const runProducts = useCallback(async () => {
    setBusy(true);
    await say(
      "ผลิตภัณฑ์สินเชื่อยอดนิยมของกรุงไทยค่ะ:\n\n•  สินเชื่อบ้านกรุงไทย — ดอกเบี้ยพิเศษ ผ่อนนานสูงสุด 40 ปี\n•  สินเชื่อส่วนบุคคล Krungthai Smart Money\n•  สินเชื่อรถยนต์ และรีไฟแนนซ์\n•  กรุงไทยธนวัฏ / บัตรกดเงินสด\n\nสนใจผลิตภัณฑ์ไหนเป็นพิเศษไหมคะ?",
      { delay: 1100 }
    );
    add({
      type: "chips",
      items: [
        { label: "สอบถามสินเชื่อบ้าน", act: "free", text: "ขอข้อมูลสินเชื่อบ้านเพิ่มเติม" },
        { label: "ปรึกษาปรับโครงสร้างหนี้", act: "restructure" },
        { label: "คุยกับเจ้าหน้าที่", act: "agent" },
      ],
    });
    setBusy(false);
  }, [say, add]);

  const runBalance = useCallback(async () => {
    setBusy(true);
    await say("ตรวจสอบยอดและทำรายการได้จากเมนูลัดด้านล่างนี้เลยค่ะ ปลอดภัยด้วยระบบยืนยันตัวตนของเป๋าตัง");
    add({ type: "actions" });
    add({
      type: "chips",
      items: [
        { label: "ปรึกษาปรับโครงสร้างหนี้", act: "restructure" },
        { label: "คุยกับเจ้าหน้าที่", act: "agent" },
      ],
    });
    setBusy(false);
  }, [say, add]);

  const runAgent = useCallback(async () => {
    setBusy(true);
    await say("กำลังเชื่อมต่อท่านกับเจ้าหน้าที่ที่ปรึกษาค่ะ สักครู่นะคะ");
    const cid = add({ type: "connecting" });
    await sleep(2200);
    remove(cid);
    add({ type: "system", text: `${AGENT_NAME} เข้าร่วมการสนทนา` });
    setMode("agent");
    await say(
      `สวัสดีครับ ผม${AGENT_NAME} ทีมที่ปรึกษาสินเชื่อกรุงไทย ยินดีดูแลเรื่องการปรับโครงสร้างหนี้ของคุณครับ มีเรื่องใดให้ช่วยเพิ่มเติมไหมครับ`,
      { who: "agent", delay: 1300 }
    );
    setBusy(false);
  }, [say, add, remove]);

  const runFree = useCallback(
    async (text: string, currentMode: "bot" | "agent") => {
      setBusy(true);
      if (currentMode === "agent") {
        await say("รับทราบครับ เดี๋ยวผมตรวจสอบและดูแลให้นะครับ สักครู่ครับ", {
          who: "agent",
          delay: 1000,
        });
      } else {
        await say(
          `ขอบคุณสำหรับข้อมูลค่ะ ดิฉันบันทึกเรื่อง "${text}" ไว้แล้ว ต้องการให้ช่วยเรื่องใดต่อไหมคะ`,
          { delay: 1000 }
        );
        add({
          type: "chips",
          items: [
            { label: "ปรึกษาปรับโครงสร้างหนี้", act: "restructure" },
            { label: "คุยกับเจ้าหน้าที่", act: "agent" },
          ],
        });
      }
      setBusy(false);
    },
    [say, add]
  );

  const dispatch = useCallback(
    (act: string, payload?: string) => {
      if (act === "restructure") {
        userSay("ปรึกษาปรับโครงสร้างหนี้");
        runRestructure();
      } else if (act === "products") {
        userSay("ผลิตภัณฑ์สินเชื่อกรุงไทย");
        runProducts();
      } else if (act === "balance") {
        userSay("ตรวจสอบยอดและชำระ");
        runBalance();
      } else if (act === "agent") {
        userSay("ขอคุยกับเจ้าหน้าที่");
        runAgent();
      } else if (act === "free") {
        const txt = payload || "";
        userSay(txt);
        runFree(txt, mode);
      }
    },
    [runRestructure, runProducts, runBalance, runAgent, runFree, userSay, mode]
  );

  const onFormSubmit = useCallback(
    async (data: FormSubmitData) => {
      setMessages((p) =>
        p.map((m) =>
          m.type === "form" && !m.locked
            ? ({ ...m, locked: true, data } as FormMsg)
            : m
        )
      );
      setBusy(true);
      await sleep(400);
      const goal = data.values.goal || "";
      await say("ได้รับข้อมูลเรียบร้อยแล้วค่ะ ขอบคุณที่ไว้วางใจกรุงไทย", {
        delay: 900,
      });
      await say(
        `จากเป้าหมาย "${goal || "จัดการหนี้"}" มีแนวทางที่เป็นไปได้ดังนี้ค่ะ:\n\n•  ขยายระยะเวลาผ่อน เพื่อลดยอดผ่อนต่อเดือน\n•  ปรับลดอัตราดอกเบี้ยตามเงื่อนไขที่เข้าเกณฑ์\n•  รวมหนี้หลายบัญชีเป็นก้อนเดียว จัดการง่ายขึ้น`,
        { delay: 1300 }
      );
      await say(
        "ทีมที่ปรึกษาจะตรวจสอบข้อมูลและติดต่อกลับโดยเร็วที่สุดค่ะ ระหว่างนี้จัดการธุรกรรมอื่นได้เลยนะคะ",
        { delay: 1100 }
      );
      add({ type: "actions" });
      add({
        type: "chips",
        items: [
          { label: "คุยกับเจ้าหน้าที่ตอนนี้", act: "agent" },
          { label: "ดูผลิตภัณฑ์สินเชื่อ", act: "products" },
        ],
      });
      setBusy(false);
    },
    [say, add]
  );

  const onSend = useCallback((text: string) => {
    userSay(text);
    if (!busy) runFree(text, mode);
  }, [busy, userSay, runFree, mode]);

  const onChip = useCallback((chipMsgId: number, chip: ChipItem) => {
    remove(chipMsgId);
    dispatch(chip.act, chip.text);
  }, [remove, dispatch]);

  const onAction = useCallback(async (action: { label: string }) => {
    userSay(action.label);
    setBusy(true);
    try {
      await say(`กำลังพาคุณไปยังหน้า "${action.label}" ของเป๋าตังค่ะ (ตัวอย่างการสาธิต)`, {
        delay: 800,
      });
    } finally {
      setBusy(false);
    }
  }, [userSay, say]);

  const reset = useCallback(() => {
    setMessages([]);
    setMode("bot");
    setBusy(false);
    try {
      window.localStorage.removeItem(storageKeyRef.current);
    } catch {
      // Ignore storage failures on reset.
    }
  }, []);

  const goHome = useCallback(() => {
    setConfirmAction("exit");
  }, []);

  const openResetConfirm = useCallback(() => {
    setConfirmAction("reset");
  }, []);

  const confirmActionNow = useCallback(() => {
    if (confirmAction === "exit") {
      setConfirmAction(null);
      router.push("/");
      return;
    }

    if (confirmAction === "reset") {
      setConfirmAction(null);
      reset();
    }
  }, [confirmAction, reset, router]);

  const cancelConfirm = useCallback(() => {
    setConfirmAction(null);
  }, []);

  // ---- render ----------------------------------------------
  const renderMsg = useCallback((m: Message) => {
    switch (m.type) {
      case "user":
      case "bot":
      case "agent":
        return <Bubble key={m.id} kind={m.type} text={m.text} time={m.time} />;
      case "typing":
        return <TypingIndicator key={m.id} who={m.who} />;
      case "chips":
        return (
          <ChipRow
            key={m.id}
            items={m.items}
            onTap={(c) => onChip(m.id, c)}
          />
        );
      case "actions":
        return <ActionRow key={m.id} onAction={onAction} />;
      case "connecting":
        return <Connecting key={m.id} />;
      case "system":
        return <SystemDivider key={m.id} text={m.text} />;
      case "form":
        return m.locked ? (
          <SummaryCard key={m.id} data={m.data} />
        ) : (
          <IntakeForm key={m.id} onSubmit={onFormSubmit} />
        );
      default:
        return null;
    }
  }, [onChip, onAction, onFormSubmit]);

  return (
    <div className="chat-screen">
      <Header
        mode={mode}
        currentUser={selectedUser}
        onBack={goHome}
        onReset={openResetConfirm}
      />
      <div className="chat-scroll" ref={scrollRef}>
        {!hydrated ? null : messages.length === 0 ? (
          <Welcome selectedUser={selectedUser} onPick={(act) => dispatch(act)} />
        ) : (
          <>
            <div className="day-chip">วันนี้</div>
            {messages.map(renderMsg)}
          </>
        )}
      </div>
      <InputBar
        onSend={onSend}
        placeholder={
          mode === "agent" ? "พิมพ์ถึงเจ้าหน้าที่…" : "พิมพ์ข้อความถึงน้องฟิน…"
        }
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
              {confirmAction === "exit" ? "ออกจากหน้าแชต" : "ล้างบทสนทนา"}
            </div>
            <div className="exit-desc" id="exit-desc">
              {confirmAction === "exit"
                ? "ต้องการกลับไปหน้าแรกหรือไม่"
                : "ต้องการล้างข้อความทั้งหมดและเริ่มใหม่หรือไม่"}
            </div>
            <div className="exit-actions">
              <button type="button" className="exit-btn secondary" onClick={cancelConfirm}>
                อยู่ต่อ
              </button>
              <button type="button" className="exit-btn primary" onClick={confirmActionNow}>
                {confirmAction === "exit" ? "กลับหน้าแรก" : "ล้างบทสนทนา"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
