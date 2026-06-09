import { defineEventHandler, getMethod, createError } from "h3";
import { checkMigrations, getMigrationSQL, getPendingMigrationsSQL } from "@/shared/migrate.server";

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

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
