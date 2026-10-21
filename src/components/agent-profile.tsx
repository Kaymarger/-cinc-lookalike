import Image from "next/image";
import { ContactInquiryForm } from "@/components/contact-inquiry-form";
import { SITE } from "@/lib/site";

const BIO = `Casey Archibald | Top Vancouver Realtor

Born and raised in Vancouver, Casey Archibald is proud to call this city home and has built his real estate career around helping clients succeed in one of the world’s most competitive housing markets. With deep local knowledge and global perspective gained through years of international travel and professional experience, Casey offers clients a unique advantage when buying or selling real estate in Vancouver.

After graduating from the University of British Columbia (UBC), Casey pursued a professional basketball career across Europe and represented Team Canada on multiple occasions. The discipline, resilience, and competitive mindset he developed as an elite athlete now define his approach as a top Vancouver Realtor—delivering strong results, strategic negotiation, and unwavering commitment to his clients.

Casey has extensive experience in residential sales, luxury homes, and new developments, including his time working with Bosa Properties. He has been involved in over $1 billion in real estate transactions and is highly skilled in contract negotiation, pricing strategy, and navigating Vancouver’s fast-moving market.

Consistently recognized as one of the top Realtors in Vancouver, Casey has earned numerous industry awards, including Presidents Club (Top 1% of Vancouver Realtors), Medallion Club (Top 10% of Vancouver Realtors), RE/MAX Hall of Fame, RE/MAX Platinum Award, RE/MAX Chairman’s Club, and Top Producing RE/MAX Group in the World.

Casey lives in Vancouver with his wife Natalie and their two children. Outside of real estate, he enjoys exploring North Vancouver’s trails, spending time at local beaches, skiing in the winter, and staying actively involved in the community.

Whether buying, selling, or investing, Casey Archibald is committed to delivering a seamless, high-performance real estate experience built on trust, communication, and exceptional results.`;

export function AgentProfile({
  showInquiry = true,
}: {
  showInquiry?: boolean;
}) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="relative mb-8 w-fit pb-3 font-[family-name:var(--font-display)] text-2xl text-[#222] sm:text-3xl">
        About
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-[3px] w-16 bg-[var(--cedar)]"
        />
      </h2>

      <div className="grid gap-10 lg:grid-cols-[1.4fr_0.85fr]">
        <article className="border border-[#e8e8e8] bg-white p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row">
            <Image
              src="/brand/casey.jpg"
              alt="Casey Archibald"
              width={160}
              height={160}
              className="size-28 shrink-0 object-cover sm:size-36"
            />
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#222]">
                Casey Archibald
              </h1>
              <p className="mt-1 text-sm text-[var(--cedar)]">
                Personal Real Estate Corporation
              </p>
              <p className="mt-3 text-sm text-[#555]">
                <a
                  href={`tel:${SITE.phoneTel}`}
                  className="text-[var(--cedar)] hover:underline"
                >
                  {SITE.phoneDisplay}
                </a>
                <br />
                <a
                  href="mailto:agent@example.com"
                  className="text-[var(--cedar)] hover:underline"
                >
                  agent@example.com
                </a>
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed whitespace-pre-line text-[#555]">
            {BIO}
          </div>
          <p className="mt-6 text-sm text-[#666]">
            Casey Archibald
            <br />
            Personal Real Estate Corporation
            <br />
            Archibald Real Estate Group | RE/MAX Crest Realty
            <br />
            {SITE.addressLine}, Vancouver, British Columbia
          </p>
        </article>

        {showInquiry && (
          <div id="inquiry">
            <ContactInquiryForm source="general" heading="Contact Us" />
          </div>
        )}
      </div>
    </div>
  );
}
