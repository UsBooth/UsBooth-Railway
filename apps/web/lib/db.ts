import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../../../database/schema";

let pool: Pool | undefined;
let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;

  if (!value) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return value;
}

export function getDb() {
  if (!database) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 5,
    });

    database = drizzle(pool, { schema });
  }

  return database;
}

