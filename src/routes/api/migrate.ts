import { defineEventHandler, getMethod, getHeader, createError } from "h3";
import { checkMigrations, getMigrationSQL, getPendingMigrationsSQL } from "@/shared/migrate.server";

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  // SECURITY: Require CRON_SECRET or admin access for migration endpoints
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = getHeader(event, "authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
  } else if (process.env.NODE_ENV === "production") {
    throw createError({ statusCode: 403, statusMessage: "Migrations not accessible in production without CRON_SECRET" });
  }

  if (method === "GET") {
    try {
      const status = await checkMigrations();
      return status;
    } catch (error) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to check migrations",
        data: String(error),
      });
    }
  }

  if (method === "POST") {
    // Return only the SQL for tables that are missing
    const pendingSQL = await getPendingMigrationsSQL();
    return { sql: pendingSQL, instructions: "Run this SQL in the Supabase Dashboard SQL Editor" };
  }

  throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
});
