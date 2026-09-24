export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { users, userSettings } from "../../../../../../database/schema";
import { createSession, hashPassword } from "../../../../lib/auth";
import {
  normalizeEmail,
  validateRegistration,
} from "../../../../lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string" ? body.email : "";
    const password =
      typeof body.password === "string" ? body.password : "";
    const displayName =
      typeof body.displayName === "string" ? body.displayName : "";

    const validationError = validateRegistration({
      email,
      password,
      displayName,
    });

    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    const db = getDb();
    const normalizedEmail = normalizeEmail(email);

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        displayName: displayName.trim(),
      })
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
      });

    await db.insert(userSettings).values({
      userId: user.id,
    });

    await createSession(user.id);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Registration failed:", error);

    return NextResponse.json(
      { error: "Unable to create account." },
      { status: 500 }
    );
  }
}
