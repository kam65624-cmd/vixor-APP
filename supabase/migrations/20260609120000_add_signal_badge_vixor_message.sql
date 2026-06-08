-- Add signal_badge and vixor_message columns to analyses table
ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS signal_badge JSONB,
ADD COLUMN IF NOT EXISTS vixor_message TEXT;
