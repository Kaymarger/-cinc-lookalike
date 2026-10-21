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
import { useCrmOverlay } from "@/lib/crm-overlay";
import {
  LEAD_SOURCE_LABEL,
  LEAD_STATUS_LABEL,
  useLeads,
  type Lead,
  type LeadStatus,
} from "@/lib/leads";
import { cn } from "@/lib/utils";

const PIPELINES: CrmPipeline[] = [
  "New",
  "Attempted",
  "Contacted",
  "Showing",
  "Nurture",
  "Closed",
];

const PIPELINE_STYLE: Record<CrmPipeline, string> = {
  New: "border-[#3498d8] text-[#3498d8]",
  Attempted: "border-[#e67e22] text-[#e67e22]",
  Contacted: "border-[#00aeb6] text-[#00aeb6]",
  Showing: "border-[#9b59b6] text-[#9b59b6]",
  Nurture: "border-[#7f8c8d] text-[#7f8c8d]",
  Closed: "border-[#27ae60] text-[#27ae60]",
};

const STATUS_TO_PIPELINE: Record<LeadStatus, CrmPipeline> = {
  new: "New",
  contacted: "Contacted",
  showing: "Showing",
  nurture: "Nurture",
  closed: "Closed",
};

const PIPELINE_TO_STATUS: Record<CrmPipeline, LeadStatus> = {
  New: "new",
  Attempted: "contacted",
  Contacted: "contacted",
  Showing: "showing",
  Nurture: "nurture",
  Closed: "closed",
};

type Row = {
  id: string;
  origin: "site" | "crm";
  name: string;
  email: string;
  phone: string;
  rating: number;
  type: string;
  pipeline: CrmPipeline;
  registeredAgo: string;
  source: string;
  price: string;
  city: string;
  timeframe: string;
  lastLogin: string;
  logins: number;
  lastTouch: string;
  nextReminder: string;
  reminderOverdue?: boolean;
  views: number;
  saved: number;
  fav: number;
  inq: number;
  assignedTo: string;
  activity: string;
};

function ago(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.round(ms / 60000));
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const days = Math.round(hr / 24);
  return `${days}d ago`;
}

function sourceLabel(lead: Lead) {
  if (lead.source === "registration") return "IDX Registration";
  return LEAD_SOURCE_LABEL[lead.source];
}

export default function LeadsDashboardPage() {
  const { ready, leads, add, updateStatus, appendActivity, remove } = useLeads();
  const overlay = useCrmOverlay();
  const [q, setQ] = useState("");
  const [pipelineFilter, setPipelineFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [mass, setMass] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [notice, setNotice] = useState("");

  const rows = useMemo(() => {
    const hidden = new Set(overlay.hidden);
    const siteRows: Row[] = leads.map((lead) => {
      const pipeline =
        overlay.pipeline[lead.id] ?? STATUS_TO_PIPELINE[lead.status] ?? "New";
      const last = lead.activity?.[0];
      return {
        id: lead.id,
        origin: "site",
        name: lead.name,
        email: lead.email,
        phone: lead.phone || "—",
        rating: Math.round(((lead.score ?? 60) / 20) * 10) / 10,
        type: "Buyer",
        pipeline,
        registeredAgo: ago(lead.createdAt),
        source: sourceLabel(lead),
        price: lead.searchLabel || "—",
        city: lead.propertyAddress || "Greater Vancouver",
        timeframe: LEAD_STATUS_LABEL[lead.status],
        lastLogin: ago(lead.updatedAt),
        logins: 1,
        lastTouch: last?.title || "Signup",
        nextReminder: lead.tasks?.find((t) => !t.done)?.due || "—",
        views: lead.viewedProperties?.length ?? 0,
        saved: lead.savedSearches?.length ?? 0,
        fav: 0,
        inq: lead.source === "registration" ? 1 : 1,
        assignedTo: "Casey Archibald",
        activity: last?.title || "Free Access signup",
      };
    });
    const crmRows: Row[] = CRM_LEADS.filter((lead) => !hidden.has(lead.id)).map(
      (lead) => ({
        id: lead.id,
        origin: "crm",
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        rating: lead.rating,
        type: lead.type,
        pipeline: overlay.pipeline[lead.id] ?? lead.pipeline,
        registeredAgo: lead.registeredAgo,
        source: lead.source,
        price: lead.price,
        city: lead.city,
        timeframe: lead.timeframe,
        lastLogin: lead.lastLogin,
        logins: lead.logins,
        lastTouch: overlay.activity[lead.id]?.[0]?.title || lead.lastTouch,
        nextReminder: lead.nextReminder,
        reminderOverdue: lead.reminderOverdue,
        views: lead.views,
        saved: lead.saved,
        fav: lead.fav,
        inq: lead.inq,
        assignedTo: lead.assignedTo,
        activity: overlay.activity[lead.id]?.[0]?.title || lead.activity[0]?.title || "—",
      })
    );
    return [...siteRows, ...crmRows];
  }, [leads, overlay.activity, overlay.hidden, overlay.pipeline]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (pipelineFilter !== "all" && row.pipeline !== pipelineFilter) return false;
      if (sourceFilter !== "all" && row.source !== sourceFilter) return false;
      if (!needle) return true;
      return (
        row.name.toLowerCase().includes(needle) ||
        row.email.toLowerCase().includes(needle) ||
        row.phone.includes(needle) ||
        row.city.toLowerCase().includes(needle) ||
        row.source.toLowerCase().includes(needle) ||
        row.activity.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, pipelineFilter, sourceFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const slice = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const sources = [...new Set(rows.map((row) => row.source))];
  const selectedIds = Object.entries(selected)
    .filter(([, on]) => on)
    .map(([id]) => id);

  function flash(text: string) {
    setNotice(text);
  }

  function log(row: Row, kind: "call" | "text" | "email") {
    const title = kind === "call" ? "Call logged" : kind === "text" ? "Text logged" : "Email logged";
    if (row.origin === "site") {
      appendActivity(row.id, { kind, title, body: `${title} from the lead list.` });
      if (kind === "call") updateStatus(row.id, "contacted");
    } else {
      overlay.appendActivity(row.id, { kind, title, body: `${title} from the lead list.` });
      if (kind === "call") overlay.setPipeline(row.id, "Attempted");
    }
    flash(`${title} for ${row.name}.`);
  }

  function setPipeline(row: Row, pipeline: CrmPipeline) {
    if (row.origin === "site") {
      updateStatus(row.id, PIPELINE_TO_STATUS[pipeline]);
      appendActivity(row.id, {
        kind: "system",
        title: `Pipeline set to ${pipeline}`,
      });
    }
    overlay.setPipeline(row.id, pipeline);
  }

  function applyMass(action: string) {
    if (!action || selectedIds.length === 0) return;
    if (action === "delete") {
      for (const id of selectedIds) {
        const row = rows.find((item) => item.id === id);
        if (!row) continue;
        if (row.origin === "site") remove(id);
        else overlay.hide([id]);
      }
      flash(`Removed ${selectedIds.length} lead${selectedIds.length === 1 ? "" : "s"}.`);
    } else if (PIPELINES.includes(action as CrmPipeline)) {
      for (const id of selectedIds) {
        const row = rows.find((item) => item.id === id);
        if (row) setPipeline(row, action as CrmPipeline);
      }
      flash(`Updated ${selectedIds.length} lead${selectedIds.length === 1 ? "" : "s"} to ${action}.`);
    }
    setSelected({});
    setMass("");
  }

  function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    if (!name || !email) return;
    add({
      name,
      email,
      phone,
      source: "general",
      notes: "Added from the agent lead list.",
    });
    setShowAdd(false);
    setPage(0);
    flash(`${name} added to the lead list.`);
    e.currentTarget.reset();
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-3rem)] flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#dbe4eb] bg-white px-3 py-2.5 sm:px-4">
        <label className="flex items-center gap-2 text-[12px] text-[#5a6f82]">
          <input
            type="checkbox"
            className="rounded border-[#b8c5d0]"
            checked={slice.length > 0 && slice.every((row) => selected[row.id])}
            onChange={(e) => {
              const next = { ...selected };
              for (const row of slice) next[row.id] = e.target.checked;
              setSelected(next);
            }}
          />
        </label>
        <select
          value={mass}
          onChange={(e) => {
            applyMass(e.target.value);
          }}
          className="rounded border border-[#dbe4eb] bg-white px-2 py-1.5 text-[12px] text-[#3d5164]"
        >
          <option value="">Mass Actions ▾</option>
          {PIPELINES.map((pipeline) => (
            <option key={pipeline} value={pipeline}>
              Set {pipeline}
            </option>
          ))}
          <option value="delete">Delete selected</option>
        </select>
        <button
          type="button"
          className="text-[12px] font-medium text-[#3498d8] hover:underline"
          onClick={() => setSelected({})}
        >
          Clear All
        </button>
        <button
          type="button"
          className="rounded p-1.5 text-[#8a9bab] hover:bg-[#eef3f7]"
          aria-label="Refresh"
          onClick={() => {
            setQ("");
            setPipelineFilter("all");
            setSourceFilter("all");
            setPage(0);
            flash(ready ? `List refreshed. ${rows.length} leads.` : "Loading leads…");
          }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <select
          value={pipelineFilter}
          onChange={(e) => {
            setPipelineFilter(e.target.value);
            setPage(0);
          }}
          className="rounded border border-[#dbe4eb] bg-white px-2 py-1.5 text-[12px]"
        >
          <option value="all">Pipeline: All</option>
          {PIPELINES.map((pipeline) => (
            <option key={pipeline} value={pipeline}>
              {pipeline}
            </option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => {
            setSourceFilter(e.target.value);
            setPage(0);
          }}
          className="rounded border border-[#dbe4eb] bg-white px-2 py-1.5 text-[12px]"
        >
          <option value="all">Source: All</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Quick search…"
          className="min-w-[140px] flex-1 rounded border border-[#dbe4eb] px-2 py-1.5 text-[12px] outline-none focus:border-[#00aeb6] sm:max-w-[200px]"
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Lock className="hidden h-3.5 w-3.5 text-[#8a9bab] sm:block" />
          <span className="hidden text-[12px] text-[#5a6f82] sm:inline">VIEW: Default</span>
          <select
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="rounded border border-[#dbe4eb] bg-white px-2 py-1.5 text-[12px]"
          >
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span className="text-[12px] text-[#5a6f82]">
            {filtered.length === 0
              ? "0"
              : `${safePage * pageSize + 1}–${Math.min(filtered.length, safePage * pageSize + slice.length)}`}{" "}
            of {filtered.length}
          </span>
          <div className="flex">
            <button
              type="button"
              className="rounded p-1 text-[#8a9bab] disabled:opacity-40"
              disabled={safePage === 0}
              onClick={() => setPage((n) => Math.max(0, n - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded p-1 text-[#8a9bab] disabled:opacity-40"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((n) => n + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="rounded bg-[#00aeb6] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#009a9c]"
          >
            + Add New Lead
          </button>
        </div>
      </div>

      {notice && (
        <p className="border-b border-[#d6efe8] bg-[#eafaf1] px-4 py-2 text-[12px] text-[#1e8449]">
          {notice}
        </p>
      )}

      {showAdd && (
        <form
          onSubmit={onAdd}
          className="flex flex-wrap items-end gap-2 border-b border-[#dbe4eb] bg-[#f7fbfd] px-4 py-3"
        >
          <label className="text-[11px] text-[#5a6f82]">
            Name
            <input name="name" required className="mt-1 block h-8 rounded border border-[#dbe4eb] px-2 text-[12px]" />
          </label>
          <label className="text-[11px] text-[#5a6f82]">
            Email
            <input name="email" type="email" required className="mt-1 block h-8 rounded border border-[#dbe4eb] px-2 text-[12px]" />
          </label>
          <label className="text-[11px] text-[#5a6f82]">
            Phone
            <input name="phone" className="mt-1 block h-8 rounded border border-[#dbe4eb] px-2 text-[12px]" />
          </label>
          <button type="submit" className="h-8 rounded bg-[#102236] px-3 text-[12px] font-semibold text-white">
            Save lead
          </button>
        </form>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left text-[12px]">
          <thead className="sticky top-0 z-10 bg-[#e8f1f8] text-[11px] font-semibold uppercase tracking-wide text-[#5a6f82]">
            <tr>
              <th className="w-8 px-3 py-2.5" />
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
            {slice.map((lead) => (
              <tr key={lead.id} className="border-b border-[#e8eef3] hover:bg-[#f7fbfd]">
                <td className="px-3 py-3 align-top">
                  <input
                    type="checkbox"
                    className="rounded border-[#b8c5d0]"
                    checked={Boolean(selected[lead.id])}
                    onChange={(e) =>
                      setSelected((cur) => ({ ...cur, [lead.id]: e.target.checked }))
                    }
                  />
                </td>
                <td className="px-2 py-3 align-top">
                  <Link href={`/agent/leads/details/${lead.id}`} className="font-medium text-[#3498d8] hover:underline">
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
                  <select
                    value=""
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "call" || value === "text" || value === "email") log(lead, value);
                      else if (PIPELINES.includes(value as CrmPipeline)) setPipeline(lead, value as CrmPipeline);
                    }}
                    className="mt-1 block bg-transparent text-[11px] text-[#3498d8]"
                  >
                    <option value="">Quick Actions ▾</option>
                    <option value="call">Log call</option>
                    <option value="text">Log text</option>
                    <option value="email">Log email</option>
                    {PIPELINES.map((pipeline) => (
                      <option key={pipeline} value={pipeline}>
                        Set {pipeline}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-3 align-top text-[#3d5164]">
                  <p>{lead.registeredAgo}</p>
                  <p className="text-[#8a9bab]">{lead.source}</p>
                </td>
                <td className="px-2 py-3 align-top text-[#3d5164]">
                  <p>{lead.price}</p>
                  <p className="text-[#8a9bab]">{lead.city}</p>
                </td>
                <td className="px-2 py-3 align-top text-[#3d5164]">{lead.timeframe}</td>
                <td className="px-2 py-3 align-top text-[#3d5164]">
                  <p>{lead.lastLogin}</p>
                  <p className="text-[#8a9bab]">{lead.logins} logins</p>
                </td>
                <td className="px-2 py-3 align-top text-[#3d5164]">
                  <p>{lead.lastTouch}</p>
                  <div className="mt-1 flex gap-1.5 text-[#8a9bab]">
                    <button type="button" aria-label="Log call" onClick={() => log(lead, "call")}>
                      <Phone className="h-3 w-3" />
                    </button>
                    <button type="button" aria-label="Log email" onClick={() => log(lead, "email")}>
                      <Mail className="h-3 w-3" />
                    </button>
                    <button type="button" aria-label="Log text" onClick={() => log(lead, "text")}>
                      <MessageSquare className="h-3 w-3" />
                    </button>
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
                  <p className="font-medium text-[#1a2b3c]">{lead.activity}</p>
                  <p className="text-[#27ae60]">Views {lead.views}</p>
                  <p className="text-[#e67e22]">Saved {lead.saved}</p>
                  <p className="flex items-center gap-0.5 text-[#e74c3c]">
                    <Heart className="h-3 w-3 fill-current" /> Fav {lead.fav}
                  </p>
                  <p className="text-[#3498d8]">Inq {lead.inq}</p>
                </td>
                <td className="px-2 py-3 align-top text-[#3d5164]">
                  <p>{lead.assignedTo}</p>
                </td>
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-[#8a9bab]">
                  {ready ? "No leads match these filters." : "Loading leads…"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
