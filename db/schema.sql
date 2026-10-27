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
  created_at timestamptz NOT NULL DEFAULT now(),
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
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_saved_searches_email_idx ON lead_saved_searches (lower(lead_email));
CREATE INDEX IF NOT EXISTS lead_saved_searches_lead_idx ON lead_saved_searches (lead_id);
