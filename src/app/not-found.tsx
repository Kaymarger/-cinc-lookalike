import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cedar)]">
        404
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--cedar-deep)] sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-[var(--ink-muted)]">
        That listing or page isn’t here. Try a suggested search or head back to
        all active homes.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link
          href="/search?city=Burnaby&maxPrice=1000000"
          className="inline-flex rounded-sm border border-[var(--cedar)] px-3 py-2 text-sm font-medium text-[var(--cedar)] hover:bg-[#edf5fd]"
        >
          Burnaby under $1M
        </Link>
        <Link
          href="/search?sort=newest"
          className="inline-flex rounded-sm border border-[var(--cedar)] px-3 py-2 text-sm font-medium text-[var(--cedar)] hover:bg-[#edf5fd]"
        >
          Newest listings
        </Link>
        <Link
          href="/search"
          className="inline-flex rounded-sm bg-[var(--cedar)] px-4 py-2 text-sm font-medium text-white hover:brightness-95"
        >
          Search homes
        </Link>
      </div>
    </div>
  );
}
