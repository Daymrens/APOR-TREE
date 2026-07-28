import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.fullName) {
      return NextResponse.json({ error: "Full name required" }, { status: 400 });
    }
    const db = getAdminDb();
    const docRef = await db.collection("family_members").add(data);
    return NextResponse.json({ ok: true, id: docRef.id });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
