"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type LandingPage = {
  id: string;
  title: string;
  category: "Buyers" | "Sellers" | "Contact";
  leads: number;
  views: number;
};

const KEY = "gvhs-landing-pages";

const SEED: LandingPage[] = [
  { id: "lp1", title: "Buyer search", category: "Buyers", leads: 12, views: 240 },
  { id: "lp2", title: "Home estimate", category: "Sellers", leads: 4, views: 90 },
  { id: "lp3", title: "Contact Casey", category: "Contact", leads: 7, views: 150 },
];

export function LandingPages({ category }: { category?: LandingPage["category"] }) {
  const [rows, setRows] = useState<LandingPage[]>([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setRows(raw ? (JSON.parse(raw) as LandingPage[]) : SEED);
    } catch {
      setRows(SEED);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(rows));
  }, [rows, ready]);

  const visible = rows.filter((row) => !category || row.category === category);
  const tabs = [
    { href: "/agent/landing", label: "All" },
    { href: "/agent/landing/buyers", label: "Buyers" },
    { href: "/agent/landing/sellers", label: "Sellers" },
    { href: "/agent/landing/contact", label: "Contact" },
  ];

  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded px-3 py-1 text-[12px] ${tab.label === (category ?? "All") ? "bg-[#102236] text-white" : "bg-white text-[#5a6f82]"}`}
          >
            {tab.label}
          </Link>
        ))}
        <form
          className="ml-auto flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            setRows((prev) => [
              {
                id: `lp-${Date.now()}`,
                title: title.trim(),
                category: category ?? "Buyers",
                leads: 0,
                views: 0,
              },
              ...prev,
            ]);
            setTitle("");
          }}
        >
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page title" className="h-8 rounded border border-[#dbe4eb] px-2 text-[12px]" />
          <button type="submit" className="h-8 rounded bg-[#00aeb6] px-3 text-[12px] font-semibold text-white">
            Add Landing Page
          </button>
        </form>
      </div>
      <table className="w-full border-collapse bg-white text-left text-[13px]">
        <thead className="bg-[#e8f1f8] text-[11px] uppercase text-[#5a6f82]">
          <tr>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Leads</th>
            <th className="px-3 py-2">Unique Views</th>
            <th className="px-3 py-2">Conversion</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row.id} className="border-t border-[#e8eef3]">
              <td className="px-3 py-2">
                {editing === row.id ? (
                  <input
                    defaultValue={row.title}
                    className="h-8 rounded border border-[#dbe4eb] px-2 text-[12px]"
                    onBlur={(e) => {
                      setRows((prev) => prev.map((item) => item.id === row.id ? { ...item, title: e.target.value } : item));
                      setEditing(null);
                    }}
                  />
                ) : (
                  row.title
                )}
              </td>
              <td className="px-3 py-2">{row.leads}</td>
              <td className="px-3 py-2">{row.views}</td>
              <td className="px-3 py-2">{row.views ? `${Math.round((row.leads / row.views) * 100)}%` : "0%"}</td>
              <td className="px-3 py-2 text-right text-[12px]">
                <button type="button" className="text-[#3498d8]" onClick={() => setEditing(row.id)}>Edit</button>
                <button type="button" className="ml-3 text-[#e74c3c]" onClick={() => setRows((prev) => prev.filter((item) => item.id !== row.id))}>Remove</button>
              </td>
            </tr>
          ))}
          {visible.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center text-[#8a9bab]">No landing pages in this category.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
