"use client";

import { CRM_LEADS } from "@/lib/cinc-crm";
import { useCrmOverlay } from "@/lib/crm-overlay";
import { useLeads } from "@/lib/leads";

export default function DialerHistoryPage() {
  const { leads } = useLeads();
  const overlay = useCrmOverlay();
  const rows = [
    ...leads.flatMap((lead) =>
      (lead.activity ?? [])
        .filter((item) => item.kind === "call" || item.kind === "text")
        .map((item) => ({ id: item.id, name: lead.name, kind: item.kind, title: item.title, body: item.body || "", at: item.at }))
    ),
    ...CRM_LEADS.flatMap((lead) =>
      (overlay.activity[lead.id] ?? [])
        .filter((item) => item.kind === "call" || item.kind === "text")
        .map((item) => ({ id: item.id, name: lead.name, kind: item.kind, title: item.title, body: item.body || "", at: item.at }))
    ),
  ];

  return (
    <div className="p-4">
      <h2 className="text-[18px] text-[#1a2b3c]">Dialer History</h2>
      <p className="mt-1 mb-3 text-[13px] text-[#5a6f82]">Calls and texts logged on this device.</p>
      <table className="w-full border-collapse bg-white text-left text-[13px]">
        <thead className="bg-[#e8f1f8] text-[11px] uppercase text-[#5a6f82]">
          <tr>
            <th className="px-3 py-2">When</th>
            <th className="px-3 py-2">Lead</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Detail</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-8 text-center text-[#8a9bab]">No dialer history yet.</td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[#e8eef3]">
              <td className="px-3 py-2">{row.at}</td>
              <td className="px-3 py-2">{row.name}</td>
              <td className="px-3 py-2 capitalize">{row.kind}</td>
              <td className="px-3 py-2">{row.body || row.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
