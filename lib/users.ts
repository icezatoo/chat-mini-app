export type ChatUser = {
  id: string;
  label: string;
};

const DEFAULT_CHAT_USERS: ChatUser[] = [
  { id: "anonymous", label: "Anonymous" },
  { id: "alice", label: "Alice" },
  { id: "bob", label: "Bob" },
  { id: "charlie", label: "Charlie" },
  { id: "david", label: "David" },
  { id: "eva", label: "Eva" },
  { id: "frank", label: "Frank" },
  { id: "grace", label: "Grace" },
  { id: "helen", label: "Helen" },
  { id: "ivan", label: "Ivan" },
];

type CustomerRecord = {
  id?: string;
  customerId?: string;
  userId?: string;
  name?: string;
  fullName?: string;
  displayName?: string;
  label?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

const toText = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
};

const pickLabel = (item: CustomerRecord): string => {
  return (
    toText(item.displayName) ||
    toText(item.fullName) ||
    toText(item.name) ||
    [toText(item.firstName), toText(item.lastName)].filter(Boolean).join(" ") ||
    toText(item.email) ||
    "ไม่ระบุชื่อ"
  );
};

const pickId = (item: CustomerRecord, index: number): string => {
  const id =
    toText(item.id) ||
    toText(item.customerId) ||
    toText(item.userId) ||
    toText(item.email);
  return id || `customer-${index + 1}`;
};

const normalizeCustomerList = (input: unknown): ChatUser[] => {
  const list =
    Array.isArray(input)
      ? input
      : Array.isArray((input as { customers?: unknown[] } | null)?.customers)
        ? (input as { customers: unknown[] }).customers
        : Array.isArray((input as { data?: unknown[] } | null)?.data)
          ? (input as { data: unknown[] }).data
          : [];

  return list.map((item, index) => {
    const record = (item && typeof item === "object" ? item : {}) as CustomerRecord;
    return {
      id: pickId(record, index),
      label: pickLabel(record),
    };
  });
};

export async function fetchChatUsers(baseUrl?: string): Promise<ChatUser[]> {
  const base = (baseUrl ?? process.env.NEXT_PUBLIC_CHAT_SERVICE_URL ?? "").trim();
  if (!base) {
    return DEFAULT_CHAT_USERS;
  }

  try {
    const url = new URL("/customers", base).toString();
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      return DEFAULT_CHAT_USERS;
    }

    const users = normalizeCustomerList(await response.json());
    return users.length > 0 ? users : DEFAULT_CHAT_USERS;
  } catch {
    return DEFAULT_CHAT_USERS;
  }
}

export function getChatUser(users: ChatUser[], id?: string | string[] | null): ChatUser | undefined {
  const value = Array.isArray(id) ? id[0] : id;
  return users.find((user) => user.id === value) ?? users[0];
}
