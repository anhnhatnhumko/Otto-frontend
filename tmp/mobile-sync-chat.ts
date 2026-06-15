import { getAccessToken } from "./session";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

export type OrderChatMessage = {
  _id: string;
  orderId: string;
  senderId: string;
  senderRole: string;
  text: string;
  read: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function tryParseJsonString(value: string): unknown | null {
  const text = value.trim();

  if (!text || (!text.startsWith("{") && !text.startsWith("["))) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractErrorMessage(
  payload: any,
  fallback = "Có lỗi xảy ra. Vui lòng thử lại.",
): string {
  if (typeof payload === "string") {
    const parsed = tryParseJsonString(payload);
    if (parsed) {
      return extractErrorMessage(parsed, fallback);
    }

    return payload.trim() || fallback;
  }

  const message = payload?.message;
  if (Array.isArray(message)) {
    return (
      message
        .map((item) => extractErrorMessage(item, ""))
        .filter(Boolean)
        .join(", ") || fallback
    );
  }

  if (typeof message === "string" && message.trim()) {
    const parsed = tryParseJsonString(message);
    if (parsed) {
      return extractErrorMessage(parsed, fallback);
    }

    return message.trim();
  }

  if (typeof payload?.error === "string" && payload.error.trim()) {
    if (payload.error.trim().toLowerCase() === "unauthorized") {
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    }

    return payload.error.trim();
  }

  if (Number(payload?.statusCode) === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  return fallback;
}

async function request<T = any>(path: string, options: RequestInit = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, `HTTP ${response.status}`));
  }

  return payload as T;
}

export async function getOrderMessages(orderId: string, limit = 200) {
  return request<OrderChatMessage[]>(
    `/chat/orders/${orderId}/messages?limit=${limit}`,
    {
      method: "GET",
    },
  );
}

export async function sendOrderMessage(orderId: string, text: string) {
  return request<{ ok: boolean; message: OrderChatMessage }>(
    `/chat/orders/${orderId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ text }),
    },
  );
}

export async function markOrderMessagesAsRead(orderId: string) {
  return request<{ modifiedCount: number }>(
    `/chat/orders/${orderId}/messages/mark-read`,
    {
      method: "PATCH",
    },
  );
}
