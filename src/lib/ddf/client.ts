import { createHash, randomBytes } from "node:crypto";
import { ddfCredentials, safeDdfError } from "@/lib/ddf/credentials";
import { listingFromOData, listingFromRetsXml, xmlBlocks, type DdfListing } from "@/lib/ddf/normalize";

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
  const filtered = `${ODATA}/Property?$top=100&$orderby=ModificationTimestamp desc&$filter=${filter}&$expand=Media`;
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
  const raw = rowsOf(payload);
  const listings = listingsFromJson(payload);
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
  };
}

export async function fetchDdfMasterPage(nextUrl?: string | null): Promise<{ keys: string[]; nextUrl: string | null }> {
  const active = await session();
  if (active.mode === "rets") {
    const page = await fetchRetsPage(active, nextUrl, true);
    return { keys: page.keys, nextUrl: page.nextUrl };
  }
  const url = nextUrl || `${ODATA}/Property/PropertyReplication()?$top=100`;
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
  };
}
