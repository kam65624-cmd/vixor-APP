import { defineEventHandler, getMethod, getHeader, createError, setResponseStatus } from "h3";
import { checkMigrations, getPendingMigrationsSQL } from "@/shared/migrate.server";
import { handlePreflight, rateLimit, validateAdminKey } from "./_security";

export default defineEventHandler(async (event) => {
  if (handlePreflight(event)) return;
  if (!rateLimit(event)) return;

  const method = getMethod(event);

  // SECURITY: Admin key (fast path) OR CRON_SECRET
  if (!validateAdminKey(event)) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = getHeader(event, "authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        setResponseStatus(event, 401);
        return { error: "Unauthorized" };
      }
    } else if (process.env.NODE_ENV === "production") {
      setResponseStatus(event, 403);
      return { error: "Migrations not accessible in production without CRON_SECRET" };
    }
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
    const pendingSQL = await getPendingMigrationsSQL();
    return { sql: pendingSQL, instructions: "Run this SQL in the Supabase Dashboard SQL Editor" };
  }

  throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
});
