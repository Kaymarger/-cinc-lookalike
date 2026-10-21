"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useLeads } from "@/lib/leads";
import { useSavedSearches, savedSearchHref } from "@/lib/saved-searches";

export default function AgentAlertsPage() {
  const { ready: leadsReady, leads } = useLeads();
  const { ready: searchesReady, searches } = useSavedSearches();

  const alertLeads = leads.filter((l) => l.source === "search_alert");

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cedar)]">
        Matching
      </p>
      <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--cedar-deep)]">
        Saved searches
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">
        Alert signups from the consumer site. Device-local demo — in production
        these would sync to your CINC CRM.
      </p>

      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--cedar-deep)]">
          Alert leads
        </h2>
        {!leadsReady ? (
          <p className="mt-4 text-sm text-[var(--ink-muted)]">Loading…</p>
        ) : alertLeads.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--ink-muted)]">
            No search-alert leads yet. Use “Save this search” on{" "}
            <Link href="/search" className="text-[var(--cedar)] hover:underline">
              /search
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {alertLeads.map((lead) => (
              <li
                key={lead.id}
                className="flex flex-col gap-2 border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Bell className="size-4 text-[var(--cedar)]" />
                    <Link
                      href={`/agent/leads/${lead.id}`}
                      className="font-medium text-[var(--cedar)] hover:underline"
                    >
                      {lead.name}
                    </Link>
                  </div>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">
                    {lead.searchLabel || "Saved search"} · {lead.email}
                  </p>
                </div>
                <Link
                  href={`/agent/leads/${lead.id}`}
                  className="text-sm font-medium text-[var(--cedar)] hover:underline"
                >
                  Open lead
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--cedar-deep)]">
          Consumer device searches
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Searches saved in this browser (buyer device view).
        </p>
        {!searchesReady ? (
          <p className="mt-4 text-sm text-[var(--ink-muted)]">Loading…</p>
        ) : searches.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--ink-muted)]">
            No local saved searches on this device.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {searches.map((search) => (
              <li
                key={search.id}
                className="flex flex-col gap-2 border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-[var(--ink)]">{search.label}</p>
                  <p className="text-sm text-[var(--ink-muted)]">
                    {search.email} ·{" "}
                    {new Date(search.createdAt).toLocaleDateString("en-CA")}
                  </p>
                </div>
                <Link
                  href={savedSearchHref(search.filters)}
                  className="text-sm font-medium text-[var(--cedar)] hover:underline"
                >
                  View results
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
