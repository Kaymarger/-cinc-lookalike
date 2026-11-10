const FEATURED_PAGE = (page: number) =>
  `https://listings.myrealpage.com/wps/mylistings/59559/mylistings.def/?_pg=${page}`;

const CARD =
  /<li class="([^"]*)"[^>]*data-share-url="[^"]*listing\.r(\d+)/gi;

export type FeaturedCard = { id: string; active: boolean };

/** Listing cards on one page of Casey Archibald's public featured widget. */
export function featuredCardsFromHtml(html: string): FeaturedCard[] {
  const cards: FeaturedCard[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(CARD)) {
    const id = `R${match[2]}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const className = match[1] || "";
    const active = /\bstatus-ACTIVE\b/.test(className) && !/\bstatus-SOLD\b/.test(className);
    cards.push({ id, active });
  }
  return cards;
}

export function activeMlsFromFeaturedHtml(html: string): string[] {
  return featuredCardsFromHtml(html).filter((card) => card.active).map((card) => card.id);
}

/** Active MLS numbers across featured pages. Stops when a page repeats or is empty. */
export function activeMlsFromFeaturedPages(pages: string[]): string[] {
  const ids: string[] = [];
  const seenCards = new Set<string>();
  for (const html of pages) {
    const cards = featuredCardsFromHtml(html);
    if (!cards.length || seenCards.has(cards[0].id)) break;
    for (const card of cards) {
      seenCards.add(card.id);
      if (card.active && !ids.includes(card.id)) ids.push(card.id);
    }
  }
  return ids;
}

let cache: { at: number; ids: string[] | null } | null = null;

/**
 * Active featured MLS® numbers from the list embedded on
 * https://archibaldrealestate.ca/featured-properties/
 * (caseyarchibald.com redirects there). Null when that list cannot be read.
 */
export async function activeFeaturedMlsIds(): Promise<string[] | null> {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return cache.ids;
  const pages: string[] = [];
  try {
    let quietPages = 0;
    for (let page = 1; page <= 12; page += 1) {
      const response = await fetch(FEATURED_PAGE(page), {
        headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (!response.ok) {
        if (page === 1) {
          cache = { at: Date.now(), ids: null };
          return null;
        }
        break;
      }
      const html = await response.text();
      if (page === 1 && !/CASEY ARCHIBALD/i.test(html)) {
        cache = { at: Date.now(), ids: null };
        return null;
      }
      const cards = featuredCardsFromHtml(html);
      if (!cards.length) break;
      pages.push(html);
      quietPages = cards.some((card) => card.active) ? 0 : quietPages + 1;
      // Active cards are grouped before sold history. Two sold-only pages means the active set is complete.
      if (quietPages >= 2 || !html.includes(`_pg=${page + 1}`)) break;
    }
    const ids = activeMlsFromFeaturedPages(pages);
    cache = { at: Date.now(), ids };
    return ids;
  } catch {
    if (pages.length) {
      const ids = activeMlsFromFeaturedPages(pages);
      cache = { at: Date.now(), ids };
      return ids;
    }
    cache = { at: Date.now(), ids: null };
    return null;
  }
}
