import { defineEventHandler } from "vinxi/http";
import { checkMigrations, getMigrationSQL } from "@/shared/migrate.server";

export default defineEventHandler(async (event) => {
  const method = event.method;

  // GET: Check migration status
  if (method === "GET") {
    try {
      const status = await checkMigrations();
      return new Response(JSON.stringify(status, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Failed to check migrations", detail: String(error) }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // POST: Return the SQL that needs to be executed
  if (method === "POST") {
    const sql = getMigrationSQL();
    return new Response(sql, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
});
