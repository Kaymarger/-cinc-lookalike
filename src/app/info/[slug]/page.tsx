import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactInquiryForm } from "@/components/contact-inquiry-form";
import { officeDb } from "@/lib/leads-db";

export const dynamic = "force-dynamic";

const BUILTIN: Record<string, { title: string; body: string; active: boolean }> = {
  team: {
    title: "About the Team",
    active: true,
    body: "Archibald Real Estate Group helps people buy and sell homes across Greater Vancouver. Call (604) 363-7858 or send a note below.",
  },
  contact: {
    title: "Contact the Team",
    active: true,
    body: "Tell us what you are looking for and Casey Archibald will follow up.",
  },
  "get-more-money": {
    title: "Get More Money When You Sell",
    active: true,
    body: "A pricing plan, the right photos, and a clear launch week are how this office prepares a listing. Start with a home estimate or send the address below.",
  },
  "seller-checklist": {
    title: "Seller Checklist",
    active: true,
    body: "Declutter, confirm the details, and book the photos before the listing goes live.",
  },
};

async function savedPage(slug: string) {
  const sql = await officeDb();
  if (!sql) return null;
  const rows = await sql<{ document: { landingPages?: { name?: string; url?: string; active?: boolean }[] } | string }[]>`
    SELECT document FROM office_settings WHERE id = 'content' LIMIT 1
  `;
  const value = rows[0]?.document;
  let doc: { landingPages?: { name?: string; url?: string; active?: boolean }[] } | null = null;
  if (typeof value === "string") {
    try { doc = JSON.parse(value) as { landingPages?: { name?: string; url?: string; active?: boolean }[] }; } catch { doc = null; }
  } else doc = value;
  const match = doc?.landingPages?.find((page) => page.url === `/info/${slug}`);
  if (!match) return null;
  return { title: match.name || slug, body: "This landing page is published by the office.", active: Boolean(match.active) };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = BUILTIN[slug] || await savedPage(slug);
  return { title: page?.title || "Landing page" };
}

export default async function InfoLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = BUILTIN[slug] || await savedPage(slug);
  if (!page?.active) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#222]">{page.title}</h1>
      <p className="mt-4 text-[16px] leading-relaxed text-[#444]">{page.body}</p>
      <p className="mt-4 text-sm"><Link href="/seller/homeestimate/homevaluation" className="text-[var(--cedar)] underline">Get a home estimate</Link></p>
      <div className="mt-8">
        <ContactInquiryForm heading="Send a note" />
      </div>
    </div>
  );
}
