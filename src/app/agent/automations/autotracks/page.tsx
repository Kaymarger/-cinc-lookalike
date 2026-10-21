"use client";

import Link from "next/link";
import { useState } from "react";
import { newId, useWorkspace } from "@/lib/agent-workspace";

const TABS = ["General", "Buyer", "Listing", "Nurture", "Past Client", "My AutoTracks"];

export default function AutoTracksPage() {
  const ws = useWorkspace();
  const [tab, setTab] = useState("General");
  const [name, setName] = useState("");
  const plans = ws.data.plans.filter((plan) => tab === "General" || plan.category === tab || (tab === "My AutoTracks" && plan.category === "My AutoTracks"));
  const active = ws.data.plans.filter((plan) => plan.active).length;

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center gap-6 rounded border border-[#dbe4eb] bg-white px-4 py-3">
        <Stat n={ws.data.plans.length} label="Total" />
        <Stat n={active} label="Active" />
        <Stat n={ws.data.plans.length - active} label="Paused" />
        <Link href="/agent/automations" className="ml-auto rounded bg-[#00aeb6] px-3 py-1.5 text-[12px] font-semibold text-white">
          Start/Edit an AutoTrack
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={`rounded border px-3 py-1 text-[12px] ${tab === item ? "border-[#00aeb6] text-[#00aeb6]" : "border-[#dbe4eb] text-[#5a6f82]"}`}>
            {item}
          </button>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          ws.upsert("plans", {
            id: newId(),
            name: name.trim(),
            category: tab === "General" ? "General" : tab,
            active: true,
            trigger: "new-lead",
            steps: [],
          });
          setName("");
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="AutoTrack name" className="h-8 rounded border border-[#dbe4eb] px-2 text-[12px]" />
        <button type="submit" className="h-8 rounded bg-[#102236] px-3 text-[12px] text-white">Add</button>
      </form>
      <ul className="mt-4 divide-y divide-[#e8eef3] rounded border border-[#dbe4eb] bg-white">
        {plans.map((plan) => (
          <li key={plan.id} className="flex items-center gap-3 px-4 py-3 text-[13px]">
            <span className="flex-1 font-medium text-[#1a2b3c]">{plan.name}</span>
            <span className="text-[12px] text-[#8a9bab]">{plan.category}</span>
            <button type="button" className="text-[12px] text-[#00aeb6]" onClick={() => ws.toggle("plans", plan.id)}>
              {plan.active ? "Pause" : "Start"}
            </button>
            <button type="button" className="text-[12px] text-[#e74c3c]" onClick={() => ws.remove("plans", plan.id)}>
              Delete
            </button>
          </li>
        ))}
        {plans.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-[#8a9bab]">No AutoTracks in {tab}.</li>}
      </ul>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <p className="text-[20px] font-semibold text-[#1a2b3c]">{n}</p>
      <p className="text-[11px] uppercase text-[#8a9bab]">{label}</p>
    </div>
  );
}
