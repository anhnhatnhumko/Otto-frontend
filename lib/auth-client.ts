import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

type AuthErrorBody = {
  message?: string;
  email?: string;
};

export async function handleAuthMeResponse(
  res: Response,
  router: AppRouterInstance,
) {
  if (res.ok) {
    return res.json();
  }

  let data: AuthErrorBody = {};

  try {
    data = await res.json();
  } catch {
    data = {};
  }

  const message = typeof data?.message === "string" ? data.message : "";
  const email = typeof data?.email === "string" ? data.email : "";

  if (message.toLowerCase().includes("xác thực") || message.toLowerCase().includes("verify")) {
    router.push(
      `/verify-email${email ? `?email=${encodeURIComponent(email)}` : ""}`,
    );
    throw new Error("Email chưa được xác thực");
  }

  throw new Error(message || "Unauthorized");
}