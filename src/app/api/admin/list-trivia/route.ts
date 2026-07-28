import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "trivia_questions";

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection(COLLECTION).get();
    const questions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json({ questions });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}