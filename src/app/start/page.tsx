import type { Metadata } from "next";
import { adLandingSearch, MetaCapiPageView } from "@/components/meta-capi-pageview";
import { AdTrustRow, PublicLeadForm, StickyLeadCta } from "@/components/public-lead-form";
import { areaFromParams, landingHeadline } from "@/lib/lead-intake";

const BUYER_SUBHEAD =
  "Get new listings the moment they hit the market, plus instant price and neighbourhood insights.";

type Params = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Params>;
}): Promise<Metadata> {
  const area = areaFromParams(await searchParams);
  const title = area ? `${area} homes for sale` : "Find a Greater Vancouver home";
  const description = area
    ? `${BUYER_SUBHEAD} Searching ${area}.`
    : BUYER_SUBHEAD;
  return {
    title,
    description,
    alternates: { canonical: area ? `/start?area=${encodeURIComponent(area)}` : "/start" },
    robots: { index: true, follow: true },
  };
}

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const area = areaFromParams(params);
  const headline = landingHeadline(area);

  return (
    <div className="bg-[#f4f7f8]">
      <MetaCapiPageView pathname="/start" search={adLandingSearch(params)} />
      <section className="mx-auto max-w-xl px-4 pt-4 pb-24 sm:pt-10">
        <h1 className="text-[28px] leading-[1.15] font-semibold tracking-tight text-[#16324f] sm:text-[40px]">
          {headline}
        </h1>
        <p className="mt-2 text-[15px] leading-snug text-[#3d4a55] sm:text-[17px]">
          {BUYER_SUBHEAD}
        </p>
        <div className="mt-4">
          <PublicLeadForm
            key={area || "all"}
            source="buyer_signup"
            intent="buyer"
            area={area}
            submitLabel="Get matching homes"
          />
        </div>
        <AdTrustRow />
      </section>
      <StickyLeadCta />
    </div>
  );
}
