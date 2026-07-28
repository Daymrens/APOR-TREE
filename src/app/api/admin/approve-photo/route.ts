import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Photo ID required" }, { status: 400 });
    }
    const db = getAdminDb();
    await db.collection("gallery_photos").doc(id).update({
      approved: true,
      approvedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
