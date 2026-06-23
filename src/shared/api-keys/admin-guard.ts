// ── Admin Guard ────────────────────────────────────────────────────────────
// Server-side only. Provides admin-check utilities for protected routes.

/**
 * Admin user IDs are stored as a comma-separated list in VIXOR_ADMIN_IDS.
 * This is the simplest and most secure approach — no database migration needed.
 *
 * Example .env:
 *   VIXOR_ADMIN_IDS=abc123-def456-...,xyz789-uvw012-...
 */
const ADMIN_IDS = new Set(
  (process.env.VIXOR_ADMIN_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
);

/**
 * Check if a user ID has admin privileges.
 */
export function isAdmin(userId: string): boolean {
  if (ADMIN_IDS.size === 0) {
    console.warn(
      "[Admin Guard] VIXOR_ADMIN_IDS is not set. No users have admin access.",
    );
  }
  return ADMIN_IDS.has(userId);
}

/**
 * Throw if the user is not an admin.
 * Call this inside server functions that require admin access.
 *
 * @example
 *   const fn = createServerFn({ method: "GET" })
 *     .middleware([requireSupabaseAuth])
 *     .handler(async ({ context }) => {
 *       requireAdmin(context.userId);
 *       // ... admin logic
 *     });
 */
export function requireAdmin(userId: string): void {
  if (!isAdmin(userId)) {
    throw new Error("Forbidden: Admin access required");
  }
}

/**
 * Check admin status without throwing. Useful for conditional UI.
 */
export function canAccessAdminPanel(userId: string): boolean {
  return isAdmin(userId);
}