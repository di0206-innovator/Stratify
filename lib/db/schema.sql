-- ═══════════════════════════════════════════════════════════════
--  Stratify — PostgreSQL Schema
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

-- ─────────────────────────────────────────
--  STARTUPS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS startups (
    id              TEXT        PRIMARY KEY,
    owner_id        TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,
    logo_url        TEXT,
    pitch           TEXT        NOT NULL DEFAULT '',
    problem         TEXT        NOT NULL DEFAULT '',
    solution        TEXT        NOT NULL DEFAULT '',
    stage           TEXT        NOT NULL DEFAULT 'idea',
    industry        TEXT        NOT NULL DEFAULT '',
    geography       TEXT        NOT NULL DEFAULT '',
    team_status     TEXT        NOT NULL DEFAULT '',
    traction        TEXT        NOT NULL DEFAULT '',
    needs           TEXT        NOT NULL DEFAULT '',
    tech_stack      TEXT        NOT NULL DEFAULT '',
    score           INTEGER     NOT NULL DEFAULT 0,
    validation_score INTEGER,
    execution_readiness INTEGER,
    fundraising_readiness INTEGER,
    founder_market_fit INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS startups_owner_id_idx ON startups (owner_id);
CREATE INDEX IF NOT EXISTS startups_score_idx    ON startups (score DESC);

-- ─────────────────────────────────────────
--  POSTS (Startup progress / execution logs feed)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
    id              TEXT        PRIMARY KEY,
    startup_id      TEXT        REFERENCES startups(id) ON DELETE CASCADE,
    author_id       TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT        NOT NULL,
    type            TEXT        NOT NULL DEFAULT 'post', -- 'post', 'milestone', 'launch', 'update'
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS posts_startup_id_idx ON posts (startup_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts (created_at DESC);

-- ─────────────────────────────────────────
--  MATCHES (Relationships / connections)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
    id              TEXT        PRIMARY KEY,
    sender_id       TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id     TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          TEXT        NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (sender_id, receiver_id)
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_startups_updated_at') THEN
        CREATE TRIGGER trg_startups_updated_at
            BEFORE UPDATE ON startups
            FOR EACH ROW EXECUTE FUNCTION _set_updated_at();
    END IF;
END; $$;

-- ─────────────────────────────────────────
--  USER PROFILE EXTENSIONS
-- ─────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT '';

-- ─────────────────────────────────────────
--  STARTUP PROFILE EXTENSIONS
-- ─────────────────────────────────────────
ALTER TABLE startups ADD COLUMN IF NOT EXISTS deck_url TEXT DEFAULT '';
ALTER TABLE startups ADD COLUMN IF NOT EXISTS website_url TEXT DEFAULT '';
ALTER TABLE startups ADD COLUMN IF NOT EXISTS revenue TEXT DEFAULT '';
ALTER TABLE startups ADD COLUMN IF NOT EXISTS funding_raised TEXT DEFAULT '';

-- ─────────────────────────────────────────
--  DECISIONS (Founder memory: what was decided and why)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS decisions (
    id              TEXT        PRIMARY KEY,
    startup_id      TEXT        REFERENCES startups(id) ON DELETE CASCADE,
    author_id       TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT        NOT NULL,
    context         TEXT        NOT NULL DEFAULT '',
    outcome         TEXT        NOT NULL DEFAULT '',
    status          TEXT        NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS decisions_startup_id_idx ON decisions (startup_id);
CREATE INDEX IF NOT EXISTS decisions_created_at_idx ON decisions (created_at DESC);

-- ─────────────────────────────────────────
--  TIMELINE EVENTS (Unified audit trail)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timeline_events (
    id              TEXT        PRIMARY KEY,
    startup_id      TEXT        REFERENCES startups(id) ON DELETE CASCADE,
    actor_id        TEXT        REFERENCES users(id) ON DELETE SET NULL,
    event_type      TEXT        NOT NULL,
    title           TEXT        NOT NULL,
    description     TEXT        NOT NULL DEFAULT '',
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS timeline_startup_id_idx ON timeline_events (startup_id);
CREATE INDEX IF NOT EXISTS timeline_created_at_idx ON timeline_events (created_at DESC);
CREATE INDEX IF NOT EXISTS timeline_type_idx ON timeline_events (event_type);

-- ─────────────────────────────────────────
--  OPPORTUNITIES (Grants, accelerators, programs)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunities (
    id              TEXT        PRIMARY KEY,
    title           TEXT        NOT NULL,
    type            TEXT        NOT NULL DEFAULT 'grant',
    organization    TEXT        NOT NULL DEFAULT '',
    description     TEXT        NOT NULL DEFAULT '',
    geography       TEXT        NOT NULL DEFAULT '',
    industries      TEXT        NOT NULL DEFAULT '',
    stages          TEXT        NOT NULL DEFAULT '',
    deadline        TEXT,
    link            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS opportunities_type_idx ON opportunities (type);
CREATE INDEX IF NOT EXISTS opportunities_geo_idx ON opportunities (LOWER(geography));

-- ─────────────────────────────────────────
--  SIGNAL HISTORY (Per-startup signal log)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS signal_history (
    id              TEXT        PRIMARY KEY,
    startup_id      TEXT        REFERENCES startups(id) ON DELETE CASCADE,
    signal_data     JSONB       NOT NULL,
    relevance       TEXT        NOT NULL DEFAULT 'medium',
    is_read         BOOLEAN     NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS signal_history_startup_idx ON signal_history (startup_id);
CREATE INDEX IF NOT EXISTS signal_history_created_idx ON signal_history (created_at DESC);

-- ─────────────────────────────────────────
--  BOUNTIES (Startup bounties / requests for help)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bounties (
    id              TEXT        PRIMARY KEY,
    startup_id      TEXT        REFERENCES startups(id) ON DELETE CASCADE,
    title           TEXT        NOT NULL,
    description     TEXT        NOT NULL DEFAULT '',
    points          INTEGER     NOT NULL DEFAULT 10,
    reward          TEXT        NOT NULL DEFAULT '',
    status          TEXT        NOT NULL DEFAULT 'open', -- 'open', 'claimed', 'completed'
    submissions     JSONB       DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bounties_startup_idx ON bounties (startup_id);
CREATE INDEX IF NOT EXISTS bounties_status_idx ON bounties (status);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_bounties_updated_at') THEN
        CREATE TRIGGER trg_bounties_updated_at
            BEFORE UPDATE ON bounties
            FOR EACH ROW EXECUTE FUNCTION _set_updated_at();
    END IF;
END; $$;

-- ─────────────────────────────────────────
--  BRIEFS (Pitch briefs / summary exports)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS briefs (
    id              TEXT        PRIMARY KEY,
    startup_id      TEXT        NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    title           TEXT        NOT NULL,
    content         TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS briefs_startup_idx ON briefs (startup_id);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_briefs_updated_at') THEN
        CREATE TRIGGER trg_briefs_updated_at
            BEFORE UPDATE ON briefs
            FOR EACH ROW EXECUTE FUNCTION _set_updated_at();
    END IF;
END; $$;

-- ─────────────────────────────────────────
--  CAP TABLES (Equity Planner states)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cap_tables (
    id              TEXT        PRIMARY KEY,
    startup_id      TEXT        NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    version_name    TEXT        NOT NULL DEFAULT 'Current',
    state           JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cap_tables_startup_idx ON cap_tables (startup_id);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cap_tables_updated_at') THEN
        CREATE TRIGGER trg_cap_tables_updated_at
            BEFORE UPDATE ON cap_tables
            FOR EACH ROW EXECUTE FUNCTION _set_updated_at();
    END IF;
END; $$;
