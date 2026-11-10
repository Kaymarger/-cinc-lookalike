import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { officeDb } from "@/lib/leads-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Seller site" };

export default async function SellerSitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = await officeDb();
  const rows = sql
    ? await sql<{ document: { sellerSites?: { id: string; name: string; address: string }[] } | string }[]>`
        SELECT document FROM office_settings WHERE id = 'content' LIMIT 1
      `
    : [];
  const value = rows[0]?.document;
  const doc = typeof value === "string" ? JSON.parse(value) as { sellerSites?: { id: string; name: string; address: string }[] } : value;
  const site = doc?.sellerSites?.find((item) => item.id === id);
  if (!site) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm uppercase tracking-wide text-[#888]">Seller site</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">{site.name}</h1>
      <p className="mt-3 text-[16px]">{site.address}</p>
      <p className="mt-6 text-sm text-[#555]">This page is the public address for the seller site. The office edits it from Seller Suite.</p>
      <p className="mt-4"><Link href="/seller/homeestimate/homevaluation" className="text-[var(--cedar)] underline">Request a home estimate</Link></p>
    </div>
  );
}
