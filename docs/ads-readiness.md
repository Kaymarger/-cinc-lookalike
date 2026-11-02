# Ads readiness

Checked against the public lead path. A pass means the behaviour is in the app. Items that need a key in Vercel stay fail until that key is set. No IDs are hard-coded.

| Item | Result | Notes |
| --- | --- | --- |
| Gmail page stays not connected without a mailbox | Pass | Shows “Gmail is not connected.” A mailbox appears only when `GMAIL_CLIENT_ID` (or `GOOGLE_CLIENT_ID`), `GMAIL_CLIENT_SECRET` (or `GOOGLE_CLIENT_SECRET`), and `GMAIL_REFRESH_TOKEN` are all set. |
| Home, search, and listing pages load | Pass | `/`, `/search`, and `/homedetails/bc/...` are real routes. |
| Registration after repeated listing views | Pass | The third distinct listing view opens Free Access signup when the visitor is not signed in. |
| Sign-up creates a lead with source and UTM | Pass | `utm_source`, `utm_medium`, `utm_campaign`, and `utm_content` / `ad` / `utm_id` are stored with the lead. |
| New lead is auto-assigned | Pass | `resolveNewLeadAssignee` runs on every public sign-up. Addresses at `example.com`, `example.org`, and `example.net` stay Unassigned and do not email or text anyone. |
| Lead appears in the back office | Pass | The lead is written to `captured_leads` when `DATABASE_URL` or `POSTGRES_URL` is set. |
| Ad landing `/lp/home-search` | Pass | Short buyer form. |
| Ad landing `/lp/home-value` | Pass | Short valuation form. |
| Privacy policy | Pass | `/privacy` covers BC PIPA and CASL. |
| CASL consent checkbox | Pass | Required on registration, the view gate, and both landing forms. |
| Unsubscribe | Pass | `/unsubscribe` turns off email and text for that address. |
| Terms | Pass | `/terms`. |
| Meta Pixel | Fail until set | Code loads the pixel only when `META_PIXEL_ID` matches a numeric id. Fires `Lead` after a stored sign-up. |
| GA4 | Fail until set | Code loads the tag only when `GA4_ID` matches `G-…`. Fires `generate_lead` after a stored sign-up. |
| Google Ads | Fail until set | Code loads the tag only when `GOOGLE_ADS_ID` matches `AW-…`. Fires a conversion when `GOOGLE_ADS_CONVERSION_LABEL` is also set. |
| Welcome email | Fail until set | Sent with Resend when `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set, otherwise SendGrid when `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` (or `LEAD_ALERT_FROM_EMAIL`) are set. Without those, sign-up still succeeds and the send is skipped. |
| Saved-search confirmation | Fail until set | Saving a search sends a confirmation with the criteria and an unsubscribe link, through the same Resend or SendGrid keys. The save still succeeds when those keys are missing. |
| Recurring saved-search alerts | Fail until set | Vercel Cron runs every day at 15:00 UTC (`vercel.json`) and calls `/api/cron/saved-search-alerts`. A search is emailed on its schedule (daily, T/Th, M/W/F, a weekday, weekends, bi-weekly, or monthly). `Never` and unsubscribed addresses are skipped. The mail lists homes listed since the last run that match the search. Set `CRON_SECRET` or the route does nothing. Without Resend or SendGrid keys the run finishes and no message is sent. `example.com` addresses are ignored. |
| Welcome / alert SMS | Fail until set | Sent only if the person opted in and `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` are set. |
| Agent alert email | Fail until set | Same email keys, plus `AGENT_ALERT_EMAIL`. |
| Agent alert SMS | Fail until set | Same Twilio keys, plus `AGENT_ALERT_PHONE`. |

## Env vars

Set these in Vercel. Leave a group empty and that channel stays off.

- `DATABASE_URL` or `POSTGRES_URL`
- `META_PIXEL_ID`
- `GA4_ID`
- `GOOGLE_ADS_ID`
- `GOOGLE_ADS_CONVERSION_LABEL`
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL`, or `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- `AGENT_ALERT_EMAIL`, `AGENT_ALERT_PHONE`, `AGENT_ALERT_NAME`
- `CRON_SECRET` (Vercel sends it as `Authorization: Bearer` on the saved-search cron)
- Gmail, only if a mailbox should appear: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`
