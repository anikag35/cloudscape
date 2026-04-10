-- Cloudscape DB Schema
-- Run in Supabase SQL editor or as a migration

CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  aws_role_arn  TEXT,
  aws_external_id TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  aws_region    TEXT DEFAULT 'us-east-1',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE incidents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id),
  title         TEXT NOT NULL,
  symptom       TEXT NOT NULL,
  severity      TEXT DEFAULT 'sev2' CHECK (severity IN ('sev1','sev2','sev3')),
  status        TEXT DEFAULT 'investigating' CHECK (status IN ('investigating','identified','mitigating','resolved')),
  phase         TEXT DEFAULT 'collecting' CHECK (phase IN ('collecting','analyzing','remediating','documenting','complete')),
  root_cause    JSONB,
  overall_score INTEGER,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE incident_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id   UUID REFERENCES incidents(id) ON DELETE CASCADE,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT now(),
  source        TEXT NOT NULL,
  event_type    TEXT NOT NULL,
  content       TEXT NOT NULL,
  raw_data      JSONB,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_events_incident ON incident_events(incident_id, timestamp);

CREATE TABLE remediations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id   UUID REFERENCES incidents(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  commands      TEXT[],
  terraform     TEXT,
  risk_level    TEXT NOT NULL CHECK (risk_level IN ('safe','caution','dangerous')),
  cost_impact   TEXT,
  timeframe     TEXT NOT NULL CHECK (timeframe IN ('immediate','long_term')),
  status        TEXT DEFAULT 'suggested' CHECK (status IN ('suggested','applied','skipped')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE postmortems (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id   UUID REFERENCES incidents(id) ON DELETE CASCADE UNIQUE,
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Enable Supabase Realtime on incident_events so the frontend
-- can subscribe and render the timeline live
ALTER PUBLICATION supabase_realtime ADD TABLE incident_events;
ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
