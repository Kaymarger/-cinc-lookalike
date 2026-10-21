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
  const { add } = useLeads();
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) router.replace("/account");
  }, [ready, user, router]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const name = String(data.get("FullName") || "").trim();
    const email = String(data.get("Email") || "").trim();
    if (!name || !email) {
      setError("Enter your name and email to continue.");
      return;
    }
    signUp(name, email);
    add({
      name,
      email,
      phone: "",
      smsOptIn: true,
      source: "registration",
      notes: "Created account (demo registration).",
    });
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
            Takes under a minute — no password needed for this demo.
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
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="text-[11px] leading-relaxed text-[#888]">
              By continuing, you agree to our{" "}
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
