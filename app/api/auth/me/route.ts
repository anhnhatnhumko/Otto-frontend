import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();

  const allCookies = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; "); // ⭐ QUAN TRỌNG

  console.log("FORWARD COOKIE:", allCookies);

  const res = await fetch("http://localhost:9999/auth/me", {
    headers: {
      cookie: allCookies, // ⭐ gửi FULL cookie string
    },
  });

  const data = await res.text();

  return new Response(data, {
    status: res.status,
  });
}