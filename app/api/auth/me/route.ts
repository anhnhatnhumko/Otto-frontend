import { cookies } from "next/headers";
import { requireApiUrl } from "@/lib/api-url";

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

  return new Response(data, {
    status: res.status,
  });
}