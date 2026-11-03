import { createHash, randomBytes } from "node:crypto";
import { ddfCredentials, safeDdfError } from "@/lib/ddf/credentials";
import { listingFromOData, listingFromRetsXml, neighbourhoodOf, openHousesFromRecord, xmlBlocks, type DdfListing } from "@/lib/ddf/normalize";

const TOKEN_URL = "https://identity.crea.ca/connect/token";
const ODATA = "https://ddfapi.realtor.ca/odata/v1";
const RETS_LOGIN = "https://data.crea.ca/Login.svc/Login";
const RETS_SEARCH = "https://data.crea.ca/Search.svc/Search";

export type DdfPage = {
  mode: "oauth" | "rets";
  listings: DdfListing[];
  nextUrl: string | null;
  keys: string[];
  rawCount: number;
  fieldNames: string;
};

type Session = {
  mode: "oauth" | "rets";
  token: string;
  cookie: string;
};

function md5(value: string): string {
  return createHash("md5").update(value).digest("hex");
}

async function digestFetch(url: string, username: string, password: string, init: RequestInit = {}) {
  const method = (init.method || "GET").toUpperCase();
  const first = await fetch(url, { ...init, method, redirect: "manual" });
  if (first.status !== 401) return first;
  const www = first.headers.get("www-authenticate") || "";
  const pick = (name: string) => new RegExp(`${name}="([^"]*)"`, "i").exec(www)?.[1] || "";
  const realm = pick("realm");
  const nonce = pick("nonce");
  const opaque = pick("opaque");
  const qop = (pick("qop").split(",")[0] || "auth").trim();
  if (!realm || !nonce) return first;
  const uri = `${new URL(url).pathname}${new URL(url).search}`;
  const nc = "00000001";
  const cnonce = randomBytes(8).toString("hex");
  const ha1 = md5(`${username}:${realm}:${password}`);
  const ha2 = md5(`${method}:${uri}`);
  const response = qop
    ? md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
    : md5(`${ha1}:${nonce}:${ha2}`);
  const header = [
    `Digest username="${username}"`,
    `realm="${realm}"`,
    `nonce="${nonce}"`,
    `uri="${uri}"`,
    `algorithm=MD5`,
    `response="${response}"`,
    qop ? `qop=${qop}` : "",
    qop ? `nc=${nc}` : "",
    qop ? `cnonce="${cnonce}"` : "",
    opaque ? `opaque="${opaque}"` : "",
  ]
    .filter(Boolean)
    .join(", ");
  return fetch(url, {
    ...init,
    method,
    redirect: "manual",
    headers: { ...(init.headers || {}), Authorization: header },
  });
}

async function oauthSession(username: string, password: string): Promise<Session> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: username,
    client_secret: password,
    scope: "DDFApi_Read",
  });
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15000),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(safeDdfError(response.status, raw));
  let token = "";
  try {
    token = String((JSON.parse(raw) as { access_token?: string }).access_token || "");
  } catch {
    token = "";
  }
  if (!token) throw new Error("DDF OAuth did not return a token.");
  return { mode: "oauth", token, cookie: "" };
}

async function retsSession(username: string, password: string): Promise<Session> {
  const response = await digestFetch(RETS_LOGIN, username, password, {
    method: "POST",
    signal: AbortSignal.timeout(15000),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(safeDdfError(response.status, raw));
  const setCookies =
    typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  const cookie = (setCookies.length ? setCookies : [response.headers.get("set-cookie") || ""])
    .map((part) => part.split(";")[0]?.trim())
    .filter((part) => part && part.includes("="))
    .join("; ");
  if (!cookie) throw new Error("DDF RETS login did not start a session.");
  return { mode: "rets", token: "", cookie };
}

let sessionPromise: Promise<Session> | null = null;

export function resetDdfSession() {
  sessionPromise = null;
}

async function session(): Promise<Session> {
  const creds = ddfCredentials();
  if (!creds) throw new Error("DDF credentials are not set.");
  if (!sessionPromise) {
    sessionPromise = (async () => {
      try {
        return await oauthSession(creds.username, creds.password);
      } catch (oauthError) {
        try {
          return await retsSession(creds.username, creds.password);
        } catch (retsError) {
          const oauthMessage = oauthError instanceof Error ? oauthError.message : "OAuth failed";
          const retsMessage = retsError instanceof Error ? retsError.message : "RETS failed";
          throw new Error(`${oauthMessage} ${retsMessage}`.slice(0, 300));
        }
      }
    })().catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }
  return sessionPromise;
}

function rowsOf(payload: { value?: unknown }): Record<string, unknown>[] {
  return Array.isArray(payload.value)
    ? payload.value.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
    : [];
}

function listingsFromJson(payload: { value?: unknown }): DdfListing[] {
  return rowsOf(payload)
    .map((row) => listingFromOData(row))
    .filter((row): row is DdfListing => Boolean(row));
}

async function oauthGet(url: string, token: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  const raw = await response.text();
  if (response.status === 401) resetDdfSession();
  if (!response.ok) throw new Error(safeDdfError(response.status, raw));
  return JSON.parse(raw) as { value?: unknown; "@odata.nextLink"?: string };
}

export async function fetchDdfPropertyPage(nextUrl?: string | null): Promise<DdfPage> {
  const active = await session();
  if (active.mode === "rets") return fetchRetsPage(active, nextUrl);
  const filter = encodeURIComponent("StateOrProvince eq 'BC'");
  const filtered = `${ODATA}/Property?$top=100&$orderby=ModificationTimestamp desc&$filter=${filter}&$expand=Media,ListOffice`;
  const plain = `${ODATA}/Property?$top=100&$orderby=ModificationTimestamp desc`;
  let payload: { value?: unknown; "@odata.nextLink"?: string };
  try {
    payload = await oauthGet(nextUrl || filtered, active.token);
  } catch (error) {
    if (nextUrl) throw error;
    payload = await oauthGet(plain, active.token);
  }
  if (!nextUrl && rowsOf(payload).length === 0) {
    payload = await oauthGet(plain, active.token);
  }
  if (!nextUrl && rowsOf(payload).length === 0) {
    let replicated: { value?: unknown; "@odata.nextLink"?: string } = { value: [] };
    try {
      replicated = await oauthGet(`${ODATA}/Property/PropertyReplication()`, active.token);
    } catch {
      replicated = { value: [] };
    }
    const keys = rowsOf(replicated)
      .map((row) => String(row.ListingKey || ""))
      .filter(Boolean)
      .slice(0, 25);
    if (!keys.length) {
      const creds = ddfCredentials();
      if (!creds) throw new Error("DDF credentials are not set.");
      resetDdfSession();
      return fetchRetsPage(await retsSession(creds.username, creds.password), null);
    }
    const quoted = keys.map((key) => `'${key.replace(/'/g, "''")}'`).join(",");
    payload = await oauthGet(
      `${ODATA}/Property?$top=25&$filter=${encodeURIComponent(`ListingKey in (${quoted})`)}`,
      active.token
    );
    if (rowsOf(payload).length === 0) {
      const one = await oauthGet(`${ODATA}/Property('${encodeURIComponent(keys[0])}')`, active.token);
      const record = one as { value?: unknown; ListingKey?: string };
      if (record.ListingKey) payload = { value: [record] };
    }
  }
  const raw = rowsOf(payload);
  const listings = listingsFromJson(payload);
  if (!nextUrl && raw.length === 0) {
    const keys = Object.keys(payload).slice(0, 12).join(", ");
    throw new Error(`DDF property query returned no rows. Payload keys: ${keys || "none"}.`);
  }
  if (raw.length > 0 && listings.length === 0) {
    const fields = Object.keys(raw[0]).slice(0, 30).join(", ");
    throw new Error(`DDF returned ${raw.length} records and none were BC listings. Fields: ${fields}`);
  }
  return {
    mode: "oauth",
    listings,
    nextUrl: payload["@odata.nextLink"] || null,
    keys: listings.map((listing) => listing.listingKey),
    rawCount: raw.length,
    fieldNames: raw[0] ? Object.keys(raw[0]).slice(0, 40).join(", ") : "",
  };
}

export async function fetchOfficeNames(officeKeys: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(officeKeys.map((key) => key.trim()).filter(Boolean))].slice(0, 40);
  if (!unique.length) return new Map();
  const active = await session();
  if (active.mode !== "oauth") return new Map();
  const quoted = unique.map((key) => `'${key.replace(/'/g, "''")}'`).join(",");
  const payload = await oauthGet(
    `${ODATA}/Office?$top=40&$filter=${encodeURIComponent(`OfficeKey in (${quoted})`)}`,
    active.token
  );
  const names = new Map<string, string>();
  for (const row of rowsOf(payload)) {
    const key = String(row.OfficeKey || row.ListOfficeKey || "");
    const name = String(row.OfficeName || row.ListOfficeName || "").trim();
    if (key && name) names.set(key, name);
  }
  return names;
}

function quote(value: string): string {
  return value.replace(/'/g, "''");
}

/** Listings whose MLS sub-area is exactly this name. Tries the CREA area fields. */
export async function fetchAreaListings(name: string): Promise<DdfListing[]> {
  const cleaned = name.trim();
  if (!/^[a-z0-9][a-z0-9 .'-]{1,40}$/i.test(cleaned)) return [];
  const active = await session();
  if (active.mode !== "oauth") return [];
  const safe = quote(cleaned);
  for (const filter of [`CityRegion eq '${safe}'`, `SubdivisionName eq '${safe}'`]) {
    try {
      const payload = await oauthGet(
        `${ODATA}/Property?$top=60&$filter=${encodeURIComponent(filter)}&$expand=Media`,
        active.token
      );
      const listings = listingsFromJson(payload);
      if (listings.length) return listings;
    } catch {
      continue;
    }
  }
  return [];
}

export type AreaStamp = { listingKey: string; city: string; neighbourhood: string };

/** One page of listing keys plus their MLS sub-area, for autocomplete. */
export async function fetchAreaStampPage(nextUrl?: string | null): Promise<{ stamps: AreaStamp[]; nextUrl: string | null }> {
  const active = await session();
  if (active.mode !== "oauth") return { stamps: [], nextUrl: null };
  const select = encodeURIComponent("ListingKey,City,CityRegion,SubdivisionName");
  const url = nextUrl || `${ODATA}/Property?$top=200&$select=${select}&$orderby=ModificationTimestamp desc`;
  let payload: { value?: unknown; "@odata.nextLink"?: string };
  try {
    payload = await oauthGet(url, active.token);
  } catch {
    if (nextUrl) return { stamps: [], nextUrl: null };
    try {
      payload = await oauthGet(`${ODATA}/Property?$top=100&$orderby=ModificationTimestamp desc`, active.token);
    } catch {
      return { stamps: [], nextUrl: null };
    }
  }
  const stamps = rowsOf(payload)
    .map((row) => {
      const listingKey = String(row.ListingKey || "");
      const neighbourhood = neighbourhoodOf(row);
      if (!listingKey || !neighbourhood) return null;
      return { listingKey, city: String(row.City || ""), neighbourhood };
    })
    .filter((row): row is AreaStamp => Boolean(row));
  return { stamps, nextUrl: payload["@odata.nextLink"] || null };
}

/** One listing with photos, video, floor plans, and open houses. */
export async function fetchListingDetail(listingKey: string): Promise<DdfListing | null> {
  const active = await session();
  if (active.mode !== "oauth" || !listingKey) return null;
  const filter = encodeURIComponent(`ListingKey eq '${quote(listingKey)}'`);
  let payload: { value?: unknown };
  try {
    payload = await oauthGet(`${ODATA}/Property?$top=1&$filter=${filter}&$expand=Media,OpenHouse`, active.token);
  } catch {
    try {
      payload = await oauthGet(`${ODATA}/Property?$top=1&$filter=${filter}&$expand=Media`, active.token);
    } catch {
      return null;
    }
  }
  const listing = listingsFromJson(payload)[0] || null;
  if (!listing) return null;
  if (!listing.openHouses.length) {
    try {
      const houses = await oauthGet(
        `${ODATA}/OpenHouse?$top=20&$filter=${encodeURIComponent(`ListingKey eq '${quote(listingKey)}'`)}`,
        active.token
      );
      listing.openHouses = openHousesFromRecord({ OpenHouse: rowsOf(houses) });
    } catch {
      listing.openHouses = listing.openHouses || [];
    }
  }
  listing.detailsSynced = true;
  return listing;
}

export async function fetchDdfMasterPage(nextUrl?: string | null): Promise<{ keys: string[]; nextUrl: string | null }> {
  const active = await session();
  if (active.mode === "rets") {
    const page = await fetchRetsPage(active, nextUrl, true);
    return { keys: page.keys, nextUrl: page.nextUrl };
  }
  const url = nextUrl || `${ODATA}/Property/PropertyReplication()`;
  const payload = await oauthGet(url, active.token);
  const rows = Array.isArray(payload.value) ? payload.value : [];
  const keys = rows
    .map((row) => (row && typeof row === "object" ? String((row as { ListingKey?: string }).ListingKey || "") : ""))
    .filter(Boolean);
  return { keys, nextUrl: payload["@odata.nextLink"] || null };
}

async function fetchRetsPage(active: Session, nextUrl?: string | null, idsOnly = false): Promise<DdfPage> {
  const creds = ddfCredentials();
  if (!creds) throw new Error("DDF credentials are not set.");
  const offset = nextUrl ? Number(new URL(nextUrl).searchParams.get("Offset") || "1") : 1;
  const body = new URLSearchParams({
    SearchType: "Property",
    Class: "Property",
    Query: "(ID=*)",
    QueryType: "DMQL2",
    Format: "STANDARD-XML",
    Count: "1",
    Limit: "100",
    Offset: String(offset),
  });
  const response = await digestFetch(RETS_SEARCH, creds.username, creds.password, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: active.cookie,
      Accept: "application/xml, text/xml",
    },
    body,
  });
  const xml = await response.text();
  if (!response.ok) throw new Error(safeDdfError(response.status, xml));
  const details = xmlBlocks(xml, "PropertyDetails");
  const listings = (details.length ? details : xmlBlocks(xml, "Property"))
    .map(listingFromRetsXml)
    .filter((row): row is DdfListing => Boolean(row));
  const total = Number(/TotalRecords="(\d+)"/.exec(xml)?.[1] || "0");
  const returned = listings.length;
  const hasMore = returned > 0 && (total === 0 || offset + returned <= total);
  return {
    mode: "rets",
    listings: idsOnly ? [] : listings,
    keys: listings.map((listing) => listing.listingKey),
    nextUrl: hasMore ? `${RETS_SEARCH}?Offset=${offset + returned}` : null,
    rawCount: listings.length,
    fieldNames: "",
  };
}
