"use client";

import Link from "next/link";
import { useState } from "react";

export default function AgentSettingsPage() {
  const [name, setName] = useState("Casey Archibald");
  const [phone, setPhone] = useState("604-555-0100");
  const [email, setEmail] = useState("agent@example.com");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [saved, setSaved] = useState(false);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cedar)]">
          Workspace
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--cedar-deep)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[#666]">
          Demo preferences for this agent CRM — not synced to CINC.
        </p>
      </div>

      <form
        onSubmit={onSave}
        className="mt-8 max-w-lg space-y-4 border border-[#dbe3e8] bg-white p-5"
      >
        <label className="block space-y-1 text-sm">
          <span className="text-[#666]">Display name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 w-full border border-[#ddd] px-3 outline-none focus:border-[var(--cedar)]"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[#666]">Phone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-10 w-full border border-[#ddd] px-3 outline-none focus:border-[var(--cedar)]"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[#666]">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 w-full border border-[#ddd] px-3 outline-none focus:border-[var(--cedar)]"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-[#333]">
          <input
            type="checkbox"
            checked={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.checked)}
            className="size-4 accent-[var(--cedar)]"
          />
          Email me on new leads
        </label>
        <label className="flex items-center gap-2 text-sm text-[#333]">
          <input
            type="checkbox"
            checked={notifySms}
            onChange={(e) => setNotifySms(e.target.checked)}
            className="size-4 accent-[var(--cedar)]"
          />
          SMS digest for showing requests
        </label>
        <button
          type="submit"
          className="h-10 bg-[var(--cedar)] px-5 text-sm font-semibold text-white hover:brightness-95"
        >
          {saved ? "Saved" : "Save settings"}
        </button>
      </form>

      <p className="mt-6 text-sm text-[#666]">
        Consumer site:{" "}
        <Link href="/" className="text-[var(--cedar)] hover:underline">
          greatervancouverhomesearch (demo)
        </Link>
      </p>
    </div>
  );
}
