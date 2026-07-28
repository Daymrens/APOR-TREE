import { NextResponse } from "next/server";
import { updateConfig } from "@/lib/firestore/config";
import { Timestamp } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.eventDateStart !== undefined) {
      data.eventDates = data.eventDates ?? {};
      (data.eventDates as Record<string, Timestamp>).start = Timestamp.fromDate(new Date(body.eventDateStart));
    }
    if (body.eventDateEnd !== undefined) {
      data.eventDates = data.eventDates ?? {};
      (data.eventDates as Record<string, Timestamp>).end = Timestamp.fromDate(new Date(body.eventDateEnd));
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

    await updateConfig(data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
