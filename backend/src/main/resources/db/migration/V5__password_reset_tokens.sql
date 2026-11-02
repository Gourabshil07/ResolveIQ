-- V5__password_reset_tokens.sql
-- ResolveIQ Security: Dedicated Table for Cryptographically Hashed Password Reset Tokens
--
-- Rationale:
-- 1. Store only a SHA-256 hash of single-use reset tokens, never the plaintext token.
-- 2. Enforce foreign key cascade on user deletion.
-- 3. Include expiration timestamps, single-use flags, and brute-force attempt counters.
-- 4. Enable Row Level Security (RLS) and revoke anon/authenticated access to preserve Supabase security hardening.

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_token_hash ON public.password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_reset_token_user ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_token_expires ON public.password_reset_tokens(expires_at);

-- Row Level Security & Access Hardening
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.password_reset_tokens FROM anon, authenticated;
