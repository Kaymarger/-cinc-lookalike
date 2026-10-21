"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { AccountBenefits } from "@/components/account-benefits";
import { PageAssist } from "@/components/page-assist";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setEmail(String(data.get("Email") || ""));
    setSent(true);
  }

  return (
    <div className="bg-white">
      <div className="border-b border-[#eee] px-4 py-3">
        <PageAssist />
      </div>
      <div className="mx-auto grid max-w-[1000px] gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#222]">
            Reset Password
          </h1>
          <p className="mt-3 text-[15px] text-[#666]">
            After submitting, you should receive an email with a link from us to
            reset your password.
          </p>
          {sent ? (
            <div className="mt-8 border border-[#e5e5e5] p-6 text-center">
              <CheckCircle2 className="mx-auto size-12 text-[var(--cedar)]" />
              <p className="mt-3 font-semibold text-[#222]">Check your inbox</p>
              <p className="mt-2 text-sm text-[#666]">
                Demo mode — no email was sent
                {email ? ` to ${email}` : ""}. Use{" "}
                <Link
                  href="/account/login"
                  className="text-[var(--cedar)] underline"
                >
                  Sign In
                </Link>{" "}
                with any password.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 space-y-3">
              <input
                name="Email"
                type="email"
                required
                placeholder="Email Address"
                aria-label="Email Address"
                className="h-11 w-full border border-[#ddd] px-3 text-sm outline-none focus:border-[var(--cedar)]"
              />
              <button
                type="submit"
                className="h-11 w-full bg-[var(--cedar)] text-sm font-semibold uppercase tracking-[0.08em] text-white hover:brightness-95"
              >
                Submit
              </button>
            </form>
          )}
          <p className="mt-4 text-sm text-[#666]">
            <Link
              href="/account/login"
              className="text-[var(--cedar)] hover:underline"
            >
              Back to Sign In
            </Link>
          </p>
        </div>
        <AccountBenefits />
      </div>
    </div>
  );
}
