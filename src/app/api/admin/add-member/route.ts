import { NextResponse } from "next/server";
import { addMember } from "@/lib/firestore/members";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.fullName) {
      return NextResponse.json({ error: "Full name required" }, { status: 400 });
    }
    const id = await addMember(data);
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
