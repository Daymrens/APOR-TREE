import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { rateLimit } from "@/lib/rate-limit";

const COLLECTION = "contributions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .get();

    const contributions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(contributions);
  } catch (err) {
    console.error("contributions API error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if ((err as { code?: unknown })?.code === 4 || /RESOURCE_EXHAUSTED|Quota exceeded/i.test(msg)) {
      return NextResponse.json({ error: "Firestore quota exceeded. Try again after the daily reset." }, { status: 503 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
    if (!rateLimit(`contribute:${ip}`, 5, 60000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429, headers: corsHeaders });
    }

    const body = await request.json();
    const db = getAdminDb();

    const data: Record<string, unknown> = {
      authorName: body.authorName || "Anonymous",
      authorBranch: body.authorBranch || null,
      type: body.type || "suggestion",
      category: body.category || null,
      title: body.title || "",
      description: body.description || "",
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    };

    if (body.data) {
      data.data = body.data;
    }

    const docRef = await db.collection(COLLECTION).add(data);
    return NextResponse.json({ id: docRef.id, ...data }, { headers: corsHeaders });
  } catch (err) {
    console.error("contributions API error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if ((err as { code?: unknown })?.code === 4 || /RESOURCE_EXHAUSTED|Quota exceeded/i.test(msg)) {
      return NextResponse.json({ error: "Firestore quota exceeded. Try again after the daily reset." }, { status: 503, headers: corsHeaders });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}