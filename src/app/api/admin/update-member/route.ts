import { NextResponse } from "next/server";
import { updateMember } from "@/lib/firestore/members";

export async function POST(request: Request) {
  try {
    const { id, ...data } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }
    await updateMember(id, data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
