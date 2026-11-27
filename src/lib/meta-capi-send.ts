import { after } from "next/server";
import { consentGrantedFromHeader, cookieValue } from "./ads-consent";
import { resolveMetaPixelId } from "./meta-pixel";
import {
  buildMetaLeadEvent,
  buildMetaPageViewEvent,
  fbcFromClick,
  metaEventsBody,
  type MetaServerEvent,
} from "./meta-capi";
import type { SanitizedLead } from "./lead-intake";

const GRAPH_VERSION = "v21.0";
const TIMEOUT_MS = 2000;
const SITE_ORIGIN = "https://vancouverpropertysearch.ca";

function pixelId(): string {
  return resolveMetaPixelId(process.env.META_PIXEL_ID || "");
}

function accessToken(): string {
  return (process.env.META_CAPI_ACCESS_TOKEN || "").trim();
}

export function clientIp(header: string | null): string {
  return (header || "").split(",")[0]?.trim().slice(0, 80) || "";
}

function sourceUrl(lead: SanitizedLead, referer: string | null): string {
  const landing = lead.attribution.landingUrl || "";
  if (landing.startsWith("http")) return landing.slice(0, 500);
  if (referer && referer.startsWith("http")) return referer.slice(0, 500);
  const path = lead.attribution.landingPath || "/start";
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`.slice(0, 500);
}

function cityOf(lead: SanitizedLead): string {
  const label = (lead.searchLabel || "").trim();
  if (label && label !== "Home search" && label !== "Home value") return label;
  const match = lead.notes.match(/^Area:\s*(.+)$/m);
  return match?.[1]?.trim() || "";
}

/** Posts events. The lead and page-view callers never pass a test code. */
export async function postMetaEvents(
  events: MetaServerEvent[],
  testEventCode?: string
): Promise<{ status: number; eventsReceived?: number }> {
  const token = accessToken();
  const pixel = pixelId();
  if (!token || !events.length) return { status: 0 };
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixel}/events?access_token=${encodeURIComponent(token)}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(metaEventsBody(events, testEventCode)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error("[meta-capi]", events[0]?.event_name || "event", response.status);
      return { status: response.status };
    }
    const json = (await response.json().catch(() => null)) as { events_received?: number } | null;
    return { status: response.status, eventsReceived: json?.events_received };
  } catch (error) {
    console.error("[meta-capi]", events[0]?.event_name || "event", error instanceof Error ? error.name : "error");
    return { status: 0 };
  }
}

function schedule(events: MetaServerEvent[], testEventCode?: string) {
  if (!events.length || !accessToken()) return;
  after(async () => {
    await postMetaEvents(events, testEventCode);
  });
}

/** Fire-and-forget Lead. Skipped when advertising consent is required and not granted. */
export function scheduleMetaLead(request: Request, lead: SanitizedLead) {
  try {
    if (!consentGrantedFromHeader(request.headers.get("cookie"))) return;
    const cookie = request.headers.get("cookie");
    const event = buildMetaLeadEvent({
      eventId: lead.id,
      sourceUrl: sourceUrl(lead, request.headers.get("referer")),
      ip: clientIp(request.headers.get("x-forwarded-for")),
      userAgent: request.headers.get("user-agent") || "",
      email: lead.email,
      phone: lead.phone,
      name: lead.name,
      city: cityOf(lead),
      fbc: lead.attribution.fbc || cookieValue(cookie, "_fbc"),
      fbp: lead.attribution.fbp || cookieValue(cookie, "_fbp"),
      fbclid: lead.attribution.fbclid,
      externalId: lead.id,
    });
    if (!event) return;
    schedule([event]);
  } catch (error) {
    console.error("[meta-capi] lead", error instanceof Error ? error.name : "error");
  }
}

export function scheduleMetaPageView(requestHeaders: Headers, sourceUrl: string, eventId: string) {
  try {
    if (!consentGrantedFromHeader(requestHeaders.get("cookie"))) return;
    const cookie = requestHeaders.get("cookie");
    const fbclid = (() => {
      try {
        return new URL(sourceUrl).searchParams.get("fbclid") || "";
      } catch {
        return "";
      }
    })();
    const event = buildMetaPageViewEvent({
      eventId,
      sourceUrl,
      ip: clientIp(requestHeaders.get("x-forwarded-for")),
      userAgent: requestHeaders.get("user-agent") || "",
      fbc: cookieValue(cookie, "_fbc") || fbcFromClick(fbclid),
      fbp: cookieValue(cookie, "_fbp"),
      fbclid,
    });
    if (!event) return;
    schedule([event]);
  } catch (error) {
    console.error("[meta-capi] pageview", error instanceof Error ? error.name : "error");
  }
}
