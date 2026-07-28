import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "contributions";

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection(COLLECTION)
      .where("status", "==", "approved")
      .orderBy("createdAt", "desc")
      .get();

    const contributions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(contributions);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getAdminDb();

    const data = {
      authorName: body.authorName || "Anonymous",
      authorBranch: body.authorBranch || null,
      type: body.type || "suggestion",
      category: body.category || "general",
      title: body.title || "",
      description: body.description || "",
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(COLLECTION).add(data);
    return NextResponse.json({ id: docRef.id, ...data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}