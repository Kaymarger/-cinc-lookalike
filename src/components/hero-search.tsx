"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

const CITY_CHIPS = [
  { label: "Vancouver", q: "Vancouver" },
  { label: "Burnaby", q: "Burnaby" },
  { label: "North Van", q: "North Vancouver" },
  { label: "West Van", q: "West Vancouver" },
  { label: "Richmond", q: "Richmond" },
];

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"buy" | "sell">("buy");

  function goSearch(value?: string) {
    const trimmed = (value ?? q).trim();
    if (!trimmed) {
      router.push("/search");
      return;
    }
    const params = new URLSearchParams();
    params.set("q", trimmed);
    router.push(`/search?${params.toString()}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tab === "sell") {
      router.push("/seller/homeestimate/homevaluation");
      return;
    }
    goSearch();
  }

  return (
    <div className="hero-searchbar w-full max-w-[640px]">
      <div className="mb-4 inline-flex rounded-full bg-black/25 p-1 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setTab("buy")}
          className={
            tab === "buy"
              ? "rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#1f2930] shadow-sm"
              : "rounded-full px-5 py-2 text-sm font-medium text-white/90 hover:text-white"
          }
        >
          Buy a home
        </button>
        <button
          type="button"
          onClick={() => setTab("sell")}
          className={
            tab === "sell"
              ? "rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#1f2930] shadow-sm"
              : "rounded-full px-5 py-2 text-sm font-medium text-white/90 hover:text-white"
          }
        >
          Sell a home
        </button>
      </div>

      {tab === "buy" ? (
        <>
          <form
            id="search-bar-form"
            onSubmit={onSubmit}
            className="flex overflow-hidden rounded-2xl bg-white shadow-xl shadow-black/20"
          >
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#8aa0b2]" />
              <input
                id="search-bar-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="City, neighbourhood, or postal code"
                aria-label="Search homes"
                autoComplete="off"
                className="h-14 w-full border-0 bg-transparent pr-3 pl-12 text-[16px] text-[#222] outline-none placeholder:text-[#8aa0b2]"
              />
            </label>
            <button
              id="home-search-button"
              type="submit"
              className="m-1.5 shrink-0 rounded-xl bg-[var(--cedar)] px-5 text-sm font-semibold uppercase tracking-[0.06em] text-white transition hover:brightness-95 sm:px-7"
            >
              Search
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-medium tracking-wide text-white/70 uppercase">
              Popular
            </span>
            {CITY_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => goSearch(chip.q)}
                className="rounded-full border border-white/35 bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                {chip.label}
              </button>
            ))}
            <Link
              href="/search"
              className="rounded-full border border-white/35 bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Browse all
            </Link>
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-white p-5 text-left shadow-xl shadow-black/20 sm:p-6">
          <p className="text-base font-semibold text-[#222]">
            What’s your home worth?
          </p>
          <p className="mt-1 text-sm text-[#666]">
            Get a free estimate from Casey — takes about a minute.
          </p>
          <Link
            href="/seller/homeestimate/homevaluation"
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--cedar)] text-sm font-semibold uppercase tracking-[0.06em] text-white hover:brightness-95"
          >
            Get my home estimate
          </Link>
        </div>
      )}
    </div>
  );
}
