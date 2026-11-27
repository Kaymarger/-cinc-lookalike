import type { Metadata } from "next";
import { AdTrustRow, PublicLeadForm } from "@/components/public-lead-form";
import { areaFromParams, landingHeadline } from "@/lib/lead-intake";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Search Greater Vancouver homes",
  description: `Tell ${SITE.agent} what you are looking for and get a home search set up for you.`,
  alternates: { canonical: "/lp/home-search" },
};

export default async function HomeSearchLanding({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const area = areaFromParams(await searchParams);
  return (
    <div className="bg-[#f4f7f8]">
      <section className="mx-auto max-w-xl px-4 py-8 pb-16">
        <h1 className="text-[32px] leading-tight font-semibold text-[#16324f]">{landingHeadline(area)}</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-[#444]">
          Share your name and how to reach you. We will set up a search and send matches.
        </p>
        <div className="mt-5">
          <PublicLeadForm key={area || "all"} source="buyer_signup" intent="buyer" area={area} submitLabel="Start my search" />
        </div>
        <AdTrustRow />
      </section>
    </div>
  );
}
