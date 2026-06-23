/**
 * @module routes/api/admin/vault-status
 * @description Admin-only API route that returns which providers are configured.
 *
 * Protection: Requires either:
 *   1. Authorization: Bearer <HEALTH_TOKEN> header, OR
 *   2. A valid Supabase JWT where the user has an admin role in profiles table.
 *
 * Returns JSON with provider names, configured status (boolean), labels, and
 * categories. NO actual key values are ever exposed.
 */

import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getPublicStatus, getHealthToken } from "@/shared/vault";
import { createClient } from "@supabase/supabase-js";

export const APIRoute = createAPIFileRoute("/api/admin/vault-status")({
  GET: async ({ request }) => {
    // ── Auth check ──────────────────────────────────────────────────────────
    const isAuthorized = await checkAdminAccess(request);
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin access required" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // ── Return public status ────────────────────────────────────────────────
    const status = getPublicStatus();
    return new Response(JSON.stringify(status), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});

// ── Auth helpers ─────────────────────────────────────────────────────────────

/**
 * Checks if the request is authorized for admin access.
 *
 * Two methods accepted:
 *   1. `Authorization: Bearer <HEALTH_TOKEN>` — machine-to-machine auth
 *   2. Valid Supabase JWT for a user whose profile has `role = 'admin'`
 */
async function checkAdminAccess(request: Request): Promise<boolean> {
  // Method 1: HEALTH_TOKEN (simple, for internal/machine auth)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const healthToken = getHealthToken();
    if (healthToken && token === healthToken) {
      return true;
    }

    // Method 2: Supabase JWT → check admin role in profiles
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey =
      process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey && token.length > 20) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
          auth: {
            storage: undefined,
            persistSession: false,
            autoRefreshToken: false,
          },
        });

        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

          if (profile?.role === "admin") {
            return true;
          }
        }
      } catch {
        // Fall through to false
      }
    }
  }

  return false;
}