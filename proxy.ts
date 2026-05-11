import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwt(token: string): any | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function middleware(request: NextRequest) {
  const tokenCookie = request.cookies.get("accessToken");
  const pathname = request.nextUrl.pathname;

  console.log("MIDDLEWARE COOKIE:", tokenCookie);

  // ❗ KHÔNG redirect nếu chưa có cookie
  if (!tokenCookie) {
    return NextResponse.next();
  }

  const payload = decodeJwt(tokenCookie.value);

  // ❗ token sai → logout
  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = payload.role;

  // ADMIN
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return redirectByRole(role, request);
  }

  // TASKER
  if (pathname.startsWith("/tasker") && role !== "TASKER") {
    return redirectByRole(role, request);
  }

  // CUSTOMER
  if (
    (pathname === "/profile" ||
      pathname.startsWith("/booking") ||
      pathname.startsWith("/orders")) &&
    role !== "CUSTOMER"
  ) {
    return redirectByRole(role, request);
  }

  return NextResponse.next();
}

function redirectByRole(role: string, request: NextRequest) {
  if (role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }
  if (role === "TASKER") {
    return NextResponse.redirect(new URL("/tasker/dashboard", request.url));
  }
  if (role === "CUSTOMER") {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/tasker/:path*",
    "/profile",
    "/booking/:path*",
    "/orders/:path*",
  ],
};