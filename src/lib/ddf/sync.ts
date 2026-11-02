import { fetchDdfMasterPage, fetchDdfPropertyPage } from "@/lib/ddf/client";
import {
  applyMasterDeletions,
  countDdfListings,
  readSyncState,
  rememberMasterKeys,
  upsertDdfListings,
  writeSyncState,
} from "@/lib/ddf/db";

export type SyncReport = {
  ok: boolean;
  mode: string;
  upserted: number;
  deleted: number;
  masterKeys: number;
  listingCount: number;
  message: string;
};

let running: Promise<SyncReport> | null = null;

export async function syncDdfBatch(options?: { budgetMs?: number; maxPages?: number }): Promise<SyncReport> {
  if (running) return running;
  running = run(options).finally(() => {
    running = null;
  });
  return running;
}

async function run(options?: { budgetMs?: number; maxPages?: number }): Promise<SyncReport> {
  const started = Date.now();
  const budget = options?.budgetMs ?? 45_000;
  const maxPages = options?.maxPages ?? 8;
  const state = await readSyncState();
  let upserted = 0;
  let deleted = 0;
  let masterKeys = 0;
  let mode = state.mode;
  let detailUrl = state.detailUrl;
  let fieldNames = "";
  let sawOffice = false;
  if (state.mode !== "oauth-fields") detailUrl = null;
  let masterUrl = state.masterUrl;
  let generation = state.masterGeneration || 1;
  let pages = 0;
  try {
    while (Date.now() - started < budget && pages < maxPages) {
      const page = await fetchDdfPropertyPage(detailUrl);
      mode = page.mode;
      fieldNames = page.fieldNames || fieldNames;
      if (page.listings.some((listing) => listing.brokerage)) sawOffice = true;
      upserted += await upsertDdfListings(page.listings);
      detailUrl = page.nextUrl;
      pages += 1;
      if (!page.nextUrl) {
        detailUrl = null;
        break;
      }
    }
    while (Date.now() - started < budget && pages < maxPages) {
      const page = await fetchDdfMasterPage(masterUrl);
      masterKeys += page.keys.length;
      await rememberMasterKeys(generation, page.keys);
      pages += 1;
      if (!page.nextUrl) {
        if (masterKeys > 0 || state.masterComplete) {
          deleted = await applyMasterDeletions(generation);
        }
        generation += 1;
        masterUrl = null;
        break;
      }
      masterUrl = page.nextUrl;
    }
    const listingCount = await countDdfListings();
    await writeSyncState({
      detailUrl,
      masterUrl,
      masterGeneration: generation,
      masterComplete: masterUrl === null,
      listingCount,
      mode: mode === "oauth" || mode === "oauth-office" ? "oauth-fields" : mode,
      lastError: sawOffice || !fieldNames ? "" : `Office name was empty. Fields: ${fieldNames}`.slice(0, 300),
    });
    return {
      ok: true,
      mode,
      upserted,
      deleted,
      masterKeys,
      listingCount,
      message: "",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "DDF sync failed";
    const listingCount = await countDdfListings().catch(() => 0);
    await writeSyncState({
      detailUrl,
      masterUrl,
      masterGeneration: generation,
      mode,
      listingCount,
      lastError: message.slice(0, 300),
    }).catch(() => undefined);
    return { ok: false, mode, upserted, deleted, masterKeys, listingCount, message: message.slice(0, 300) };
  }
}
