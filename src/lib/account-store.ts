import {
  applyAccountNotes,
  cleanFilters,
  idsFromLine,
  propertyNotesFromText,
  readNotebooks,
  readTaggedLine,
  type NotebookNote,
  type PropertyNote,
} from "@/lib/account-merge";
import { insertSearch, listSearchesForEmail } from "@/lib/lead-searches-db";
import { officeDb } from "@/lib/leads-db";
import { EMPTY_CRITERIA, type SearchCriteria } from "@/lib/office-access";
import { SITE } from "@/lib/site";
import type { SearchFilters } from "@/lib/types";

export type AccountSearch = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  filters: SearchFilters;
};

export type AccountSnapshot = {
  homes: string[];
  compare: string[];
  notebook: NotebookNote[];
  propertyNotes: PropertyNote[];
  searches: AccountSearch[];
};

export type AccountPatch = {
  email: string;
  name?: string;
  homes?: string[];
  homesMode?: "merge" | "replace";
  compare?: string[];
  compareMode?: "merge" | "replace";
  notebook?: NotebookNote[];
  notebookMode?: "merge" | "replace";
  propertyNotes?: PropertyNote[];
  searches?: { name?: string; filters?: unknown; createdAt?: string }[];
  searchesMode?: "merge" | "replace";
};

const EMPTY: AccountSnapshot = { homes: [], compare: [], notebook: [], propertyNotes: [], searches: [] };

function snapshotFrom(notes: string, searches: AccountSearch[]): AccountSnapshot {
  return {
    homes: idsFromLine(readTaggedLine(notes, "Favourites")),
    compare: idsFromLine(readTaggedLine(notes, "Compare")),
    notebook: readNotebooks(notes),
    propertyNotes: propertyNotesFromText(notes),
    searches,
  };
}

function searchFilters(search: {
  city: string;
  minPrice: number | null;
  maxPrice: number | null;
  beds: number | null;
  baths: number | null;
  propertyType: string;
  criteria: SearchCriteria;
}): SearchFilters {
  const saved = (search.criteria as SearchCriteria & { savedFilters?: unknown }).savedFilters;
  const cleaned = cleanFilters(saved);
  if (Object.keys(cleaned).length) return cleaned;
  return {
    city: search.city || undefined,
    minPrice: search.minPrice ?? undefined,
    maxPrice: search.maxPrice ?? undefined,
    beds: search.beds ?? undefined,
    baths: search.baths ?? undefined,
    propertyType: search.propertyType || undefined,
  };
}

async function searchesFor(email: string): Promise<AccountSearch[]> {
  const rows = await listSearchesForEmail(email).catch(() => []);
  return rows.map((search) => ({
    id: search.id,
    name: search.name,
    email: search.leadEmail,
    createdAt: search.createdAt,
    filters: searchFilters(search),
  }));
}

export async function readAccount(email: string): Promise<AccountSnapshot> {
  const sql = await officeDb();
  if (!sql) return EMPTY;
  const rows = await sql<{ notes: string | null }[]>`
    SELECT notes FROM captured_leads WHERE lower(email) = ${email} ORDER BY created_at ASC LIMIT 1
  `;
  if (!rows[0]) return { ...EMPTY, searches: await searchesFor(email) };
  return snapshotFrom(rows[0].notes || "", await searchesFor(email));
}

export async function writeAccount(patch: AccountPatch): Promise<AccountSnapshot | null> {
  const sql = await officeDb();
  if (!sql) return null;
  const email = patch.email.trim().toLowerCase();
  const hasContent = Boolean(
    patch.homes?.length || patch.compare?.length || patch.notebook?.length || patch.propertyNotes?.length || patch.searches?.length
  );
  const saved = await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtext(${email}))`;
    const rows = await tx<{ id: string; notes: string | null }[]>`
      SELECT id, notes FROM captured_leads WHERE lower(email) = ${email} ORDER BY created_at ASC LIMIT 1 FOR UPDATE
    `;
    let leadId = rows[0]?.id || "";
    let currentNotes = rows[0]?.notes || "";
    if (!leadId && !hasContent) return null;
    if (!leadId) {
      leadId = crypto.randomUUID();
      const display = (patch.name || "").trim().slice(0, 120) || email.split("@")[0] || "Lead";
      await tx`
        INSERT INTO captured_leads (
          id, name, email, phone, source, intent, status, notes, consent, attribution, assigned_to, partner_name, listing_agent
        ) VALUES (
          ${leadId},
          ${display},
          ${email},
          '',
          'registration',
          'buyer',
          'new',
          '',
          true,
          ${sql.json({})},
          ${SITE.agent},
          'Unassigned',
          'Unassigned'
        )
      `;
      currentNotes = "";
    }
    const next = applyAccountNotes(currentNotes, patch);
    await tx`UPDATE captured_leads SET notes = ${next}, updated_at = now() WHERE id = ${leadId}`;
    return { leadId, notes: next };
  });
  if (!saved) return EMPTY;
  const { leadId, notes } = saved;

  if (patch.searchesMode === "replace") {
    await sql`DELETE FROM lead_saved_searches WHERE lower(lead_email) = ${email}`;
  }
  const incoming = (patch.searches || [])
    .map((search) => ({
      name: (search.name || "").replace(/\s+/g, " ").trim().slice(0, 140),
      filters: cleanFilters(search.filters),
    }))
    .filter((search) => search.name);
  if (incoming.length) {
    const current = await listSearchesForEmail(email);
    const names = new Set(current.map((search) => search.name.trim().toLowerCase()));
    for (const search of incoming) {
      const key = search.name.toLowerCase();
      if (names.has(key)) continue;
      names.add(key);
      await insertSearch(leadId, {
        leadEmail: email,
        name: search.name,
        city: search.filters.city || "",
        minPrice: search.filters.minPrice ?? null,
        maxPrice: search.filters.maxPrice ?? null,
        beds: search.filters.beds ?? null,
        baths: search.filters.baths ?? null,
        propertyType: search.filters.propertyType || "",
        frequency: "Daily (Best for default search)",
        criteria: { ...EMPTY_CRITERIA, savedFilters: search.filters } as SearchCriteria,
      }).catch(() => undefined);
    }
  }

  return snapshotFrom(notes, await searchesFor(email));
}
