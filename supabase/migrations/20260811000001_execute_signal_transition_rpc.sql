-- ============================================================================
-- VIXOR Phase 3: Atomic Signal Transition RPC
-- ============================================================================
-- Wraps signal_tracking UPDATE + signal_transitions INSERT in a single
-- PostgreSQL transaction. Returns the transition result or raises an error.
-- ============================================================================

CREATE OR REPLACE FUNCTION execute_signal_transition(
  p_tracking_id UUID,
  p_user_id UUID,
  p_current_version TIMESTAMPTZ,
  p_new_status TEXT,
  p_current_price DOUBLE PRECISION DEFAULT NULL,
  p_hit_tp INTEGER DEFAULT NULL,
  p_activated_at TIMESTAMPTZ DEFAULT NULL,
  p_resolved_at TIMESTAMPTZ DEFAULT NULL,
  p_from_status TEXT DEFAULT NULL,
  p_event_type TEXT DEFAULT NULL,
  p_observed_price DOUBLE PRECISION DEFAULT NULL,
  p_tp_index INTEGER DEFAULT NULL,
  p_transition_reason TEXT DEFAULT NULL,
  p_observed_at TIMESTAMPTZ DEFAULT NULL,
  p_actor TEXT DEFAULT 'system',
  p_source TEXT DEFAULT 'server'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_signal_updated BOOLEAN;
  v_transition_id UUID;
  v_result JSONB;
BEGIN
  -- Step 1: Update signal_tracking with optimistic lock
  UPDATE signal_tracking
  SET
    status = p_new_status,
    current_price = COALESCE(p_current_price, current_price),
    hit_tp = COALESCE(p_hit_tp, hit_tp),  -- trigger enforces final invariant
    activated_at = COALESCE(p_activated_at, activated_at),
    resolved_at = COALESCE(p_resolved_at, resolved_at),
    updated_at = clock_timestamp()
  WHERE id = p_tracking_id
    AND user_id = p_user_id
    AND updated_at = p_current_version;

  GET DIAGNOSTICS v_signal_updated = ROW_COUNT;

  IF NOT v_signal_updated THEN
    RAISE EXCEPTION 'CONFLICT: Signal state has changed concurrently or not found'
      USING ERRCODE = 'P0004';
  END IF;

  -- Step 2: Insert audit record (same transaction — atomic)
  INSERT INTO signal_transitions (
    signal_tracking_id, user_id,
    from_status, to_status, event_type,
    observed_price, tp_index, transition_reason,
    server_received_at, observed_at,
    actor, source
  ) VALUES (
    p_tracking_id, p_user_id,
    COALESCE(p_from_status, 'unknown'), p_new_status, COALESCE(p_event_type, 'unknown'),
    p_observed_price, p_tp_index, p_transition_reason,
    clock_timestamp(), p_observed_at,
    p_actor, p_source
  )
  RETURNING id INTO v_transition_id;

  -- Step 3: Return result
  v_result := jsonb_build_object(
    'ok', true,
    'transition', jsonb_build_object(
      'id', v_transition_id,
      'trackingId', p_tracking_id,
      'to', p_new_status,
      'event', COALESCE(p_event_type, 'unknown'),
      'price', p_observed_price,
      'serverReceivedAt', clock_timestamp()
    )
  );

  RETURN v_result;
END;
$$;

-- RLS: service_role can execute; users cannot call RPC directly
-- (the application layer calls this via admin client)
ALTER FUNCTION execute_signal_transition SECURITY DEFINER;
