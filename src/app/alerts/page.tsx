"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { PageAssist } from "@/components/page-assist";
import { AccountSearchList } from "@/components/account-searches";
import { savedSearchHref, useSavedSearches } from "@/lib/saved-searches";

export default function AlertsPage() {
  const { ready, searches, remove, clear } = useSavedSearches();

  return (
    <div className="bg-[#f7fafc]">
      <div className="border-b border-[#e8eef3] bg-white px-4 py-3">
        <PageAssist />
      </div>
      <div className="mx-auto max-w-[800px] px-4 py-10 sm:px-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#222]">
          Saved searches
        </h1>
        <p className="mt-3 text-[15px] text-[#666]">
          {!ready
            ? "Loading…"
            : searches.length === 0
              ? "Save a search from the results page to get notified when matching homes appear."
              : `${searches.length} alert${searches.length === 1 ? "" : "s"} on this device.`}
        </p>

        {ready && searches.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-[#e5eef5] bg-white px-6 py-14 text-center">
            <Bell className="mx-auto size-10 text-[var(--cedar)]" strokeWidth={1.5} />
            <p className="mt-4 text-lg font-semibold text-[#222]">
              No alerts yet
            </p>
            <p className="mt-2 text-sm text-[#666]">
              Run a search, then tap “Save search” to create an alert.
            </p>
            <Link
              href="/search"
              className="mt-6 inline-flex h-11 items-center rounded-full bg-[var(--cedar)] px-6 text-sm font-semibold text-white hover:brightness-95"
            >
              Start a search
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {searches.map((search) => (
              <li
                key={search.id}
                className="flex flex-col gap-3 rounded-2xl border border-[#e5eef5] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[var(--cedar)]">
                    <Bell className="size-4 shrink-0" />
                    <p className="font-medium text-[#222]">{search.label}</p>
                  </div>
                  <p className="mt-1 text-sm text-[#666]">
                    Alerts to {search.email} · saved{" "}
                    {new Date(search.createdAt).toLocaleDateString("en-CA")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={savedSearchHref(search.filters)}
                    className="inline-flex h-10 items-center rounded-full border border-[#d7e0e8] px-4 text-sm font-semibold text-[var(--cedar)] hover:bg-[#edf5fd]"
                  >
                    View results
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(search.id)}
                    className="inline-flex h-10 items-center px-3 text-sm text-[#666] hover:text-[var(--cedar)]"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <AccountSearchList heading="Saved searches from your agent" />

        {searches.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="mt-6 text-sm text-[#666] hover:text-[var(--cedar)]"
          >
            Clear all alerts
          </button>
        )}
      </div>
    </div>
  );
}
