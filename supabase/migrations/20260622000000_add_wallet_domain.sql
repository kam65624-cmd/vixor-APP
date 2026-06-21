-- ============================================================================
-- VIXOR Wallet Domain — Supabase Migration
-- ============================================================================
--
-- Creates the wallet_sessions table for non-custodial wallet connections.
-- Each row represents one wallet connection session.
-- No private keys are stored — only public addresses.
--
-- Security:
--   - RLS enabled on all tables
--   - Users can only read/write their own sessions
--   - Service role can manage all sessions (server-side only)
-- ============================================================================

BEGIN;

-- 1. wallet_sessions — stores wallet connection sessions
CREATE TABLE IF NOT EXISTS public.wallet_sessions (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address  TEXT NOT NULL,
    chain           TEXT NOT NULL CHECK (chain IN ('solana', 'evm')),
    session_token   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL,
    ip_address      TEXT NOT NULL DEFAULT '',
    user_agent      TEXT NOT NULL DEFAULT '',
    is_active       BOOLEAN NOT NULL DEFAULT true,

    -- Constraints
    CONSTRAINT valid_wallet_address CHECK (
        (chain = 'solana' AND wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$') OR
        (chain = 'evm' AND wallet_address ~ '^0x[0-9a-fA-F]{40}$')
    ),
    CONSTRAINT valid_expires_at CHECK (expires_at > created_at)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_wallet_sessions_user_id ON public.wallet_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_sessions_address ON public.wallet_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_sessions_active ON public.wallet_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_wallet_sessions_expires ON public.wallet_sessions(expires_at) WHERE is_active = true;

-- 2. web3_transactions — stores Web3 transaction history (for B.3/B.4)
CREATE TABLE IF NOT EXISTS public.web3_transactions (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address  TEXT NOT NULL,
    chain           TEXT NOT NULL CHECK (chain IN ('solana', 'evm')),
    type            TEXT NOT NULL CHECK (type IN ('swap', 'transfer', 'nft_buy', 'nft_sell', 'stake', 'unstake')),
    tx_signature    TEXT,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'reverted')),
    input_token     TEXT,
    output_token    TEXT,
    input_amount    NUMERIC(38, 0),
    output_amount   NUMERIC(38, 0),
    input_usd       NUMERIC(20, 6),
    output_usd      NUMERIC(20, 6),
    gas_paid        NUMERIC(20, 6),
    venue           TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_web3_tx_user ON public.web3_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_web3_tx_wallet ON public.web3_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_web3_tx_status ON public.web3_transactions(user_id, status);

-- 3. nft_badges — stores NFT badge states for users
CREATE TABLE IF NOT EXISTS public.nft_badges (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type      TEXT NOT NULL CHECK (badge_type IN ('none', 'nft', 'collection', 'verified')),
    chain           TEXT NOT NULL CHECK (chain IN ('solana', 'evm')),
    nft_mint        TEXT,
    nft_name        TEXT,
    nft_image_url   TEXT,
    verified_at     TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_user_badge UNIQUE (user_id, chain)
);

CREATE INDEX IF NOT EXISTS idx_nft_badges_user ON public.nft_badges(user_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.wallet_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web3_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_badges ENABLE ROW LEVEL SECURITY;

-- wallet_sessions: users can read their own sessions
CREATE POLICY "Users can read own wallet sessions"
    ON public.wallet_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- wallet_sessions: users can insert their own sessions (via service role only)
CREATE POLICY "Users can insert own wallet sessions"
    ON public.wallet_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- wallet_sessions: users can update their own sessions (disconnect)
CREATE POLICY "Users can update own wallet sessions"
    ON public.wallet_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- wallet_sessions: users can delete their own sessions
CREATE POLICY "Users can delete own wallet sessions"
    ON public.wallet_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Service role bypass (needed for server functions)
CREATE POLICY "Service role full access to wallet_sessions"
    ON public.wallet_sessions FOR ALL
    USING (auth.role() = 'service_role');

-- web3_transactions: users can read their own transactions
CREATE POLICY "Users can read own web3 transactions"
    ON public.web3_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- web3_transactions: users can insert their own transactions
CREATE POLICY "Users can insert own web3 transactions"
    ON public.web3_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- web3_transactions: users can update their own transactions
CREATE POLICY "Users can update own web3 transactions"
    ON public.web3_transactions FOR UPDATE
    USING (auth.uid() = user_id);

-- Service role bypass
CREATE POLICY "Service role full access to web3_transactions"
    ON public.web3_transactions FOR ALL
    USING (auth.role() = 'service_role');

-- nft_badges: users can read their own badges
CREATE POLICY "Users can read own nft badges"
    ON public.nft_badges FOR SELECT
    USING (auth.uid() = user_id);

-- Service role bypass
CREATE POLICY "Service role full access to nft_badges"
    ON public.nft_badges FOR ALL
    USING (auth.role() = 'service_role');

COMMIT;
