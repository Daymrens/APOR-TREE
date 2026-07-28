import { NextResponse } from "next/server";
import { getGalleryPhotos } from "@/lib/firestore/gallery";

export async function GET() {
  try {
    const photos = await getGalleryPhotos();
    return NextResponse.json({ photos });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
