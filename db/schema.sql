-- Captured paid-traffic and website leads.
-- The app also creates this table on first use when DATABASE_URL or POSTGRES_URL is set.
-- Safe to run by hand in the Neon SQL editor or the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS captured_leads (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  sms_opt_in boolean NOT NULL DEFAULT false,
  source text NOT NULL,
  intent text,
  status text NOT NULL DEFAULT 'new',
  property_address text,
  property_id text,
  search_label text,
  notes text NOT NULL DEFAULT '',
  consent boolean NOT NULL DEFAULT false,
  consent_text text,
  attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  assigned_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
