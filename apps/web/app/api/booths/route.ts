import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";

import {
  booths,
  boothSettings,
  users,
} from "../../../../../database/schema";

import { normalizeTemplateId } from "../../../lib/templates/template-utils";
import { getDb } from "../../../lib/db";
import { getSessionUserId } from "../../../lib/auth";
import { generateRoomCode } from "../../../lib/room-code";
import {
  getEffectivePlanLimits,
  getPlanDisplayName,
} from "../../../lib/plans";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_TYPES = ["SOLO", "COUPLE", "RANDOM"] as const;

type BoothType = (typeof VALID_TYPES)[number];

/*
 * ============================================================
 * GET — FETCH USER BOOTHS
 * ============================================================
 */

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const db = getDb();

    /*
     * --------------------------------------------------------
     * Get the current user's plan AND email.
     *
     * Email is required because the special full-access
     * accounts are identified by email.
     * --------------------------------------------------------
     */

    const [user] = await db
      .select({
        plan: users.plan,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * Calculate effective limits.
     *
     * Normal accounts:
     * FREE = 3
     * PLUS = 5
     * PRO = 10
     *
     * Full-access accounts:
     * unlimited
     * --------------------------------------------------------
     */

    const limits = getEffectivePlanLimits(
      user.plan,
      user.email
    );

    const userBooths = await db
      .select()
      .from(booths)
      .where(eq(booths.ownerId, userId));

    const boothLimit = limits.maxBooths;

    const remaining =
      boothLimit === null
        ? null
        : Math.max(
            0,
            boothLimit - userBooths.length
          );

    return NextResponse.json({
      booths: userBooths,

      /*
       * Actual database plan.
       */
      plan: user.plan,

      /*
       * Display-friendly entitlement.
       *
       * Normal:
       * FREE / PLUS / PRO
       *
       * Special accounts:
       * FULL ACCESS
       */
      planName: getPlanDisplayName(
        user.plan,
        user.email
      ),

      /*
       * null = unlimited
       */
      limit: boothLimit,

      /*
       * null = unlimited
       */
      remaining,

      unlimited: limits.unlimited,
    });
  } catch (error) {
    console.error(
      "Failed to fetch booths:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to fetch booths.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ============================================================
 * POST — CREATE BOOTH
 * ============================================================
 */

export async function POST(
  request: Request
) {
  try {
    const userId =
      await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request
        .json()
        .catch(() => ({}));

    const name =
      typeof body?.name === "string"
        ? body.name.trim()
        : "";

    const type =
      typeof body?.type === "string"
        ? body.type.toUpperCase()
        : "RANDOM";

    const description =
      typeof body?.description === "string"
        ? body.description.trim()
        : null;

    const template =
      normalizeTemplateId(
        body?.template
      );

    /*
     * --------------------------------------------------------
     * Validate booth name
     * --------------------------------------------------------
     */

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Booth name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (name.length > 80) {
      return NextResponse.json(
        {
          error:
            "Booth name must be 80 characters or fewer.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * Validate booth type
     * --------------------------------------------------------
     */

    if (
      !VALID_TYPES.includes(
        type as BoothType
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid booth type.",
        },
        {
          status: 400,
        }
      );
    }

    const db = getDb();

    /*
     * --------------------------------------------------------
     * Get current user's plan + email
     * --------------------------------------------------------
     */

    const [user] = await db
      .select({
        plan: users.plan,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * Calculate effective limits
     * --------------------------------------------------------
     */

    const limits =
      getEffectivePlanLimits(
        user.plan,
        user.email
      );

    /*
     * --------------------------------------------------------
     * Count existing booths
     * --------------------------------------------------------
     */

    const existing = await db
      .select({
        count: count(),
      })
      .from(booths)
      .where(
        eq(
          booths.ownerId,
          userId
        )
      );

    const boothCount = Number(
      existing[0]?.count ?? 0
    );

    /*
     * --------------------------------------------------------
     * Enforce booth limit
     *
     * null means unlimited.
     * --------------------------------------------------------
     */

    if (
      limits.maxBooths !== null &&
      boothCount >=
        limits.maxBooths
    ) {
      return NextResponse.json(
        {
          error:
            "You've reached your booth limit for your current plan.",

          code:
            "BOOTH_LIMIT_REACHED",

          plan: user.plan,

          planName:
            getPlanDisplayName(
              user.plan,
              user.email
            ),

          limit:
            limits.maxBooths,

          remaining: 0,

          unlimited:
            limits.unlimited,
        },
        {
          status: 403,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * Generate a unique room code
     * --------------------------------------------------------
     */

    let booth = null;

    for (
      let attempt = 0;
      attempt < 10;
      attempt++
    ) {
      const roomCode =
        generateRoomCode();

      try {
        const result =
          await db
            .insert(booths)
            .values({
              ownerId: userId,

              type:
                type as BoothType,

              name,

              roomCode,

              description,
            })
            .returning();

        booth =
          result[0] ?? null;

        break;
      } catch (error) {
        /*
         * Room-code collisions are retried.
         *
         * Any other database problem will still be
         * surfaced after the final attempt.
         */

        if (attempt === 9) {
          throw error;
        }
      }
    }

    if (!booth) {
      throw new Error(
        "Unable to generate a unique room code."
      );
    }

    /*
     * --------------------------------------------------------
     * Create default booth settings
     * --------------------------------------------------------
     */

    await db
      .insert(boothSettings)
      .values({
        boothId:
          booth.id,

        defaultTemplate:
          template,
      });

    /*
     * --------------------------------------------------------
     * Calculate remaining booths
     * --------------------------------------------------------
     */

    const remaining =
      limits.maxBooths === null
        ? null
        : Math.max(
            0,
            limits.maxBooths -
              boothCount -
              1
          );

    /*
     * --------------------------------------------------------
     * Return created booth + entitlement information
     * --------------------------------------------------------
     */

    return NextResponse.json(
      {
        booth,

        plan: user.plan,

        planName:
          getPlanDisplayName(
            user.plan,
            user.email
          ),

        limit:
          limits.maxBooths,

        remaining,

        unlimited:
          limits.unlimited,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create booth:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create booth.",
      },
      {
        status: 500,
      }
    );
  }
}
