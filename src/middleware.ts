import { NextRequest, NextResponse } from "next/server";

const publicPaths = ["/gate", "/api/verify-passcode"];

export function middleware(request: NextRequest) {
  // Cross-origin preflight for public API POSTs (Firebase-hosted static page
  // submits contributions). Answer OPTIONS unconditionally so the browser
  // allows the actual request regardless of cookies/session state.
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS, GET, HEAD",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // The gate calls these before a session exists (open registration / passcode skipped):
  // set-member establishes the family-session cookie, and contributions POST is a public,
  // rate-limited moderation-queue submit. GET on contributions stays gated (it lists them).
  if (
    pathname === "/api/set-member" ||
    (pathname === "/api/contributions" && request.method === "POST")
  ) {
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

  if (!familySession && !adminSession) {
    const gateUrl = new URL("/gate", request.url);
    gateUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(gateUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
