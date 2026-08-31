// ============================================================================
// VIXOR Signal Transition Server Function
// ============================================================================
//
// Server-authoritative endpoint for signal state transitions.
// Replaces the old client-authoritative updateSignalTracking for status changes.
//
// The client REQUESTS a transition. The server DECIDES whether it's valid.
//
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import {
  executeSignalTransition,
  type TransitionServiceRequestWithVersion,
} from "./signal-transition.service";

export const requestSignalTransition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const data = d as TransitionServiceRequestWithVersion;

    if (!data.trackingId) {
      throw new Error("trackingId is required");
    }
    if (!data.currentVersion) {
      throw new Error("currentVersion (updated_at from your last read) is required");
    }

    // For price-based transitions, observedPrice must be present
    if (!data.requestedTransition && data.observedPrice === undefined) {
      throw new Error("observedPrice is required for price-based transitions");
    }

    // Validate requestedTransition values if provided
    if (
      data.requestedTransition &&
      !["cancelled", "expired", "invalidated"].includes(data.requestedTransition)
    ) {
      throw new Error("requestedTransition must be one of: cancelled, expired, invalidated");
    }

    return data;
  })
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    const result = await executeSignalTransition(supabase, userId, data);

    return result;
  });
