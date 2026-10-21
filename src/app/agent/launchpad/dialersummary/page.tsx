"use client";

import { useMemo, useState } from "react";
import { CRM_LEADS } from "@/lib/cinc-crm";
import { useCrmOverlay } from "@/lib/crm-overlay";
import { useLeads } from "@/lib/leads";

export default function CallSummaryPage() {
  const { leads } = useLeads();
  const overlay = useCrmOverlay();
  const [range, setRange] = useState("7");

  const calls = useMemo(() => {
    const site = leads.flatMap((lead) => lead.activity ?? []).filter((item) => item.kind === "call");
    const crm = CRM_LEADS.flatMap((lead) => overlay.activity[lead.id] ?? []).filter((item) => item.kind === "call");
    return [...site, ...crm];
  }, [leads, overlay.activity]);

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[18px] text-[#1a2b3c]">Call Summary</h2>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="ml-auto h-8 rounded border border-[#dbe4eb] bg-white px-2 text-[12px]"
        >
          <option value="1">Today</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </div>
      <table className="w-full border-collapse bg-white text-left text-[13px]">
        <thead className="bg-[#e8f1f8] text-[11px] uppercase text-[#5a6f82]">
          <tr>
            <th className="px-3 py-2">Agent</th>
            <th className="px-3 py-2">Last Login</th>
            <th className="px-3 py-2">Call Logs</th>
            <th className="px-3 py-2">Calls</th>
            <th className="px-3 py-2">Voicemails</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-[#e8eef3]">
            <td className="px-3 py-3">Casey Archibald</td>
            <td className="px-3 py-3">Just now</td>
            <td className="px-3 py-3">{calls.length}</td>
            <td className="px-3 py-3">{calls.length}</td>
            <td className="px-3 py-3">0</td>
          </tr>
          {calls.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-[12px] text-[#8a9bab]">
                No calls in the last {range} day{range === "1" ? "" : "s"}. Log one from the dialer.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
