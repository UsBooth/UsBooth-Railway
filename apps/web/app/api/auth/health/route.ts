export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "../../../../lib/db";

export async function GET() {
  const checks: Record<string, string> = {};

  try {
    const db = getDb();

    await db.execute(sql`select 1`);
    checks.connection = "ok";

    try {
      await db.execute(sql`select id, email, password_hash, display_name, status from users limit 1`);
      checks.users_table = "ok";
    } catch (error) {
      checks.users_table = error instanceof Error ? error.message : "failed";
    }

    try {
      await db.execute(sql`select user_id from user_settings limit 1`);
      checks.user_settings_table = "ok";
    } catch (error) {
      checks.user_settings_table = error instanceof Error ? error.message : "failed";
    }

    return NextResponse.json({
      ok: checks.connection === "ok" &&
          checks.users_table === "ok" &&
          checks.user_settings_table === "ok",
      checks,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      checks,
      connection_error: error instanceof Error ? error.message : "unknown error",
    }, { status: 503 });
  }
}
