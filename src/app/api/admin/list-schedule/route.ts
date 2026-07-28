import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection("schedule_items")
      .orderBy("day")
      .orderBy("startTime")
      .get();
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
