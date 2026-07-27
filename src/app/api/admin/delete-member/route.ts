import { NextResponse } from "next/server";
import { deleteMember } from "@/lib/firestore/members";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }
    await deleteMember(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
