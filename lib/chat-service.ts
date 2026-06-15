type ChatServiceRecord = {
  id?: string;
  messageId?: string;
  sessionId?: string;
  senderRole?: string;
  content?: string;
  messageType?: string;
  status?: string;
  createdAt?: string;
  metadata?: unknown;
  error?: string;
};

export type NormalizedChatMessage = {
  id: string;
  sessionId: string;
  senderRole: "user" | "bot" | "agent";
  content: string;
  messageType: string;
  status: string;
  createdAt: string;
  metadata?: unknown;
};

type HistoryPayload = {
  messages?: unknown;
  nextCursor?: string;
  hasMore?: boolean;
};

export function getChatServiceBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_CHAT_SERVICE_URL ?? "").trim();
}

export function buildChatServiceUrl(pathname: string, baseUrl = getChatServiceBaseUrl()): string {
  const url = new URL(pathname, baseUrl);
  return url.toString();
}

export function buildChatWebSocketUrl(token = "", baseUrl = getChatServiceBaseUrl()): string {
  const url = new URL("/ws", baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  if (token.trim()) {
    url.searchParams.set("token", token.trim());
  }
  return url.toString();
}

export function normalizeChatMessage(record: ChatServiceRecord): NormalizedChatMessage {
  const senderRole = String(record.senderRole ?? "").toUpperCase();
  const kind = senderRole === "BOT" ? "bot" : senderRole === "AGENT" ? "agent" : "user";

  return {
    id: record.messageId ?? record.id ?? `${kind}-${Date.now()}`,
    sessionId: record.sessionId ?? "",
    senderRole: kind,
    content: record.content ?? "",
    messageType: record.messageType ?? "TEXT",
    status: record.status ?? "",
    createdAt: record.createdAt ?? new Date().toISOString(),
    metadata: record.metadata,
  };
}

function normalizeHistoryMessages(input: unknown): ChatServiceRecord[] {
  if (Array.isArray(input)) {
    return input as ChatServiceRecord[];
  }

  if (input && typeof input === "object") {
    const payload = input as HistoryPayload;
    if (Array.isArray(payload.messages)) {
      return payload.messages as ChatServiceRecord[];
    }
  }

  return [];
}

export function normalizeChatHistory(input: unknown): NormalizedChatMessage[] {
  return normalizeHistoryMessages(input).map(normalizeChatMessage);
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string; message?: string } | null;
    return body?.message || body?.error || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

export async function fetchChatHistory(
  token: string,
  sessionId: string,
  limit = 100,
  signal?: AbortSignal
): Promise<NormalizedChatMessage[]> {
  const url = new URL(`/sessions/${encodeURIComponent(sessionId)}/messages`, getChatServiceBaseUrl());
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url, {
    cache: "no-store",
    signal,
    ...(token.trim()
      ? {
          headers: {
            Authorization: `Bearer ${token.trim()}`,
          },
        }
      : {}),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return normalizeChatHistory(await response.json());
}

export async function clearChatHistory(token: string, sessionId: string): Promise<void> {
  const url = new URL(
    `/sessions/${encodeURIComponent(sessionId)}/messages`,
    getChatServiceBaseUrl()
  );
  url.searchParams.set("confirm", "true");

  const response = await fetch(url, {
    method: "DELETE",
    cache: "no-store",
    ...(token.trim()
      ? {
          headers: {
            Authorization: `Bearer ${token.trim()}`,
          },
        }
      : {}),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}
