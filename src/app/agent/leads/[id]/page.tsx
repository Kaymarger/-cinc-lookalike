"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  PhoneCall,
  Star,
} from "lucide-react";
import { CRM_LEADS, getCrmLead } from "@/lib/cinc-crm";
import { cn } from "@/lib/utils";

const TABS = [
  "Activity",
  "Info",
  "Reminders+Plans",
  "Appointments",
  "Conversations",
  "AutoTracks",
] as const;

const TYPES = ["Buyer", "Seller", "Partial", "Recruit"] as const;

export default function LeadDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const lead = getCrmLead(id) ?? CRM_LEADS[0];
  const [tab, setTab] = useState<(typeof TABS)[number]>("Activity");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState(lead.activity);
  const [leadType, setLeadType] = useState(lead.type);
  const [pipeline, setPipeline] = useState(lead.pipeline);

  const siblings = useMemo(() => CRM_LEADS, []);

  function addNote() {
    const text = note.trim();
    if (!text) return;
    setNotes((prev) => [
      {
        id: `n-${Date.now()}`,
        at: new Date().toLocaleString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
        kind: "note",
        title: "Note Added",
        body: text,
        actor: "Casey Archibald",
      },
      ...prev,
    ]);
    setNote("");
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-[520px] overflow-hidden bg-[#eef3f7]">
      {/* Lead list strip */}
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[#dbe4eb] bg-white xl:flex">
        <div className="border-b border-[#e8eef3] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#8a9bab]">
          Leads
        </div>
        <ul className="flex-1 overflow-y-auto">
          {siblings.map((l) => {
            const selected = l.id === lead.id;
            return (
              <li key={l.id}>
                <Link
                  href={`/agent/leads/${l.id}`}
                  className={cn(
                    "block border-b border-[#f0f4f8] px-3 py-2.5 text-[12px]",
                    selected ? "bg-[#e3f2fd]" : "hover:bg-[#f7fbfd]"
                  )}
                >
                  <p className="font-medium text-[#3498d8]">{l.name}</p>
                  <p className="text-[#5a6f82]">{l.phone}</p>
                  <p className="truncate text-[#8a9bab]">{l.email}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Star className="h-3 w-3 fill-[#f1c40f] text-[#f1c40f]" />
                    <span className="text-[#5a6f82]">{l.rating.toFixed(1)}</span>
                    <span
                      className={cn(
                        "rounded px-1 py-0.5 text-[10px] font-semibold",
                        l.type === "Seller"
                          ? "bg-[#eceff1] text-[#546e7a]"
                          : "bg-[#e3f2fd] text-[#1565c0]"
                      )}
                    >
                      {l.type}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Profile pane */}
      <section className="w-full max-w-[300px] shrink-0 overflow-y-auto border-r border-[#dbe4eb] bg-white sm:w-[280px]">
        <div className="border-b border-[#e8eef3] px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dce4ec] text-[14px] font-semibold text-[#3d5164]">
              {lead.initials}
            </span>
            <div>
              <p className="text-[15px] font-semibold text-[#1a2b3c]">
                {lead.name}
                {lead.verified && (
                  <span className="ml-1 inline-block h-3.5 w-3.5 rounded-full bg-[#3498d8] text-center text-[9px] leading-[14px] text-white">
                    ✓
                  </span>
                )}
              </p>
              <a
                href={`tel:${lead.phone}`}
                className="block text-[12px] text-[#3498d8] hover:underline"
              >
                {lead.phone}
              </a>
              <a
                href={`mailto:${lead.email}`}
                className="block truncate text-[12px] text-[#3498d8] hover:underline"
              >
                {lead.email}
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase text-[#8a9bab]">
              Lead type
            </p>
            <div className="flex flex-wrap gap-3">
              {TYPES.map((t) => (
                <label
                  key={t}
                  className="flex items-center gap-1.5 text-[12px] text-[#3d5164]"
                >
                  <input
                    type="radio"
                    name="leadType"
                    checked={leadType === t}
                    onChange={() => setLeadType(t)}
                    className="accent-[#00aeb6]"
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase text-[#8a9bab]">
              Status
            </p>
            <select
              value={pipeline}
              onChange={(e) =>
                setPipeline(e.target.value as typeof pipeline)
              }
              className="w-full rounded border border-[#27ae60] bg-[#eafaf1] px-3 py-2 text-[13px] font-semibold text-[#1e8449]"
            >
              <option value="New">New</option>
              <option value="Attempted">Attempted</option>
              <option value="Contacted">Contacted (10/18/26)</option>
              <option value="Showing">Showing</option>
              <option value="Nurture">Nurture</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
            <div className="rounded border border-[#e8eef3] px-2 py-2">
              <p className="font-semibold text-[#1a2b3c]">{lead.lastTouch}</p>
              <p className="text-[#8a9bab]">Last touch</p>
            </div>
            <div className="rounded border border-[#e8eef3] px-2 py-2">
              <p className="font-semibold text-[#1a2b3c]">1</p>
              <p className="text-[#8a9bab]">Calls</p>
            </div>
            <div className="rounded border border-[#e8eef3] px-2 py-2">
              <p className="font-semibold text-[#1a2b3c]">0</p>
              <p className="text-[#8a9bab]">Texts</p>
            </div>
            <div className="rounded border border-[#e8eef3] px-2 py-2">
              <p className="font-semibold text-[#1a2b3c]">0</p>
              <p className="text-[#8a9bab]">Emails</p>
            </div>
          </div>

          <div className="space-y-2 text-[11px]">
            {[
              ["Clicks", 0],
              ["Opens", 0],
              ["Alert Opens", 0],
            ].map(([label, pct]) => (
              <div key={String(label)}>
                <div className="mb-0.5 flex justify-between text-[#5a6f82]">
                  <span>{label}</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 rounded bg-[#e8eef3]">
                  <div
                    className="h-1.5 rounded bg-[#00aeb6]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] leading-relaxed text-[#8a9bab]">
            Registered {lead.registeredAgo} ago from {lead.source}
          </p>
        </div>
      </section>

      {/* Quick actions column */}
      <div className="hidden w-[72px] shrink-0 flex-col items-center gap-3 bg-[#00aeb6] py-4 text-white sm:flex">
        {[
          { icon: Phone, label: "Call" },
          { icon: PhoneCall, label: "Dialer" },
          { icon: MessageSquare, label: "Text" },
          { icon: Mail, label: "Email" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            className="flex w-full flex-col items-center gap-1 px-1 py-2 text-[10px] font-medium hover:bg-white/10"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#00aeb6]">
              <Icon className="h-4 w-4" />
            </span>
            {label}
          </button>
        ))}
        <button
          type="button"
          className="mt-auto flex flex-col items-center gap-1 py-2 text-[10px] font-medium hover:bg-white/10"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <MoreHorizontal className="h-4 w-4" />
          </span>
          More
        </button>
      </div>

      {/* Activity pane */}
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-[#dbe4eb] bg-white px-3 py-2 sm:px-4">
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addNote();
              }}
              placeholder="Add a note…"
              className="min-w-0 flex-1 rounded border border-[#dbe4eb] px-3 py-2 text-[13px] outline-none focus:border-[#00aeb6]"
            />
            <button
              type="button"
              onClick={addNote}
              className="shrink-0 rounded bg-[#00aeb6] px-3 py-2 text-[12px] font-semibold text-white"
            >
              Add
            </button>
          </div>
        </div>

        <div className="flex gap-0 overflow-x-auto border-b border-[#dbe4eb] bg-white px-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "relative shrink-0 px-3 py-3 text-[12px] whitespace-nowrap sm:text-[13px]",
                tab === t
                  ? "font-semibold text-[#1a2b3c]"
                  : "text-[#5a6f82] hover:text-[#1a2b3c]"
              )}
            >
              {t}
              {tab === t && (
                <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-[#00aeb6]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {tab === "Activity" && (
            <ul className="space-y-3">
              {notes.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-[#dbe4eb] bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-semibold text-[#1a2b3c]">
                      {a.title}
                    </p>
                    <p className="shrink-0 text-[11px] text-[#8a9bab]">{a.at}</p>
                  </div>
                  {a.kind === "note" && (
                    <div className="mt-2 flex gap-2">
                      <span className="rounded bg-[#d6eaf8] px-2 py-0.5 text-[11px] font-medium text-[#1a5276]">
                        Call
                      </span>
                      <span className="rounded bg-[#eef3f7] px-2 py-0.5 text-[11px] text-[#5a6f82]">
                        General
                      </span>
                    </div>
                  )}
                  {a.body && (
                    <p className="mt-2 text-[13px] text-[#3d5164]">{a.body}</p>
                  )}
                  {a.actor && (
                    <p className="mt-2 text-[11px] text-[#8a9bab]">— {a.actor}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {tab === "Info" && (
            <div className="rounded-lg border border-[#dbe4eb] bg-white p-4 text-[13px] text-[#3d5164]">
              <p>
                <span className="text-[#8a9bab]">Price / City:</span> {lead.price}{" "}
                · {lead.city}
              </p>
              <p className="mt-2">
                <span className="text-[#8a9bab]">Timeframe:</span> {lead.timeframe}
              </p>
              <p className="mt-2">
                <span className="text-[#8a9bab]">Source:</span> {lead.source}
              </p>
              <p className="mt-2">
                <span className="text-[#8a9bab]">Assigned:</span> {lead.assignedTo}
              </p>
            </div>
          )}
          {tab !== "Activity" && tab !== "Info" && (
            <div className="rounded-lg border border-dashed border-[#dbe4eb] bg-white px-4 py-10 text-center text-[13px] text-[#8a9bab]">
              No {tab.toLowerCase()} for this demo lead yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
