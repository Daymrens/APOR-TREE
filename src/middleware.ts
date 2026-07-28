import { NextRequest, NextResponse } from "next/server";

const publicPaths = ["/gate", "/api/verify-passcode"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const familySession = request.cookies.get("family-session")?.value;
  const adminSession = request.cookies.get("admin-session")?.value;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!adminSession) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const adminUrl = new URL("/admin", request.url);
      adminUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(adminUrl);
    }
    return NextResponse.next();
  }

  if (!familySession) {
    const gateUrl = new URL("/gate", request.url);
    gateUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(gateUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
