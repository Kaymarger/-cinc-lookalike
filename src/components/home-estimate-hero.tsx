"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { LEAD_CONSENT_TEXT } from "@/lib/lead-intake";
import { useLeads } from "@/lib/leads";

export function HomeEstimateHero({
  title,
  subtitle,
  ctaLabel = "Submit",
}: {
  title: string;
  subtitle: string;
  ctaLabel?: string;
}) {
  const { capture } = useLeads();
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    if (data.get("consent") !== "on") {
      setError("Please agree to be contacted.");
      return;
    }
    const fullName = String(data.get("FullName") || "").trim();
    const unit = String(data.get("Unit") || "").trim();
    const address = String(data.get("Address") || "").trim();
    const propertyAddress = unit ? `${unit} - ${address}` : address;
    setPending(true);
    const result = await capture({
      name: fullName,
      email: String(data.get("Email") || ""),
      phone: String(data.get("Phone") || ""),
      smsOptIn: true,
      source: "home_valuation",
      propertyAddress,
      notes: "Home estimate request",
      intent: "valuation",
      consent: true,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message || "Please check the form and try again.");
      return;
    }
    setName(fullName);
    setSent(true);
  }

  return (
    <section className="relative isolate min-h-[70vh] overflow-hidden">
      <Image
        src="/brand/hero.jpg"
        alt="Greater Vancouver neighbourhoods"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(105deg,rgba(4,66,125,0.88)_0%,rgba(4,66,125,0.72)_45%,rgba(0,0,0,0.45)_100%)]"
      />

      <div className="relative z-10 mx-auto grid min-h-[70vh] max-w-[1100px] items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="text-white">
          <h1 className="font-[family-name:var(--font-accent)] text-3xl font-normal uppercase leading-tight tracking-wide sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-white/95 sm:text-xl">
            {subtitle}
          </p>
        </div>

        <div className="bg-white p-5 shadow-lg sm:p-7">
          {sent ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto size-12 text-[var(--cedar)]" />
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl text-[#222]">
                Thanks{name ? `, ${name.split(" ")[0]}` : ""}!
              </h2>
              <p className="mt-2 text-sm text-[#666]">
                We received your estimate request. Casey will follow up shortly.
              </p>
              <p className="mt-3 text-xs text-[#888]">
                Casey will follow up with your estimate. Call{" "}
                <a href="tel:6043637858" className="text-[var(--cedar)] underline">
                  (604) 363-7858
                </a>{" "}
                if you would rather talk now.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-[#444]">
                Enter your home and how to reach you
              </p>
              <form onSubmit={onSubmit} className="mt-4 space-y-3" id="estimate">
                <input
                  name="FullName"
                  required
                  placeholder="Full name"
                  aria-label="Full name"
                  className="h-12 w-full border border-[#ddd] px-3 text-[16px] outline-none focus:border-[var(--cedar)]"
                />
                <input
                  name="Email"
                  type="email"
                  required
                  placeholder="Email"
                  aria-label="Email"
                  className="h-12 w-full border border-[#ddd] px-3 text-[16px] outline-none focus:border-[var(--cedar)]"
                />
                <input
                  name="Phone"
                  type="tel"
                  required
                  placeholder="Phone"
                  aria-label="Phone"
                  className="h-12 w-full border border-[#ddd] px-3 text-[16px] outline-none focus:border-[var(--cedar)]"
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    name="Unit"
                    placeholder="Unit # (opt.)"
                    aria-label="Enter a Unit Number"
                    className="h-12 w-full shrink-0 border border-[#ddd] px-3 text-[16px] outline-none focus:border-[var(--cedar)] sm:w-32"
                  />
                  <input
                    name="Address"
                    required
                    placeholder="Street address"
                    aria-label="Home Address"
                    className="h-12 min-w-0 flex-1 border border-[#ddd] px-3 text-[16px] outline-none focus:border-[var(--cedar)]"
                  />
                </div>
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
                  className="h-12 w-full bg-[var(--cedar)] px-8 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
                >
                  {pending ? "Sending…" : ctaLabel}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
