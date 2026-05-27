import { cookies } from "next/headers";
import { requireApiUrl } from "@/lib/api-url";

async function forward(req: Request, params: { slug?: string[] }) {
  const apiUrl = requireApiUrl();
  const slug = params.slug ? params.slug.join("/") : "";

  const url = new URL(req.url);
  const search = url.search || "";

  const target = `${apiUrl}/${slug}${search}`;

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");

  const headers: Record<string, string> = {};

  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  if (allCookies) headers["cookie"] = allCookies;

  const method = req.method;

  let body: BodyInit | undefined = undefined;
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    try {
      const rawBody = await req.arrayBuffer();
      body = rawBody.byteLength > 0 ? rawBody : undefined;
    } catch (e) {
      body = undefined;
    }
  }

  const res = await fetch(target, {
    method,
    headers,
    body,
  });

  const text = await res.text();

  const outHeaders: Record<string, string> = {};
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) outHeaders["Set-Cookie"] = setCookie;

  const contentTypeOut = res.headers.get("content-type");
  if (contentTypeOut) outHeaders["content-type"] = contentTypeOut;

  return new Response(text, {
    status: res.status,
    headers: outHeaders,
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  return forward(req, resolvedParams || {});
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  return forward(req, resolvedParams || {});
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  return forward(req, resolvedParams || {});
}

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  return forward(req, resolvedParams || {});
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  return forward(req, resolvedParams || {});
}

export async function OPTIONS(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  return forward(req, resolvedParams || {});
}
