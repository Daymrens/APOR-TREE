import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection("reunion_config").doc("main").get();
    const config = snap.exists ? snap.data() : null;
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
