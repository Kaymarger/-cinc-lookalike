"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { LEAD_CONSENT_TEXT } from "@/lib/lead-intake";
import { useLeads } from "@/lib/leads";
import type { Property } from "@/lib/types";
import { fullAddress } from "@/lib/search";

export function PropertyInquirySidebar({ property }: { property: Property }) {
  const { capture } = useLeads();
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const defaultMessage = `I'm interested in ${fullAddress(property)}.`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    if (data.get("consent") !== "on") {
      setError("Please agree to be contacted.");
      return;
    }
    const fullName = String(data.get("FullName") || "").trim();
    setPending(true);
    const result = await capture({
      name: fullName,
      email: String(data.get("Email") || ""),
      phone: String(data.get("Phone") || ""),
      smsOptIn: true,
      source: "ask_question",
      propertyId: property.id,
      propertyAddress: property.address,
      notes: String(data.get("Message") || defaultMessage),
      consent: true,
      intent: "inquiry",
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message || "Please check the form and try again.");
      return;
    }
    setName(fullName);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="border border-[#e5e5e5] bg-white p-5 text-center">
        <CheckCircle2 className="mx-auto size-10 text-[var(--cedar)]" />
        <p className="mt-3 font-semibold text-[#222]">
          Thanks{name ? `, ${name.split(" ")[0]}` : ""}!
        </p>
        <p className="mt-1 text-sm text-[#666]">
          Casey will follow up about this home.
        </p>
      </div>
    );
  }

  return (
    <div
      className="border border-[#e5e5e5] bg-white"
      id="maincontent_propertyinquirysection"
    >
      <div className="border-b border-[#eee] px-5 py-4">
        <h2 className="text-base font-semibold text-[#222]">
          Ask Casey Archibald
        </h2>
        <p className="mt-1 text-sm text-[#666]">
          I want more info about this home
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-3 p-5">
        <input
          name="FullName"
          required
          placeholder="Full Name"
          aria-label="Full Name"
          className="h-11 w-full border border-[#ddd] px-3 text-sm outline-none focus:border-[var(--cedar)]"
        />
        <input
          name="Email"
          type="email"
          required
          placeholder="Email Address"
          aria-label="Email Address"
          className="h-11 w-full border border-[#ddd] px-3 text-sm outline-none focus:border-[var(--cedar)]"
        />
        <input
          name="Phone"
          type="tel"
          required
          placeholder="Phone Number"
          aria-label="Phone Number"
          className="h-11 w-full border border-[#ddd] px-3 text-sm outline-none focus:border-[var(--cedar)]"
        />
        <textarea
          name="Message"
          rows={4}
          defaultValue={defaultMessage}
          aria-label="Message"
          className="w-full border border-[#ddd] px-3 py-2 text-sm outline-none focus:border-[var(--cedar)]"
        />
        <label className="flex items-start gap-2 text-[13px] leading-relaxed text-[#555]">
          <input name="consent" type="checkbox" required className="mt-1" />
          <span>
            {LEAD_CONSENT_TEXT}{" "}
            <Link href="/privacy" className="underline">Privacy</Link>
          </span>
        </label>
        {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="h-11 w-full bg-[var(--cedar)] text-sm font-semibold uppercase tracking-[0.08em] text-white hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
