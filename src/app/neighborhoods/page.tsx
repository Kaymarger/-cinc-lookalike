import type { Metadata } from "next";
import Link from "next/link";
import { CamelotPageHeader } from "@/components/camelot-page-header";
import { QUICK_SEARCHES, quickSearchHref } from "@/lib/quick-searches";

export const metadata: Metadata = {
  title: "Neighbourhoods",
  description:
    "Browse Greater Vancouver neighbourhood quick searches — Kitsilano, Yaletown, North Vancouver, and more.",
};

export default function NeighborhoodsPage() {
  const areas = QUICK_SEARCHES.filter(
    (q) =>
      q.slug.startsWith("homes-for-sale-in-") ||
      q.slug.includes("vancouver") ||
      q.slug.includes("condos") ||
      q.slug.includes("townhomes") ||
      q.slug.includes("duplexes") ||
      q.slug.includes("luxury") ||
      q.slug.includes("open-houses") ||
      q.slug.includes("new-homes")
  );

  return (
    <div className="bg-white">
      <CamelotPageHeader
        title="Neighbourhoods"
        subtitle="Explore curated quick searches across Metro Vancouver — the same SEO landings featured on the live CINC site."
      />
      <div className="mx-auto max-w-[1000px] px-4 pb-14 sm:px-6">
        <ul className="mt-8 columns-1 gap-x-10 sm:columns-2 lg:columns-3">
          {areas.map((item) => (
            <li key={item.id} className="mb-2.5 break-inside-avoid">
              <Link
                href={quickSearchHref(item)}
                className="text-[15px] text-[var(--cedar)] hover:text-[var(--cedar-deep)] hover:underline"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
