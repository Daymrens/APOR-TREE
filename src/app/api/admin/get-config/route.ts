import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth/passcode";

export async function GET() {
  try {
    const adminSession = (await cookies()).get("admin-session")?.value;
    if (!(await verifySessionToken(adminSession))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getAdminDb();
    const snap = await db.collection("reunion_config").doc("main").get();
    const config = snap.exists ? snap.data() : null;
    return NextResponse.json({ config });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if ((err as { code?: unknown })?.code === 4 || /RESOURCE_EXHAUSTED|Quota exceeded/i.test(msg)) {
      return NextResponse.json({ error: "Firestore quota exceeded. Try again after the daily reset." }, { status: 503 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
