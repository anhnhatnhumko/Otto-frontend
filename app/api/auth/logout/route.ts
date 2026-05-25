import { NextRequest } from "next/server";
import { requireApiUrl } from "@/lib/api-url";

export async function POST(req: NextRequest) {
  const apiUrl = requireApiUrl();

  const backendRes = await fetch(`${apiUrl}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const text = await backendRes.text();

  const headers: Record<string, string> = {};
  const setCookie = backendRes.headers.get("set-cookie");
  if (setCookie) {
    headers["Set-Cookie"] = setCookie;
  }

  return new Response(text, {
    status: backendRes.status,
    headers,
  });
}
