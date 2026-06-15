import { getAccessToken } from "./session";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

export type AppNotification = {
  _id: string;
  userId: string;
  title: string;
  content: string;
  type?: string;
  orderId?: string;
  senderId?: string;
  senderName?: string;
  isRead: boolean;
  createdAt?: string;
};

const MOJIBAKE_PATTERN =
  /[\u00c3\u00c2\u00c4\u00c5\u00c6\u00d0\u00d1\u00d2\u00d3\u00d4\u00d5\u00d6\u00d8\u00d9\u00da\u00db\u00dc\u00dd\u00de\u00df\u00e2\u00f0\u00ef\ufffd]/;
const BROKEN_INLINE_QUESTION_PATTERN = /[\p{L}]\?[\p{L}]/u;

function normalizeVietnameseText(value?: string | null) {
  const input = String(value ?? "");

  if (!input || !MOJIBAKE_PATTERN.test(input)) {
    return input;
  }

  let normalized = input;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const decoded = decodeURIComponent(escape(normalized));
      if (!decoded || decoded === normalized) {
        break;
      }

      normalized = decoded;
      if (!MOJIBAKE_PATTERN.test(normalized)) {
        break;
      }
    } catch {
      break;
    }
  }

  return normalized;
}

function isBrokenText(value?: string | null) {
  const normalized = normalizeVietnameseText(value);
  return (
    Boolean(normalized) &&
    (MOJIBAKE_PATTERN.test(normalized) ||
      BROKEN_INLINE_QUESTION_PATTERN.test(normalized))
  );
}

function getFallbackTitle(type: string, senderName: string) {
  switch (type) {
    case "chat_message":
      return senderName ? `Tin nhắn mới từ ${senderName}` : "Tin nhắn mới";
    case "order_accepted":
      return "Đơn hàng được nhận";
    case "order_completed_confirmation":
      return "Công việc đã hoàn thành";
    case "order_completed":
      return "Đơn hàng hoàn thành";
    case "order_cancelled":
      return "Đơn hàng đã bị hủy";
    case "order_kept":
      return "Đơn hàng được giữ lại";
    case "order_overdue_warning":
      return "Đơn hàng sắp quá hạn";
    case "refund":
      return "Hoàn tiền đã được xử lý";
    default:
      return "";
  }
}

function getFallbackContent(type: string, senderName: string) {
  switch (type) {
    case "chat_message":
      return senderName
        ? `${senderName} đã gửi một tin nhắn mới.`
        : "Bạn có một tin nhắn mới.";
    case "order_accepted":
      return senderName
        ? `${senderName} đã nhận đơn hàng của bạn.`
        : "Tasker đã nhận đơn hàng của bạn.";
    case "order_completed_confirmation":
      return senderName
        ? `${senderName} đã hoàn thành công việc. Vui lòng xác nhận.`
        : "Tasker đã hoàn thành công việc. Vui lòng xác nhận.";
    case "order_completed":
      return "Đơn hàng của bạn đã hoàn thành. Vui lòng kiểm tra email để xem hóa đơn.";
    case "order_cancelled":
      return senderName
        ? `Đơn hàng đã bị hủy bởi ${senderName}.`
        : "Đơn hàng đã bị hủy.";
    case "order_kept":
      return "Khách hàng đã quyết định giữ lại đơn hàng quá hạn. Vui lòng bắt đầu làm ngay.";
    case "order_overdue_warning":
      return "Tasker chưa bắt đầu công việc sau giờ hẹn. Vui lòng kiểm tra đơn hàng của bạn.";
    case "refund":
      return "Tiền hoàn đã được ghi nhận vào ví của bạn.";
    default:
      return "";
  }
}

export function normalizeNotification(notification: AppNotification): AppNotification {
  const type = String(notification.type || "").toLowerCase();
  const senderName = normalizeVietnameseText(notification.senderName).trim();
  const title = normalizeVietnameseText(notification.title);
  const content = normalizeVietnameseText(notification.content);
  const fallbackTitle = getFallbackTitle(type, senderName);
  const fallbackContent = getFallbackContent(type, senderName);

  return {
    ...notification,
    title: !title || isBrokenText(title) ? fallbackTitle || title : title,
    content: !content || isBrokenText(content) ? fallbackContent || content : content,
    senderName,
  };
}

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

export async function getNotifications(limit = 20) {
  const items = await request<AppNotification[]>(`/notifications?limit=${limit}`);
  return Array.isArray(items) ? items.map(normalizeNotification) : [];
}

export async function markNotificationRead(notificationId: string) {
  return request(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead() {
  return request("/notifications/read-all", {
    method: "POST",
  });
}

export async function deleteNotification(notificationId: string) {
  return request(`/notifications/${notificationId}`, {
    method: "DELETE",
  });
}
