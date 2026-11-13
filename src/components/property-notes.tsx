"use client";

import { useEffect, useState } from "react";
import { useDemoAuth } from "@/lib/demo-auth";

const KEY = "gvhs-property-notes";

type Note = { propertyId: string; email: string; body: string; at: string };

function readNotes(): Note[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is Note => Boolean(item && typeof item === "object")) : [];
  } catch {
    return [];
  }
}

export function PropertyNotes({ propertyId, address }: { propertyId: string; address: string }) {
  const { ready, user } = useDemoAuth();
  const [body, setBody] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (!user) return;
    const match = readNotes().find((note) => note.propertyId === propertyId && note.email === user.email.toLowerCase());
    if (match) setBody(match.body);
  }, [propertyId, user]);

  if (!ready) return null;
  if (!user) {
    return (
      <section className="mt-10 border border-[#e5e5e5] bg-white p-5">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#222]">My notes on this property</h2>
        <p className="mt-2 text-sm text-[#666]">Sign in to keep private notes. Your agent can see them with your lead profile.</p>
      </section>
    );
  }

  function save() {
    const email = user?.email.toLowerCase() || "";
    const next = readNotes().filter((note) => !(note.propertyId === propertyId && note.email === email));
    const note = { propertyId, email, body: body.trim(), at: new Date().toISOString() };
    if (note.body) next.push(note);
    localStorage.setItem(KEY, JSON.stringify(next));
    setSaved("Saved on this device.");
    void fetch("/api/account/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, propertyId, address, body: note.body }),
    }).then(() => setSaved("Saved. Your agent can see this note."));
  }

  return (
    <section className="mt-10 border border-[#e5e5e5] bg-white p-5">
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#222]">My notes on this property</h2>
      <p className="mt-1 text-sm text-[#666]">Private to you and your agent. Nobody else on the site can read this.</p>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        className="mt-3 h-28 w-full border border-[#d7e0e8] p-3 text-sm outline-none focus:border-[#04427d]"
        placeholder="What you want to remember about this home"
      />
      <div className="mt-3 flex items-center gap-3">
        <button type="button" className="h-10 bg-[#04427d] px-4 text-sm font-semibold text-white" onClick={save}>Save note</button>
        {saved ? <p className="text-sm text-[#2e9e5b]">{saved}</p> : null}
      </div>
    </section>
  );
}
