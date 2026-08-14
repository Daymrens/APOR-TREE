import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snapshot = await getAdminDb().collection("rsvps").get();
    const counts = { yes: 0, no: 0, maybe: 0, total: snapshot.size };
    snapshot.docs.forEach((d) => {
      const a = d.data()?.attending;
      if (a === "yes") counts.yes++;
      else if (a === "no") counts.no++;
      else if (a === "maybe") counts.maybe++;
    });
    const res = NextResponse.json({ counts });
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if ((err as { code?: unknown })?.code === 4 || /RESOURCE_EXHAUSTED|Quota exceeded/i.test(msg)) {
      return NextResponse.json({ error: "Firestore quota exceeded" }, { status: 503 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}