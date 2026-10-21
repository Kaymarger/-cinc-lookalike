"use client";

import { useEffect, useState } from "react";

type Claim = { id: string; address: string; note: string };

const KEY = "gvhs-homepulse";

export default function HomePulsePage() {
  const [items, setItems] = useState<Claim[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw) as Claim[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const address = String(data.get("address") || "").trim();
    if (!address) return;
    setItems((list) => [
      {
        id: crypto.randomUUID(),
        address,
        note: String(data.get("note") || "").trim(),
      },
      ...list,
    ]);
    e.currentTarget.reset();
  }

  return (
    <div className="mx-auto max-w-[800px] px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#1f2930]">
        HomePulse
      </h1>
      <p className="mt-2 text-sm text-[#354652]">
        Claim a home to watch. Sample only — nothing is sent to a live valuation service.
      </p>
      <form onSubmit={add} className="mt-6 space-y-3 border border-[#dbe3e8] bg-white p-5">
        <input
          name="address"
          required
          placeholder="Property address"
          aria-label="Property address"
          className="h-11 w-full border border-[#dbe3e8] px-3 text-sm outline-none focus:border-[#1976d2]"
        />
        <input
          name="note"
          placeholder="Why you are watching it"
          aria-label="Note"
          className="h-11 w-full border border-[#dbe3e8] px-3 text-sm outline-none focus:border-[#1976d2]"
        />
        <button
          type="submit"
          className="h-10 bg-[#1976d2] px-5 text-sm font-bold tracking-wide text-white uppercase"
        >
          Claim home
        </button>
      </form>
      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 border border-[#dbe3e8] bg-white p-4">
            <div>
              <p className="font-semibold text-[#1f2930]">{item.address}</p>
              {item.note && <p className="text-sm text-[#354652]">{item.note}</p>}
            </div>
            <button
              type="button"
              className="text-sm text-[#e53935]"
              onClick={() => setItems((list) => list.filter((x) => x.id !== item.id))}
            >
              Remove
            </button>
          </li>
        ))}
        {ready && items.length === 0 && (
          <li className="text-sm text-[#7b97aa]">No homes claimed yet.</li>
        )}
      </ul>
    </div>
  );
}
