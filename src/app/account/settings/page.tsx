"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDemoAuth } from "@/lib/demo-auth";

export default function AccountSettingsPage() {
  const { ready, user, updateProfile, signOut } = useDemoAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || "");
  }, [user]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim() });
    setSaved(true);
  }

  if (ready && !user) {
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

  return (
    <div className="mx-auto max-w-[640px] px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#1f2930]">
        Settings
      </h1>
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
        <button type="submit" className="h-10 bg-[#1976d2] px-5 text-sm font-bold text-white uppercase">
          {saved ? "Saved" : "Save"}
        </button>
      </form>
      <button type="button" onClick={signOut} className="mt-4 text-sm text-[#e53935]">
        Logout
      </button>
    </div>
  );
}
