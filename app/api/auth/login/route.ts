import { NextRequest } from "next/server";
import { requireApiUrl } from "@/lib/api-url";

export async function POST(req: NextRequest) {
  const apiUrl = requireApiUrl();

  const body = await req.json().catch(() => ({}));

  const backendRes = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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
