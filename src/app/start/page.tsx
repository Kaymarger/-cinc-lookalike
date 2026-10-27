import type { Metadata } from "next";
import Link from "next/link";
import { LeadCaptureForms } from "@/components/lead-capture-forms";
import { PropertyCard } from "@/components/property-card";
import { getFeaturedProperties, searchProperties } from "@/lib/search";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Find a home or request an estimate",
  description:
    "Search sample Greater Vancouver listings, or send a buyer, seller, or home-valuation request to Archibald Real Estate Group. No account required.",
};

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawQuery = params.q;
  const query = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim() ?? "";
  const matches = query ? searchProperties({ q: query }) : [];
  const sent = params.sent === "1" || (Array.isArray(params.sent) && params.sent.includes("1"));
  const errorRaw = params.error;
  const error = Array.isArray(errorRaw) ? errorRaw[0] : errorRaw;
  const listings = (query ? matches : getFeaturedProperties()).slice(0, 6);
  const heading = query
    ? `${matches.length} sample ${matches.length === 1 ? "home" : "homes"} for “${query}”`
    : "Sample homes across Greater Vancouver";

  return (
    <div className="bg-white">
      <section className="bg-[var(--cedar-deep)] text-white">
        <div className="mx-auto max-w-[1170px] px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-sm font-bold tracking-[0.14em] uppercase">
            {SITE.company}
          </p>
          <h1 className="mt-2 max-w-3xl font-[family-name:var(--font-display)] text-4xl leading-tight sm:text-5xl">
            Greater Vancouver Area Home Search
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/90">
            Search neighbourhoods, then ask {SITE.agent} for buyer help, a listing plan, or a home valuation. No login required.
          </p>
          <form action="/start" method="get" className="mt-6 flex max-w-2xl flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="start-search">
              City, neighbourhood, or address
            </label>
            <input
              id="start-search"
              name="q"
              defaultValue={query}
              placeholder="City, neighbourhood, or address"
              className="h-12 min-w-0 flex-1 border-0 bg-white px-3 text-base text-[#1f2930] outline-none"
            />
            <button
              type="submit"
              className="h-12 bg-[#1976d2] px-6 text-sm font-bold tracking-[1px] text-white uppercase hover:bg-[#145ca4]"
            >
              Search
            </button>
          </form>
          <p className="mt-3 text-xs text-white/75">
            Listings on this page are samples, not a live MLS feed.{" "}
            <Link href="/search" className="underline">
              Open the full search
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1170px] px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#1f2930] sm:text-3xl">
            {heading}
          </h2>
          {query && matches.length > listings.length && (
            <Link href={`/search?q=${encodeURIComponent(query)}`} className="text-sm font-semibold text-[#1976d2] hover:underline">
              View all {matches.length}
            </Link>
          )}
        </div>
        {listings.length === 0 ? (
          <p className="mt-6 text-sm text-[#555]">
            No sample listings match that search. Try Vancouver, Kitsilano, or Burnaby — or send a request below and an agent will look with you.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((property, index) => (
              <PropertyCard key={property.id} property={property} priority={index < 2} />
            ))}
          </div>
        )}
        {query && matches.length > listings.length && (
          <p className="mt-4 text-sm text-[#666]">
            Showing {listings.length} of {matches.length} sample matches.
          </p>
        )}
      </section>

      <LeadCaptureForms notice={{ sent, error }} />
    </div>
  );
}
