import {
  attributionSummary,
  sanitizeAttribution,
  sanitizeLeadInput,
  type SanitizedLead,
} from "@/lib/lead-intake";
import { insertLead, leadsDatabaseConfigured, listLeads, type StoredLead } from "@/lib/leads-db";
import { assignedAgentName, notifyAssignedAgent } from "@/lib/notify-lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>();

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < 60_000);
  if (recent.length >= 8) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function publicLead(lead: SanitizedLead | StoredLead) {
  const summary =
    "activityBody" in lead && lead.activityBody
      ? lead.activityBody
      : [lead.notes, attributionSummary(lead.attribution)].filter(Boolean).join("\n");
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    smsOptIn: lead.smsOptIn,
    source: lead.source,
    intent: lead.intent,
    status: "new" as const,
    propertyAddress: lead.propertyAddress,
    propertyId: lead.propertyId,
    searchLabel: lead.searchLabel,
    notes: lead.notes,
    consent: lead.consent,
    attribution: lead.attribution,
    assignedTo: lead.assignedTo,
    createdAt: lead.createdAt,
    updatedAt: lead.createdAt,
    activity: [
      {
        id: `${lead.id}-created`,
        at: lead.createdAt,
        kind: lead.source === "registration" || lead.source === "buyer_signup" ? "signup" : "system",
        title:
          lead.source === "registration" || lead.source === "buyer_signup"
            ? "Free Access signup"
            : "Lead captured",
        body: summary || undefined,
      },
    ],
  };
}

export async function GET() {
  if (!leadsDatabaseConfigured()) {
    return Response.json({ ok: true, configured: false, leads: [] });
  }
  try {
    const leads = await listLeads();
    return Response.json({
      ok: true,
      configured: true,
      leads: leads.map(publicLead),
    });
  } catch (error) {
    console.error("[leads] read failed", error instanceof Error ? error.name : "error");
    return Response.json(
      { ok: false, configured: true, leads: [], message: "Leads are temporarily unavailable." },
      { status: 503 }
    );
  }
}

function wantsHtml(request: Request) {
  const type = request.headers.get("content-type") || "";
  return type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data");
}

function htmlRedirect(request: Request, params: Record<string, string>, hash = "buyer") {
  const url = new URL("/start", request.url);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.hash = hash;
  return Response.redirect(url, 303);
}

function attributionFromReferer(request: Request) {
  const referer = request.headers.get("referer");
  if (!referer) return undefined;
  try {
    const url = new URL(referer);
    return sanitizeAttribution({
      utmSource: url.searchParams.get("utm_source") ?? undefined,
      utmMedium: url.searchParams.get("utm_medium") ?? undefined,
      utmCampaign: url.searchParams.get("utm_campaign") ?? undefined,
      utmTerm: url.searchParams.get("utm_term") ?? undefined,
      utmContent: url.searchParams.get("utm_content") ?? undefined,
      gclid: url.searchParams.get("gclid") ?? undefined,
      fbclid: url.searchParams.get("fbclid") ?? undefined,
      landingPath: `${url.pathname}${url.search}`,
    });
  } catch {
    return undefined;
  }
}

async function readPayload(request: Request): Promise<unknown> {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) return request.json();
  const form = await request.formData();
  const consent = form.get("consent");
  const agreed = consent === "on" || consent === "true";
  return {
    name: form.get("name"),
    email: form.get("email"),
    phone: form.get("phone"),
    source: form.get("source"),
    intent: form.get("intent"),
    propertyAddress: form.get("address"),
    notes: form.get("notes"),
    searchLabel: form.get("source") === "buyer_signup" ? form.get("notes") : undefined,
    consent: agreed,
    smsOptIn: agreed,
    website: form.get("website"),
    attribution: attributionFromReferer(request),
  };
}

export async function POST(request: Request) {
  const html = wantsHtml(request);
  const hash = "buyer";
  if (rateLimited(clientIp(request))) {
    const message = "Too many requests. Please wait a minute and try again.";
    if (html) return htmlRedirect(request, { error: "1" }, hash);
    return Response.json({ ok: false, message }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await readPayload(request);
  } catch {
    const message = "Enter your contact details to continue.";
    if (html) return htmlRedirect(request, { error: "1" }, hash);
    return Response.json({ ok: false, message }, { status: 400 });
  }

  const formHash =
    body && typeof body === "object" && "source" in body
      ? String((body as { source?: string }).source) === "seller_signup"
        ? "seller"
        : String((body as { source?: string }).source) === "home_valuation"
          ? "valuation"
          : "buyer"
      : hash;

  const parsed = sanitizeLeadInput(body, { assignedTo: assignedAgentName() });
  if (!parsed.ok) {
    if (parsed.message === "honeypot") {
      if (html) return htmlRedirect(request, { sent: "1" }, formHash);
      return Response.json({ ok: true, persisted: false, alerts: { email: "skipped", sms: "skipped" } });
    }
    if (html) return htmlRedirect(request, { error: "1" }, formHash);
    return Response.json({ ok: false, message: parsed.message }, { status: 400 });
  }

  const alerts = await notifyAssignedAgent(parsed.lead);

  if (!leadsDatabaseConfigured()) {
    if (html) return htmlRedirect(request, { sent: "1" }, formHash);
    return Response.json({
      ok: true,
      persisted: false,
      storage: "unconfigured",
      alerts,
      lead: publicLead(parsed.lead),
    });
  }

  try {
    const saved = await insertLead(parsed.lead);
    if (html) return htmlRedirect(request, { sent: "1" }, formHash);
    return Response.json({
      ok: true,
      persisted: true,
      storage: "postgres",
      alerts,
      lead: publicLead(saved),
    });
  } catch (error) {
    console.error("[leads] insert failed", error instanceof Error ? error.name : "error");
    const message = "We could not save your request just now. Please call (604) 363-7858.";
    if (html) return htmlRedirect(request, { error: "1" }, formHash);
    return Response.json(
      {
        ok: false,
        persisted: false,
        alerts,
        message,
      },
      { status: 503 }
    );
  }
}
