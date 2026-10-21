import type { Metadata } from "next";
import Link from "next/link";
import { PageAssist } from "@/components/page-assist";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "FAQ" };

const faqs = [
  {
    q: "Who provides the real estate information for this website?",
    a: "This website is a real estate search platform powered by CINC, a real estate technology company. CINC provides the website, search tools, and technology infrastructure only. All real estate related services referenced on this site are provided exclusively by Archibald Real Estate Group.",
  },
  {
    q: "Where is Archibald Real Estate Group located?",
    a: `${SITE.addressLine}, ${SITE.cityLine}. Phone: ${SITE.phoneDisplay}. Email: ${SITE.email}.`,
  },
  {
    q: "How do I search for homes?",
    a: "Use Search Homes in the header, the hero search on the home page, or any Quick Search link. You can filter by city, price, beds, baths, and property type, and switch between list and map views.",
  },
  {
    q: "How do I request a showing?",
    a: "Open any listing and choose Request a showing, or use Ask Casey Archibald on the listing page. You can also Contact us anytime. On this demo, inquiries also appear in the agent workspace inbox.",
  },
  {
    q: "Can I get a home estimate?",
    a: "Yes — visit Home Estimate, enter your address (unit number optional), and submit. There is also a Home Value Calculator for a rough payment estimate.",
  },
  {
    q: "How much out-of-pocket expenses do I need to purchase a home?",
    a: "Buyers typically need a down payment, closing costs, property transfer tax where applicable, and inspection/appraisal fees. Casey can walk you through a personalized estimate for a specific listing.",
  },
  {
    q: "How much down-payment would I need to buy?",
    a: "In Canada, minimum down payment rules depend on purchase price (often 5% on the first portion for insured mortgages, higher for luxury prices). Use the mortgage calculator on a listing for a rough scenario, then talk to a lender.",
  },
  {
    q: "Is listing data live MLS® inventory?",
    a: "On the live greatervancouverhomesearch.com site, listings are provided under license from Greater Vancouver REALTORS®. This demonstration uses sample listings only.",
  },
  {
    q: "How do saved homes and alerts work?",
    a: "Heart a listing to save it on this device, or save a search to create an alert. In production CINC, these sync to your agent CRM; here they stay in local browser storage for the demo.",
  },
];

export default function FaqPage() {
  return (
    <div className="bg-white">
      <div className="border-b border-[#eee] px-4 py-3">
        <PageAssist />
      </div>
      <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#222]">
          FAQ
        </h1>
        <div className="mt-8 space-y-8">
          {faqs.map((item) => (
            <div key={item.q}>
              <h2 className="font-semibold text-[#222]">{item.q}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[#555]">
                {item.a}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-sm text-[#666]">
          Still need help?{" "}
          <Link href="/contact" className="text-[var(--cedar)] hover:underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
