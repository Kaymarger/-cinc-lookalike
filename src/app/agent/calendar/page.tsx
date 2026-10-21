"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Appt = {
  id: string;
  title: string;
  when: string;
  lead: string;
  done: boolean;
};

const KEY = "gvhs-agent-calendar";

function read(): Appt[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Appt[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function CalendarPage() {
  const [items, setItems] = useState<Appt[]>([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [lead, setLead] = useState("");

  useEffect(() => {
    setItems(read());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const upcoming = [...items].sort((a, b) => a.when.localeCompare(b.when));

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#00aeb6]">Calendar</p>
          <h2 className="text-[20px] text-[#1a2b3c]">Tasks and appointments</h2>
        </div>
        <Link href="/agent/tasks" className="text-[13px] text-[#3498d8] hover:underline">
          Open task list
        </Link>
      </div>
      <form
        className="mb-4 flex flex-wrap items-end gap-2 rounded border border-[#dbe4eb] bg-white p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !when) return;
          setItems((prev) => [
            {
              id: `appt-${Date.now()}`,
              title: title.trim(),
              when,
              lead: lead.trim(),
              done: false,
            },
            ...prev,
          ]);
          setTitle("");
          setLead("");
        }}
      >
        <label className="text-[11px] text-[#5a6f82]">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block h-9 rounded border border-[#dbe4eb] px-2 text-[13px]"
          />
        </label>
        <label className="text-[11px] text-[#5a6f82]">
          When
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            required
            className="mt-1 block h-9 rounded border border-[#dbe4eb] px-2 text-[13px]"
          />
        </label>
        <label className="text-[11px] text-[#5a6f82]">
          Lead
          <input
            value={lead}
            onChange={(e) => setLead(e.target.value)}
            className="mt-1 block h-9 rounded border border-[#dbe4eb] px-2 text-[13px]"
          />
        </label>
        <button type="submit" className="h-9 rounded bg-[#00aeb6] px-3 text-[13px] font-semibold text-white">
          Add appointment
        </button>
      </form>
      <ul className="divide-y divide-[#e8eef3] rounded border border-[#dbe4eb] bg-white">
        {upcoming.length === 0 && (
          <li className="px-4 py-8 text-center text-[13px] text-[#8a9bab]">
            {ready ? "Nothing on the calendar yet." : "Loading…"}
          </li>
        )}
        {upcoming.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-[13px]">
            <input
              type="checkbox"
              checked={item.done}
              onChange={() =>
                setItems((prev) =>
                  prev.map((row) => (row.id === item.id ? { ...row, done: !row.done } : row))
                )
              }
            />
            <div className="min-w-0 flex-1">
              <p className={item.done ? "text-[#8a9bab] line-through" : "font-medium text-[#1a2b3c]"}>
                {item.title}
              </p>
              <p className="text-[12px] text-[#5a6f82]">
                {new Date(item.when).toLocaleString("en-CA")}
                {item.lead ? ` · ${item.lead}` : ""}
              </p>
            </div>
            <button
              type="button"
              className="text-[12px] text-[#e74c3c]"
              onClick={() => setItems((prev) => prev.filter((row) => row.id !== item.id))}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
