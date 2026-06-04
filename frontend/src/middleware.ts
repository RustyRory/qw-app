import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeToken, getDashboardPath } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("qw_token")?.value;
  const { pathname } = request.nextUrl;

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

  if (pathname === "/login" && isAuthenticated) {
    return redirect(getDashboardPath(payload!.role));
  }

  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    return redirect("/login");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
