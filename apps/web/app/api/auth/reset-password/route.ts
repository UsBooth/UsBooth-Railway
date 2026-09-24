export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";

import { getDb } from "../../../../lib/db";

import {
  users,
  passwordResetTokens,
} from "../../../../../../database/schema";

import { hashPassword } from "../../../../lib/auth";

import {
  hashPasswordResetToken,
} from "../../../../lib/password-reset";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const token =
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!token || !password) {
      return NextResponse.json(
        {
          error:
            "Reset token and new password are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Your new password must be at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const db = getDb();

    const tokenHash =
      hashPasswordResetToken(token);

    const [reset] = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
      })
      .from(passwordResetTokens)
      .where(
        and(
          eq(
            passwordResetTokens.tokenHash,
            tokenHash
          ),
          gt(
            passwordResetTokens.expiresAt,
            new Date()
          )
        )
      )
      .limit(1);

    if (!reset) {
      return NextResponse.json(
        {
          error:
            "This reset link is invalid or has expired.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Use the same Argon2 password hashing
     * system as normal UsBooth registration.
     */
    const passwordHash =
      await hashPassword(password);

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(
        eq(
          users.id,
          reset.userId
        )
      );

    /*
     * Delete the token so it cannot
     * be used again.
     */
    await db
      .delete(passwordResetTokens)
      .where(
        eq(
          passwordResetTokens.id,
          reset.id
        )
      );

    return NextResponse.json({
      message:
        "Your password has been reset. You can sign in now.",
    });
  } catch (error) {
    console.error(
      "Reset password failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to reset your password right now.",
      },
      {
        status: 500,
      }
    );
  }
}
