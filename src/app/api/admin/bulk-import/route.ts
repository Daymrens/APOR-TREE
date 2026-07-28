import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { members } = await request.json();
    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ error: "Members array required" }, { status: 400 });
    }

    const db = getAdminDb();
    const results: { id?: string; name: string; error?: string }[] = [];

    for (const member of members) {
      try {
        const docRef = await db.collection("family_members").add({
          fullName: member.fullName || "",
          nickname: member.nickname || "",
          generation: member.generation || 0,
          branch: member.branch || "",
          parentIds: member.parentIds || [],
          spouseId: member.spouseId || null,
          birthOrder: member.birthOrder || 0,
          photoUrl: member.photoUrl || null,
          livingStatus: member.livingStatus || "living",
          notes: member.notes || "",
        });
        results.push({ id: docRef.id, name: member.fullName });
      } catch {
        results.push({ name: member.fullName, error: "Failed" });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
