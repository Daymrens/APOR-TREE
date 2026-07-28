import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const COLLECTION = "trivia_questions";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Question ID required" }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection(COLLECTION).doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}