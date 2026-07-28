import { NextResponse } from "next/server";
import { approvePhoto } from "@/lib/firestore/gallery";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Photo ID required" }, { status: 400 });
    }
    await approvePhoto(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
