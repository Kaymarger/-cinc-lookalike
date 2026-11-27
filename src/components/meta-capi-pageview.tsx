import { headers } from "next/headers";
import { consentGrantedFromHeader } from "@/lib/ads-consent";
import { scheduleMetaPageView } from "@/lib/meta-capi-send";

const ORIGIN = "https://vancouverpropertysearch.ca";

export function adLandingSearch(params: Record<string, string | string[] | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const text = (Array.isArray(value) ? value[0] : value)?.trim();
    if (text) query.set(key, text.slice(0, 300));
  }
  const search = query.toString();
  return search ? `?${search}` : "";
}

/** Server PageView for ad landings. The browser pixel reads the same event id. */
export async function MetaCapiPageView({ pathname, search = "" }: { pathname: string; search?: string }) {
  if (pathname !== "/start" && !pathname.startsWith("/lp/")) return null;
  const headerList = await headers();
  if (!consentGrantedFromHeader(headerList.get("cookie"))) return null;
  const eventId = crypto.randomUUID();
  const sourceUrl = `${ORIGIN}${pathname}${search}`;
  scheduleMetaPageView(headerList, sourceUrl, eventId);
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__gvhsPageViewId=${JSON.stringify(eventId)};`,
      }}
    />
  );
}
