export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "../../../../lib/db";

import {
  booths,
} from "../../../../../../database/schema";

export async function GET(
  request: Request
) {
  try {
    const url = new URL(request.url);

    const code = (
      url.searchParams.get("code") || ""
    )
      .trim()
      .toUpperCase();

    if (code.length !== 6) {
      return NextResponse.json(
        {
          error:
            "Booth code must be exactly 6 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const db = getDb();

    const [booth] = await db
      .select({
        id: booths.id,
        name: booths.name,
        roomCode: booths.roomCode,
        type: booths.type,
        description: booths.description,
      })
      .from(booths)
      .where(eq(booths.roomCode, code))
      .limit(1);

    if (!booth) {
      return NextResponse.json(
        {
          error:
            "No booth was found with that code.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      booth,
    });
  } catch (error) {
    console.error(
      "Unable to resolve booth code:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to find that booth right now.",
      },
      {
        status: 500,
      }
    );
  }
}
