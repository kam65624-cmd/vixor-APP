import { defineEventHandler, getMethod, createError } from "h3";
import { checkMigrations, getMigrationSQL } from "@/shared/migrate.server";

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
    const sql = getMigrationSQL();
    return sql;
  }

  throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
});
