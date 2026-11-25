import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Content Security Policy cơ bản, tránh unsafe-eval
  const csp = [
    "default-src 'self'",
    "img-src 'self' data: https://canboso.com",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // Chặn index cho khu vực admin và account
  if (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/account")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
