import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS, GET, HEAD",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET() {
  try {
    const snapshot = await getAdminDb().collection("family_members").get();
    const members = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const res = NextResponse.json({ members }, { headers: corsHeaders });
    // Cache on the CDN for 5 minutes; serve stale while revalidating.
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if ((err as { code?: unknown })?.code === 4 || /RESOURCE_EXHAUSTED|Quota exceeded/i.test(msg)) {
      return NextResponse.json({ error: "Firestore quota exceeded. Try again after the daily reset." }, { status: 503, headers: corsHeaders });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}