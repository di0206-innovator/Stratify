-- ═══════════════════════════════════════════════════════════════
--  NeuralBI — PostgreSQL Schema
--  Designed for high concurrency (MVCC, indexed, advisory locks avoided)
--  All migrations are idempotent (safe to re-run)
-- ═══════════════════════════════════════════════════════════════

-- Required for gen_random_uuid() on older Postgres (≥13 has it built-in)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
--  USERS
--  id is TEXT to support both UUID (local) and Firebase UID (string)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              TEXT        PRIMARY KEY,
    email           TEXT        UNIQUE NOT NULL,
    name            TEXT        NOT NULL DEFAULT '',
    password_hash   TEXT,
    email_verified  BOOLEAN     NOT NULL DEFAULT false,
    role            TEXT        NOT NULL DEFAULT 'user',
    is_firebase     BOOLEAN     NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS users_role_idx        ON users (role) WHERE role <> 'user';

-- ─────────────────────────────────────────
--  SESSIONS
--  Stored in DB for audit trail.
--  Fast lookups use Redis (cache layer in front).
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id     TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT        UNIQUE NOT NULL,
    user_agent  TEXT        NOT NULL DEFAULT '',
    ip          TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions (token_hash);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx    ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

-- ─────────────────────────────────────────
--  AUTH TOKENS  (email verification, password reset)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_tokens (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id     TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        TEXT        NOT NULL,
    token_hash  TEXT        UNIQUE NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS auth_tokens_hash_idx ON auth_tokens (token_hash);
CREATE INDEX IF NOT EXISTS auth_tokens_type_idx ON auth_tokens (type, used_at, expires_at)
    WHERE used_at IS NULL;

-- ─────────────────────────────────────────
--  EMAIL OUTBOX  (simple queue for dev/SMTP integration)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_outbox (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    to_email    TEXT        NOT NULL,
    type        TEXT        NOT NULL,
    subject     TEXT,
    token       TEXT,
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_outbox_created_at_idx ON email_outbox (created_at DESC);

-- ─────────────────────────────────────────
--  REPORTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
    id                TEXT        PRIMARY KEY,
    owner_id          TEXT        REFERENCES users(id) ON DELETE SET NULL,
    title             TEXT,
    mode              TEXT,
    intelligence_mode TEXT,
    model             TEXT,
    markdown          TEXT,
    sections          JSONB,
    section_order     JSONB,
    sources           JSONB,
    founder_context   JSONB,
    generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reports_owner_id_idx     ON reports (owner_id);
CREATE INDEX IF NOT EXISTS reports_generated_at_idx ON reports (generated_at DESC);
CREATE INDEX IF NOT EXISTS reports_public_idx       ON reports (generated_at DESC)
    WHERE owner_id IS NULL;

-- ─────────────────────────────────────────
--  MARKET SIGNALS CACHE
--  UPSERT target — unique per (industry, geography)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS signals_cache (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    industry    TEXT        NOT NULL,
    geography   TEXT        NOT NULL,
    signals     JSONB,
    mode        TEXT        NOT NULL DEFAULT 'cache',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (industry, geography)
);

CREATE INDEX IF NOT EXISTS signals_cache_lookup_idx
    ON signals_cache (LOWER(industry), LOWER(geography));

-- ─────────────────────────────────────────
--  TRIGGERS — keep updated_at fresh
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
        CREATE TRIGGER trg_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION _set_updated_at();
    END IF;
END; $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_signals_updated_at') THEN
        CREATE TRIGGER trg_signals_updated_at
            BEFORE UPDATE ON signals_cache
            FOR EACH ROW EXECUTE FUNCTION _set_updated_at();
    END IF;
END; $$;
