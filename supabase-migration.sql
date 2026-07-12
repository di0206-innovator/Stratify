-- ═══════════════════════════════════════════════════════════════
--  Stratify — Supabase Migration
--  Run this in: https://supabase.com/dashboard/project/kekoeliybtqrhgxazfhz/sql/new
-- ═══════════════════════════════════════════════════════════════

-- STARTUPS table (stores each founder's startup profile)
CREATE TABLE IF NOT EXISTS startups (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  owner_id        TEXT        NOT NULL,
  name            TEXT        NOT NULL DEFAULT 'My Startup',
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
  deck_url        TEXT        DEFAULT '',
  website_url     TEXT        DEFAULT '',
  revenue         TEXT        DEFAULT '',
  funding_raised  TEXT        DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS startups_owner_id_idx ON startups (owner_id);

ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS startups_service_all ON startups;
CREATE POLICY startups_service_all ON startups USING (true) WITH CHECK (true);

-- DECISIONS table (founder memory entries)
CREATE TABLE IF NOT EXISTS decisions (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  startup_id      TEXT        REFERENCES startups(id) ON DELETE CASCADE,
  author_id       TEXT        NOT NULL,
  title           TEXT        NOT NULL,
  context         TEXT        NOT NULL DEFAULT '',
  outcome         TEXT        NOT NULL DEFAULT '',
  status          TEXT        NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS decisions_startup_id_idx ON decisions (startup_id);
CREATE INDEX IF NOT EXISTS decisions_author_id_idx  ON decisions (author_id);
CREATE INDEX IF NOT EXISTS decisions_created_at_idx ON decisions (created_at DESC);

ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS decisions_service_all ON decisions;
CREATE POLICY decisions_service_all ON decisions USING (true) WITH CHECK (true);

-- TIMELINE EVENTS table
CREATE TABLE IF NOT EXISTS timeline_events (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  startup_id  TEXT        REFERENCES startups(id) ON DELETE CASCADE,
  actor_id    TEXT,
  event_type  TEXT        NOT NULL,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS timeline_events_startup_id_idx ON timeline_events (startup_id);
CREATE INDEX IF NOT EXISTS timeline_events_created_at_idx ON timeline_events (created_at DESC);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS timeline_events_service_all ON timeline_events;
CREATE POLICY timeline_events_service_all ON timeline_events USING (true) WITH CHECK (true);
