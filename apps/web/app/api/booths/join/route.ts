export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "../../../../lib/db";
import { getSessionUserId } from "../../../../lib/auth";
import { booths } from "../../../../../../database/schema";

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    const body = await request.json();

    const roomCode =
      typeof body?.roomCode === "string"
        ? body.roomCode.trim().toUpperCase()
        : "";

    if (!roomCode) {
      return NextResponse.json(
        {
          error: "Please enter a room code.",
          code: "ROOM_CODE_REQUIRED",
        },
        { status: 400 }
      );
    }

    const [booth] = await getDb()
      .select({
        id: booths.id,
        name: booths.name,
        roomCode: booths.roomCode,
        type: booths.type,
      })
      .from(booths)
      .where(eq(booths.roomCode, roomCode))
      .limit(1);

    if (!booth) {
      return NextResponse.json(
        {
          error:
            "We couldn't find a booth with that room code.",
          code: "BOOTH_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      booth: {
        id: booth.id,
        name: booth.name,
        roomCode: booth.roomCode,
        type: booth.type,
      },

      participantType: userId
        ? "USER"
        : "GUEST",
    });
  } catch (error) {
    console.error(
      "Join booth lookup failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to find that room right now.",
      },
      { status: 500 }
    );
  }
}
