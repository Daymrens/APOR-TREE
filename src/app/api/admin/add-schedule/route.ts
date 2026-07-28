import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    const db = getAdminDb();
    const docRef = await db.collection("schedule_items").add(data);
    return NextResponse.json({ ok: true, id: docRef.id });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
