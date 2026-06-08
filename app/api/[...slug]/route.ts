import { cookies } from "next/headers";
import { requireApiUrl } from "@/lib/api-url";

async function forward(req: Request, params: { slug?: string[] }) {
  const apiUrl = requireApiUrl();
  const slug = params.slug ? params.slug.join("/") : "";

  const url = new URL(req.url);
  const search = url.search || "";
  const target = `${apiUrl}/${slug}${search}`;

  const cookieStore = await cookies();
  const allCookies = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type");

  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  if (allCookies) {
    headers.cookie = allCookies;
  }

  const method = req.method;
  let body: BodyInit | undefined;

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    try {
      const rawBody = await req.arrayBuffer();
      body = rawBody.byteLength > 0 ? rawBody : undefined;
    } catch {
      body = undefined;
    }
  }

  const upstreamResponse = await fetch(target, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const upstreamBody =
    method === "HEAD" ? null : await upstreamResponse.arrayBuffer();

  const outHeaders = new Headers();

  upstreamResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      return;
    }

    outHeaders.append(key, value);
  });

  const getSetCookie = (upstreamResponse.headers as Headers & {
    getSetCookie?: () => string[];
  }).getSetCookie;
  const setCookies = typeof getSetCookie === "function"
    ? getSetCookie.call(upstreamResponse.headers)
    : [];

  if (setCookies.length > 0) {
    for (const cookie of setCookies) {
      outHeaders.append("set-cookie", cookie);
    }
  } else {
    const singleCookie = upstreamResponse.headers.get("set-cookie");
    if (singleCookie) {
      outHeaders.append("set-cookie", singleCookie);
    }
  }

  return new Response(upstreamBody, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: outHeaders,
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const resolvedParams = await params;
  return forward(req, resolvedParams || {});
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const resolvedParams = await params;
  return forward(req, resolvedParams || {});
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const resolvedParams = await params;
  return forward(req, resolvedParams || {});
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const resolvedParams = await params;
  return forward(req, resolvedParams || {});
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const resolvedParams = await params;
  return forward(req, resolvedParams || {});
}

export async function OPTIONS(
  req: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const resolvedParams = await params;
  return forward(req, resolvedParams || {});
}
