# CINC Lookalike

Demo of a CINC-style consumer IDX site plus agent back office (Launchpad, Leads, Deals, Communications, Automations, Properties).

Sample data only — not a live MLS feed and not real client records.

## Run locally

```bash
npm install
npm run dev
```

- Consumer site: [http://localhost:3000](http://localhost:3000)
- Agent CRM: [http://localhost:3000/agent](http://localhost:3000/agent)

## Deploy on Vercel (free Hobby)

1. Import this GitHub repository in Vercel.
2. Framework preset: **Next.js** (auto-detected).
3. Build command: `next build` (default).
4. The site runs with no environment variables. Listing search stays on sample data, and leads stay in the browser until a database URL is set.

Paid-traffic landing page: `/start` (for example `https://cinc-lookalike.vercel.app/start`).

### Environment variables

See `.env.example`. Nothing in that file is a secret.

| Purpose | Variables | If unset |
| --- | --- | --- |
| Save leads (Neon, Vercel Postgres, or Supabase Postgres) | `DATABASE_URL` or `POSTGRES_URL` | Forms still succeed in the browser. The CRM keeps its sample rows. |
| Email the assigned agent | `AGENT_ALERT_EMAIL` plus either `RESEND_API_KEY` and `RESEND_FROM_EMAIL`, or `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` | Email is skipped. |
| Text the assigned agent | `AGENT_ALERT_PHONE`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | SMS is skipped. |
| Name stored on the lead | `AGENT_ALERT_NAME` | Defaults to Casey Archibald. |
| Meta Pixel | `META_PIXEL_ID` | Pixel is not loaded. |
| Google Ads | `GOOGLE_ADS_ID` and, for the lead conversion, `GOOGLE_ADS_CONVERSION_LABEL` | Tag is not loaded. |

UTM parameters, `gclid`, and `fbclid` are stored on each lead automatically. Do not commit `.env` or real client records.

Contact details and the built-in CRM rows in this repo are fictional sample placeholders.
