import { NextRequest, NextResponse } from "next/server";
import { verifyPasscode } from "@/lib/auth/passcode";

const FALLBACK_FAMILY_HASH = "e794500dc1d7db699cf4804973ee7bb5366cb3012c5fa4022e01990e93af501e";
const FALLBACK_ADMIN_HASH = "82b9a6b59a100d46eb32bf1dc5ab49fac363e686bac84e46aad502d0518335ae";

export async function POST(request: NextRequest) {
  const { passcode, isAdmin } = await request.json();

  const familyHash = process.env.FAMILY_PASSCODE_HASH || FALLBACK_FAMILY_HASH;
  const adminHash = process.env.ADMIN_PASSCODE_HASH || FALLBACK_ADMIN_HASH;

  if (isAdmin) {
    if (!verifyPasscode(passcode, adminHash)) {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }
    const response = NextResponse.json({ success: true, isAdmin: true });
    response.cookies.set("admin-session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  }

  if (!verifyPasscode(passcode, familyHash)) {
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
