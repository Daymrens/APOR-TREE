import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getAdminDb();
    const data: Record<string, unknown> = {};

    if (body.eventDateStart !== undefined) {
      data.eventDates = data.eventDates ?? {};
      (data.eventDates as Record<string, Date>).start = new Date(body.eventDateStart);
    }
    if (body.eventDateEnd !== undefined) {
      data.eventDates = data.eventDates ?? {};
      (data.eventDates as Record<string, Date>).end = new Date(body.eventDateEnd);
    }
    if (body.venueName !== undefined) data.venueName = body.venueName;
    if (body.venueAddress !== undefined) data.venueAddress = body.venueAddress;
    if (body.mapEmbedUrl !== undefined) data.mapEmbedUrl = body.mapEmbedUrl;
    if (body.contactPerson !== undefined) data.contactPerson = body.contactPerson;
    if (body.contactNumber !== undefined) data.contactNumber = body.contactNumber;
    if (body.parkingNotes !== undefined) data.parkingNotes = body.parkingNotes;
    if (body.coverImageUrl !== undefined) data.coverImageUrl = body.coverImageUrl;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    data.updatedAt = FieldValue.serverTimestamp();

    await db.collection("reunion_config").doc("main").set(data, { merge: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
