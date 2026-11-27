"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountBenefits } from "@/components/account-benefits";
import { PageAssist } from "@/components/page-assist";
import { useDemoAuth } from "@/lib/demo-auth";

export default function AccountLoginPage() {
  const router = useRouter();
  const { signIn, user, ready } = useDemoAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/account");
  }, [ready, user, router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const response = await fetch("/api/account/login-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sent ? { email, code } : { email }),
    });
    const data = (await response.json().catch(() => null)) as { ok?: boolean; verified?: boolean; message?: string } | null;
    setPending(false);
    if (!response.ok || !data?.ok) {
      setError(data?.message || "We could not sign you in.");
      return;
    }
    if (data.verified) {
      signIn(email);
      router.push("/account");
      return;
    }
    setSent(true);
  }

  return (
    <div className="bg-[#f7fafc]">
      <div className="border-b border-[#e8eef3] bg-white px-4 py-3">
        <PageAssist />
      </div>
      <div className="mx-auto grid max-w-[1000px] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-14">
        <div className="rounded-3xl border border-[#e5eef5] bg-white p-6 shadow-sm sm:p-8">
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#222]">Welcome back</h1>
          <p className="mt-3 text-[15px] text-[#666]">
            {sent
              ? `Enter the 6-digit code we emailed to ${email}. It expires in 10 minutes.`
              : "We'll email you a 6-digit code. No password to remember."}
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-3">
            <input
              name="Email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              aria-label="Email"
              readOnly={sent}
              className="h-12 w-full rounded-xl border border-[#d7e0e8] px-4 text-[16px] outline-none focus:border-[var(--cedar)]"
            />
            {sent ? (
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="6-digit code"
                aria-label="Sign-in code"
                className="h-12 w-full rounded-xl border border-[#d7e0e8] px-4 text-[16px] tracking-[0.3em] outline-none focus:border-[var(--cedar)]"
              />
            ) : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={pending}
              className="h-12 w-full rounded-full bg-[var(--cedar)] text-sm font-semibold text-white hover:brightness-95 disabled:opacity-60"
            >
              {pending ? "Sending…" : sent ? "Sign in" : "Email me a code"}
            </button>
          </form>
          <p className="mt-5 text-sm text-[#666]">
            New here?{" "}
            <Link href="/start" className="font-semibold text-[var(--cedar)] hover:underline">
              Start a home search
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
