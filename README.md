# CINC Lookalike

Demo of a CINC-style consumer IDX site plus agent back office (Launchpad, Leads, Deals, Communications, Automations, Properties).

Sample data only — not a live MLS feed and not real client records.

## Run locally

```bash
npm install
npm run dev
```

- Consumer site: [http://localhost:3000](http://localhost:3000)
- Paid-traffic page: [http://localhost:3000/start](http://localhost:3000/start)
- Agent office: [http://localhost:3000/agent](http://localhost:3000/agent) (locked until `AGENT_PASSWORD` is set)

See [SETUP.md](SETUP.md) for the Vercel password and Neon steps.

## Deploy on Vercel (free Hobby)

1. Import this GitHub repository in Vercel.
2. Framework preset: **Next.js** (auto-detected).
3. Build command: `next build` (default).
4. The public site runs with no environment variables. `/agent` stays locked until `AGENT_PASSWORD` is set. Leads stay in the browser until a database URL is set. See [SETUP.md](SETUP.md).

Paid-traffic landing page: `/start` (for example `https://cinc-lookalike.vercel.app/start`).

### Environment variables

See `.env.example`. Nothing in that file is a secret.

| Purpose | Variables | If unset |
| --- | --- | --- |
| Save leads (Neon, Vercel Postgres, or Supabase Postgres) | `DATABASE_URL` or `POSTGRES_URL` | Forms still succeed in the browser. The CRM keeps its sample rows. |
| Email the assigned agent | `AGENT_ALERT_EMAIL` plus either `RESEND_API_KEY` and `RESEND_FROM_EMAIL`, or `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` | Email is skipped. |
| Call or text a lead, and text a visitor who opted in | `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY_SID`, `TWILIO_API_SECRET`, `TWILIO_FROM_NUMBER` | Calls and texts stay disconnected. New-lead alerts are email only. |
| Name stored on the lead | `AGENT_ALERT_NAME` | Defaults to Casey Archibald. |
| Meta Pixel | `NEXT_PUBLIC_META_PIXEL_ID` | The site pixel `1412153377363377` is used. It loads on public pages only. |
| Google Ads | `GOOGLE_ADS_ID` and, for the lead conversion, `GOOGLE_ADS_CONVERSION_LABEL` | Tag is not loaded. |

UTM parameters, `gclid`, and `fbclid` are stored on each lead automatically. Do not commit `.env` or real client records.

Contact details and the built-in CRM rows in this repo are fictional sample placeholders.
