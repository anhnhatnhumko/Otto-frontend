import { cookies } from "next/headers";
import { requireApiUrl } from "@/lib/api-url";

function buildExpiredAccessTokenCookie() {
  const isProduction = process.env.NODE_ENV === "production";

  return [
    "accessToken=",
    "Path=/",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
    "HttpOnly",
    isProduction ? "SameSite=None" : "SameSite=Lax",
    isProduction ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export async function GET() {
  const cookieStore = await cookies();
  const apiUrl = requireApiUrl();

  const allCookies = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; "); // ⭐ QUAN TRỌNG

  console.log("FORWARD COOKIE:", allCookies);

  const res = await fetch(`${apiUrl}/auth/me`, {
    headers: {
      cookie: allCookies, // ⭐ gửi FULL cookie string
    },
  });

  const data = await res.text();

  const headers = new Headers();
  const contentType = res.headers.get("content-type");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (res.status === 401 || res.status === 403) {
    headers.append("set-cookie", buildExpiredAccessTokenCookie());
  }

  return new Response(data, {
    status: res.status,
    headers,
  });
}
