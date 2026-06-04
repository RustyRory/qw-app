import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeToken, getDashboardPath } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const target = new URL(BACKEND_URL + pathname + request.nextUrl.search);
    return NextResponse.rewrite(target);
  }

  const token = request.cookies.get("qw_token")?.value;

  const payload = token ? decodeToken(token) : null;
  const isAuthenticated = !!payload && payload.exp * 1000 > Date.now();

  const redirect = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    return NextResponse.redirect(url);
  };

  if (pathname === "/" || pathname === "") {
    return isAuthenticated
      ? redirect(getDashboardPath(payload!.role))
      : redirect("/login");
  }

  if (pathname === "/login") {
    if (isAuthenticated) return redirect(getDashboardPath(payload!.role));
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) return redirect("/login");
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/api/:path*"],
};
