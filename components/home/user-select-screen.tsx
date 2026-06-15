"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ChatUser } from "@/lib/users";
import { fetchChatUsers } from "@/lib/users";

export default function UserSelectScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const list = await fetchChatUsers();
        if (!alive) return;

        setUsers(list);
        setSelectedUser((current) => current || list[0]?.id || "");
      } catch {
        if (!alive) return;
        setError("ไม่สามารถโหลดรายชื่อลูกค้าได้");
        setUsers([]);
        setSelectedUser("");
      } finally {
        if (alive) setLoading(false);
      }
    };

    void load();

    return () => {
      alive = false;
    };
  }, []);

  const selectedLabel = useMemo(
    () => users.find((user) => user.id === selectedUser)?.label ?? "",
    [users, selectedUser]
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
            disabled={loading || !users.length}
          >
            <option value="" disabled>
              {loading ? "กำลังโหลดรายชื่อลูกค้า..." : "เลือกลูกค้า"}
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.label}
              </option>
            ))}
          </select>
        </div>

        <div className="home-preview">
          {error || (selectedLabel ? `เลือกไว้แล้ว: ${selectedLabel}` : "ยังไม่ได้เลือกลูกค้า")}
        </div>

        <button
          type="button"
          className="home-button"
          onClick={onContinue}
          disabled={!selectedUser || loading || !users.length}
        >
          เข้าสู่หน้าแชต
        </button>
      </section>
    </main>
  );
}
