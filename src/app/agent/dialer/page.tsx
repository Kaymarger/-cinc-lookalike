"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CRM_LEADS } from "@/lib/cinc-crm";
import { useCrmOverlay } from "@/lib/crm-overlay";
import { useLeads } from "@/lib/leads";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

export default function DialerPage() {
  const { leads, appendActivity, updateStatus } = useLeads();
  const overlay = useCrmOverlay();
  const people = useMemo(
    () => [
      ...leads.map((lead) => ({
        id: lead.id,
        origin: "site" as const,
        name: lead.name,
        phone: lead.phone || "",
      })),
      ...CRM_LEADS.filter((lead) => !overlay.hidden.includes(lead.id)).map((lead) => ({
        id: lead.id,
        origin: "crm" as const,
        name: lead.name,
        phone: lead.phone,
      })),
    ],
    [leads, overlay.hidden]
  );
  const [leadId, setLeadId] = useState(people[0]?.id ?? "");
  const [digits, setDigits] = useState("");
  const [note, setNote] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const active = people.find((person) => person.id === leadId) ?? people[0];

  function record(kind: "call" | "text", title: string) {
    if (!active) return;
    const body = note.trim() || `${title} to ${digits || active.phone || "no number"}`;
    if (active.origin === "site") {
      appendActivity(active.id, { kind, title, body });
      if (kind === "call") updateStatus(active.id, "contacted");
    } else {
      overlay.appendActivity(active.id, { kind, title, body });
    }
    setLog((prev) => [`${title} · ${active.name} · ${body}`, ...prev].slice(0, 8));
    setNote("");
  }

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[280px_1fr]">
      <section className="rounded border border-[#dbe4eb] bg-white">
        <div className="border-b border-[#e8eef3] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#8a9bab]">
          People
        </div>
        <ul className="max-h-[70vh] overflow-y-auto">
          {people.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => {
                  setLeadId(person.id);
                  setDigits(person.phone);
                }}
                className={`block w-full px-3 py-2 text-left text-[13px] ${
                  person.id === active?.id ? "bg-[#e3f2fd]" : "hover:bg-[#f7fbfd]"
                }`}
              >
                <span className="font-medium text-[#1a2b3c]">{person.name}</span>
                <span className="mt-0.5 block text-[12px] text-[#5a6f82]">{person.phone || "No phone"}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded border border-[#dbe4eb] bg-white p-4">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#00aeb6]">Dialer</p>
        <h2 className="mt-1 text-[20px] text-[#1a2b3c]">{active?.name ?? "No lead selected"}</h2>
        <input
          value={digits}
          onChange={(e) => setDigits(e.target.value)}
          className="mt-3 h-12 w-full rounded border border-[#dbe4eb] px-3 text-center text-[22px] tracking-widest text-[#102236] outline-none focus:border-[#00aeb6]"
          aria-label="Number"
        />
        <div className="mx-auto mt-4 grid max-w-[280px] grid-cols-3 gap-2">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setDigits((value) => `${value}${key}`)}
              className="h-12 rounded border border-[#dbe4eb] bg-[#f7fbfd] text-[18px] text-[#102236] hover:bg-[#e8f1f8]"
            >
              {key}
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Call or text note"
          className="mt-4 w-full rounded border border-[#dbe4eb] px-3 py-2 text-[13px] outline-none focus:border-[#00aeb6]"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => record("call", "Call logged")}
            className="rounded bg-[#00aeb6] px-4 py-2 text-[13px] font-semibold text-white"
          >
            Log call
          </button>
          <button
            type="button"
            onClick={() => record("text", "Text sent")}
            className="rounded border border-[#00aeb6] px-4 py-2 text-[13px] font-semibold text-[#00aeb6]"
          >
            Send text
          </button>
          <button
            type="button"
            onClick={() => setDigits("")}
            className="rounded border border-[#dbe4eb] px-4 py-2 text-[13px] text-[#5a6f82]"
          >
            Clear
          </button>
          {active && (
            <Link href={`/agent/leads/${active.id}`} className="px-2 py-2 text-[13px] text-[#3498d8]">
              Open lead
            </Link>
          )}
        </div>
        <ul className="mt-4 space-y-1 text-[12px] text-[#3d5164]">
          {log.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
