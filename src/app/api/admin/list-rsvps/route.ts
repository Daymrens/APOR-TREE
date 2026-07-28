import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection("rsvps")
      .orderBy("submittedAt", "desc")
      .get();
    const rsvps = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Serialize Firestore Timestamps to plain objects
      if (data.submittedAt && typeof data.submittedAt.toMillis === "function") {
        data.submittedAt = {
          seconds: data.submittedAt.seconds,
          nanoseconds: data.submittedAt.nanoseconds,
        };
      }
      return { id: doc.id, ...data };
    });
    return NextResponse.json({ rsvps });
  } catch {
    return NextResponse.json({ rsvps: [] });
  }
}
