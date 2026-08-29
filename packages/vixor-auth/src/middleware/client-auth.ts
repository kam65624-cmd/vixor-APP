// ============================================================================
// VIXOR Auth — Client Middleware (attachSupabaseAuth)
// ============================================================================

import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "../browser-client";

export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    try {
      const {
        data: { user },
        error: getUserError,
      } = await supabase.auth.getUser();

      if (!getUserError && user) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          return next({ headers: { Authorization: `Bearer ${session.access_token}` } });
        }
      }

      console.warn("[Auth Attacher] No valid session:", getUserError?.message || "no user");
      return next({ headers: {} });
    } catch (error) {
      console.warn("[Auth Attacher] Unexpected error:", error);
      return next({ headers: {} });
    }
  },
);
