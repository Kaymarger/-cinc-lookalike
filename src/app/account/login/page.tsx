"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountBenefits } from "@/components/account-benefits";
import { PageAssist } from "@/components/page-assist";
import { useDemoAuth } from "@/lib/demo-auth";
import { useLeads } from "@/lib/leads";

export default function AccountLoginPage() {
  const router = useRouter();
  const { signIn, user, ready } = useDemoAuth();
  const { add } = useLeads();
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) router.replace("/account");
  }, [ready, user, router]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const email = String(data.get("Email") || "").trim();
    if (!email) {
      setError("Enter your email to continue.");
      return;
    }
    signIn(email);
    add({
      name: email.split("@")[0] || "Buyer",
      email,
      phone: "",
      source: "registration",
      notes: "Signed in (demo account — email only).",
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
            Welcome back
          </h1>
          <p className="mt-3 text-[15px] text-[#666]">
            Log in with your email to pick up saved homes and alerts on this
            device.
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-3">
            <input
              name="Email"
              type="email"
              required
              placeholder="Email"
              aria-label="Email"
              className="h-12 w-full rounded-xl border border-[#d7e0e8] px-4 text-[16px] outline-none focus:border-[var(--cedar)] sm:text-sm"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="h-12 w-full rounded-full bg-[var(--cedar)] text-sm font-semibold text-white hover:brightness-95"
            >
              Continue
            </button>
          </form>
          <p className="mt-5 text-sm text-[#666]">
            <Link
              href="/account/forgotpassword"
              className="text-[var(--cedar)] hover:underline"
            >
              Forgot password?
            </Link>
            {" · "}
            New here?{" "}
            <Link
              href="/account/register"
              className="font-semibold text-[var(--cedar)] hover:underline"
            >
              Create an account
            </Link>
          </p>
          <p className="mt-3 text-xs text-[#888]">
            Demo only — any email works; nothing is sent to a real login server.
          </p>
        </div>
        <div className="rounded-3xl border border-[#e5eef5] bg-white p-6 sm:p-8">
          <AccountBenefits />
        </div>
      </div>
    </div>
  );
}
