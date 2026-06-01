import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeToken, getDashboardPath } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("qw_token")?.value;
  const { pathname } = request.nextUrl;

  const payload = token ? decodeToken(token) : null;
  const isAuthenticated = !!payload && payload.exp * 1000 > Date.now();

  if (pathname === "/" || pathname === "") {
    if (isAuthenticated) {
      return NextResponse.redirect(
        new URL(getDashboardPath(payload.role), request.url),
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(
        new URL(getDashboardPath(payload.role), request.url),
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
