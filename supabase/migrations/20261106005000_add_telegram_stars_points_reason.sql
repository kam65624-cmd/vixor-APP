-- Add the Stars ledger reason in its own migration so the new enum value is
-- committed before the fulfillment function references it.
ALTER TYPE public.points_reason
  ADD VALUE IF NOT EXISTS 'telegram_stars_purchase';
