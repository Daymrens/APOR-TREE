import { NextResponse } from "next/server";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

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

    const bytes = await file.arrayBuffer();
    const storageRef = ref(storage, `members/${memberId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, bytes);
    const url = await getDownloadURL(snapshot.ref);

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
