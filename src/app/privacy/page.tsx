import type { Metadata } from "next";
import Link from "next/link";
import { PageAssist } from "@/components/page-assist";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Archibald Real Estate Group collects contact details, listing-email consent, and optional advertising cookies.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="bg-white">
      <div className="border-b border-[#eee] px-4 py-3">
        <PageAssist />
      </div>
      <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#222]">
          Privacy Policy
        </h1>
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-[#555]">
          <p>
            Archibald Real Estate Group, RE/MAX Crest Realty Westside, {SITE.addressLine}, {SITE.cityLine}, collects the name, email, phone number, search area, and property address you submit so {SITE.agent} can follow up and send listing emails you asked for.
          </p>
          <p>
            If you arrive from an ad, we also store the landing page, referrer, and ad click parameters (including utm fields, gclid, gbraid, wbraid, and fbclid) on that inquiry. This is so the office can see which ad the request came from.
          </p>
          <p>
            This site serves people in British Columbia. Personal information is handled under the Personal Information Protection Act (British Columbia) and, where it applies, Canada&apos;s anti-spam law (CASL). Listing emails and texts are sent only after you check the consent box on the form. Consent is not a condition of buying or selling a home. You can withdraw consent at any time on the{" "}
            <Link href="/unsubscribe" className="text-[var(--cedar)] hover:underline">unsubscribe</Link> page, or by replying STOP to a text.
          </p>
          <p>
            Essential cookies keep the site working. Advertising cookies from Google and Meta are optional. They stay off until you choose Accept on the cookie banner. Essential only leaves those tags off. We do not sell personal information.
          </p>
          <p>
            Questions: {SITE.company}, {SITE.phoneDisplay}, or the{" "}
            <Link href="/contact" className="text-[var(--cedar)] hover:underline">contact form</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
