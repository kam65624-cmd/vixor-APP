/**
 * @module server/api/vixor-ai/weekly-report
 * @description Cron endpoint for the VIXOR Behavioral Analyst agent.
 * Generates weekly behavioral reports for active users (logged in within 7 days).
 *
 * Auth: Vercel Cron (x-vercel-cron: 1) or CRON_SECRET.
 * Schedule: Sunday 08:00 UTC (configured in vercel.json, not here).
 */

import { defineEventHandler, getMethod, getHeader, createError } from "h3";
import { supabaseAdmin } from "@/shared/supabase/client.server";

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method !== "GET" && method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // Security: Verify this is a legitimate cron request
  const isVercelCron = getHeader(event, "x-vercel-cron") === "1";
  const cronSecret = process.env.CRON_SECRET;

  if (isVercelCron) {
    // Vercel Cron requests are automatically authenticated
  } else if (cronSecret) {
    const authHeader = getHeader(event, "authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error(
      "[CRON SECURITY] Weekly report request is not from Vercel Cron and CRON_SECRET is not set. Refusing.",
    );
    throw createError({ statusCode: 500, statusMessage: "Cron not configured" });
  }

  try {
    const { generateWeeklyReport } = await import("@/domains/copilot/server/analyst.agent");

    // Find active users (logged in within the last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();

    const { data: activeUsers, error: usersError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .gte("updated_at", sevenDaysAgo)
      .limit(100);

    if (usersError) {
      console.error("[Weekly Report] Failed to fetch active users:", usersError.message);
      return { generated: 0, error: "Failed to fetch active users." };
    }

    if (!activeUsers || activeUsers.length === 0) {
      return { generated: 0, message: "No active users found." };
    }

    let generated = 0;
    let failed = 0;

    // Generate reports for each active user
    for (const user of activeUsers) {
      try {
        await generateWeeklyReport(user.id);
        generated++;
      } catch (err) {
        failed++;
        console.warn(
          `[Weekly Report] Failed for user ${user.id}:`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }

    return {
      generated,
      failed,
      total: activeUsers.length,
      date: new Date().toISOString().split("T")[0],
    };
  } catch (error) {
    console.error("[Weekly Report] Error:", error);
    throw createError({ statusCode: 500, statusMessage: "Internal server error" });
  }
});
