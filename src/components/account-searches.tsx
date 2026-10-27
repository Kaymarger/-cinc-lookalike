"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { savedSearchSummary, type LeadSavedSearch } from "@/lib/office-access";
import { useDemoAuth } from "@/lib/demo-auth";
import { savedSearchHref } from "@/lib/saved-searches";
import type { SearchFilters } from "@/lib/types";

export function useAccountSearches() {
  const { user } = useDemoAuth();
  const email = user?.email?.trim().toLowerCase() || "";
  const [searches, setSearches] = useState<LeadSavedSearch[]>([]);
  const [loadedFor, setLoadedFor] = useState("");

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    fetch(`/api/account/searches?email=${encodeURIComponent(email)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return { searches: [] as LeadSavedSearch[] };
        return (await response.json()) as { searches?: LeadSavedSearch[] };
      })
      .then((data) => {
        if (cancelled) return;
        setSearches(data.searches ?? []);
        setLoadedFor(email);
      })
      .catch(() => {
        if (!cancelled) setLoadedFor(email);
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

  const ready = !email || loadedFor === email;
  const visible = email && loadedFor === email ? searches : [];

  async function remove(id: string) {
    if (!email) return;
    const response = await fetch("/api/account/searches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, id }),
    });
    if (response.ok) setSearches((current) => current.filter((search) => search.id !== id));
  }

  return { email, ready, searches: visible, remove };
}

export function AccountSearchList({ heading = "Saved searches from your agent" }: { heading?: string }) {
  const { email, ready, searches, remove } = useAccountSearches();
  if (!email) {
    return (
      <p className="mt-4 text-sm text-[#354652]">
        Sign in with the email your agent has on file to see saved searches they created for you.
      </p>
    );
  }
  if (!ready) return <p className="mt-4 text-sm text-[#666]">Loading saved searches…</p>;
  if (!searches.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-[#1f2930]">{heading}</h2>
      <ul className="mt-3 space-y-3">
        {searches.map((search) => {
          const filters: SearchFilters = {
            city: search.city || undefined,
            minPrice: search.minPrice ?? undefined,
            maxPrice: search.maxPrice ?? undefined,
            beds: search.beds ?? undefined,
            baths: search.baths ?? undefined,
            propertyType: search.propertyType || undefined,
          };
          return (
            <li key={search.id} className="border border-[#dbe3e8] bg-white p-4">
              <p className="font-semibold">{search.name}</p>
              <p className="mt-1 text-sm text-[#354652]">{savedSearchSummary(search)}</p>
              <div className="mt-3 flex gap-3 text-sm">
                <Link href={savedSearchHref(filters)} className="text-[#1976d2]">
                  View results
                </Link>
                <button type="button" className="text-[#e53935]" onClick={() => void remove(search.id)}>
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
