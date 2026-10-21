"use client";

import { useState } from "react";
import { CRM_LEADS } from "@/lib/cinc-crm";
import { LEAD_SOURCE_LABEL, useLeads } from "@/lib/leads";

export default function ExportLeadsPage() {
  const { leads } = useLeads();
  const [done, setDone] = useState("");
  const rows = [
    ...leads.map((lead) => [lead.name, lead.email, lead.phone, lead.source === "registration" ? "IDX Registration" : LEAD_SOURCE_LABEL[lead.source], lead.createdAt]),
    ...CRM_LEADS.map((lead) => [lead.name, lead.email, lead.phone, lead.source, lead.registeredAgo]),
  ];

  function download() {
    const header = ["Name", "Email", "Phone", "Source", "Registered"];
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leads.csv";
    link.click();
    URL.revokeObjectURL(url);
    setDone(`Exported ${rows.length} leads.`);
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-[18px] text-[#1a2b3c]">Export Leads</h2>
        <button type="button" onClick={download} className="ml-auto rounded bg-[#00aeb6] px-3 py-1.5 text-[12px] font-semibold text-white">
          Download CSV
        </button>
      </div>
      {done && <p className="mb-2 text-[13px] text-[#1e8449]">{done}</p>}
      <p className="mb-3 text-[13px] text-[#5a6f82]">{rows.length} sample leads on this device. Nothing is uploaded.</p>
      <table className="w-full border-collapse bg-white text-left text-[13px]">
        <thead className="bg-[#e8f1f8] text-[11px] uppercase text-[#5a6f82]">
          <tr>
            {["Name", "Email", "Phone", "Source", "Registered"].map((label) => (
              <th key={label} className="px-3 py-2">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 25).map((row) => (
            <tr key={row[1]} className="border-t border-[#e8eef3]">
              {row.map((cell) => (
                <td key={cell} className="px-3 py-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
