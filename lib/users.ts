export type ChatUser = {
  id: string;
  label: string;
};

export const CHAT_USERS: ChatUser[] = [
  { id: "user-1", label: "ผู้ใช้สาธิต 1" },
  { id: "user-2", label: "ผู้ใช้สาธิต 2" },
  { id: "user-3", label: "ผู้ใช้สาธิต 3" },
];

export function getChatUser(id?: string | string[] | null): ChatUser | undefined {
  const value = Array.isArray(id) ? id[0] : id;
  return CHAT_USERS.find((user) => user.id === value);
}
