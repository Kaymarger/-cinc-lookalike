import type { Metadata } from "next";
import { AdTrustRow, PublicLeadForm, StickyLeadCta } from "@/components/public-lead-form";
import { areaFromParams, landingHeadline } from "@/lib/lead-intake";
import { SITE } from "@/lib/site";

type Params = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Params>;
}): Promise<Metadata> {
  const area = areaFromParams(await searchParams);
  const title = area ? `${area} homes for sale` : "Find a Greater Vancouver home";
  const description = area
    ? `Tell ${SITE.agent} what you want in ${area}. Get matching homes by email. No account required.`
    : `Tell ${SITE.agent} what you want in Greater Vancouver. Get matching homes by email. No account required.`;
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
  const area = areaFromParams(await searchParams);
  const headline = landingHeadline(area);

  return (
    <div className="bg-[#f4f7f8]">
      <section className="mx-auto max-w-xl px-4 pt-4 pb-24 sm:pt-10">
        <h1 className="text-[28px] leading-[1.15] font-semibold tracking-tight text-[#16324f] sm:text-[40px]">
          {headline}
        </h1>
        <p className="mt-2 text-[16px] leading-relaxed text-[#3d4a55]">
          Share your name and how to reach you. {SITE.agent} will set up your search and send matches. No account and no obligation.
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
