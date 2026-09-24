export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { and, desc, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "../../../lib/db";
import { getSessionUserId } from "../../../lib/auth";
import {
  booths,
  boothSessions,
  memories,
  memoryAssets,
  participants,
} from "../../../../../database/schema";

const MAX_DATA_URL_LENGTH = 3_000_000;

function isPhotoDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("data:image/") &&
    value.includes(";base64,") &&
    value.length <= MAX_DATA_URL_LENGTH
  );
}

async function canUseSession(
  userId: string,
  sessionId: string
) {
  const db = getDb();

  const [session] = await db
    .select({ id: boothSessions.id })
    .from(boothSessions)
    .innerJoin(
      booths,
      eq(booths.id, boothSessions.boothId)
    )
    .leftJoin(
      participants,
      eq(participants.sessionId, boothSessions.id)
    )
    .where(
      and(
        eq(boothSessions.id, sessionId),
        or(
          eq(booths.ownerId, userId),
          eq(participants.userId, userId)
        )
      )
    )
    .limit(1);

  return Boolean(session);
}

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in.", memories: [] },
        { status: 401 }
      );
    }

    const db = getDb();

    const rows = await db
      .select({
        id: memories.id,
        title: memories.title,
        sessionId: memories.sessionId,
        layout: memories.layout,
        template: memories.template,
        privacy: memories.privacy,
        metadata: memories.metadata,
        createdAt: memories.createdAt,
        assetId: memoryAssets.id,
        photoDataUrl: memoryAssets.storageKey,
        mimeType: memoryAssets.mimeType,
        width: memoryAssets.width,
        height: memoryAssets.height,
      })
      .from(memories)
      .leftJoin(
        memoryAssets,
        eq(memoryAssets.memoryId, memories.id)
      )
      .where(eq(memories.ownerId, userId))
      .orderBy(desc(memories.createdAt));

    return NextResponse.json({
      memories: rows.map((row) => ({
        id: row.id,
        title: row.title,
        sessionId: row.sessionId,
        layout: row.layout,
        template: row.template,
        privacy: row.privacy,
        metadata: row.metadata,
        createdAt: row.createdAt,
        asset: row.assetId
          ? {
              id: row.assetId,
              photoDataUrl: row.photoDataUrl,
              mimeType: row.mimeType,
              width: row.width,
              height: row.height,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Memory GET failed:", error);
    return NextResponse.json(
      { error: "Unable to load memories." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const photoDataUrl = body?.photoDataUrl;

    if (!isPhotoDataUrl(photoDataUrl)) {
      return NextResponse.json(
        {
          error:
            "A valid photo is required. The photo must be a base64 image under 3 MB.",
        },
        { status: 400 }
      );
    }

    const sessionId =
      typeof body?.sessionId === "string"
        ? body.sessionId
        : null;

    if (sessionId) {
      const allowed = await canUseSession(
        userId,
        sessionId
      );

      if (!allowed) {
        return NextResponse.json(
          {
            error:
              "You are not allowed to save a memory from this booth session.",
          },
          { status: 403 }
        );
      }
    }

    const title =
      typeof body?.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 120)
        : "You, Me & Every Moment";

    const layout =
      typeof body?.layout === "string"
        ? body.layout.slice(0, 40)
        : "JOINED";

    const template =
      typeof body?.template === "string"
        ? body.template.slice(0, 40)
        : "CLASSIC";

    const privacy =
      body?.privacy === "SHARED" || body?.privacy === "PUBLIC"
        ? body.privacy
        : "PRIVATE";

    const db = getDb();

    const [memory] = await db
      .insert(memories)
      .values({
        ownerId: userId,
        sessionId,
        title,
        layout,
        template,
        privacy,
        metadata: {
          source: "usbooth-web-capture",
          storageMode: "database-data-url-prototype",
          ...(body?.metadata && typeof body.metadata === "object"
            ? body.metadata
            : {}),
        },
      })
      .returning({
        id: memories.id,
        createdAt: memories.createdAt,
      });

    if (!memory) {
      throw new Error("Memory was not created.");
    }

    const width = typeof body?.width === "number" && body.width > 0 ? Math.round(body.width) : null;
    const height = typeof body?.height === "number" && body.height > 0 ? Math.round(body.height) : null;

    const mimeMatch = /^data:([^;]+);base64,/.exec(photoDataUrl);
    const mimeType = mimeMatch?.[1] || "image/jpeg";
    const base64 = photoDataUrl.slice(
      photoDataUrl.indexOf(",") + 1
    );

    const [asset] = await db
      .insert(memoryAssets)
      .values({
        memoryId: memory.id,
        kind: "FINAL_PHOTO",
        storageKey: photoDataUrl,
        mimeType,
        byteSize: Math.floor((base64.length * 3) / 4),
        width,
        height,
      })
      .returning({
        id: memoryAssets.id,
      });

    return NextResponse.json(
      {
        success: true,
        memory: {
          id: memory.id,
          assetId: asset?.id ?? null,
          createdAt: memory.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Memory POST failed:", error);
    return NextResponse.json(
      { error: "Unable to save this memory." },
      { status: 500 }
    );
  }
}


export async function PATCH(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const memoryId =
      typeof body?.memoryId === "string"
        ? body.memoryId
        : "";

    const title =
      typeof body?.title === "string"
        ? body.title.trim().slice(0, 120)
        : "";

    if (!memoryId || !title) {
      return NextResponse.json(
        { error: "Memory ID and title are required." },
        { status: 400 }
      );
    }

    const db = getDb();

    const [updated] = await db
      .update(memories)
      .set({
        title,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(memories.id, memoryId),
          eq(memories.ownerId, userId)
        )
      )
      .returning({
        id: memories.id,
        title: memories.title,
        updatedAt: memories.updatedAt,
      });

    if (!updated) {
      return NextResponse.json(
        { error: "Memory not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      memory: updated,
    });
  } catch (error) {
    console.error("Memory PATCH failed:", error);
    return NextResponse.json(
      { error: "Unable to update this memory." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const memoryId =
      url.searchParams.get("memoryId") ??
      "";

    if (!memoryId) {
      return NextResponse.json(
        { error: "Memory ID is required." },
        { status: 400 }
      );
    }

    const db = getDb();

    const deleted = await db
      .delete(memories)
      .where(
        and(
          eq(memories.id, memoryId),
          eq(memories.ownerId, userId)
        )
      )
      .returning({
        id: memories.id,
      });

    if (!deleted.length) {
      return NextResponse.json(
        { error: "Memory not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      memoryId,
    });
  } catch (error) {
    console.error("Memory DELETE failed:", error);
    return NextResponse.json(
      { error: "Unable to delete this memory." },
      { status: 500 }
    );
  }
}
