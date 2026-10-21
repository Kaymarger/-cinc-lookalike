"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useLeads, type LeadSource } from "@/lib/leads";
import { SITE } from "@/lib/site";

export function ContactInquiryForm({
  source = "general",
  heading = "Contact Us",
  includeAddress = false,
}: {
  source?: LeadSource;
  heading?: string;
  includeAddress?: boolean;
}) {
  const { add } = useLeads();
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const fullName = String(data.get("FullName") || "").trim();
    const address = String(data.get("Address") || "").trim();
    const message = String(data.get("Message") || "").trim();
    add({
      name: fullName,
      email: String(data.get("Email") || ""),
      phone: String(data.get("Phone") || ""),
      smsOptIn: true,
      source,
      propertyAddress: address || undefined,
      notes: message,
    });
    setName(fullName);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="border border-[#e5e5e5] bg-white p-6 text-center sm:p-8">
        <CheckCircle2 className="mx-auto size-12 text-[var(--cedar)]" />
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl text-[#222]">
          Thanks{name ? `, ${name.split(" ")[0]}` : ""}!
        </h2>
        <p className="mt-2 text-sm text-[#666]">
          Your inquiry was sent successfully. Casey will follow up shortly.
        </p>
        <p className="mt-3 text-xs text-[#888]">
          Demo lead also appears in the{" "}
          <Link href="/agent/leads" className="text-[var(--cedar)] underline">
            agent inbox
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#e5e5e5] bg-white" id="inquiry">
      <div className="border-b border-[#eee] px-5 py-4">
        <h2 className="text-lg font-semibold uppercase tracking-[0.06em] text-[#222]">
          {heading}
        </h2>
        <p className="mt-2 text-[13px] text-[#666]">
          {SITE.company}
          <br />
          {SITE.addressLine}
          <br />
          {SITE.cityLine}
          <br />
          {SITE.phoneDisplay}
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
          placeholder="Email"
          aria-label="Email"
          className="h-11 w-full border border-[#ddd] px-3 text-sm outline-none focus:border-[var(--cedar)]"
        />
        <input
          name="Phone"
          type="tel"
          required
          placeholder="Phone"
          aria-label="Phone"
          className="h-11 w-full border border-[#ddd] px-3 text-sm outline-none focus:border-[var(--cedar)]"
        />
        {includeAddress && (
          <input
            name="Address"
            required
            placeholder="Enter Your Home Address"
            aria-label="Home Address"
            className="h-11 w-full border border-[#ddd] px-3 text-sm outline-none focus:border-[var(--cedar)]"
          />
        )}
        <textarea
          name="Message"
          rows={4}
          placeholder={
            includeAddress
              ? "Anything else we should know?"
              : "Question or Message"
          }
          aria-label="Message"
          className="w-full border border-[#ddd] px-3 py-2 text-sm outline-none focus:border-[var(--cedar)]"
        />
        <p className="text-[11px] leading-relaxed text-[#888]">
          By clicking &quot;Submit&quot; you consent to receive messages from
          greatervancouverhomesearch.com at the number provided. Consent is not
          required to purchase any good or service. Message and data rates may
          apply. See{" "}
          <Link href="/terms" className="underline">
            Terms of Use
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
        <button
          type="submit"
          className="h-11 w-full bg-[var(--cedar)] text-sm font-semibold uppercase tracking-[0.08em] text-white hover:brightness-95"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
