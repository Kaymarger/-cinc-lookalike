import type { Metadata } from "next";
import { adLandingSearch, MetaCapiPageView } from "@/components/meta-capi-pageview";
import { AdTrustRow, PublicLeadForm } from "@/components/public-lead-form";
import { areaFromParams, landingHeadline } from "@/lib/lead-intake";

const BUYER_SUBHEAD =
  "Get new listings the moment they hit the market, plus instant price and neighbourhood insights.";

export const metadata: Metadata = {
  title: "Search Greater Vancouver homes",
  description: BUYER_SUBHEAD,
  alternates: { canonical: "/lp/home-search" },
};

export default async function HomeSearchLanding({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const area = areaFromParams(params);
  return (
    <div className="bg-[#f4f7f8]">
      <MetaCapiPageView pathname="/lp/home-search" search={adLandingSearch(params)} />
      <section className="mx-auto max-w-xl px-4 py-8 pb-16">
        <h1 className="text-[32px] leading-tight font-semibold text-[#16324f]">{landingHeadline(area)}</h1>
        <p className="mt-2 text-[15px] leading-snug text-[#3d4a55] sm:text-[17px]">
          {BUYER_SUBHEAD}
        </p>
        <div className="mt-5">
          <PublicLeadForm key={area || "all"} source="buyer_signup" intent="buyer" area={area} submitLabel="Start my search" />
        </div>
        <AdTrustRow />
      </section>
    </div>
  );
}
