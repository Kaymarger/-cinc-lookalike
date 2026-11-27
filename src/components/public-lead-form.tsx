"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { EmailField } from "@/components/email-field";
import { RealtorBadge } from "@/components/ddf-attribution";
import {
  LEAD_CONSENT_TEXT,
  formatPhoneInput,
  landingHeadline,
  matchedSearchPath,
  readStoredAttribution,
  type LeadIntent,
} from "@/lib/lead-intake";
import { useDemoAuth } from "@/lib/demo-auth";
import { useLeads, type LeadSource } from "@/lib/leads";
import { SITE } from "@/lib/site";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function searchHref(area: string): string {
  const path = matchedSearchPath(area);
  const stored = readStoredAttribution();
  if (!stored) return path;
  const url = new URL(path, "https://vancouverpropertysearch.ca");
  const keep: [string, string | undefined][] = [
    ["utm_source", stored.utmSource],
    ["utm_medium", stored.utmMedium],
    ["utm_campaign", stored.utmCampaign],
    ["utm_term", stored.utmTerm],
    ["utm_content", stored.utmContent],
    ["gclid", stored.gclid],
    ["gbraid", stored.gbraid],
    ["wbraid", stored.wbraid],
    ["fbclid", stored.fbclid],
  ];
  for (const [key, value] of keep) {
    if (value) url.searchParams.set(key, value);
  }
  return `${url.pathname}?${url.searchParams.toString()}`;
}

export function PublicLeadForm({
  source,
  intent,
  area = "",
  submitLabel,
  address = false,
  id = "start-form",
}: {
  source: LeadSource;
  intent: LeadIntent;
  area?: string;
  submitLabel: string;
  address?: boolean;
  id?: string;
}) {
  const { capture } = useLeads();
  const { user, signUp } = useDemoAuth();
  const lock = useRef(false);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState(area);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState("");
  const [nextHref, setNextHref] = useState("/search?sort=newest");

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      setFullName((current) => current || user.name);
      setEmail((current) => current || user.email);
      setPhone((current) => current || user.phone || "");
    });
  }, [user]);

  useEffect(() => {
    if (!done || intent !== "buyer") return;
    const timer = window.setTimeout(() => {
      window.location.assign(nextHref);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [done, intent, nextHref]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    setError("");
    const data = new FormData(event.currentTarget);
    if (String(data.get("website") || "").trim()) {
      setDone(String(data.get("name") || "Thanks").trim() || "Thanks");
      return;
    }
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phoneValue = formatPhoneInput(String(data.get("phone") || ""));
    const place = String(data.get("city") || city || area).trim();
    const nextErrors: Record<string, string> = {};
    if (name.length < 2) nextErrors.name = "Enter your full name.";
    if (!EMAIL_RE.test(email)) nextErrors.email = "Enter a valid email address.";
    const digits = phoneValue.replace(/\D/g, "");
    if (digits.length < 10) nextErrors.phone = "Enter a 10-digit phone number.";
    if (data.get("consent") !== "on") nextErrors.consent = "Consent is required before we can email you listings.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    lock.current = true;
    setPending(true);
    const href = searchHref(place);
    const result = await capture({
      name,
      email,
      phone: phoneValue,
      smsOptIn: true,
      source,
      intent,
      consent: true,
      propertyAddress: String(data.get("address") || "").trim() || undefined,
      searchLabel: intent === "buyer" ? place || "Greater Vancouver" : undefined,
      notes: [place ? `Area: ${place}` : "", String(data.get("notes") || "").trim()].filter(Boolean).join("\n"),
    });
    setPending(false);
    if (!result.ok) {
      lock.current = false;
      setError(result.message || "Please check the form and try again.");
      return;
    }
    if (source === "buyer_signup" || source === "seller_signup" || source === "home_valuation") {
      signUp(name, email, phoneValue);
      try {
        sessionStorage.setItem("gvhs-welcome", "1");
      } catch {
        /* ignore */
      }
    }
    setNextHref(href);
    setDone(name);
  }

  if (done) {
    const first = done.split(" ")[0];
    return (
      <div id={id} className="rounded-xl bg-white p-5 text-[#1f2930] shadow-sm" role="status">
        <p className="text-[26px] leading-tight font-semibold">Thanks, {first}.</p>
        <p className="mt-2 text-[16px] leading-relaxed text-[#444]">
          {SITE.agent} will follow up shortly.
          {intent === "buyer" ? " Your matching homes are ready." : " We will review your request."}
        </p>
        <Link href={nextHref} className="mt-4 inline-flex h-12 items-center bg-[#04427d] px-5 text-[16px] font-semibold text-white">
          {intent === "buyer" ? "View matching homes" : "Back to search"}
        </Link>
      </div>
    );
  }

  return (
    <form id={id} onSubmit={onSubmit} noValidate className="scroll-mt-24 rounded-xl bg-white p-4 shadow-sm sm:p-5">
      <div hidden aria-hidden="true">
        <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <label className="block text-[14px] font-semibold text-[#1f2930]">
        Full name
          <input
            name="name"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            className="mt-1 h-12 w-full rounded-md border border-[#d5dde3] px-3 text-[16px] outline-none focus:border-[#04427d]"
          />
      </label>
      {fieldErrors.name ? <p className="mt-1 text-[13px] text-[#9b3b3b]">{fieldErrors.name}</p> : null}
      <label htmlFor={`${id}-email`} className="mt-2 block text-[14px] font-semibold text-[#1f2930]">
        Email
      </label>
        <EmailField
          id={`${id}-email`}
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          className="mt-1 h-12 w-full rounded-md border border-[#d5dde3] px-3 text-[16px] outline-none focus:border-[#04427d]"
        />
      {fieldErrors.email ? <p className="mt-1 text-[13px] text-[#9b3b3b]">{fieldErrors.email}</p> : null}
      <label className="mt-2 block text-[14px] font-semibold text-[#1f2930]">
        Phone
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          aria-invalid={Boolean(fieldErrors.phone)}
          onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
          placeholder="(604) 000-0000"
          className="mt-1 h-12 w-full rounded-md border border-[#d5dde3] px-3 text-[16px] outline-none focus:border-[#04427d]"
        />
      </label>
      {fieldErrors.phone ? <p className="mt-1 text-[13px] text-[#9b3b3b]">{fieldErrors.phone}</p> : null}
      {intent === "buyer" ? (
        <label className="mt-2 block text-[14px] font-semibold text-[#1f2930]">
          City or area
          <input
            name="city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="North Vancouver"
            className="mt-1 h-12 w-full rounded-md border border-[#d5dde3] px-3 text-[16px] outline-none focus:border-[#04427d]"
          />
        </label>
      ) : null}
      {address ? (
        <label className="mt-3 block text-[14px] font-semibold text-[#1f2930]">
          Home address
          <input
            name="address"
            autoComplete="street-address"
            className="mt-1 h-12 w-full rounded-md border border-[#d5dde3] px-3 text-[16px] outline-none focus:border-[#04427d]"
          />
        </label>
      ) : null}
      <label className="mt-2 flex items-start gap-3 text-[13px] leading-relaxed text-[#444]">
        <input name="consent" type="checkbox" className="mt-1 size-4 shrink-0 accent-[#04427d]" />
        <span>
          {LEAD_CONSENT_TEXT}{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>
          {" · "}
          <Link href="/terms" className="underline">Terms</Link>
        </span>
      </label>
      {fieldErrors.consent ? <p className="mt-1 text-[13px] text-[#9b3b3b]">{fieldErrors.consent}</p> : null}
      {error ? <p role="alert" className="mt-2 text-[14px] text-[#9b3b3b]">{error}</p> : null}
      <button
        id="start-submit"
        type="submit"
        disabled={pending}
        className="mt-3 h-12 w-full rounded-md bg-[#04427d] text-[16px] font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}

export function ListingCount() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/ddf/status")
      .then((response) => response.json())
      .then((data: { count?: number }) => {
        if (!cancelled && typeof data.count === "number" && data.count > 0) setCount(data.count);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  if (!count) return null;
  return <span>{count.toLocaleString("en-CA")} active listings</span>;
}

export function AdTrustRow() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-[#3d4a55]">
      {/* Direct file. The image optimizer stays off for this site. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/casey.jpg" alt="" width={48} height={48} className="size-12 rounded-full object-cover" />
      <div>
        <p className="font-semibold text-[#1f2930]">{SITE.agent}</p>
        <p>RE/MAX Crest Realty Westside</p>
      </div>
      <ListingCount />
      <RealtorBadge href="https://www.realtor.ca/" />
    </div>
  );
}

export function StickyLeadCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const target = document.getElementById("start-submit");
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting), { threshold: 0.6 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d5dde3] bg-white p-3 md:hidden">
      <a href="#start-submit" className="flex h-12 items-center justify-center bg-[#04427d] text-[16px] font-semibold text-white">
        Get home matches
      </a>
    </div>
  );
}

export { landingHeadline };
