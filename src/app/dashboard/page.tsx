"use client";

import Link from "next/link";
import { useDemoAuth } from "@/lib/demo-auth";
import { useSavedHomes } from "@/lib/saved-homes";
import { useSavedSearches } from "@/lib/saved-searches";

export default function DashboardPage() {
  const { ready, user } = useDemoAuth();
  const { ids } = useSavedHomes();
  const { searches } = useSavedSearches();

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#1f2930]">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-[#354652]">
        {ready && user
          ? `Signed in as ${user.name}. This demo account stays on this device.`
          : "Sign in from the header to save this dashboard to your device."}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/savedhomes" className="border border-[#dbe3e8] bg-white p-5 hover:border-[#1976d2]">
          <p className="text-2xl text-[#1976d2]">{ids.length}</p>
          <p className="text-sm font-bold tracking-wide uppercase">Saved homes</p>
        </Link>
        <Link href="/alerts" className="border border-[#dbe3e8] bg-white p-5 hover:border-[#1976d2]">
          <p className="text-2xl text-[#1976d2]">{searches.length}</p>
          <p className="text-sm font-bold tracking-wide uppercase">Saved searches</p>
        </Link>
        <Link href="/seller/homepulse" className="border border-[#dbe3e8] bg-white p-5 hover:border-[#1976d2]">
          <p className="text-sm font-bold tracking-wide uppercase">HomePulse</p>
          <p className="mt-1 text-sm text-[#354652]">Track a home you own.</p>
        </Link>
        <Link href="/notebook" className="border border-[#dbe3e8] bg-white p-5 hover:border-[#1976d2]">
          <p className="text-sm font-bold tracking-wide uppercase">My Notebook</p>
          <p className="mt-1 text-sm text-[#354652]">Notes saved on this device.</p>
        </Link>
        <Link href="/account/settings" className="border border-[#dbe3e8] bg-white p-5 hover:border-[#1976d2]">
          <p className="text-sm font-bold tracking-wide uppercase">Settings</p>
          <p className="mt-1 text-sm text-[#354652]">Name, email, and phone.</p>
        </Link>
        <Link href="/recently-viewed" className="border border-[#dbe3e8] bg-white p-5 hover:border-[#1976d2]">
          <p className="text-sm font-bold tracking-wide uppercase">Recently viewed</p>
          <p className="mt-1 text-sm text-[#354652]">Homes you opened.</p>
        </Link>
      </div>
    </div>
  );
}
