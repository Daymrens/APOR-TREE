import { NextResponse } from "next/server";
import { getSchedule } from "@/lib/firestore/schedule";

export async function GET() {
  try {
    const items = await getSchedule();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
