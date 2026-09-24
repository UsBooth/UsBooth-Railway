export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { and, eq, gte, inArray, isNull, not } from "drizzle-orm";

import { getDb } from "../../../../../lib/db";
import { getParticipantIdentity } from "../../../../../lib/participant-auth";
import {
  boothSessions,
  participants,
  boothSignals,
} from "../../../../../../../database/schema";

type RouteContext = {
  params: Promise<{ boothId: string }>;
};

const ACTIVE_PARTICIPANT_STATUSES = [
  "JOINING",
  "CONNECTED",
  "READY",
  "CAPTURING",
] as const;

const ACTIVE_SESSION_STATUSES = ["WAITING", "ACTIVE"] as const;
const SUPPORTED_SIGNAL_TYPES = ["offer", "answer", "candidate", "capture"] as const;
type SignalType = (typeof SUPPORTED_SIGNAL_TYPES)[number];

type SignalPayload = Record<string, unknown>;

async function getCurrentParticipant(sessionId: string, userId: string | null, guestParticipantId: string | null) {
  const db = getDb();

  if (guestParticipantId) {
    const [participant] = await db
      .select({
        id: participants.id,
        sessionId: participants.sessionId,
        userId: participants.userId,
        guestName: participants.guestName,
        status: participants.status,
      })
      .from(participants)
      .where(and(
        eq(participants.sessionId, sessionId),
        eq(participants.id, guestParticipantId),
        isNull(participants.userId),
        inArray(participants.status, ACTIVE_PARTICIPANT_STATUSES),
      ))
      .limit(1);
    return participant ?? null;
  }

  if (!userId) return null;

  const [participant] = await db
    .select({
      id: participants.id,
      sessionId: participants.sessionId,
      userId: participants.userId,
      guestName: participants.guestName,
      status: participants.status,
    })
    .from(participants)
    .where(and(
      eq(participants.sessionId, sessionId),
      eq(participants.userId, userId),
      inArray(participants.status, ACTIVE_PARTICIPANT_STATUSES),
    ))
    .limit(1);

  return participant ?? null;
}

async function getActiveSession(boothId: string) {
  const db = getDb();
  const [session] = await db
    .select({
      id: boothSessions.id,
      boothId: boothSessions.boothId,
      status: boothSessions.status,
    })
    .from(boothSessions)
    .where(and(
      eq(boothSessions.boothId, boothId),
      inArray(boothSessions.status, ACTIVE_SESSION_STATUSES),
    ))
    .orderBy(boothSessions.createdAt)
    .limit(1);
  return session ?? null;
}

async function getActiveParticipants(sessionId: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: participants.id,
      userId: participants.userId,
      guestName: participants.guestName,
    })
    .from(participants)
    .where(and(
      eq(participants.sessionId, sessionId),
      inArray(participants.status, ACTIVE_PARTICIPANT_STATUSES),
    ))
    .orderBy(participants.joinedAt);

  return rows.map((participant) => ({
    id: participant.id,
    guestName: participant.guestName ?? null,
    userId: participant.userId ?? null,
  }));
}

function getTarget(payload: SignalPayload) {
  return typeof payload.toParticipantId === "string" ? payload.toParticipantId : null;
}

/* POST — send a WebRTC/capture signal */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { userId, guestParticipantId } = await getParticipantIdentity();
    const { boothId } = await context.params;
    if (!boothId) return NextResponse.json({ error: "Booth ID is required." }, { status: 400 });

    const body = await request.json().catch(() => null);
    const type = body?.type;
    const payload = body?.payload;

    if (typeof type !== "string" || !payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ error: "Invalid signaling message." }, { status: 400 });
    }

    if (!(SUPPORTED_SIGNAL_TYPES as readonly string[]).includes(type)) {
      return NextResponse.json({ error: "Unsupported signaling message." }, { status: 400 });
    }

    const session = await getActiveSession(boothId);
    if (!session) return NextResponse.json({ error: "No active booth session." }, { status: 409 });

    const participant = await getCurrentParticipant(session.id, userId, guestParticipantId);
    if (!participant) return NextResponse.json({ error: "You are not a participant in this booth." }, { status: 403 });

    const signalType = type as SignalType;
    const signalPayload = payload as SignalPayload;

    if (signalPayload.fromParticipantId && signalPayload.fromParticipantId !== participant.id) {
      return NextResponse.json({ error: "Invalid sender participant." }, { status: 400 });
    }

    if (signalType === "capture") {
      const timestamp = signalPayload.timestamp;
      if (timestamp !== undefined && typeof timestamp !== "number") {
        return NextResponse.json({ error: "Invalid capture timestamp." }, { status: 400 });
      }
    }

    const target = getTarget(signalPayload);
    if (target && target === participant.id) {
      return NextResponse.json({ error: "A signal cannot target its sender." }, { status: 400 });
    }

    if (target) {
      const active = await getActiveParticipants(session.id);
      if (!active.some((item) => item.id === target)) {
        return NextResponse.json({ error: "Target participant is no longer active." }, { status: 409 });
      }
    }

    const db = getDb();
    const [signal] = await db
      .insert(boothSignals)
      .values({
        sessionId: session.id,
        participantId: participant.id,
        type: signalType,
        payload: { ...signalPayload, fromParticipantId: participant.id },
      })
      .returning({ id: boothSignals.id, createdAt: boothSignals.createdAt });

    return NextResponse.json({
      success: true,
      signalId: signal?.id ?? null,
      type: signalType,
      createdAt: signal?.createdAt ?? null,
    });
  } catch (error) {
    console.error("WebRTC signal POST failed:", error);
    return NextResponse.json({ error: "Unable to send signaling message." }, { status: 500 });
  }
}

/* GET — receive targeted/broadcast signals plus the current participant list */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { userId, guestParticipantId } = await getParticipantIdentity();
    const { boothId } = await context.params;
    if (!boothId) return NextResponse.json({ error: "Booth ID is required." }, { status: 400 });

    const session = await getActiveSession(boothId);
    if (!session) return NextResponse.json({ signals: [], participants: [] });

    const participant = await getCurrentParticipant(session.id, userId, guestParticipantId);
    if (!participant) return NextResponse.json({ error: "You are not a participant in this booth." }, { status: 403 });

    const url = new URL(request.url);
    const since = url.searchParams.get("since");
    const db = getDb();

    const conditions = [
      eq(boothSignals.sessionId, session.id),
      not(eq(boothSignals.participantId, participant.id)),
    ];

    if (since) {
      const sinceDate = new Date(since);
      if (Number.isNaN(sinceDate.getTime())) {
        return NextResponse.json({ error: "Invalid since timestamp." }, { status: 400 });
      }
      conditions.push(gte(boothSignals.createdAt, sinceDate));
    }

    const rawSignals = await db
      .select({
        id: boothSignals.id,
        type: boothSignals.type,
        payload: boothSignals.payload,
        createdAt: boothSignals.createdAt,
      })
      .from(boothSignals)
      .where(and(...conditions))
      .orderBy(boothSignals.createdAt, boothSignals.id);

    const signals = rawSignals.filter((signal) => {
      const payload = (signal.payload ?? {}) as SignalPayload;
      const target = getTarget(payload);
      return !target || target === participant.id;
    });

    const activeParticipants = await getActiveParticipants(session.id);

    return NextResponse.json({
      signals,
      participants: activeParticipants.map((item) => ({
        id: item.id,
        guestName: item.guestName,
      })),
    });
  } catch (error) {
    console.error("WebRTC signal GET failed:", error);
    return NextResponse.json({ error: "Unable to retrieve signaling messages." }, { status: 500 });
  }
}
