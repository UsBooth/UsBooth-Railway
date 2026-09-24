import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../lib/db";
import { getSessionUserId } from "../../../lib/auth";
import { suggestions, users } from "../../../../../database/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CATEGORY_MAP = {
  feature: "FEATURE",
  template: "TEMPLATE",
  improvement: "IMPROVEMENT",
  other: "OTHER",
} as const;

function validEmail(value: string) {
  return value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const category = typeof body?.category === "string" ? body.category.toLowerCase() : "";
    const suggestion = typeof body?.suggestion === "string" ? body.suggestion.trim() : "";
    const suppliedEmail = typeof body?.email === "string" ? body.email.trim() : "";

    if (!(category in CATEGORY_MAP)) {
      return NextResponse.json({ error: "Choose a valid suggestion type." }, { status: 400 });
    }

    if (suggestion.length < 3) {
      return NextResponse.json({ error: "Please write a little more about your idea." }, { status: 400 });
    }

    if (suggestion.length > 4000) {
      return NextResponse.json({ error: "Suggestions are limited to 4000 characters." }, { status: 400 });
    }

    if (suppliedEmail && !validEmail(suppliedEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const userId = await getSessionUserId();
    const db = getDb();

    let email = suppliedEmail || null;
    if (userId && !email) {
      const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
      email = user?.email ?? null;
    }

    const [created] = await db.insert(suggestions).values({
      userId: userId || null,
      category: CATEGORY_MAP[category as keyof typeof CATEGORY_MAP],
      suggestion,
      email,
    }).returning({
      id: suggestions.id,
      status: suggestions.status,
      createdAt: suggestions.createdAt,
    });

    return NextResponse.json({ success: true, suggestion: created }, { status: 201 });
  } catch (error) {
    console.error("Suggestion POST failed:", error);
    return NextResponse.json({ error: "Unable to save your suggestion right now." }, { status: 500 });
  }
}
