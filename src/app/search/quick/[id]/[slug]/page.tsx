import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SearchExperience } from "@/components/search-experience";
import {
  getQuickSearch,
  quickSearchHref,
  QUICK_SEARCHES,
} from "@/lib/quick-searches";
import { marketStats, searchProperties } from "@/lib/search";

type Params = Promise<{ id: string; slug: string }>;

export function generateStaticParams() {
  return QUICK_SEARCHES.map((q) => ({ id: q.id, slug: q.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id, slug } = await params;
  const qs = getQuickSearch(id, slug) ?? getQuickSearch(id);
  if (!qs) return { title: "Quick Search" };
  return {
    title: qs.title,
    description: qs.description,
  };
}

export default async function QuickSearchPage({
  params,
}: {
  params: Params;
}) {
  const { id, slug } = await params;
  const byBoth = getQuickSearch(id, slug);
  const byId = getQuickSearch(id);

  if (!byId) notFound();
  if (!byBoth) redirect(quickSearchHref(byId));

  const results = searchProperties(byBoth.filters);
  const stats = marketStats(results);

  return (
    <SearchExperience
      filters={byBoth.filters}
      properties={results}
      stats={stats}
      heading={byBoth.title}
    />
  );
}
