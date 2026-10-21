"use client";

import { useEffect, useState } from "react";

const BEHAVIORS = ["General", "Pipeline change", "New listing view", "Saved search", "No contact 7 days"];
const KEY = "gvhs-behavioral";

export default function BehavioralCommsPage() {
  const [on, setOn] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<"Text" | "Email">("Email");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setOn(raw ? (JSON.parse(raw) as Record<string, boolean>) : { General: true });
    } catch {
      setOn({ General: true });
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(on));
  }, [on, ready]);

  return (
    <div className="p-4">
      <div className="mb-3 flex gap-2">
        {(["Text", "Email"] as const).map((item) => (
          <button key={item} type="button" onClick={() => setView(item)} className={`rounded px-3 py-1 text-[12px] ${view === item ? "bg-[#102236] text-white" : "bg-white text-[#5a6f82]"}`}>
            {item} View
          </button>
        ))}
      </div>
      <ul className="divide-y divide-[#e8eef3] rounded border border-[#dbe4eb] bg-white">
        {BEHAVIORS.map((name) => (
          <li key={name} className="flex items-center justify-between px-4 py-3 text-[13px]">
            <div>
              <p className="font-medium text-[#1a2b3c]">{name}</p>
              <p className="text-[12px] text-[#8a9bab]">{view} message when this behavior happens. Sample only.</p>
            </div>
            <input type="checkbox" checked={Boolean(on[name])} onChange={() => setOn((prev) => ({ ...prev, [name]: !prev[name] }))} />
          </li>
        ))}
      </ul>
    </div>
  );
}
