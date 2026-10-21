"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Star,
} from "lucide-react";
import { CRM_LEADS, type CrmPipeline } from "@/lib/cinc-crm";
import { cn } from "@/lib/utils";

const PIPELINE_STYLE: Record<CrmPipeline, string> = {
  New: "border-[#3498d8] text-[#3498d8]",
  Attempted: "border-[#e67e22] text-[#e67e22]",
  Contacted: "border-[#00aeb6] text-[#00aeb6]",
  Showing: "border-[#9b59b6] text-[#9b59b6]",
  Nurture: "border-[#7f8c8d] text-[#7f8c8d]",
  Closed: "border-[#27ae60] text-[#27ae60]",
};

export default function LeadsDashboardPage() {
  const [q, setQ] = useState("");
  const leads = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return CRM_LEADS;
    return CRM_LEADS.filter(
      (l) =>
        l.name.toLowerCase().includes(needle) ||
        l.email.toLowerCase().includes(needle) ||
        l.phone.includes(needle) ||
        l.city.toLowerCase().includes(needle)
    );
  }, [q]);

  return (
    <div className="flex h-full min-h-[calc(100vh-3rem)] flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#dbe4eb] bg-white px-3 py-2.5 sm:px-4">
        <label className="flex items-center gap-2 text-[12px] text-[#5a6f82]">
          <input type="checkbox" className="rounded border-[#b8c5d0]" />
        </label>
        <button
          type="button"
          className="rounded border border-[#dbe4eb] bg-white px-2.5 py-1.5 text-[12px] text-[#3d5164]"
        >
          Mass Actions ▾
        </button>
        <button
          type="button"
          className="text-[12px] font-medium text-[#3498d8] hover:underline"
        >
          Clear All
        </button>
        <button
          type="button"
          className="rounded p-1.5 text-[#8a9bab] hover:bg-[#eef3f7]"
          aria-label="Refresh"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <select className="rounded border border-[#dbe4eb] bg-white px-2 py-1.5 text-[12px]">
          <option>CINC Filter: None</option>
        </select>
        <select className="rounded border border-[#dbe4eb] bg-white px-2 py-1.5 text-[12px]">
          <option>Custom Filter: None</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Quick search…"
          className="min-w-[140px] flex-1 rounded border border-[#dbe4eb] px-2 py-1.5 text-[12px] outline-none focus:border-[#00aeb6] sm:max-w-[200px]"
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Lock className="hidden h-3.5 w-3.5 text-[#8a9bab] sm:block" />
          <select className="rounded border border-[#dbe4eb] bg-white px-2 py-1.5 text-[12px]">
            <option>VIEW: Default</option>
          </select>
          <select className="rounded border border-[#dbe4eb] bg-white px-2 py-1.5 text-[12px]">
            <option>25</option>
            <option>50</option>
          </select>
          <span className="text-[12px] text-[#5a6f82]">
            1–{leads.length} of {CRM_LEADS.length}
          </span>
          <div className="flex">
            <button type="button" className="rounded p-1 text-[#8a9bab]">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" className="rounded p-1 text-[#8a9bab]">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            className="rounded bg-[#00aeb6] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#009a9c]"
          >
            + Add New Lead
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left text-[12px]">
          <thead className="sticky top-0 z-10 bg-[#e8f1f8] text-[11px] font-semibold uppercase tracking-wide text-[#5a6f82]">
            <tr>
              <th className="w-8 px-3 py-2.5">
                <input type="checkbox" className="rounded border-[#b8c5d0]" />
              </th>
              <th className="px-2 py-2.5">Name / Info</th>
              <th className="px-2 py-2.5">Pipeline</th>
              <th className="px-2 py-2.5">Registered</th>
              <th className="px-2 py-2.5">Price / City</th>
              <th className="px-2 py-2.5">Timeframe</th>
              <th className="px-2 py-2.5">Last Login</th>
              <th className="px-2 py-2.5">Last Touch</th>
              <th className="px-2 py-2.5">Next Reminder</th>
              <th className="px-2 py-2.5">Activity</th>
              <th className="px-2 py-2.5">Assigned To</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-[#e8eef3] hover:bg-[#f7fbfd]"
              >
                <td className="px-3 py-3 align-top">
                  <input type="checkbox" className="rounded border-[#b8c5d0]" />
                </td>
                <td className="px-2 py-3 align-top">
                  <Link
                    href={`/agent/leads/${lead.id}`}
                    className="font-medium text-[#3498d8] hover:underline"
                  >
                    {lead.name}
                  </Link>
                  <p className="mt-0.5 text-[#5a6f82]">{lead.phone}</p>
                  <p className="text-[#8a9bab]">{lead.email}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-0.5 text-[#f1c40f]">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-[#5a6f82]">{lead.rating.toFixed(1)}</span>
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        lead.type === "Seller"
                          ? "bg-[#eceff1] text-[#546e7a]"
                          : "bg-[#e3f2fd] text-[#1565c0]"
                      )}
                    >
                      {lead.type}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-3 align-top">
                  <span
                    className={cn(
                      "inline-block rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      PIPELINE_STYLE[lead.pipeline]
                    )}
                  >
                    {lead.pipeline}
                  </span>
                  <button
                    type="button"
                    className="mt-1 block text-[11px] text-[#3498d8] hover:underline"
                  >
                    Quick Actions ▾
                  </button>
                </td>
                <td className="px-2 py-3 align-top text-[#3d5164]">
                  <p>{lead.registeredAgo}</p>
                  <p className="text-[#8a9bab]">{lead.source}</p>
                </td>
                <td className="px-2 py-3 align-top text-[#3d5164]">
                  <p>{lead.price}</p>
                  <p className="text-[#8a9bab]">{lead.city}</p>
                </td>
                <td className="px-2 py-3 align-top text-[#3d5164]">
                  {lead.timeframe}
                </td>
                <td className="px-2 py-3 align-top text-[#3d5164]">
                  <p>{lead.lastLogin}</p>
                  <p className="text-[#8a9bab]">{lead.logins} logins</p>
                </td>
                <td className="px-2 py-3 align-top text-[#3d5164]">
                  <p>{lead.lastTouch}</p>
                  <div className="mt-1 flex gap-1.5 text-[#8a9bab]">
                    <Phone className="h-3 w-3" />
                    <Mail className="h-3 w-3" />
                    <MessageSquare className="h-3 w-3" />
                  </div>
                </td>
                <td
                  className={cn(
                    "px-2 py-3 align-top font-medium",
                    lead.reminderOverdue ? "text-[#e74c3c]" : "text-[#3d5164]"
                  )}
                >
                  {lead.nextReminder}
                </td>
                <td className="px-2 py-3 align-top text-[11px] leading-relaxed">
                  <p className="text-[#27ae60]">Views {lead.views}</p>
                  <p className="text-[#e67e22]">Saved {lead.saved}</p>
                  <p className="flex items-center gap-0.5 text-[#e74c3c]">
                    <Heart className="h-3 w-3 fill-current" /> Fav {lead.fav}
                  </p>
                  <p className="text-[#3498d8]">Inq {lead.inq}</p>
                </td>
                <td className="px-2 py-3 align-top text-[#3d5164]">
                  <p>{lead.assignedTo}</p>
                  {lead.assignedTo === "UNASSIGNED" && (
                    <p className="text-[10px] font-semibold uppercase text-[#e67e22]">
                      Unassigned
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
