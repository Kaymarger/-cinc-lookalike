"use client";

import Link from "next/link";
import { useState } from "react";
import { LEAD_CONSENT_TEXT } from "@/lib/lead-intake";
import { useLeads, type LeadSource } from "@/lib/leads";

export function AdLandingForm({
  source,
  intent,
  submitLabel,
}: {
  source: LeadSource;
  intent: "buyer" | "valuation";
  submitLabel: string;
}) {
  const { capture } = useLeads();
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    if (String(data.get("website") || "").trim()) {
      setDone(String(data.get("name") || "Thanks"));
      return;
    }
    if (data.get("consent") !== "on") {
      setError("Please agree to be contacted.");
      return;
    }
    setPending(true);
    const result = await capture({
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      phone: String(data.get("phone") || ""),
      smsOptIn: true,
      source,
      intent,
      consent: true,
      propertyAddress: String(data.get("address") || "").trim() || undefined,
      searchLabel: intent === "buyer" ? "Home search" : "Home value",
      notes: String(data.get("notes") || "").trim(),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message || "Please check the form and try again.");
      return;
    }
    setDone(String(data.get("name") || "").trim());
  }

  if (done) {
    return (
      <div className="bg-white p-5 text-[16px] leading-relaxed text-[#243238]" role="status">
        <p className="text-[22px] font-semibold">Thanks, {done.split(" ")[0]}.</p>
        <p className="mt-2 text-[#555]">An agent will follow up. You can keep searching while you wait.</p>
        <Link href="/search" className="mt-4 inline-block bg-[#1c93b5] px-4 py-3 text-white">Search homes</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 bg-white p-4">
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <input name="name" required aria-label="Full name" placeholder="Full name" className="h-12 w-full border border-[#ccc] px-3 text-[16px]" />
      <input name="email" type="email" required aria-label="Email" placeholder="Email" className="h-12 w-full border border-[#ccc] px-3 text-[16px]" />
      <input name="phone" type="tel" required aria-label="Phone" placeholder="Phone" className="h-12 w-full border border-[#ccc] px-3 text-[16px]" />
      {intent === "valuation" ? (
        <input name="address" aria-label="Home address" placeholder="Home address" className="h-12 w-full border border-[#ccc] px-3 text-[16px]" />
      ) : null}
      <label className="flex items-start gap-2 text-[13px] leading-relaxed text-[#444]">
        <input name="consent" type="checkbox" required className="mt-1" />
        <span>
          {LEAD_CONSENT_TEXT}{" "}
          <Link href="/privacy" className="underline">Privacy</Link>
          {" · "}
          <Link href="/unsubscribe" className="underline">Unsubscribe</Link>
        </span>
      </label>
      {error ? <p role="alert" className="text-[14px] text-[#c62828]">{error}</p> : null}
      <button type="submit" disabled={pending} className="h-12 w-full bg-[#1c93b5] text-[16px] font-semibold text-white disabled:opacity-60">
        {pending ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
