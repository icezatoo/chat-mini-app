"use client";

import { useState } from "react";
import { IcSend } from "@/components/icons";

interface InputBarProps {
  onSend: (text: string) => boolean;
  placeholder?: string;
  disabled?: boolean;
}

export default function InputBar({ onSend, placeholder, disabled }: InputBarProps) {
  const [val, setVal] = useState("");

  const send = () => {
    if (disabled) return;
    const t = val.trim();
    if (!t) return;
    if (onSend(t)) {
      setVal("");
    }
  };

  return (
    <div className="chat-input">
      <div className="input-wrap">
        <input
          value={val}
          placeholder={placeholder ?? "พิมพ์ข้อความ…"}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          disabled={disabled}
        />
      </div>
      <button
        className="send-btn"
        disabled={disabled || !val.trim()}
        onClick={send}
        aria-label="ส่ง"
      >
        <IcSend />
      </button>
    </div>
  );
}
