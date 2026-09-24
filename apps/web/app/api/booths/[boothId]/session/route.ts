export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  and,
  count,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";

import { getDb } from "../../../../../lib/db";

import {
  getParticipantIdentity,
  setGuestParticipantCookie,
} from "../../../../../lib/participant-auth";

import {
  getEffectivePlanLimits,
  getPlanDisplayName,
} from "../../../../../lib/plans";

import {
  booths,
  boothSettings,
  boothSessions,
  participants,
  users,
} from "../../../../../../../database/schema";

type RouteContext = {
  params: Promise<{
    boothId: string;
  }>;
};

type UserPlan = "FREE" | "PLUS" | "PRO";

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const {
      userId,
      guestParticipantId,
    } = await getParticipantIdentity();

    const body =
      await request
        .json()
        .catch(() => ({}));

    const guestName =
      typeof body?.guestName === "string"
        ? body.guestName
            .trim()
            .slice(0, 40)
        : null;

    const { boothId } =
      await context.params;

    if (!boothId) {
      return NextResponse.json(
        {
          error:
            "Booth ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const db = getDb();

    /*
     * ========================================================
     * 1. FIND BOOTH
     * ========================================================
     */

    const [booth] =
      await db
        .select({
          id: booths.id,
          ownerId:
            booths.ownerId,
          name: booths.name,
          roomCode:
            booths.roomCode,
          type: booths.type,
          defaultTemplate: boothSettings.defaultTemplate,
        })
        .from(booths)
        .leftJoin(
          boothSettings,
          eq(boothSettings.boothId, booths.id)
        )
        .where(
          eq(
            booths.id,
            boothId
          )
        )
        .limit(1);

    if (!booth) {
      return NextResponse.json(
        {
          error:
            "Booth not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ========================================================
     * 2. GET BOOTH OWNER'S PLAN
     * ========================================================
     *
     * The OWNER'S plan determines how many people
     * can participate in the booth.
     *
     * FREE -> 2
     * PLUS -> 3
     * PRO  -> 5
     *
     * Full-access accounts -> unlimited
     */

    const [owner] =
      await db
        .select({
          plan: users.plan,
          email: users.email,
        })
        .from(users)
        .where(
          eq(
            users.id,
            booth.ownerId
          )
        )
        .limit(1);

    const ownerPlan =
      (owner?.plan as
        | UserPlan
        | undefined) ??
      "FREE";

    const limits =
      getEffectivePlanLimits(
        ownerPlan,
        owner?.email
      );

    const participantLimit =
      booth.type === "SOLO"
        ? 1
        : limits.maxParticipants;

    /*
     * ========================================================
     * 3. FIND EXISTING SESSION
     * ========================================================
     */

    let [session] =
      await db
        .select({
          id:
            boothSessions.id,
          boothId:
            boothSessions.boothId,
          status:
            boothSessions.status,
          createdAt:
            boothSessions.createdAt,
          startedAt:
            boothSessions.startedAt,
        })
        .from(boothSessions)
        .where(
          and(
            eq(
              boothSessions.boothId,
              boothId
            ),
            inArray(
              boothSessions.status,
              [
                "WAITING",
                "ACTIVE",
              ]
            )
          )
        )
        .orderBy(
          boothSessions.createdAt
        )
        .limit(1);

    /*
     * ========================================================
     * 4. CREATE SESSION IF NEEDED
     * ========================================================
     */

    if (!session) {
      const [
        createdSession,
      ] = await db
        .insert(boothSessions)
        .values({
          boothId:
            booth.id,
          status:
            "WAITING",
        })
        .returning({
          id:
            boothSessions.id,
          boothId:
            boothSessions.boothId,
          status:
            boothSessions.status,
          createdAt:
            boothSessions.createdAt,
          startedAt:
            boothSessions.startedAt,
        });

      if (!createdSession) {
        return NextResponse.json(
          {
            error:
              "Unable to create booth session.",
          },
          {
            status: 500,
          }
        );
      }

      session =
        createdSession;
    }

    /*
     * ========================================================
     * 5. CHECK EXISTING PARTICIPANT
     * ========================================================
     */

    let [participant] =
      guestParticipantId
        ? await db
            .select({
              id:
                participants.id,
              sessionId:
                participants.sessionId,
              userId:
                participants.userId,
              guestName:
                participants.guestName,
              status:
                participants.status,
              joinedAt:
                participants.joinedAt,
            })
            .from(
              participants
            )
            .where(
              and(
                eq(
                  participants.sessionId,
                  session.id
                ),
                eq(
                  participants.id,
                  guestParticipantId
                ),
                isNull(
                  participants.userId
                )
              )
            )
            .limit(1)
        : await db
            .select({
              id:
                participants.id,
              sessionId:
                participants.sessionId,
              userId:
                participants.userId,
              guestName:
                participants.guestName,
              status:
                participants.status,
              joinedAt:
                participants.joinedAt,
            })
            .from(
              participants
            )
            .where(
              and(
                eq(
                  participants.sessionId,
                  session.id
                ),
                eq(
                  participants.userId,
                  userId as string
                )
              )
            )
            .limit(1);

    /*
     * ========================================================
     * 6. ADD PARTICIPANT
     * ========================================================
     */

    if (!participant) {
      const [
        participantCount,
      ] = await db
        .select({
          count:
            participants.id,
        })
        .from(
          participants
        )
        .where(
          and(
            eq(
              participants.sessionId,
              session.id
            ),
            inArray(
              participants.status,
              [
                "JOINING",
                "CONNECTED",
                "READY",
                "CAPTURING",
              ]
            )
          )
        );

      const activeParticipantCount =
        Number(
          participantCount?.count ??
            0
        );

      /*
       * ------------------------------------------------------
       * ENFORCE PARTICIPANT LIMIT
       * ------------------------------------------------------
       *
       * null = unlimited.
       */

      if (
        participantLimit !==
          null &&
        activeParticipantCount >=
          participantLimit
      ) {
        return NextResponse.json(
          {
            error:
              booth.type === "SOLO"
                ? "This solo booth is already in use."
                : participantLimit === 2
                  ? "This booth is full. Free booths allow up to 2 people."
                  : `This booth is full. Your ${ownerPlan} plan allows up to ${participantLimit} people.`,

            code:
              "BOOTH_FULL",

            limit:
              participantLimit,

            plan:
              ownerPlan,

            planName:
              getPlanDisplayName(
                ownerPlan,
                owner?.email
              ),

            unlimited:
              limits.unlimited,
          },
          {
            status: 409,
          }
        );
      }

      /*
       * ------------------------------------------------------
       * CREATE PARTICIPANT
       * ------------------------------------------------------
       */

      const [
        createdParticipant,
      ] = await db
        .insert(participants)
        .values({
          sessionId:
            session.id,

          userId,

          guestName:
            userId
              ? null
              : guestName || "Guest",

          status:
            "JOINING",
        })
        .returning({
          id:
            participants.id,
          sessionId:
            participants.sessionId,
          userId:
            participants.userId,
          guestName:
            participants.guestName,
          status:
            participants.status,
          joinedAt:
            participants.joinedAt,
        });

      if (!createdParticipant) {
        return NextResponse.json(
          {
            error:
              "Unable to join booth session.",
          },
          {
            status: 500,
          }
        );
      }

      participant =
        createdParticipant;

      /*
       * Guests receive a participant
       * cookie so they can reconnect.
       */
      if (!userId) {
        await setGuestParticipantCookie(
          createdParticipant.id
        );
      }
    }

    /*
     * ========================================================
     * 7. ACTIVATE SESSION
     * ========================================================
     *
     * The current two-phone WebRTC experience
     * becomes ACTIVE once two participants exist.
     */

    const [
      activeParticipantResult,
    ] = await db
      .select({
        activeParticipantCount:
          count(
            participants.id
          ),
      })
      .from(
        participants
      )
      .where(
        and(
          eq(
            participants.sessionId,
            session.id
          ),
          inArray(
            participants.status,
            [
              "JOINING",
              "CONNECTED",
              "READY",
              "CAPTURING",
            ]
          )
        )
      );

    const requiredParticipants = booth.type === "SOLO" ? 1 : 2;

    if (
      Number(
        activeParticipantResult?.activeParticipantCount ??
          0
      ) >= requiredParticipants &&
      session.status ===
        "WAITING"
    ) {
      await db
        .update(
          boothSessions
        )
        .set({
          status:
            "ACTIVE",

          startedAt:
            session.startedAt ??
            new Date(),
        })
        .where(
          eq(
            boothSessions.id,
            session.id
          )
        );

      session.status =
        "ACTIVE";
    }

    /*
     * ========================================================
     * 8. GET ACTIVE PARTICIPANTS
     * ========================================================
     */

    const activeParticipants =
      await db
        .select({
          id: participants.id,
          userId: participants.userId,
          guestName: participants.guestName,
        })
        .from(participants)
        .where(
          and(
            eq(participants.sessionId, session.id),
            inArray(participants.status, [
              "JOINING",
              "CONNECTED",
              "READY",
              "CAPTURING",
            ])
          )
        )
        .orderBy(participants.joinedAt);

    const participantUserIds = activeParticipants
      .map((item) => item.userId)
      .filter((id): id is string => Boolean(id));

    const participantUsers = participantUserIds.length
      ? await db
          .select({
            id: users.id,
            displayName: users.displayName,
          })
          .from(users)
          .where(inArray(users.id, participantUserIds))
      : [];

    const participantNames = new Map(
      participantUsers.map((user) => [user.id, user.displayName])
    );

    const activeParticipantPayload = activeParticipants.map((item) => ({
      id: item.id,
      guestName: item.guestName ?? null,
      displayName: item.userId
        ? participantNames.get(item.userId) ?? null
        : null,
    }));

    /*
     * ========================================================
     * 9. GET THE JOINER'S OWN PLAN
     * ========================================================
     *
     * The booth OWNER controls participant capacity.
     * The PARTICIPANT controls their own feature access.
     *
     * Guests are always treated as FREE.
     */
    const [participantUser] = userId
      ? await db
          .select({
            plan: users.plan,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)
      : [];

    const participantPlan =
      (participantUser?.plan as UserPlan | undefined) ?? "FREE";

    const participantLimits = getEffectivePlanLimits(
      participantPlan,
      participantUser?.email
    );

    const participantLevel = participantLimits.unlimited
      ? 3
      : participantPlan === "PRO"
        ? 3
        : participantPlan === "PLUS"
          ? 2
          : 1;

    /*
     * ========================================================
     * 10. RETURN SESSION DATA
     * ========================================================
     */

    return NextResponse.json({
      initiatorId:
        activeParticipants[0]?.id ?? null,

      activeParticipants: activeParticipantPayload,

      template:
        booth.defaultTemplate ?? "classic-love-collage",

      booth: {
        id:
          booth.id,

        name:
          booth.name,

        roomCode:
          booth.roomCode,

        type:
          booth.type,
      },

      session: {
        id:
          session.id,

        boothId:
          session.boothId,

        status:
          session.status,

        createdAt:
          session.createdAt,

        startedAt:
          session.startedAt,
      },

      participant: {
        id:
          participant.id,

        sessionId:
          participant.sessionId,

        status:
          participant.status,

        guestName:
          participant.guestName ??
          null,
      },

      plan: {
        name:
          getPlanDisplayName(
            ownerPlan,
            owner?.email
          ),

        databasePlan:
          ownerPlan,

        participantLimit,

        unlimited:
          limits.unlimited,

        participantPlan,

        participantUnlimited:
          participantLimits.unlimited,

        participantLevel,

        featureAccess: {
          coreTemplates: true,
          plusTemplates: participantLevel >= 2,
          proTemplates: participantLevel >= 3,
          plusCustomization: participantLevel >= 2,
          advancedCustomization: participantLevel >= 3,
        },
      },
    });
  } catch (error) {
    console.error(
      "Unable to create/join booth session:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to join the booth right now.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      userId,
      guestParticipantId,
    } =
      await getParticipantIdentity();

    const { boothId } =
      await context.params;

    if (!boothId) {
      return NextResponse.json(
        {
          error:
            "Booth ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const db = getDb();

    const [session] =
      await db
        .select({
          id:
            boothSessions.id,
        })
        .from(
          boothSessions
        )
        .where(
          and(
            eq(
              boothSessions.boothId,
              boothId
            ),
            inArray(
              boothSessions.status,
              [
                "WAITING",
                "ACTIVE",
              ]
            )
          )
        )
        .orderBy(
          boothSessions.createdAt
        )
        .limit(1);

    if (!session) {
      return NextResponse.json({
        success: true,
      });
    }

    const [participant] =
      guestParticipantId
        ? await db
            .select({
              id:
                participants.id,
            })
            .from(
              participants
            )
            .where(
              and(
                eq(
                  participants.sessionId,
                  session.id
                ),
                eq(
                  participants.id,
                  guestParticipantId
                ),
                isNull(
                  participants.userId
                ),
                inArray(
                  participants.status,
                  [
                    "JOINING",
                    "CONNECTED",
                    "READY",
                    "CAPTURING",
                  ]
                )
              )
            )
            .limit(1)
        : await db
            .select({
              id:
                participants.id,
            })
            .from(
              participants
            )
            .where(
              and(
                eq(
                  participants.sessionId,
                  session.id
                ),
                eq(
                  participants.userId,
                  userId as string
                ),
                inArray(
                  participants.status,
                  [
                    "JOINING",
                    "CONNECTED",
                    "READY",
                    "CAPTURING",
                  ]
                )
              )
            )
            .limit(1);

    if (!participant) {
      return NextResponse.json({
        success: true,
      });
    }

    await db
      .update(
        participants
      )
      .set({
        status:
          "DISCONNECTED",

        leftAt:
          new Date(),
      })
      .where(
        eq(
          participants.id,
          participant.id
        )
      );

    const [
      activeCountResult,
    ] = await db
      .select({
        activeCount:
          count(
            participants.id
          ),
      })
      .from(
        participants
      )
      .where(
        and(
          eq(
            participants.sessionId,
            session.id
          ),
          inArray(
            participants.status,
            [
              "JOINING",
              "CONNECTED",
              "READY",
              "CAPTURING",
            ]
          )
        )
      );

    if (
      Number(
        activeCountResult?.activeCount ??
          0
      ) === 0
    ) {
      await db
        .update(
          boothSessions
        )
        .set({
          status:
            "ENDED",

          endedAt:
            new Date(),
        })
        .where(
          eq(
            boothSessions.id,
            session.id
          )
        );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Unable to leave booth session:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to leave the booth session.",
      },
      {
        status: 500,
      }
    );
  }
}
