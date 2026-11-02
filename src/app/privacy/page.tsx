import type { Metadata } from "next";
import Link from "next/link";
import { PageAssist } from "@/components/page-assist";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
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
            Archibald Real Estate Group collects the name, email, phone number, search preferences, and property address you submit so an agent can follow up. Ad click parameters from the page you landed on (source, medium, campaign, and ad) are stored with that inquiry.
          </p>
          <p>
            This site serves people in British Columbia. Personal information is handled under the Personal Information Protection Act (British Columbia) and, where it applies, Canada&apos;s anti-spam law (CASL). We contact you by email or text only after you check the consent box. Consent is not a condition of buying or selling a home. You can withdraw consent at any time on the{" "}
            <Link href="/unsubscribe" className="text-[var(--cedar)] hover:underline">unsubscribe</Link> page, or by replying STOP to a text.
          </p>
          <p>
            Questions: {SITE.company}, {SITE.addressLine}, {SITE.cityLine}, {SITE.phoneDisplay}, or the{" "}
            <Link href="/contact" className="text-[var(--cedar)] hover:underline">contact form</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
