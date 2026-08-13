import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { memberId, memberName, branch } = await request.json();

    if (!memberName || typeof memberName !== "string") {
      return NextResponse.json({ error: "Member name is required" }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });

    // Establish the family session here too, so the middleware lets the visitor
    // through even when the passcode step was skipped (open registration).
    response.cookies.set("family-session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set("family-member-id", memberId || "", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });

    response.cookies.set("family-member-name", encodeURIComponent(memberName), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    response.cookies.set("family-member-branch", encodeURIComponent(branch || ""), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
