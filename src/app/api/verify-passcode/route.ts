import { NextRequest, NextResponse } from "next/server";
import { verifyPasscode } from "@/lib/auth/passcode";

const FALLBACK_FAMILY_HASH = "ec63b0eb26bd86a55011350f69aa3a3fa9d3e0f50412e28ea779c55a5d6b4a36";
const FALLBACK_ADMIN_HASH = "3c183d946ea996dd8f81c457c76596138b93160937f98a364e3442a2e2a3c7b5";

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
