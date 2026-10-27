"use client";

import Link from "next/link";
import { useState } from "react";
import { useOfficeSession } from "@/components/cinc/office-session";
import { useDemoAuth } from "@/lib/demo-auth";

function SettingsForm({
  initialName,
  initialEmail,
  initialPhone,
  onSave,
}: {
  initialName: string;
  initialEmail: string;
  initialPhone: string;
  onSave: (value: { name: string; email: string; phone: string }) => Promise<string | null>;
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const message = await onSave({ name: name.trim(), email: email.trim(), phone: phone.trim() });
    if (message) {
      setError(message);
      setSaved(false);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3 border border-[#dbe3e8] bg-white p-5">
      <label className="block text-sm">
        Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 h-11 w-full border border-[#dbe3e8] px-3 outline-none focus:border-[#1976d2]"
        />
      </label>
      <label className="block text-sm">
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 h-11 w-full border border-[#dbe3e8] px-3 outline-none focus:border-[#1976d2]"
        />
      </label>
      <label className="block text-sm">
        Phone
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 h-11 w-full border border-[#dbe3e8] px-3 outline-none focus:border-[#1976d2]"
        />
      </label>
      {error ? <p className="text-sm text-[#c62828]">{error}</p> : null}
      <button type="submit" className="h-10 bg-[#1976d2] px-5 text-sm font-bold text-white uppercase">
        {saved ? "Saved" : "Save"}
      </button>
    </form>
  );
}

export default function AccountSettingsPage() {
  const { ready, user, updateProfile, signOut } = useDemoAuth();
  const office = useOfficeSession();
  const agent = office.user;

  if (!ready || !office.ready) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-12">
        <h1 className="text-3xl text-[#1f2930]">Settings</h1>
        <p className="mt-3 text-sm text-[#354652]">Loading…</p>
      </div>
    );
  }

  if (!user && !agent) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-12">
        <h1 className="text-3xl text-[#1f2930]">Settings</h1>
        <p className="mt-3 text-sm text-[#354652]">
          Sign in with Log In or Sign Up in the header, then come back here.
        </p>
        <Link href="/" className="mt-4 inline-block text-[#1976d2] underline">
          Back home
        </Link>
      </div>
    );
  }

  const initialName = agent?.name || user?.name || "";
  const initialEmail = agent?.email || user?.email || "";
  const initialPhone = agent?.cell || user?.phone || "";

  return (
    <div className="mx-auto max-w-[640px] px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#1f2930]">
        Settings
      </h1>
      <SettingsForm
        key={`${agent?.id || "guest"}-${initialEmail}`}
        initialName={initialName}
        initialEmail={initialEmail}
        initialPhone={initialPhone}
        onSave={async ({ name, email, phone }) => {
          if (agent && agent.id !== "bootstrap" && office.database?.connected) {
            const [firstName, ...rest] = name.split(/\s+/);
            const response = await fetch(`/api/office/users/${agent.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                firstName: firstName || "",
                lastName: rest.join(" "),
                email,
                cell: phone,
              }),
            });
            const data = (await response.json().catch(() => null)) as { message?: string } | null;
            if (!response.ok) return data?.message || "Could not save your profile.";
            office.refresh();
            return null;
          }
          if (agent && office.database && !office.database.connected) return office.database.message;
          updateProfile({ name, email, phone });
          return null;
        }}
      />
      {agent ? (
        <form action="/api/agent/logout" method="post" className="mt-4" onSubmit={() => signOut()}>
          <input type="hidden" name="next" value="/" />
          <button type="submit" className="text-sm text-[#e53935]">Logout</button>
        </form>
      ) : (
        <button type="button" onClick={signOut} className="mt-4 text-sm text-[#e53935]">
          Logout
        </button>
      )}
    </div>
  );
}
