import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "trivia_questions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Question ID required" }, { status: 400 });
    }

    const db = getAdminDb();
    const updateData = {
      question: data.question,
      choices: data.choices,
      correctIndex: data.correctIndex,
      points: data.points ?? 10,
      explanation: data.explanation ?? "",
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.collection(COLLECTION).doc(id).update(updateData);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}