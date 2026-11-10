import type { Metadata } from "next";
import Link from "next/link";
import { PageAssist } from "@/components/page-assist";

export const metadata: Metadata = { title: "FAQ" };

const faqs = [
  {
    q: "How much out-of-pocket expenses do I need to purchase a home?",
    a: "Buyers typically need a down payment, closing costs, property transfer tax where it applies, and inspection or appraisal fees. The office can walk through a specific home with you.",
  },
  {
    q: "How much down-payment would I need to buy?",
    a: "Minimum down payment rules depend on the purchase price. A lender can confirm the amount for the home you want. The mortgage calculator on a listing is only a rough scenario.",
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
