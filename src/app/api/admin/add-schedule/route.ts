import { NextResponse } from "next/server";
import { addScheduleItem } from "@/lib/firestore/schedule";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    const id = await addScheduleItem(data);
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
