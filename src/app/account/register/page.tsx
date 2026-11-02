"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountBenefits } from "@/components/account-benefits";
import { PageAssist } from "@/components/page-assist";
import { useDemoAuth } from "@/lib/demo-auth";
import { useLeads } from "@/lib/leads";

export default function AccountRegisterPage() {
  const router = useRouter();
  const { signUp, user, ready } = useDemoAuth();
  const { capture } = useLeads();
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) router.replace("/account");
  }, [ready, user, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const name = String(data.get("FullName") || "").trim();
    const email = String(data.get("Email") || "").trim();
    const phone = String(data.get("Phone") || "").trim();
    if (!name || !email) {
      setError("Enter your name and email to continue.");
      return;
    }
    if (data.get("consent") !== "on") {
      setError("Please agree to be contacted before creating an account.");
      return;
    }
    const result = await capture({
      name,
      email,
      phone,
      smsOptIn: true,
      source: "registration",
      intent: "buyer",
      consent: true,
      notes: "Created an account on the public site.",
    });
    if (!result.ok) {
      setError(result.message || "Please check the form and try again.");
      return;
    }
    signUp(name, email, phone);
    router.push("/account");
  }

  return (
    <div className="bg-[#f7fafc]">
      <div className="border-b border-[#e8eef3] bg-white px-4 py-3">
        <PageAssist />
      </div>
      <div className="mx-auto grid max-w-[1000px] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-14">
        <div className="rounded-3xl border border-[#e5eef5] bg-white p-6 shadow-sm sm:p-8">
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#222]">
            Create your free account
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#666]">
            Save homes, get listing alerts, and message Casey in one place.
            Takes under a minute.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-3">
            <input
              name="FullName"
              required
              placeholder="Full name"
              aria-label="Full name"
              className="h-12 w-full rounded-xl border border-[#d7e0e8] px-4 text-[16px] outline-none focus:border-[var(--cedar)] sm:text-sm"
            />
            <input
              name="Email"
              type="email"
              required
              placeholder="Email"
              aria-label="Email"
              className="h-12 w-full rounded-xl border border-[#d7e0e8] px-4 text-[16px] outline-none focus:border-[var(--cedar)] sm:text-sm"
            />
            <input
              name="Phone"
              type="tel"
              placeholder="Phone"
              aria-label="Phone"
              className="h-12 w-full rounded-xl border border-[#d7e0e8] px-4 text-[16px] outline-none focus:border-[var(--cedar)] sm:text-sm"
            />
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <label className="flex items-start gap-2 text-[13px] leading-relaxed text-[#555]">
              <input name="consent" type="checkbox" required className="mt-1" />
              <span>
                I agree that Archibald Real Estate Group may contact me by phone, email, or text about homes that match my search. Consent is not a condition of any purchase. Message frequency varies. Reply STOP to unsubscribe from texts.{" "}
                <Link href="/privacy" className="underline">Privacy Policy</Link>
                {" · "}
                <Link href="/terms" className="underline">Terms of Use</Link>
              </span>
            </label>
            <button
              type="submit"
              className="h-12 w-full rounded-full bg-[var(--cedar)] text-sm font-semibold text-white hover:brightness-95"
            >
              Create account
            </button>
          </form>
          <p className="mt-5 text-sm text-[#666]">
            Already have an account?{" "}
            <Link
              href="/account/login"
              className="font-semibold text-[var(--cedar)] hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>

        <div className="rounded-3xl border border-[#e5eef5] bg-white p-6 sm:p-8">
          <AccountBenefits />
        </div>
      </div>
    </div>
  );
}
