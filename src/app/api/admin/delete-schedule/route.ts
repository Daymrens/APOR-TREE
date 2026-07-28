import { NextResponse } from "next/server";
import { deleteScheduleItem } from "@/lib/firestore/schedule";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }
    await deleteScheduleItem(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
