"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { LEAD_CONSENT_TEXT, type LeadIntent } from "@/lib/lead-intake";
import { useLeads, type LeadSource } from "@/lib/leads";
import { SITE } from "@/lib/site";

type FormKind = {
  id: string;
  source: LeadSource;
  intent: LeadIntent;
  kicker: string;
  title: string;
  body: string;
  addressLabel?: string;
  addressPlaceholder?: string;
  notesPlaceholder: string;
  submitLabel: string;
};

const FORMS: FormKind[] = [
  {
    id: "buyer",
    source: "buyer_signup",
    intent: "buyer",
    kicker: "Buy",
    title: "Buyer sign-up",
    body: "Tell us what you’re looking for. An agent will set up your search and follow up directly — no account required.",
    notesPlaceholder: "Neighbourhoods, beds, or budget",
    submitLabel: "Request buyer help",
  },
  {
    id: "seller",
    source: "seller_signup",
    intent: "seller",
    kicker: "Sell",
    title: "Seller sign-up",
    body: "Planning to list? Share the property and how to reach you. We’ll outline next steps for selling in Greater Vancouver.",
    addressLabel: "Property address",
    addressPlaceholder: "Street address",
    notesPlaceholder: "Timing, or anything we should know",
    submitLabel: "Request seller help",
  },
  {
    id: "valuation",
    source: "home_valuation",
    intent: "valuation",
    kicker: "Value",
    title: "Home valuation",
    body: "Get a complimentary market estimate for your home or a place you’re curious about.",
    addressLabel: "Home address",
    addressPlaceholder: "Street address to estimate",
    notesPlaceholder: "Beds, updates, or a question",
    submitLabel: "Request an estimate",
  },
];

function CaptureForm({ form }: { form: FormKind }) {
  const { capture } = useLeads();
  const [sentName, setSentName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    if (String(data.get("website") || "").trim()) {
      setSentName(String(data.get("name") || "").trim());
      return;
    }
    const name = String(data.get("name") || "").trim();
    setPending(true);
    const result = await capture({
      name,
      email: String(data.get("email") || ""),
      phone: String(data.get("phone") || ""),
      smsOptIn: data.get("consent") === "on",
      source: form.source,
      intent: form.intent,
      consent: data.get("consent") === "on",
      propertyAddress: String(data.get("address") || "").trim() || undefined,
      searchLabel:
        form.intent === "buyer" ? String(data.get("notes") || "").trim() || undefined : undefined,
      notes: String(data.get("notes") || "").trim(),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message || "Please check the form and try again.");
      return;
    }
    setSentName(name);
  }

  if (sentName) {
    return (
      <div className="border border-[#e5e5e5] bg-white p-5 sm:p-6" id={form.id}>
        <CheckCircle2 className="size-10 text-[var(--cedar)]" />
        <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl text-[#222]">
          Thanks, {sentName.split(" ")[0]}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#555]">
          {SITE.agent} at {SITE.company} will follow up shortly
          {form.intent === "valuation" ? " with your home estimate" : ""}.
        </p>
      </div>
    );
  }

  return (
    <form
      id={form.id}
      action="/api/leads"
      method="post"
      onSubmit={onSubmit}
      className="scroll-mt-24 border border-[#e5e5e5] bg-white p-5 sm:p-6"
    >
      <p className="text-[11px] font-bold tracking-[0.14em] text-[#1976d2] uppercase">
        {form.kicker}
      </p>
      <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[#1f2930]">
        {form.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[#555]">{form.body}</p>
      <div className="mt-4 space-y-3">
        <input type="hidden" name="source" value={form.source} />
        <input type="hidden" name="intent" value={form.intent} />
        <div className="absolute -left-[9999px] h-0 overflow-hidden" aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="block text-sm font-medium text-[#1f2930]">
          Full name
          <input
            name="name"
            required
            autoComplete="name"
            className="mt-1 h-12 w-full border border-[#ddd] px-3 text-base outline-none focus:border-[var(--cedar)]"
          />
        </label>
        <label className="block text-sm font-medium text-[#1f2930]">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 h-12 w-full border border-[#ddd] px-3 text-base outline-none focus:border-[var(--cedar)]"
          />
        </label>
        <label className="block text-sm font-medium text-[#1f2930]">
          Phone
          <input
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            className="mt-1 h-12 w-full border border-[#ddd] px-3 text-base outline-none focus:border-[var(--cedar)]"
          />
        </label>
        {form.addressLabel && (
          <label className="block text-sm font-medium text-[#1f2930]">
            {form.addressLabel}
            <input
              name="address"
              required
              autoComplete="street-address"
              placeholder={form.addressPlaceholder}
              className="mt-1 h-12 w-full border border-[#ddd] px-3 text-base outline-none focus:border-[var(--cedar)]"
            />
          </label>
        )}
        <label className="block text-sm font-medium text-[#1f2930]">
          {form.intent === "buyer" ? "What are you looking for?" : "Notes"}
          <textarea
            name="notes"
            rows={3}
            placeholder={form.notesPlaceholder}
            className="mt-1 w-full border border-[#ddd] px-3 py-2 text-base outline-none focus:border-[var(--cedar)]"
          />
        </label>
        <label className="flex items-start gap-3 text-[13px] leading-relaxed text-[#555]">
          <input
            name="consent"
            type="checkbox"
            required
            className="mt-1 size-4 shrink-0 accent-[var(--cedar)]"
          />
          <span>
            {LEAD_CONSENT_TEXT}{" "}
            <Link href="/terms" className="underline">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {error && (
          <p className="text-sm text-[#c62828]" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full bg-[var(--cedar)] text-sm font-bold tracking-[1px] text-white uppercase hover:bg-[#145ca4] disabled:opacity-60"
        >
          {pending ? "Sending…" : form.submitLabel}
        </button>
      </div>
    </form>
  );
}

export function LeadCaptureForms({
  notice,
}: {
  notice?: { sent?: boolean; error?: string };
}) {
  return (
    <section className="bg-[#f7fafc] py-12 sm:py-16">
      <div className="mx-auto max-w-[1170px] px-4 sm:px-6">
        {notice?.sent && (
          <p className="mb-6 border border-[#c8e6c9] bg-white px-4 py-3 text-sm text-[#1f2930]" role="status">
            Thanks. {SITE.agent} will follow up shortly.
          </p>
        )}
        {notice?.error && (
          <p className="mb-6 border border-[#ffcdd2] bg-white px-4 py-3 text-sm text-[#c62828]" role="alert">
            We could not send that request. Check the required fields and the consent box, or call {SITE.phoneDisplay}.
          </p>
        )}
        <h2 className="font-[family-name:var(--font-display)] text-3xl text-[#1f2930]">
          Talk with {SITE.company}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#555] sm:text-base">
          No login. Choose the request that fits — buyer help, a listing conversation, or a home valuation.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {FORMS.map((form) => (
            <CaptureForm key={form.id} form={form} />
          ))}
        </div>
      </div>
    </section>
  );
}
