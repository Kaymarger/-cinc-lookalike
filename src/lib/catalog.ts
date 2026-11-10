import { fetchListingDetail } from "@/lib/ddf/client";
import { pullAreaIntoSearch } from "@/lib/ddf/areas";
import { ddfConfigured } from "@/lib/ddf/credentials";
import { featuredDdfListings, getDdfListing, searchDdfListings, upsertDdfListings } from "@/lib/ddf/db";
import type { Property, SearchFilters } from "@/lib/types";

const detailReads = new Map<string, Promise<void>>();

async function refreshListingDetails(id: string): Promise<void> {
  const detail = await fetchListingDetail(id);
  if (detail) await upsertDdfListings([detail]);
}

export async function catalogSearch(filters: SearchFilters): Promise<{ properties: Property[]; total: number; live: boolean }> {
  if (!ddfConfigured()) return { properties: [], total: 0, live: false };
  let result = await searchDdfListings(filters);
    const needle = filters.q?.trim() || "";
    const placeName = needle.length >= 4 && !/^\d/.test(needle) && !/^[a-z]\d{4,}/i.test(needle);
    const unlabeled = result.properties.length > 0 && result.properties.every((property) => !property.neighborhood);
    if (placeName && (result.total === 0 || unlabeled) && (filters.page || 1) === 1) {
      const pulled = await Promise.race([
        pullAreaIntoSearch(needle).catch(() => 0),
        new Promise<number>((resolve) => setTimeout(() => resolve(0), 3500)),
      ]);
      if (pulled > 0) result = await searchDdfListings(filters);
    }
    return {
    properties: result.properties.map((property) => ({ ...property, images: property.images.slice(0, 1) })),
    total: result.total,
    live: true,
  };
}

/** Active Archibald / RE/MAX Crest listings from the CREA feed. Empty when none are active. */
export async function catalogFeatured(limit = 12): Promise<Property[]> {
  if (!ddfConfigured()) return [];
  const live = await featuredDdfListings(limit);
  return live.map((property) => ({ ...property, images: property.images.slice(0, 1) }));
}

export async function catalogListing(id: string): Promise<Property | null> {
  if (!ddfConfigured()) return null;
    let listing = await getDdfListing(id);
    if (listing && !listing.detailsSynced) {
      const listingId = listing.id;
      let pending = detailReads.get(listingId);
      if (!pending) {
        pending = refreshListingDetails(listingId).finally(() => detailReads.delete(listingId));
        detailReads.set(listingId, pending);
      }
      await Promise.race([pending, new Promise((resolve) => setTimeout(resolve, 2500))]);
      listing = (await getDdfListing(id)) || listing;
    }
    if (listing) return listing;
  return null;
}
