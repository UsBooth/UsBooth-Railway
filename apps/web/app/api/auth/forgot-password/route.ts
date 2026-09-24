export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "../../../../lib/db";

import {
  users,
  passwordResetTokens,
} from "../../../../../../database/schema";

import { normalizeEmail } from "../../../../lib/validation";

import {
  createPasswordResetToken,
  PASSWORD_RESET_MINUTES,
} from "../../../../lib/password-reset";

import { sendPasswordResetEmail } from "../../../../lib/email";

export async function POST(request: Request) {
  try {
    console.log("[FORGOT PASSWORD] Request received.");

    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? normalizeEmail(body.email)
        : "";

    console.log(
      "[FORGOT PASSWORD] Normalized email:",
      email ? "[provided]" : "[empty]"
    );

    if (!email) {
      return NextResponse.json(
        {
          error: "Enter your email address.",
        },
        { status: 400 }
      );
    }

    const db = getDb();

    console.log("[FORGOT PASSWORD] Looking up user...");

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        status: users.status,
      })
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.status, "ACTIVE")
        )
      )
      .limit(1);

    if (!user) {
      console.log(
        "[FORGOT PASSWORD] No active user found."
      );

      return NextResponse.json({
        message:
          "If that email belongs to a UsBooth account, a reset link is on its way.",
      });
    }

    console.log(
      "[FORGOT PASSWORD] Active user found."
    );

    await db
      .delete(passwordResetTokens)
      .where(
        eq(
          passwordResetTokens.userId,
          user.id
        )
      );

    console.log(
      "[FORGOT PASSWORD] Old reset tokens cleared."
    );

    const {
      token,
      tokenHash,
    } = createPasswordResetToken();

    const expiresAt = new Date(
      Date.now() +
        PASSWORD_RESET_MINUTES * 60 * 1000
    );

    await db
      .insert(passwordResetTokens)
      .values({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

    console.log(
      "[FORGOT PASSWORD] New reset token created."
    );

    // Always use the live UsBooth URL for password reset links.
    const appUrl =
      process.env.APP_URL ||
      "https://usbooth-web.onrender.com";

    const resetUrl =
      `${appUrl}/reset-password?token=` +
      encodeURIComponent(token);

    console.log(
      "[FORGOT PASSWORD] Reset URL generated from APP_URL."
    );

    console.log(
      "[FORGOT PASSWORD] Sending reset email..."
    );

    await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
    });

    console.log(
      "[FORGOT PASSWORD] Reset email sent successfully."
    );

    return NextResponse.json({
      message:
        "If that email belongs to a UsBooth account, a reset link is on its way.",
    });
  } catch (error) {
    console.error(
      "[FORGOT PASSWORD] FAILED:",
      error
    );

    return NextResponse.json(
      {
        error:
          "We couldn't send the reset email right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
