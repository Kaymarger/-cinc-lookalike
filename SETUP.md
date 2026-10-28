# Set up the live site

The public home search and `/start` work with no setup. The agent office stays locked until you set a password. Leads are saved in a database only after you connect Neon.

Do this in the Vercel project that deploys from `main`. After you add or change any variable, redeploy (Deployments → the latest deployment → Redeploy). A finished deploy does not see new variables.

## 1. Lock the agent office

1. Open the project on [vercel.com](https://vercel.com).
2. Go to **Settings → Environment Variables**.
3. Add `AGENT_PASSWORD`. The value is the password you will type at `/agent`. Use a long password you can remember or store in a password manager.
4. Optional: add `AUTH_SECRET` as a second long random string. It signs the login cookie. If you leave it blank, the cookie is signed with a value derived from `AGENT_PASSWORD`.
5. Redeploy.

Until `AGENT_PASSWORD` is set, `/agent` shows “Set AGENT_PASSWORD in Vercel” and does not open the office.

## 2. Add a free Neon database

1. In the same Vercel project, open the **Storage** tab.
2. Click **Create Database** (sometimes labeled **Create**).
3. Choose **Neon** (Postgres). Pick the free plan if Vercel asks.
4. Click through **Continue**, then connect it to this project and confirm **Create** / **Connect**.
5. Accept the environment variables Vercel offers. That adds `DATABASE_URL` and `POSTGRES_URL` for Production. Include Preview too if you use preview deploys.
6. Redeploy when Vercel asks. If it does not ask, open **Deployments** and redeploy the latest production deployment.

You do not run SQL by hand. The lead, user, and saved-search tables are created during the build when a database URL is present, and again the first time the office uses the database.

On **Leads**, a banner says whether the database is connected.

## Team logins

The office password is the owner login. Leave the email blank on `/agent/login` and use `AGENT_PASSWORD`. The first time the database is connected, that sign-in creates the owner admin (Casey Archibald, `agent@example.com`).

An admin or broker then opens **Users** in the account menu and adds people. Leave the password blank to create an invite link they use to set their own password, or type a password of at least 8 characters so they can sign in right away. Passwords are stored as a hash. Roles are Admin, Broker, Agent, ISA, and Lender.

**Forgot password** on the sign-in page creates a link that works for one hour. **Reset link** and **Invite link** on a user row do the same for an admin to copy. Invite links work for 7 days. If `RESEND_API_KEY` or `SENDGRID_API_KEY` is set, along with a from-address (`RESEND_FROM_EMAIL`, `SENDGRID_FROM_EMAIL`, or `LEAD_ALERT_FROM_EMAIL`), those links are emailed. Resend is used when its key is present. If neither provider is set, copy the link from Users and send it yourself.

An admin can click **Become** on another user. A red bar says whose office they are viewing, and **Switch back** or **End Become User** returns them to their own account. Agents still only see their own leads while an admin is viewing as them.

**New lead assignment** on the Users screen sends each new registration to one chosen person, or round-robin across the people you check. Until you save a rule, new leads still go to `AGENT_ALERT_NAME` or Casey Archibald.

- Admins and brokers see every lead and can reassign them.
- Agents see only leads assigned to them.
- ISAs see their own leads plus unassigned (pond) leads, and can reassign.
- Lenders see only leads where they are the partner.

If the database is not connected, the Users screen says so and the office password still signs in the owner. Team email logins, profile saves, and saved searches wait until Neon is connected.

## Saved searches on a lead

On a lead, **+ Saved Search** stores area, price, beds, baths, property type, and email alert frequency in the database. The lead sees those searches on **My Notebook** and **Saved searches** after they sign in on the public site with the same email.

## 3. Optional alerts and ad tags

| You want | Account | Variables |
| --- | --- | --- |
| Email when a lead arrives | [Resend](https://resend.com) or [SendGrid](https://sendgrid.com), with a verified from-address | `AGENT_ALERT_EMAIL`, plus `RESEND_API_KEY` and `RESEND_FROM_EMAIL`, or `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` |
| Text when a lead arrives | [Twilio](https://www.twilio.com) and a Twilio phone number | `AGENT_ALERT_PHONE`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` |
| Name stored on the lead | — | `AGENT_ALERT_NAME` (optional; otherwise Casey Archibald) |
| Meta ads | Meta Events Manager | `META_PIXEL_ID` |
| Google ads | Google Ads conversion action | `GOOGLE_ADS_ID` (`AW-…`) and `GOOGLE_ADS_CONVERSION_LABEL` |

`LEAD_ALERT_FROM_EMAIL` can be used as the from-address if the provider-specific from variable is empty. `NEXT_PUBLIC_SITE_URL` is optional and is the link included in the alert email.

If an alert variable is missing, that alert is skipped. The lead is still saved when the database is connected.

## What stays public

`/start`, the rest of the home search, and sending a lead (`POST /api/leads`) do not require the password. Reading the lead list does.
