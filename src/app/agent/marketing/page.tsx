"use client";

import { useEffect, useState } from "react";

type Blast = {
  id: string;
  name: string;
  subject: string;
  audience: string;
  body: string;
  status: "draft" | "scheduled" | "sent";
};

const KEY = "gvhs-agent-marketing";

function read(): Blast[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Blast[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const EMPTY = {
  name: "",
  subject: "",
  audience: "All buyers",
  body: "",
};

export default function MarketingPage() {
  const [items, setItems] = useState<Blast[]>([]);
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    const existing = read();
    setItems(
      existing.length
        ? existing
        : [
            {
              id: "blast-seed",
              name: "Westside new listings",
              subject: "New homes in Kitsilano and Point Grey",
              audience: "Buyer leads",
              body: "A fresh set of sample IDX listings just hit the site.",
              status: "draft",
            },
          ]
    );
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim()) return;
    if (editing) {
      setItems((prev) =>
        prev.map((item) => (item.id === editing ? { ...item, ...form } : item))
      );
      setEditing(null);
    } else {
      setItems((prev) => [
        { id: `blast-${Date.now()}`, ...form, status: "draft" },
        ...prev,
      ]);
    }
    setForm(EMPTY);
  }

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[1fr_320px]">
      <section>
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#00aeb6]">Marketing</p>
        <h2 className="mt-1 text-[20px] text-[#1a2b3c]">Email blasts</h2>
        <ul className="mt-4 divide-y divide-[#e8eef3] rounded border border-[#dbe4eb] bg-white">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-[#1a2b3c]">{item.name}</p>
                <p className="text-[12px] text-[#5a6f82]">
                  {item.subject} · {item.audience}
                </p>
                <p className="mt-1 text-[12px] text-[#3d5164]">{item.body}</p>
              </div>
              <span className="rounded bg-[#e8f1f8] px-2 py-0.5 text-[11px] font-semibold uppercase text-[#3498d8]">
                {item.status}
              </span>
              <div className="flex gap-2 text-[12px]">
                <button
                  type="button"
                  className="text-[#3498d8]"
                  onClick={() => {
                    setEditing(item.id);
                    setForm({
                      name: item.name,
                      subject: item.subject,
                      audience: item.audience,
                      body: item.body,
                    });
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-[#00aeb6]"
                  onClick={() =>
                    setItems((prev) =>
                      prev.map((row) =>
                        row.id === item.id ? { ...row, status: "sent" } : row
                      )
                    )
                  }
                >
                  Send
                </button>
                <button
                  type="button"
                  className="text-[#e74c3c]"
                  onClick={() => setItems((prev) => prev.filter((row) => row.id !== item.id))}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <form onSubmit={save} className="h-fit rounded border border-[#dbe4eb] bg-white p-4">
        <p className="text-[13px] font-semibold text-[#1a2b3c]">
          {editing ? "Edit blast" : "New blast"}
        </p>
        {(
          [
            ["name", "Name"],
            ["subject", "Subject"],
            ["audience", "Audience"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="mt-3 block text-[11px] text-[#5a6f82]">
            {label}
            <input
              value={form[key]}
              onChange={(e) => setForm((cur) => ({ ...cur, [key]: e.target.value }))}
              className="mt-1 h-9 w-full rounded border border-[#dbe4eb] px-2 text-[13px] text-[#1a2b3c]"
            />
          </label>
        ))}
        <label className="mt-3 block text-[11px] text-[#5a6f82]">
          Body
          <textarea
            value={form.body}
            onChange={(e) => setForm((cur) => ({ ...cur, body: e.target.value }))}
            rows={4}
            className="mt-1 w-full rounded border border-[#dbe4eb] px-2 py-2 text-[13px] text-[#1a2b3c]"
          />
        </label>
        <button type="submit" className="mt-3 h-9 w-full rounded bg-[#102236] text-[13px] font-semibold text-white">
          {editing ? "Update draft" : "Save draft"}
        </button>
      </form>
    </div>
  );
}
