import { NextResponse } from "next/server";
import { getConfig } from "@/lib/firestore/config";

export async function GET() {
  try {
    const config = await getConfig();
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
