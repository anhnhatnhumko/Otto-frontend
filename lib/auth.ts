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
  const API_URL = requireApiUrl();

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: "include", // ⭐ BẮT BUỘC
  });

  if (!res.ok) {
    throw new Error("Login failed");
  }

  return res.json();
}

export function logoutApi() {
  return apiPost("/auth/logout", {});
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
  const API_URL = requireApiUrl();

  const res = await fetch(
    `${API_URL}/auth/me`,
    {
      credentials: "include",
    }
  );

  if (!res.ok) {
    throw new Error("Unauthorized");
  }

  return res.json();
}


