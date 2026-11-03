import { PLACES, type Place } from "@/lib/places";
import { fetchAreaListings, fetchAreaStampPage } from "@/lib/ddf/client";
import { listFeedPlaces, stampNeighbourhoods, upsertDdfListings, type PlaceOption } from "@/lib/ddf/db";

const areaMisses = new Map<string, number>();

let stampCursor: string | null = null;
let stampDone = false;
let warming: Promise<void> | null = null;
let placeCache: { at: number; places: Place[] } = { at: 0, places: [] };

/** Read MLS sub-areas from the feed and store them on listings we already have. */
export async function warmNeighbourhoodNames(budgetMs = 3500): Promise<void> {
  if (stampDone) return;
  if (!warming) {
    const run = (async () => {
      const started = Date.now();
      while (Date.now() - started < budgetMs && !stampDone) {
        const page = await fetchAreaStampPage(stampCursor);
        if (page.stamps.length) await stampNeighbourhoods(page.stamps);
        stampCursor = page.nextUrl;
        if (!page.nextUrl) {
          stampDone = true;
          break;
        }
      }
      placeCache = { at: 0, places: [] };
    })();
    warming = run.finally(() => {
      warming = null;
    });
  }
  await warming;
}

export async function pullAreaIntoSearch(name: string): Promise<number> {
  const key = name.trim().toLowerCase();
  const missedAt = areaMisses.get(key) || 0;
  if (missedAt && Date.now() - missedAt < 10 * 60_000) return 0;
  const listings = await fetchAreaListings(name);
  if (!listings.length) {
    areaMisses.set(key, Date.now());
    return 0;
  }
  const saved = await upsertDdfListings(listings);
  placeCache = { at: 0, places: [] };
  return saved;
}

export async function suggestablePlaces(): Promise<Place[]> {
  if (placeCache.places.length && Date.now() - placeCache.at < 5 * 60_000) return placeCache.places;
  const feed = await listFeedPlaces().catch(() => [] as PlaceOption[]);
  const seen = new Set(feed.map((place) => `${place.kind}:${place.label.toLowerCase()}`));
  const extras = PLACES.filter((place) => !seen.has(`${place.kind}:${place.label.toLowerCase()}`));
  const places = [
    ...feed.map((place) => ({ label: place.label, city: place.city, kind: place.kind })),
    ...extras,
  ];
  placeCache = { at: Date.now(), places };
  return places;
}
