import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("gallery_photos").get();
    const photos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json({ photos });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
