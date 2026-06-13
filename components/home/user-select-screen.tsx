"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CHAT_USERS } from "@/lib/users";

export default function UserSelectScreen() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState(CHAT_USERS[0]?.id ?? "");

  const selectedLabel = useMemo(
    () => CHAT_USERS.find((user) => user.id === selectedUser)?.label ?? "",
    [selectedUser]
  );

  const onContinue = () => {
    if (!selectedUser) return;
    router.push(`/chat?user=${encodeURIComponent(selectedUser)}`);
  };

  return (
    <main className="home-screen">
      <section className="home-card">
        <div className="home-kicker">Paotang Advisor</div>
        <h1 className="home-title">เลือกผู้ใช้ก่อนเข้าแชต</h1>
        <p className="home-sub">
          เลือกโปรไฟล์จากรายการด้านล่างเพื่อเข้าสู่หน้าพูดคุย
          ระบบจะใช้โปรไฟล์ที่เลือกเป็นจุดเริ่มต้นของการสนทนา
        </p>

        <div className="home-field">
          <label className="home-label" htmlFor="user-select">
            ผู้ใช้
          </label>
          <select
            id="user-select"
            className="home-select"
            value={selectedUser}
            onChange={(event) => setSelectedUser(event.target.value)}
          >
            {CHAT_USERS.map((user) => (
              <option key={user.id} value={user.id}>
                {user.label}
              </option>
            ))}
          </select>
        </div>

        <div className="home-preview">เลือกไว้แล้ว: {selectedLabel}</div>

        <button
          type="button"
          className="home-button"
          onClick={onContinue}
          disabled={!selectedUser}
        >
          เข้าสู่หน้าแชต
        </button>
      </section>
    </main>
  );
}
