export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { users } from "../../../../../../database/schema";
import { getSessionUserId } from "../../../../lib/auth";

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const db = getDb();

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        username: users.username,
        status: users.status,
        plan: users.plan,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Session lookup failed:", error);

    return NextResponse.json({ user: null });
  }
}
