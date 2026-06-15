import { getAccessToken } from "./session";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

export type AuthUser = {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
};

export type LoginResponse = {
  message: string;
  accessToken: string;
  user: AuthUser;
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

async function request(path: string, options: RequestInit = {}) {
  try {
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

    return payload;
  } catch (error: any) {
    // Network error, timeout, or other fetch issues
    if (error instanceof TypeError) {
      console.error(`[API] Network error calling ${API_BASE}${path}:`, error.message);
      throw new Error(`Lỗi kết nối mạng. Vui lòng kiểm tra backend IP và port: ${API_BASE}`);
    }
    throw error;
  }
}

export async function login(payload: { email: string; password: string }) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<LoginResponse>;
}

export async function register(payload: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<{ message: string }>;
}

export async function logout() {
  return request("/auth/logout", {
    method: "POST",
  }) as Promise<{ message: string }>;
}

export async function getMe() {
  return request("/auth/me") as Promise<AuthUser>;
}

export async function forgotPassword(payload: { email: string }) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<{ message: string }>;
}

export async function resetPassword(payload: {
  token: string;
  newPassword: string;
}) {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<{ message: string }>;
}

export async function resendVerifyEmail(payload: { email: string }) {
  return request("/auth/resend-verify-email", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<{ message: string }>;
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  return request("/auth/change-password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  }) as Promise<{ message: string }>;
}
