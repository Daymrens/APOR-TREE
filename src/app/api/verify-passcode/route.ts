import { NextRequest, NextResponse } from "next/server";
import { signSessionToken, verifyPasscode } from "@/lib/auth/passcode";
import { rateLimitCheck } from "@/lib/rate-limit";

const FALLBACK_FAMILY_HASH = "e794500dc1d7db699cf4804973ee7bb5366cb3012c5fa4022e01990e93af501e";
const FALLBACK_ADMIN_HASH = "eac988a580051252ecb9453e7964cefefa27e92be323169005bff8f4c82cb3f9";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const limited = rateLimitCheck(`verify-passcode:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many attempts, try again later" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      }
    );
  }

  let body: { passcode?: string; isAdmin?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { passcode, isAdmin } = body;

  const familyHash = process.env.FAMILY_PASSCODE_HASH || FALLBACK_FAMILY_HASH;
  const adminHash = process.env.ADMIN_PASSCODE_HASH || FALLBACK_ADMIN_HASH;

  if (isAdmin) {
    if (!verifyPasscode(passcode ?? "", adminHash)) {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }
    const sessionToken = await signSessionToken();
    const response = NextResponse.json({ success: true, isAdmin: true });
    response.cookies.set("admin-session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  }

  if (!verifyPasscode(passcode ?? "", familyHash)) {
    return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, isAdmin: false });
  response.cookies.set("family-session", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return response;
}
