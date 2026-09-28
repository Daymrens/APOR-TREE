import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth/passcode";

export async function POST(request: Request) {
  try {
    const adminSession = (await cookies()).get("admin-session")?.value;
    if (!(await verifySessionToken(adminSession))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const db = getAdminDb();
    const data: Record<string, unknown> = {};

    const scheduled = body.reunionScheduled === true;
    const startDate = body.eventDateStart !== undefined
      ? new Date(body.eventDateStart)
      : null;
    const startValid = startDate instanceof Date && !isNaN(startDate.getTime());

    if (scheduled && startValid) {
      data.eventDates = data.eventDates ?? {};
      (data.eventDates as Record<string, Date | null>).start = startDate;
    } else {
      data.eventDates = data.eventDates ?? {};
      (data.eventDates as Record<string, Date | null>).start = null;
    }

    if (body.eventDateEnd !== undefined) {
      const endDate = new Date(body.eventDateEnd);
      data.eventDates = data.eventDates ?? {};
      (data.eventDates as Record<string, Date | null>).end =
        endDate instanceof Date && !isNaN(endDate.getTime()) ? endDate : null;
    }
    data.reunionScheduled = scheduled;
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
