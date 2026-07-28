import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const COLLECTION = "contributions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getAdminDb();

    await db.collection(COLLECTION).doc(body.id).delete();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}