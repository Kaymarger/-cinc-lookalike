import { officeDb } from "@/lib/leads-db";
import type { DdfListing, DdfPhoto } from "@/lib/ddf/normalize";
import type { Property, SearchFilters } from "@/lib/types";

export type DdfSyncState = {
  detailUrl: string | null;
  masterUrl: string | null;
  masterGeneration: number;
  masterComplete: boolean;
  listingCount: number;
  mode: string;
  lastError: string;
  updatedAt: string | null;
};

type ListingRow = {
  listing_key: string;
  listing_id: string;
  list_price: number | null;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  beds: number | null;
  baths: number | string | null;
  sqft: number | null;
  property_type: string;
  public_remarks: string;
  brokerage_name: string;
  realtor_url: string;
  latitude: number | null;
  longitude: number | null;
  listed_at: Date | string | null;
  photos: DdfPhoto[] | string | null;
  modification_timestamp: Date | string | null;
};

function photos(value: ListingRow["photos"]): DdfPhoto[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as DdfPhoto[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function daysAgo(value: Date | string | null): number {
  if (!value) return 0;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (Number.isNaN(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
}

export function propertyFromRow(row: ListingRow): Property {
  const images = photos(row.photos).map((photo) => photo.url).filter((url) => url.startsWith("http"));
  const baths = Number(row.baths ?? 0) || 0;
  return {
    id: row.listing_key,
    mlsNumber: row.listing_id,
    price: Number(row.list_price ?? 0) || 0,
    address: row.address,
    city: row.city,
    province: "BC",
    postalCode: row.postal_code,
    beds: Number(row.beds ?? 0) || 0,
    baths,
    sqft: Number(row.sqft ?? 0) || 0,
    propertyType: row.property_type,
    yearBuilt: 0,
    description: row.public_remarks,
    features: [],
    images,
    status: "Active",
    listedDaysAgo: daysAgo(row.listed_at || row.modification_timestamp),
    brokerage: row.brokerage_name,
    lat: Number(row.latitude ?? 0) || 0,
    lng: Number(row.longitude ?? 0) || 0,
    feed: "ddf",
    realtorUrl: row.realtor_url,
  };
}

const TYPE_SQL: Record<string, string> = {
  condo: "condo|apartment|condominium",
  apartment: "condo|apartment|condominium",
  house: "house|single|detached|duplex",
  townhouse: "town",
  "half duplex": "duplex",
};

export async function countDdfListings(): Promise<number> {
  const sql = await officeDb();
  if (!sql) return 0;
  const rows = await sql<{ count: string }[]>`SELECT count(*)::text AS count FROM ddf_listings`;
  return Number(rows[0]?.count || 0);
}

export async function upsertDdfListings(listings: DdfListing[]): Promise<number> {
  const sql = await officeDb();
  if (!sql || !listings.length) return 0;
  for (const listing of listings) {
    await sql`
      INSERT INTO ddf_listings (
        listing_key, listing_id, list_price, address, city, province, postal_code,
        beds, baths, sqft, property_type, public_remarks, brokerage_name, realtor_url,
        latitude, longitude, listed_at, photos, modification_timestamp, updated_at
      ) VALUES (
        ${listing.listingKey},
        ${listing.listingId},
        ${listing.price || null},
        ${listing.address},
        ${listing.city},
        ${listing.province},
        ${listing.postalCode},
        ${listing.beds || null},
        ${listing.baths || null},
        ${listing.sqft || null},
        ${listing.propertyType},
        ${listing.remarks},
        ${listing.brokerage},
        ${listing.realtorUrl},
        ${listing.latitude || null},
        ${listing.longitude || null},
        ${listing.listedAt},
        ${sql.json(listing.photos)},
        ${listing.modifiedAt},
        now()
      )
      ON CONFLICT (listing_key) DO UPDATE SET
        listing_id = EXCLUDED.listing_id,
        list_price = EXCLUDED.list_price,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        province = EXCLUDED.province,
        postal_code = EXCLUDED.postal_code,
        beds = EXCLUDED.beds,
        baths = EXCLUDED.baths,
        sqft = EXCLUDED.sqft,
        property_type = EXCLUDED.property_type,
        public_remarks = EXCLUDED.public_remarks,
        brokerage_name = EXCLUDED.brokerage_name,
        realtor_url = EXCLUDED.realtor_url,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        listed_at = EXCLUDED.listed_at,
        photos = EXCLUDED.photos,
        modification_timestamp = EXCLUDED.modification_timestamp,
        updated_at = now()
    `;
  }
  return listings.length;
}

export async function readSyncState(): Promise<DdfSyncState> {
  const sql = await officeDb();
  const empty: DdfSyncState = {
    detailUrl: null,
    masterUrl: null,
    masterGeneration: 1,
    masterComplete: false,
    listingCount: 0,
    mode: "",
    lastError: "",
    updatedAt: null,
  };
  if (!sql) return empty;
  const rows = await sql<{
    detail_url: string | null;
    master_url: string | null;
    master_generation: number;
    master_complete: boolean;
    listing_count: number;
    mode: string;
    last_error: string;
    updated_at: Date | string | null;
  }[]>`SELECT * FROM ddf_sync_state WHERE id = 'default'`;
  const row = rows[0];
  if (!row) return empty;
  return {
    detailUrl: row.detail_url,
    masterUrl: row.master_url,
    masterGeneration: Number(row.master_generation) || 1,
    masterComplete: Boolean(row.master_complete),
    listingCount: Number(row.listing_count) || 0,
    mode: row.mode || "",
    lastError: row.last_error || "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

export async function writeSyncState(patch: Partial<DdfSyncState> & { lastError?: string }): Promise<void> {
  const sql = await officeDb();
  if (!sql) return;
  const current = await readSyncState();
  const next = { ...current, ...patch };
  await sql`
    INSERT INTO ddf_sync_state (
      id, detail_url, master_url, master_generation, master_complete, listing_count, mode, last_error, updated_at
    ) VALUES (
      'default',
      ${next.detailUrl},
      ${next.masterUrl},
      ${next.masterGeneration},
      ${next.masterComplete},
      ${next.listingCount},
      ${next.mode},
      ${next.lastError},
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      detail_url = EXCLUDED.detail_url,
      master_url = EXCLUDED.master_url,
      master_generation = EXCLUDED.master_generation,
      master_complete = EXCLUDED.master_complete,
      listing_count = EXCLUDED.listing_count,
      mode = EXCLUDED.mode,
      last_error = EXCLUDED.last_error,
      updated_at = now()
  `;
}

export async function rememberMasterKeys(generation: number, keys: string[]): Promise<void> {
  const sql = await officeDb();
  if (!sql || !keys.length) return;
  for (const key of keys) {
    await sql`
      INSERT INTO ddf_master_keys (generation, listing_key)
      VALUES (${generation}, ${key})
      ON CONFLICT (generation, listing_key) DO NOTHING
    `;
  }
}

export async function applyMasterDeletions(generation: number): Promise<number> {
  const sql = await officeDb();
  if (!sql) return 0;
  const present = await sql<{ count: string }[]>`
    SELECT count(*)::text AS count FROM ddf_master_keys WHERE generation = ${generation}
  `;
  if (Number(present[0]?.count || 0) === 0) return 0;
  const removed = await sql<{ listing_key: string }[]>`
    DELETE FROM ddf_listings
    WHERE listing_key NOT IN (
      SELECT listing_key FROM ddf_master_keys WHERE generation = ${generation}
    )
    RETURNING listing_key
  `;
  await sql`DELETE FROM ddf_master_keys WHERE generation <> ${generation}`;
  return removed.length;
}

export async function searchDdfListings(filters: SearchFilters, limit = 48): Promise<{ properties: Property[]; total: number }> {
  const sql = await officeDb();
  if (!sql) return { properties: [], total: 0 };
  const city = filters.city?.trim() || "";
  const q = (filters.q?.trim() || "").replace(/[%_]/g, "");
  const typePattern = filters.propertyType ? TYPE_SQL[filters.propertyType.toLowerCase()] || filters.propertyType : "";
  const rows = await sql<ListingRow[]>`
    SELECT * FROM ddf_listings
    WHERE (${city} = '' OR city ILIKE ${city})
      AND (${filters.minPrice ?? null}::int IS NULL OR list_price >= ${filters.minPrice ?? null})
      AND (${filters.maxPrice ?? null}::int IS NULL OR list_price <= ${filters.maxPrice ?? null})
      AND (${filters.beds ?? null}::int IS NULL OR beds >= ${filters.beds ?? null})
      AND (${filters.baths ?? null}::numeric IS NULL OR baths >= ${filters.baths ?? null})
      AND (${filters.minSqft ?? null}::int IS NULL OR sqft >= ${filters.minSqft ?? null})
      AND (${filters.maxSqft ?? null}::int IS NULL OR sqft <= ${filters.maxSqft ?? null})
      AND (${filters.maxDays ?? null}::int IS NULL OR listed_at >= now() - ((${filters.maxDays ?? 0})::text || ' days')::interval)
      AND (${q} = '' OR address ILIKE ${"%" + q + "%"} OR city ILIKE ${"%" + q + "%"} OR postal_code ILIKE ${"%" + q + "%"} OR listing_id ILIKE ${"%" + q + "%"} OR public_remarks ILIKE ${"%" + q + "%"})
      AND (${typePattern} = '' OR property_type ~* ${typePattern})
    ORDER BY listed_at DESC NULLS LAST, list_price DESC
    LIMIT ${limit}
  `;
  const totals = await sql<{ count: string }[]>`
    SELECT count(*)::text AS count FROM ddf_listings
    WHERE (${city} = '' OR city ILIKE ${city})
      AND (${filters.minPrice ?? null}::int IS NULL OR list_price >= ${filters.minPrice ?? null})
      AND (${filters.maxPrice ?? null}::int IS NULL OR list_price <= ${filters.maxPrice ?? null})
      AND (${filters.beds ?? null}::int IS NULL OR beds >= ${filters.beds ?? null})
      AND (${filters.baths ?? null}::numeric IS NULL OR baths >= ${filters.baths ?? null})
      AND (${q} = '' OR address ILIKE ${"%" + q + "%"} OR city ILIKE ${"%" + q + "%"} OR postal_code ILIKE ${"%" + q + "%"} OR listing_id ILIKE ${"%" + q + "%"})
      AND (${typePattern} = '' OR property_type ~* ${typePattern})
  `;
  return { properties: rows.map(propertyFromRow), total: Number(totals[0]?.count || rows.length) };
}

export async function getDdfListing(id: string): Promise<Property | null> {
  const sql = await officeDb();
  if (!sql || !id) return null;
  const rows = await sql<ListingRow[]>`
    SELECT * FROM ddf_listings WHERE listing_key = ${id} OR listing_id = ${id} LIMIT 1
  `;
  return rows[0] ? propertyFromRow(rows[0]) : null;
}

export async function ddfListingsForAlert(input: {
  city: string;
  minPrice: number | null;
  maxPrice: number | null;
  beds: number | null;
  baths: number | null;
  propertyType: string;
  windowDays: number;
  exclude: string[];
}): Promise<Property[]> {
  const sql = await officeDb();
  if (!sql) return [];
  const typePattern = input.propertyType ? TYPE_SQL[input.propertyType.toLowerCase()] || input.propertyType : "";
  const rows = await sql<ListingRow[]>`
    SELECT * FROM ddf_listings
    WHERE (${input.city} = '' OR city ILIKE ${input.city})
      AND (${input.minPrice}::int IS NULL OR list_price >= ${input.minPrice})
      AND (${input.maxPrice}::int IS NULL OR list_price <= ${input.maxPrice})
      AND (${input.beds}::int IS NULL OR beds >= ${input.beds})
      AND (${input.baths}::numeric IS NULL OR baths >= ${input.baths})
      AND (${typePattern} = '' OR property_type ~* ${typePattern})
      AND COALESCE(listed_at, modification_timestamp, updated_at) >= now() - (${input.windowDays} || ' days')::interval
      AND NOT (listing_key = ANY(${input.exclude}))
    ORDER BY listed_at DESC NULLS LAST
    LIMIT 12
  `;
  return rows.map(propertyFromRow);
}
