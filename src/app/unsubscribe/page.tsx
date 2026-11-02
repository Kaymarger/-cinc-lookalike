"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function UnsubscribeForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const response = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    setPending(false);
    setMessage(data?.message || "If that address is on file, email and text alerts are now off.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <input
        type="email"
        required
        aria-label="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        className="h-12 w-full border border-[#ccc] px-3 text-[16px]"
      />
      <button type="submit" disabled={pending} className="h-12 w-full bg-[#16324f] text-[16px] text-white">
        {pending ? "Saving…" : "Unsubscribe"}
      </button>
      {message ? <p role="status" className="text-[15px] text-[#243238]">{message}</p> : null}
    </form>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-[28px] font-semibold text-[#16324f]">Unsubscribe</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-[#444]">
          Enter the email you used to sign up. Email and text alerts from Archibald Real Estate Group stop for that address. You can still search homes.
        </p>
        <Suspense fallback={<p className="mt-6 text-[15px]">Loading…</p>}>
          <UnsubscribeForm />
        </Suspense>
      </div>
    </div>
  );
}
