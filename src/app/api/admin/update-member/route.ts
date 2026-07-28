import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { id, ...data } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }
    const db = getAdminDb();
    await db.collection("family_members").doc(id).update(data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
