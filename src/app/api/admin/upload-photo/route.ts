import { NextResponse } from "next/server";
import { getAdminStorage } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const memberId = formData.get("memberId") as string;

    if (!file || !memberId) {
      return NextResponse.json({ error: "File and memberId required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Max file size is 5MB" }, { status: 400 });
    }

    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const filePath = `members/${memberId}/${file.name}`;
    const fileRef = bucket.file(filePath);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await fileRef.save(buffer, {
      contentType: file.type,
      metadata: {
        firebaseStorageDownloadTokens: crypto.randomUUID(),
      },
    });

    // Make the file publicly accessible
    await fileRef.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
