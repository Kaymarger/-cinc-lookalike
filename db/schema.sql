-- Captured paid-traffic and website leads, office users, and per-lead saved searches.
-- The app also creates these tables on first use when DATABASE_URL or POSTGRES_URL is set.
-- Safe to run by hand in the Neon SQL editor.

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
  assigned_user_id text,
  partner_user_id text,
  partner_name text,
  listing_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE captured_leads ADD COLUMN IF NOT EXISTS assigned_user_id text;
ALTER TABLE captured_leads ADD COLUMN IF NOT EXISTS partner_user_id text;
ALTER TABLE captured_leads ADD COLUMN IF NOT EXISTS partner_name text;
ALTER TABLE captured_leads ADD COLUMN IF NOT EXISTS listing_agent text;

CREATE TABLE IF NOT EXISTS office_users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  cell text NOT NULL DEFAULT '',
  home_phone text NOT NULL DEFAULT '',
  office_phone text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  license_number text NOT NULL DEFAULT '',
  loan_url text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  signature text NOT NULL DEFAULT '',
  subdomain text NOT NULL DEFAULT '',
  facebook text NOT NULL DEFAULT '',
  google text NOT NULL DEFAULT '',
  pinterest text NOT NULL DEFAULT '',
  twitter text NOT NULL DEFAULT '',
  instagram text NOT NULL DEFAULT '',
  youtube text NOT NULL DEFAULT '',
  linkedin text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  bootstrap boolean NOT NULL DEFAULT false,
  must_set_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE office_users ADD COLUMN IF NOT EXISTS must_set_password boolean NOT NULL DEFAULT false;
ALTER TABLE office_users ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS office_access_tokens (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  kind text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS office_access_tokens_user_idx ON office_access_tokens (user_id);

CREATE TABLE IF NOT EXISTS lead_routing (
  id text PRIMARY KEY,
  mode text NOT NULL,
  fixed_user_id text,
  pool_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  rr_cursor integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_saved_searches (
  id text PRIMARY KEY,
  lead_id text NOT NULL,
  lead_email text NOT NULL,
  name text NOT NULL,
  city text NOT NULL DEFAULT '',
  min_price integer,
  max_price integer,
  beds integer,
  baths integer,
  property_type text NOT NULL DEFAULT '',
  frequency text NOT NULL DEFAULT 'Daily',
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lead_saved_searches ADD COLUMN IF NOT EXISTS criteria jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS lead_saved_searches_email_idx ON lead_saved_searches (lower(lead_email));
CREATE INDEX IF NOT EXISTS lead_saved_searches_lead_idx ON lead_saved_searches (lead_id);

CREATE TABLE IF NOT EXISTS autotracks (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  status text NOT NULL,
  document jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS autotrack_files (
  id text PRIMARY KEY,
  track_id text NOT NULL,
  step_id text NOT NULL,
  name text NOT NULL,
  content_type text NOT NULL,
  size_bytes integer NOT NULL,
  bytes bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS autotrack_files_step_idx ON autotrack_files (step_id);

CREATE TABLE IF NOT EXISTS autotrack_hidden (
  id text PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS office_settings (
  id text PRIMARY KEY,
  document jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS office_vendors (
  id text PRIMARY KEY,
  name text NOT NULL,
  vendor_type text NOT NULL DEFAULT '',
  preferred boolean NOT NULL DEFAULT false,
  phone text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS office_user_photos (
  user_id text PRIMARY KEY,
  content_type text NOT NULL,
  bytes bytea NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS office_sends (
  id text PRIMARY KEY,
  channel text NOT NULL,
  status text NOT NULL,
  provider text NOT NULL DEFAULT '',
  to_address text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  autotrack_id text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS office_sends_track_idx ON office_sends (autotrack_id);

CREATE TABLE IF NOT EXISTS office_send_events (
  id text PRIMARY KEY,
  send_id text NOT NULL,
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS office_send_events_send_idx ON office_send_events (send_id);

ALTER TABLE office_vendors ADD COLUMN IF NOT EXISTS first_name text NOT NULL DEFAULT '';
ALTER TABLE office_vendors ADD COLUMN IF NOT EXISTS last_name text NOT NULL DEFAULT '';
ALTER TABLE office_vendors ADD COLUMN IF NOT EXISTS company text NOT NULL DEFAULT '';
ALTER TABLE office_vendors ADD COLUMN IF NOT EXISTS cell_phone text NOT NULL DEFAULT '';
ALTER TABLE office_vendors ADD COLUMN IF NOT EXISTS office_phone text NOT NULL DEFAULT '';
ALTER TABLE office_vendors ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';
ALTER TABLE office_vendors ADD COLUMN IF NOT EXISTS email2 text NOT NULL DEFAULT '';
ALTER TABLE office_vendors ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS office_lead_fields (
  lead_id text PRIMARY KEY,
  document jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
