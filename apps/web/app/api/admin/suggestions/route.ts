import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { getSessionUserId } from "../../../../lib/auth";
import { suggestions, users } from "../../../../../../database/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUSES = ["NEW", "REVIEWING", "PLANNED", "BUILDING", "SHIPPED"] as const;

async function requireAdmin() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const db = getDb();
  const [user] = await db.select({ id: users.id, email: users.email, displayName: users.displayName })
    .from(users).where(eq(users.id, userId)).limit(1);

  if (!user) return null;

  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(user.email.toLowerCase()) ? user : null;
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const db = getDb();
    const rows = await db.select({
      id: suggestions.id,
      category: suggestions.category,
      suggestion: suggestions.suggestion,
      email: suggestions.email,
      status: suggestions.status,
      adminNotes: suggestions.adminNotes,
      createdAt: suggestions.createdAt,
      updatedAt: suggestions.updatedAt,
      userId: suggestions.userId,
      userDisplayName: users.displayName,
      userEmail: users.email,
    })
      .from(suggestions)
      .leftJoin(users, eq(suggestions.userId, users.id))
      .orderBy(desc(suggestions.createdAt));

    return NextResponse.json({ suggestions: rows });
  } catch (error) {
    console.error("Admin suggestions GET failed:", error);
    return NextResponse.json({ error: "Unable to load suggestions." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const body = await request.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id : "";
    const status = typeof body?.status === "string" ? body.status.toUpperCase() : "";
    const adminNotes = typeof body?.adminNotes === "string" ? body.adminNotes.trim().slice(0, 4000) : undefined;

    if (!id) return NextResponse.json({ error: "Suggestion ID is required." }, { status: 400 });
    if (!STATUSES.includes(status as typeof STATUSES[number])) {
      return NextResponse.json({ error: "Invalid suggestion status." }, { status: 400 });
    }

    const db = getDb();
    const [updated] = await db.update(suggestions)
      .set({
        status: status as typeof STATUSES[number],
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        updatedAt: sql`now()`,
      })
      .where(eq(suggestions.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Suggestion not found." }, { status: 404 });
    return NextResponse.json({ success: true, suggestion: updated });
  } catch (error) {
    console.error("Admin suggestions PATCH failed:", error);
    return NextResponse.json({ error: "Unable to update suggestion." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const body = await request.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: "Suggestion ID is required." }, { status: 400 });

    const db = getDb();
    await db.delete(suggestions).where(eq(suggestions.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin suggestions DELETE failed:", error);
    return NextResponse.json({ error: "Unable to delete suggestion." }, { status: 500 });
  }
}
