import { NextRequest, NextResponse } from "next/server";
import { verifyPasscode } from "@/lib/auth/passcode";

export async function POST(request: NextRequest) {
  const { passcode, isAdmin } = await request.json();

  const familyHash = process.env.FAMILY_PASSCODE_HASH;
  const adminHash = process.env.ADMIN_PASSCODE_HASH;

  if (isAdmin) {
    if (!adminHash) {
      return NextResponse.json(
        { error: "Admin passcode not configured" },
        { status: 500 }
      );
    }
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

  if (!familyHash) {
    return NextResponse.json(
      { error: "Family passcode not configured" },
      { status: 500 }
    );
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
