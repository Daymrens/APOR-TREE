import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("family_members").get();
    const members = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json({ members });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
