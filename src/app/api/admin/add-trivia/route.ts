import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "trivia_questions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getAdminDb();

    const data = {
      question: body.question,
      choices: body.choices,
      correctIndex: body.correctIndex,
      points: body.points ?? 10,
      explanation: body.explanation ?? "",
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(COLLECTION).add(data);
    return NextResponse.json({ id: docRef.id, ...data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}