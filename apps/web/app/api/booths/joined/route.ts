export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { getSessionUserId } from "../../../../lib/auth";
import { booths, boothSessions, participants } from "../../../../../../database/schema";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized.", booths: [] }, { status: 401 });

    const db = getDb();
    const rows = await db
      .select({ id: booths.id, type: booths.type, name: booths.name, roomCode: booths.roomCode, description: booths.description })
      .from(participants)
      .innerJoin(boothSessions, eq(boothSessions.id, participants.sessionId))
      .innerJoin(booths, eq(booths.id, boothSessions.boothId))
      .where(and(eq(participants.userId, userId), inArray(participants.status, ["JOINING", "CONNECTED", "READY", "CAPTURING"])))
      .orderBy(boothSessions.createdAt);

    const unique = Array.from(new Map(rows.map((row) => [row.id, row])).values());
    return NextResponse.json({ booths: unique });
  } catch (error) {
    console.error("Failed to fetch joined booths:", error);
    return NextResponse.json({ error: "Unable to fetch joined booths.", booths: [] }, { status: 500 });
  }
}
