"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { EmailField } from "@/components/email-field";
import { useDemoAuth } from "@/lib/demo-auth";
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
  const { capture } = useLeads();
  const { user } = useDemoAuth();
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const fullName = String(data.get("FullName") || user?.name || "").trim();
    const email = String(data.get("Email") || user?.email || "").trim();
    const phone = String(data.get("Phone") || user?.phone || "").trim();
    const address = String(data.get("Address") || "").trim();
    const message = String(data.get("Message") || "").trim();
    if (fullName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.replace(/\D/g, "").length < 7) {
      setError("Enter your name, a valid email, and a phone number.");
      return;
    }
    if (includeAddress && !address) {
      setError("Enter the home address.");
      return;
    }
    setPending(true);
    const result = await capture({
      name: fullName,
      email,
      phone,
      smsOptIn: true,
      source,
      propertyAddress: address || undefined,
      notes: message ? `Contact inquiry: ${message}` : "Contact inquiry",
      consent: true,
      intent: includeAddress ? "valuation" : "inquiry",
    });
    setPending(false);
    if (!result.ok || !result.persisted) {
      setError(result.message || "We could not save your inquiry just now. Please call (604) 363-7858.");
      return;
    }
    setName(fullName);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="border border-[#e5e5e5] bg-white p-6 text-center sm:p-8">
        <CheckCircle2 className="mx-auto size-12 text-[var(--cedar)]" />
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl text-[#222]">
          Thanks{name ? `, ${name}` : ""}!
        </h2>
        <p className="mt-2 text-sm text-[#666]">
          Your inquiry was sent successfully. Casey will follow up shortly.
        </p>
        <p className="mt-3 text-xs text-[#888]">
          Your request is with {SITE.agent}. You can also reach the office at{" "}
          <a href={`tel:${SITE.phoneTel}`} className="text-[var(--cedar)] underline">
            {SITE.phoneDisplay}
          </a>
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
      <form onSubmit={onSubmit} noValidate className="space-y-3 p-5">
        {user ? (
          <p className="text-sm text-[#444]">Sending as {user.name}. We already have your email and phone.</p>
        ) : (
          <>
            <input name="FullName" required placeholder="Full Name" aria-label="Full Name" className="h-11 w-full border border-[#ddd] px-3 text-sm outline-none focus:border-[var(--cedar)]" />
            <EmailField name="Email" required placeholder="Email" aria-label="Email" className="h-11 w-full border border-[#ddd] px-3 text-sm outline-none focus:border-[var(--cedar)]" />
            <input name="Phone" type="tel" required placeholder="Phone" aria-label="Phone" className="h-11 w-full border border-[#ddd] px-3 text-sm outline-none focus:border-[var(--cedar)]" />
          </>
        )}
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
        {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="h-11 w-full bg-[var(--cedar)] text-sm font-semibold uppercase tracking-[0.08em] text-white hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Submit"}
        </button>
      </form>
    </div>
  );
}
