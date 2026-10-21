"use client";

import { useEffect, useRef, useState } from "react";

export type HouseRow = { id: string; address: string; when: string };

export function HouseList({
  storageKey,
  title,
  empty,
  seed,
}: {
  storageKey: string;
  title: string;
  empty: string;
  seed: HouseRow[];
}) {
  const [rows, setRows] = useState<HouseRow[]>([]);
  const [ready, setReady] = useState(false);
  const [address, setAddress] = useState("");
  const [when, setWhen] = useState("");
  const seedRef = useRef(seed);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setRows(raw ? (JSON.parse(raw) as HouseRow[]) : seedRef.current);
    } catch {
      setRows(seedRef.current);
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(storageKey, JSON.stringify(rows));
  }, [rows, ready, storageKey]);

  return (
    <div className="p-4">
      <h2 className="text-[18px] text-[#1a2b3c]">{title}</h2>
      <form
        className="mt-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!address.trim()) return;
          setRows((prev) => [{ id: `${Date.now()}`, address: address.trim(), when: when || "Sat 1–3pm" }, ...prev]);
          setAddress("");
        }}
      >
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="h-8 rounded border border-[#dbe4eb] px-2 text-[12px]" />
        <input value={when} onChange={(e) => setWhen(e.target.value)} placeholder="When" className="h-8 rounded border border-[#dbe4eb] px-2 text-[12px]" />
        <button type="submit" className="h-8 rounded bg-[#00aeb6] px-3 text-[12px] font-semibold text-white">Add</button>
      </form>
      <ul className="mt-4 divide-y divide-[#e8eef3] rounded border border-[#dbe4eb] bg-white">
        {rows.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-[#8a9bab]">{empty}</li>}
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-3 px-4 py-3 text-[13px]">
            <span className="flex-1 text-[#1a2b3c]">{row.address}</span>
            <span className="text-[#5a6f82]">{row.when}</span>
            <button type="button" className="text-[12px] text-[#e74c3c]" onClick={() => setRows((prev) => prev.filter((item) => item.id !== row.id))}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
