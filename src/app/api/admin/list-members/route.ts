import { NextResponse } from "next/server";
import { getMembers } from "@/lib/firestore/members";

export async function GET() {
  try {
    const members = await getMembers();
    return NextResponse.json({ members });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
