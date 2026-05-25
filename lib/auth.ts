import { apiPost } from "./api";
import { requireApiUrl } from "@/lib/api-url";

export function setAuthToken(token: string) {
  document.cookie = `accessToken=${token}; path=/`;
}

export function removeAuthToken() {
  document.cookie =
    "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
}

export async function login(data: any) {
  // Use server-side proxy so the backend's Set-Cookie can be forwarded to frontend domain
  const res = await fetch(`/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || "Login failed");
  }

  return res.json();
}

export async function logoutApi() {
  const res = await fetch(`/api/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || "Logout failed");
  }

  return res.json();
}

export function register(payload: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}) {
  return apiPost<{
    message: string;
  }>("/auth/register", payload);
}

export async function getMe(token: string) {
  // Use server-side proxy route
  const res = await fetch(`/api/auth/me`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Unauthorized");
  }

  return res.json();
}


