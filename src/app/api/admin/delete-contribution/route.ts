import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const COLLECTION = "contributions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getAdminDb();

    await db.collection(COLLECTION).doc(body.id).delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if ((err as { code?: unknown })?.code === 4 || /RESOURCE_EXHAUSTED|Quota exceeded/i.test(msg)) {
      return NextResponse.json({ error: "Firestore quota exceeded. Try again after the daily reset." }, { status: 503 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}