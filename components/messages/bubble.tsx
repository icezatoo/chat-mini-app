import BotAvatar from "@/components/bot-avatar";
import AgentAvatar from "@/components/agent-avatar";

interface BubbleProps {
  kind: "bot" | "user" | "agent";
  text: string;
  time: string;
  status?: "sent" | "read";
}

export default function Bubble({ kind, text, time, status }: BubbleProps) {
  const isUser = kind === "user";
  const avatar = kind === "agent" ? <AgentAvatar size={28} /> : <BotAvatar size={28} />;

  return (
    <div className={`row ${isUser ? "user" : ""}`}>
      {!isUser && <div className="avatar-slot">{avatar}</div>}
      <div className="bubble-container">
        <div className={`bubble ${kind}`}>{text}</div>
        <div className="msg-time">
          {isUser && status === "read" && <span className="read-status">อ่านแล้ว</span>}
          {time}
        </div>
      </div>
    </div>
  );
}
