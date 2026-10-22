"use client";

import { useEffect, useMemo, useState } from "react";
import { CRM_AGENT, CRM_LEADS } from "@/lib/cinc-crm";
import { useLeads, type Lead } from "@/lib/leads";
import { useChrome } from "./chrome-context";
import { href, type LeadTab } from "./route";
import { nowLabel, uid, useCinc, type Assign } from "./store";
import { Btn, checkCls, Field, inputCls, Menu, ModalFrame, useComposer } from "./ui";

const PIPELINES = [
  "New Lead",
  "Attempted Contact",
  "Contacted",
  "Appt Set",
  "Appt Met",
  "Active Client",
  "Pending Client",
  "Past Client",
  "No Stage Set",
];

const TEAM = [
  "Unassigned",
  "Anastasiia Borovyk",
  "Ann-Marie Copping",
  "Casey Archibald",
  "Cassie Kang",
  "Chantel Machnik",
  "Denisse Moran",
  "Doris Stratoberdha",
  "Kayla Gerak",
  "Kevin Barrett",
  "Routing Engine",
];

const LISTING_AGENTS = ["Unassigned", "Casey Archibald", "Routing Engine"];

const CINC_FILTERS = [
  "•P1 - Call Now!",
  "•P2 - Call Again",
  "•P3 - Call Active",
  "F1 - Call Today",
  "F2 - Email Today",
  "F3 - Do Today",
  "Needs Reminder",
];

const CUSTOM_FILTERS = [
  "*3. •P1 - Call New Leads",
  "*4. •P2 - Call New Again",
  "*5. •P3 - Call Active",
  "1. F4- DANGER",
  "2. F1- Follow Up Today",
  "HOT & Ready!!",
  "HOT LEADS",
  "ISA",
  "Kayla - First 12",
  "Kayla - Overdue",
  "Kayla - Remove",
  "POND-",
  "REW",
  "Step 5",
  "Step 6",
  "POND",
];

const FILTER_CHECKS = [
  "Assigned Agent",
  "Contact Validity",
  "Lead Type",
  "RealVerified Lead",
  "Registration Date",
  "Source",
];

const FILTER_ALL = [
  "Assigned Agent",
  "Appointment",
  "AutoTracks",
  "Average Price",
  "Contact Validity",
  "Deal",
  "Email Activity",
  "Etta App",
  "Favorite City",
  "First Time Buyer",
  "House to Sell",
  "Keyword",
  "Last Login Date",
  "Last Touch Date",
  "Lead Engagement",
  "Lead Type",
  "Login Count",
  "Median Price",
  "Next Reminder Date",
  "Prequalified",
  "PROLINC Leads",
  "Property Alerts",
  "Property Inquiries",
  "Property Views",
  "RealVerified Lead",
  "Registration Date",
  "Sign in Alert",
  "Source",
  "Status",
  "Subscription",
  "Terms of Use",
  "Timeframe",
];

const LABEL_COLORS: Record<string, string> = {
  H: "#e36a9a",
  N: "#e39b2b",
  R: "#5b7cfa",
  B: "#2e9e5b",
  S: "#8e5bd6",
};

type Row = {
  id: string;
  origin: "crm" | "site";
  name: string;
  email: string;
  phone: string;
  phoneValid: boolean;
  verified: boolean;
  score: number;
  type: string;
  pipeline: string;
  registered: string;
  source: string;
  price: string;
  city: string;
  timeframe: string;
  lastLogin: string;
  logins: number;
  lastTouch: string;
  nextReminder: string;
  overdue: boolean;
  views: number;
  saved: number;
  fav: number;
  inq: number;
  assigned: Assign;
};

function digits(phone: string) {
  return phone.replace(/\D/g, "").length >= 10;
}

function ago(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

const SOURCE: Record<string, string> = {
  showing_request: "Showing Request",
  ask_question: "Property Inquiry",
  registration: "IDX Registration",
  photo_gate: "Photo Gate",
  search_alert: "Search Alert",
  general: "Website",
};

const CRM_PIPE: Record<string, string> = {
  New: "New Lead",
  Attempted: "Attempted Contact",
  Contacted: "Contacted",
  Showing: "Appt Set",
  Nurture: "Active Client",
  Closed: "Past Client",
};

const SITE_PIPE: Record<string, string> = {
  new: "New Lead",
  contacted: "Contacted",
  showing: "Appt Set",
  nurture: "Active Client",
  closed: "Past Client",
};

function siteRow(lead: Lead): Row {
  return {
    id: lead.id,
    origin: "site",
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    phoneValid: digits(lead.phone),
    verified: lead.source === "registration",
    score: lead.score,
    type: "Buyer",
    pipeline: SITE_PIPE[lead.status] ?? "New Lead",
    registered: ago(lead.createdAt),
    source: SOURCE[lead.source] ?? "Website",
    price: lead.propertyAddress ? "Inquiry" : "$ n/a",
    city: "Vancouver",
    timeframe: lead.searchLabel || "—",
    lastLogin: "—",
    logins: 1,
    lastTouch: ago(lead.updatedAt),
    nextReminder: lead.tasks.find((task) => !task.done)?.due || "n/a",
    overdue: false,
    views: lead.viewedProperties.length,
    saved: lead.savedSearches.length,
    fav: 0,
    inq: lead.source === "ask_question" || lead.source === "showing_request" ? 1 : 0,
    assigned: { agent: CRM_AGENT.name, partner: "Unassigned", listing: "Unassigned" },
  };
}

function crmRows(): Row[] {
  return CRM_LEADS.map((lead) => ({
    id: lead.id,
    origin: "crm",
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    phoneValid: digits(lead.phone),
    verified: Boolean(lead.verified),
    score: lead.rating,
    type: lead.type,
    pipeline: CRM_PIPE[lead.pipeline] ?? "New Lead",
    registered: lead.registeredAgo,
    source: lead.source,
    price: lead.price,
    city: lead.city,
    timeframe: lead.timeframe,
    lastLogin: lead.lastLogin,
    logins: lead.logins,
    lastTouch: lead.lastTouch,
    nextReminder: lead.nextReminder,
    overdue: Boolean(lead.reminderOverdue),
    views: lead.views,
    saved: lead.saved,
    fav: lead.fav,
    inq: lead.inq,
    assigned: {
      agent: lead.assignedTo === "UNASSIGNED" ? "Unassigned" : lead.assignedTo,
      partner: "Unassigned",
      listing: "Unassigned",
    },
  }));
}

function applyNamedFilter(row: Row, name: string, index: number) {
  const text = name.toLowerCase();
  if (text.includes("p1") || text.includes("call now") || text.includes("call new")) return row.pipeline === "New Lead";
  if (text.includes("p2") || text.includes("call again")) return row.pipeline === "Attempted Contact";
  if (text.includes("p3") || text.includes("call active")) return row.pipeline === "Contacted" || row.pipeline === "Active Client";
  if (text.includes("danger") || text.includes("overdue")) return row.overdue;
  if (text.includes("follow up") || text.includes("call today") || text.includes("do today")) return row.overdue || row.nextReminder === "Today";
  if (text.includes("email today")) return Boolean(row.email);
  if (text.includes("needs reminder")) return row.nextReminder !== "n/a";
  if (text.includes("hot")) return row.score >= 4;
  if (text === "isa" || text.includes("rew") || text.includes("referral")) return row.source.toLowerCase().includes("referral") || row.source.toLowerCase().includes("isa");
  if (text.includes("first 12")) return index < 12;
  if (text.includes("remove")) return false;
  if (text.includes("pond")) return row.assigned.agent === "Unassigned";
  if (text.includes("step 5")) return row.type === "Seller";
  if (text.includes("step 6")) return row.type === "Buyer";
  return true;
}

function pipeColor(stage: string) {
  if (stage === "Contacted") return "border-[#2e9e5b] text-[#2e9e5b]";
  if (stage === "Attempted Contact") return "border-[#e39b2b] text-[#c47d12]";
  if (stage === "New Lead") return "border-[#d9363e] text-[#d9363e]";
  if (stage === "Past Client" || stage === "No Stage Set") return "border-[#bbb] text-[#777]";
  return "border-[#1c93b5] text-[#1c93b5]";
}

export function LeadsView({
  mode,
  leadId,
  tab,
}: {
  mode: "list" | "export" | "history";
  leadId?: string;
  tab: LeadTab;
}) {
  const { leads, add, appendActivity } = useLeads();
  const { state, update } = useCinc();
  const chrome = useChrome();
  const composer = useComposer();
  const [selected, setSelected] = useState<string[]>([]);
  const [cincFilter, setCincFilter] = useState("None");
  const [customFilter, setCustomFilter] = useState("None");
  const [customQuery, setCustomQuery] = useState("");
  const [view, setView] = useState<"Roomy" | "Default" | "Compact">("Default");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(0);
  const [showTrash, setShowTrash] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [checks, setChecks] = useState<string[]>([]);
  const [drawerAgent, setDrawerAgent] = useState("Any");
  const [drawerType, setDrawerType] = useState("Any");
  const [drawerSource, setDrawerSource] = useState("Any");
  const [drawerValid, setDrawerValid] = useState("Any");
  const [drawerStage, setDrawerStage] = useState("Any");
  const [drawerVerified, setDrawerVerified] = useState("Any");
  const [includeLabels, setIncludeLabels] = useState("");
  const [excludeLabels, setExcludeLabels] = useState("");
  const [mustLabels, setMustLabels] = useState("");
  const [expanded, setExpanded] = useState(false);

  const rows = useMemo(() => {
    const merged = [...leads.map(siteRow), ...crmRows()].map((row) => ({
      ...row,
      pipeline: state.pipeline[row.id] ?? row.pipeline,
      type: state.leadType[row.id] ?? row.type,
      assigned: state.assigned[row.id] ?? row.assigned,
    }));
    return merged;
  }, [leads, state.pipeline, state.leadType, state.assigned]);

  const filtered = rows.filter((row, index) => {
    const trashed = state.trashed.includes(row.id);
    if (showTrash ? !trashed : trashed) return false;
    const q = chrome.leadSearch.trim().toLowerCase();
    if (q && !`${row.name} ${row.email} ${row.phone} ${row.city}`.toLowerCase().includes(q)) return false;
    if (cincFilter !== "None" && !applyNamedFilter(row, cincFilter, index)) return false;
    if (customFilter !== "None" && !applyNamedFilter(row, customFilter, index)) return false;
    if (checks.includes("Assigned Agent") && drawerAgent !== "Any" && row.assigned.agent !== drawerAgent) return false;
    if (checks.includes("Lead Type") && drawerType !== "Any" && row.type !== drawerType) return false;
    if (checks.includes("Source") && drawerSource !== "Any" && row.source !== drawerSource) return false;
    if (checks.includes("Contact Validity") && drawerValid === "Valid" && !row.phoneValid) return false;
    if (checks.includes("Contact Validity") && drawerValid === "Invalid" && row.phoneValid) return false;
    if (checks.includes("RealVerified Lead") && drawerVerified === "Verified" && !row.verified) return false;
    if (drawerStage !== "Any" && row.pipeline !== drawerStage) return false;
    const labels = state.labels[row.id] ?? [];
    if (includeLabels && !labels.includes(includeLabels)) return false;
    if (excludeLabels && labels.includes(excludeLabels)) return false;
    if (mustLabels && !mustLabels.split(",").every((part) => labels.includes(part.trim()))) return false;
    return true;
  });

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const dirty = cincFilter !== "None" || customFilter !== "None" || checks.length > 0 || drawerStage !== "Any" || Boolean(chrome.leadSearch);
  const open = rows.find((row) => row.id === leadId);

  useEffect(() => {
    if (mode !== "export") return;
    const header = ["Name", "Email", "Phone", "Pipeline", "Source", "City"];
    const lines = [header.join(","), ...filtered.map((row) => [row.name, row.email, row.phone, row.pipeline, row.source, row.city].join(","))];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leads.csv";
    link.click();
    URL.revokeObjectURL(url);
    chrome.toast("Exported the current lead list.");
    // Export once when this hash is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function clearFilters() {
    setCincFilter("None");
    setCustomFilter("None");
    setChecks([]);
    setDrawerStage("Any");
    setDrawerAgent("Any");
    setDrawerType("Any");
    setDrawerSource("Any");
    setDrawerValid("Any");
    setIncludeLabels("");
    setExcludeLabels("");
    setMustLabels("");
    chrome.setLeadSearch("");
  }

  function setPipeline(id: string, stage: string) {
    update((current) => ({ ...current, pipeline: { ...current.pipeline, [id]: stage } }));
  }

  function trash(ids: string[]) {
    update((current) => ({ ...current, trashed: [...new Set([...current.trashed, ...ids])] }));
    setSelected([]);
    chrome.toast(`Trashed ${ids.length} lead${ids.length === 1 ? "" : "s"}.`);
  }

  function untrash(ids: string[]) {
    update((current) => ({ ...current, trashed: current.trashed.filter((id) => !ids.includes(id)) }));
    setSelected([]);
    chrome.toast("Restored the selected leads.");
  }

  function log(row: Row, kind: "call" | "text" | "email" | "note", title: string, body?: string) {
    if (row.origin === "site" && kind !== "note") {
      appendActivity(row.id, { kind, title, body });
    }
    if (kind === "note") {
      update((current) => ({
        ...current,
        notes: { ...current.notes, [row.id]: [...(current.notes[row.id] ?? []), { id: uid("note"), body: body || title, at: nowLabel() }] },
      }));
    }
    if (kind === "call" || kind === "text") {
      update((current) => ({
        ...current,
        calls: [{ id: uid("call"), leadId: row.id, name: row.name, at: nowLabel(), kind: kind === "text" ? "text" : "call" }, ...current.calls],
      }));
    }
  }

  function mass(action: string) {
    const chosen = rows.filter((row) => selected.includes(row.id));
    if (!chosen.length && action !== "Untrash Selected Leads") {
      chrome.toast("Select at least one lead first.");
      return;
    }
    if (action === "Send Email to Selected") {
      composer.email(chosen.map((row) => row.email).join(", "), (sent, value) => {
        chosen.forEach((row) => log(row, "email", sent ? "Email sent" : "Email draft", value.body));
        chrome.toast(sent ? "Email sent from this device." : "Draft saved on this device.");
      });
    } else if (action === "Send Text to Selected") {
      composer.text(chosen.map((row) => row.phone).join(", "), (value) => {
        chosen.forEach((row) => log(row, "text", "Text sent", value.body));
        chrome.toast("Text sent from this device.");
      });
    } else if (action === "Apply Label to Selected" || action === "Remove Label from Selected") {
      const removing = action.startsWith("Remove");
      chrome.openModal(
        <LabelModal
          title={action}
          onClose={chrome.closeModal}
          onSave={(label) => {
            update((current) => {
              const labels = { ...current.labels };
              for (const id of selected) {
                const next = new Set(labels[id] ?? []);
                if (removing) next.delete(label);
                else next.add(label.slice(0, 1).toUpperCase());
                labels[id] = [...next];
              }
              return { ...current, labels };
            });
            chrome.closeModal();
            chrome.toast(removing ? "Label removed." : "Label applied.");
          }}
        />,
      );
    } else if (action === "Add Selected to Pipeline") {
      chrome.openModal(
        <ChoiceModal
          title="Add Selected to Pipeline"
          options={PIPELINES}
          onClose={chrome.closeModal}
          onSave={(stage) => {
            selected.forEach((id) => setPipeline(id, stage));
            chrome.closeModal();
            chrome.toast(`Pipeline set to ${stage}.`);
          }}
        />,
      );
    } else if (action === "Set Property Alert Frequency") {
      chrome.openModal(
        <ChoiceModal
          title="Property Alert Frequency"
          options={["Off", "Instant", "Daily", "Weekly", "Monthly"]}
          onClose={chrome.closeModal}
          onSave={(freq) => {
            update((current) => {
              const alertFreq = { ...current.alertFreq };
              selected.forEach((id) => {
                alertFreq[id] = freq;
              });
              return { ...current, alertFreq };
            });
            chrome.closeModal();
            chrome.toast(`Alerts set to ${freq}.`);
          }}
        />,
      );
    } else if (action === "Toggle Sign-In Alert") {
      update((current) => {
        const signInAlert = { ...current.signInAlert };
        selected.forEach((id) => {
          signInAlert[id] = !signInAlert[id];
        });
        return { ...current, signInAlert };
      });
      chrome.toast("Sign-in alert toggled.");
    } else if (action === "Reassign Agents") {
      chrome.openModal(
        <ReassignModal
          onClose={chrome.closeModal}
          onSave={(assign) => {
            update((current) => {
              const assigned = { ...current.assigned };
              selected.forEach((id) => {
                assigned[id] = assign;
              });
              return { ...current, assigned };
            });
            chrome.closeModal();
            chrome.toast("Agents reassigned on this device.");
          }}
        />,
      );
    } else if (action === "Trash Selected Leads") trash(selected);
    else if (action === "Untrash Selected Leads") untrash(selected.length ? selected : state.trashed);
  }

  const rowPad = view === "Compact" ? "py-1" : view === "Roomy" ? "py-4" : "py-2";

  if (mode === "history") {
    return (
      <div className="p-4">
        <div className="bg-white p-4">
          <h2 className="mb-3 text-[15px] text-[#2a9bb8]">Dialer History</h2>
          <table className="w-full text-left text-[12px]">
            <thead className="text-[10px] tracking-wide text-[#888] uppercase">
              <tr>
                <th className="py-2">Lead</th>
                <th>Kind</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {state.calls.length ? (
                state.calls.map((call) => (
                  <tr key={call.id} className="border-t border-[#eee]">
                    <td className="py-2"><a className="text-[#1c93b5]" href={href.lead(call.leadId)}>{call.name}</a></td>
                    <td>{call.kind}</td>
                    <td>{call.at}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-[#888]">No dialer history yet. Log a call from a lead to see it here.</td>
                </tr>
              )}
            </tbody>
          </table>
          <a href={href.leads} className="mt-3 inline-block text-[12px] text-[#1c93b5]">Back to leads</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {mode === "export" ? (
        <p className="bg-[#e8f6fb] px-4 py-2 text-[12px] text-[#1c93b5]">A CSV of the current list downloaded. <a href={href.leads}>Return to leads</a></p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#eee] bg-white px-3 py-2">
        <label className="flex items-center gap-1 text-[12px]">
          <input
            className={checkCls}
            type="checkbox"
            checked={slice.length > 0 && slice.every((row) => selected.includes(row.id))}
            onChange={(event) => setSelected(event.target.checked ? slice.map((row) => row.id) : [])}
          />
        </label>
        <Menu
          label={<span className="inline-flex h-6 items-center border border-[#b7c4ce] bg-white px-2 text-[12px] text-[#4d6270]">Mass Actions ▾</span>}
          items={[
            "Send Email to Selected",
            "Send Text to Selected",
            "Apply Label to Selected",
            "Remove Label from Selected",
            "Add Selected to Pipeline",
            "Set Property Alert Frequency",
            "Toggle Sign-In Alert",
            "Reassign Agents",
            "Trash Selected Leads",
            "Untrash Selected Leads",
          ].map((label) => ({ label, danger: label.startsWith("Trash"), onClick: () => mass(label) }))}
        />
        <Btn disabled={!dirty} onClick={clearFilters}>Clear All</Btn>
        <button type="button" title="Refresh filters" className="grid h-[34px] w-[34px] place-items-center bg-[#1c93b5] text-white" onClick={() => chrome.toast("Filters refreshed.")}>↻</button>
        <select className="h-6 w-[150px] border border-[#ccc] bg-white text-[12px]" value={cincFilter} onChange={(event) => { setCincFilter(event.target.value); setPage(0); }}>
          <option>None</option>
          {CINC_FILTERS.map((option) => <option key={option}>{option}</option>)}
        </select>
        <Menu
          label={<span className="inline-flex h-6 w-[170px] items-center border border-[#ccc] bg-white px-2 text-[12px]">Custom Filter: {customFilter} ▾</span>}
          items={[
            { label: "Clear", onClick: () => setCustomFilter("None") },
            ...[...CUSTOM_FILTERS, ...state.customFilters].filter((option) => option.toLowerCase().includes(customQuery.toLowerCase())).map((label) => ({
              label,
              onClick: () => setCustomFilter(label),
            })),
          ]}
        />
        <input className="h-6 w-28 border border-[#ccc] px-1 text-[12px]" placeholder="Find filter" value={customQuery} onChange={(event) => setCustomQuery(event.target.value)} />
        <Btn disabled={!dirty} title="Save filter" onClick={() => {
          const name = window.prompt("Name this filter");
          if (!name) return;
          update((current) => ({ ...current, customFilters: [...current.customFilters, name] }));
          chrome.toast("Filter saved on this device.");
        }}>Save</Btn>
        <button type="button" className="inline-flex h-[26px] items-center gap-1.5 border border-[#d0d0d0] bg-white px-2.5 text-[13px] font-normal text-[#333] shadow-[0_1px_1px_rgba(0,0,0,0.04)]" onClick={() => setDrawer(true)}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 3h12M4 8h8M6 13h4" /></svg>
          Filters
        </button>
        <button type="button" className="ml-auto text-[#666]" title="Print" onClick={() => window.print()}>⎙</button>
        <Menu
          header="View Style"
          label={<span className="text-[12px] font-semibold">VIEW: {view} ▾</span>}
          items={["Roomy", "Default", "Compact"].map((label) => ({ label, onClick: () => setView(label as typeof view) }))}
        />
        <Menu
          header="Page Size"
          label={<span className="text-[12px]">{pageSize} ☰ ▾</span>}
          items={[5, 10, 25, 50, 100].map((size) => ({ label: String(size), onClick: () => { setPageSize(size); setPage(0); } }))}
        />
        <span className="text-[12px] text-[#666]">
          {filtered.length ? `${safePage * pageSize + 1} - ${Math.min(filtered.length, (safePage + 1) * pageSize)} of ${filtered.length}` : "0 of 0"}
        </span>
        <button type="button" className="px-1 disabled:opacity-30" disabled={safePage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>‹</button>
        <button type="button" className="px-1 disabled:opacity-30" disabled={safePage >= pages - 1} onClick={() => setPage((value) => value + 1)}>›</button>
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <button type="button" className="text-[12px] text-[#1c93b5]" onClick={() => setShowTrash((value) => !value)}>
          {showTrash ? "Showing trashed" : "Showing active"}
        </button>
        <Btn kind="teal" onClick={() => chrome.openModal(<AddLeadModal onClose={chrome.closeModal} onSave={(input) => {
          add({ ...input, source: "general" });
          chrome.closeModal();
          chrome.toast("Lead added.");
        }} />)}>+ Add New Lead</Btn>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className={`min-w-0 overflow-auto ${open && !expanded ? "w-[205px] shrink-0 border-r border-[#e5e5e5]" : "flex-1"}`}>
          {open && !expanded ? (
            <ul>
              {slice.map((row) => (
                <li key={row.id}>
                  <a href={href.lead(row.id, tab)} className={`block truncate px-3 py-2 text-[12px] ${row.id === leadId ? "bg-[#d5eaf2] text-[#1c93b5]" : "hover:bg-[#f7f7f7]"}`}>
                    {row.name}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <table className="w-full min-w-[1100px] border-collapse bg-white text-left">
              <thead className="text-[10px] font-bold tracking-wide text-[#8a8a8a] uppercase">
                <tr>
                  {["", "Name/Info", "Pipeline", "Registered", "Price/City", "Timeframe", "Last Login", "Last Touch", "Next Reminder", "Activity", "Assigned To"].map((col) => (
                    <th key={col} className="border-b border-[#eee] px-2 py-2">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.map((row, index) => (
                  <tr key={row.id} className={`group border-b border-[#f0f0f0] align-top hover:bg-[#d5eaf2] ${index % 2 ? "bg-[#f7f7f7]" : "bg-white"} ${rowPad}`}>
                    <td className="px-2">
                      <input className={checkCls} type="checkbox" checked={selected.includes(row.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id))} />
                    </td>
                    <td className="px-2">
                      <div className="flex items-center gap-1">
                        <a href={href.lead(row.id)} className="text-[11.5px] font-bold text-[#1c93b5]">{row.name}</a>
                        <span title={row.verified ? "Verified" : "Unverified"} className={row.verified ? "text-[#1c93b5]" : "text-[#bbb]"}>{row.verified ? "✓" : "○"}</span>
                      </div>
                      <p className="text-[11px]">
                        {row.phone} <span className={row.phoneValid ? "text-[#2e9e5b]" : "text-[#e39b2b]"}>{row.phoneValid ? "✓" : "!"}</span>
                        <Menu
                          label={<span className="ml-1 text-[10px] text-[#888]">▾</span>}
                          items={[
                            { label: "Call", onClick: () => { log(row, "call", "Call logged"); chrome.toast(`Call to ${row.phone} logged.`); } },
                            { label: "Text", onClick: () => composer.text(row.phone, (value) => { log(row, "text", "Text sent", value.body); chrome.toast("Text sent."); }) },
                            { label: "Copy number", onClick: () => { navigator.clipboard?.writeText(row.phone); chrome.toast("Phone copied."); } },
                          ]}
                        />
                      </p>
                      <button type="button" className="text-[11px] text-[#1c93b5]" onClick={() => composer.email(row.email, (sent, value) => { log(row, "email", sent ? "Email sent" : "Draft", value.body); chrome.toast(sent ? "Email sent." : "Draft saved."); })}>
                        {row.email} <span className="text-[#2e9e5b]">✓</span>
                      </button>
                      <p className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="rounded-full bg-[#eee] px-1.5 text-[10px]">★ {row.score.toFixed(1)}</span>
                        <span className={`rounded px-1 text-[10px] ${row.type === "Seller" ? "bg-[#e5f6ea] text-[#2e9e5b]" : "bg-[#eee] text-[#666]"}`}>{row.type}</span>
                        {(state.labels[row.id] ?? []).map((label) => (
                          <span key={label} className="grid h-4 w-4 place-items-center rounded-full text-[9px] text-white" style={{ background: LABEL_COLORS[label] ?? "#888" }}>{label}</span>
                        ))}
                      </p>
                    </td>
                    <td className="px-2">
                      <Menu
                        label={<span className={`inline-flex rounded border px-1 text-[10px] font-semibold uppercase ${pipeColor(row.pipeline)}`}>{row.pipeline === "Contacted" ? "✔ " : ""}{row.pipeline}</span>}
                        items={PIPELINES.map((stage) => ({ label: stage, onClick: () => setPipeline(row.id, stage) }))}
                      />
                      <div className="mt-1 hidden group-hover:block">
                        <Menu
                          label={<span className="text-[11px] text-[#1c93b5]">Quick Actions ▾</span>}
                          items={[
                            { label: "+ Add Note", onClick: () => chrome.openModal(<NoteModal onClose={chrome.closeModal} onSave={(body) => { log(row, "note", "Note added", body); chrome.closeModal(); }} />) },
                            { label: "+ New Reminder", onClick: () => chrome.openModal(<ReminderModal leadId={row.id} onClose={chrome.closeModal} />) },
                            { label: "→ Send Text", onClick: () => composer.text(row.phone, (value) => log(row, "text", "Text sent", value.body)) },
                            { label: "→ Send Email", onClick: () => composer.email(row.email, (sent, value) => log(row, "email", sent ? "Email sent" : "Draft", value.body)) },
                            { label: "Trash this Lead", danger: true, onClick: () => trash([row.id]) },
                            { label: "Merge lead", onClick: () => chrome.toast("Merge keeps the selected lead and files a note. Pick a second lead from the list, then run Merge again.") },
                          ]}
                        />
                      </div>
                    </td>
                    <td className="px-2 text-[11px]">{row.registered}<br />{row.source}</td>
                    <td className="px-2 text-[11px]">{row.price}<br />{row.city}</td>
                    <td className="px-2 text-[11px]">{row.timeframe}</td>
                    <td className="px-2 text-[11px]">{row.lastLogin}<br />{row.logins} Total</td>
                    <td className="px-2 text-[11px]">{row.lastTouch}</td>
                    <td className={`px-2 text-[11px] ${row.overdue ? "text-[#d9363e]" : ""}`}>{row.nextReminder}</td>
                    <td className="px-2 text-[10px]">
                      <span className="text-[#2e9e5b]">{row.views} Views</span><br />
                      <span className="text-[#e39b2b]">{row.saved} Saved</span><br />
                      <span className="text-[#d9363e]">{row.fav} Fav</span> · <span className="text-[#1c93b5]">{row.inq} Inq</span>
                    </td>
                    <td className="px-2 text-[10px] leading-4">
                      {(["agent", "partner", "listing"] as const).map((slot) => (
                        <Menu
                          key={slot}
                          label={<span className="block text-[#1c93b5] uppercase">{row.assigned[slot]} ▾</span>}
                          items={(slot === "listing" ? LISTING_AGENTS : TEAM).map((name) => ({
                            label: name,
                            onClick: () => update((current) => ({
                              ...current,
                              assigned: { ...current.assigned, [row.id]: { ...row.assigned, [slot]: name } },
                            })),
                          }))}
                        />
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!slice.length ? <p className="bg-white px-4 py-10 text-center text-[13px] text-[#888]">No leads match these filters.</p> : null}
        </div>
        {open ? (
          <LeadDetail
            row={open}
            tab={tab}
            rows={filtered}
            expanded={expanded}
            onExpand={() => setExpanded((value) => !value)}
            onLog={log}
            onPipeline={setPipeline}
          />
        ) : null}
      </div>
      {drawer ? (
        <FilterDrawer
          showAll={showAll}
          setShowAll={setShowAll}
          filterQuery={filterQuery}
          setFilterQuery={setFilterQuery}
          checks={checks}
          setChecks={setChecks}
          count={filtered.length}
          onClose={() => setDrawer(false)}
          onClear={clearFilters}
          dirty={dirty}
          onSave={() => {
            const name = window.prompt("Name this filter");
            if (!name) return;
            update((current) => ({ ...current, customFilters: [...current.customFilters, name] }));
            chrome.toast("Filter saved on this device.");
          }}
          stage={drawerStage}
          setStage={setDrawerStage}
          agent={drawerAgent}
          setAgent={setDrawerAgent}
          type={drawerType}
          setType={setDrawerType}
          source={drawerSource}
          setSource={setDrawerSource}
          valid={drawerValid}
          setValid={setDrawerValid}
          verified={drawerVerified}
          setVerified={setDrawerVerified}
          includeLabels={includeLabels}
          excludeLabels={excludeLabels}
          mustLabels={mustLabels}
          setInclude={setIncludeLabels}
          setExclude={setExcludeLabels}
          setMust={setMustLabels}
        />
      ) : null}
    </div>
  );
}

function LeadDetail({
  row,
  tab,
  rows,
  expanded,
  onExpand,
  onLog,
  onPipeline,
}: {
  row: Row;
  tab: LeadTab;
  rows: Row[];
  expanded: boolean;
  onExpand: () => void;
  onLog: (row: Row, kind: "call" | "text" | "email" | "note", title: string, body?: string) => void;
  onPipeline: (id: string, stage: string) => void;
}) {
  const chrome = useChrome();
  const composer = useComposer();
  const { state, update } = useCinc();
  const { leads } = useLeads();
  const index = rows.findIndex((item) => item.id === row.id);
  const prev = rows[index - 1];
  const next = rows[index + 1];
  const site = leads.find((lead) => lead.id === row.id);
  const crm = CRM_LEADS.find((lead) => lead.id === row.id);
  const notes = [...(state.notes[row.id] ?? []), ...(site?.activity.filter((item) => item.kind === "note").map((item) => ({ id: item.id, body: item.body || item.title, at: item.at })) ?? [])];
  const deals = state.deals.filter((deal) => deal.client === row.name);
  const reminders = state.reminders.filter((item) => item.leadId === row.id);
  const appts = state.appointments.filter((item) => item.leadId === row.id);
  const tabs: { id: LeadTab; label: string }[] = [
    { id: "activity", label: "Activity" },
    { id: "info", label: "Info" },
    { id: "plans", label: "Reminders+Plans" },
    { id: "appointments", label: "Appointments" },
    { id: "conversations", label: "Conversations" },
    { id: "plips", label: "AutoTracks" },
  ];

  return (
    <div className="flex min-w-0 flex-1 bg-[#f5f5f5]">
      {!expanded ? (
        <div className="flex w-[34px] shrink-0 flex-col items-center gap-3 border-r border-[#eee] bg-white py-3">
          {[
            ["Call", () => { onLog(row, "call", "Call logged"); chrome.toast(`Called ${row.phone}.`); }],
            ["Dialer", () => chrome.toast("Dialer is disabled on this lead. Open Dialer from the globe sidebar.")],
            ["Text", () => composer.text(row.phone, (value) => { onLog(row, "text", "Text sent", value.body); chrome.toast("Text sent."); })],
            ["Email", () => composer.email(row.email, (sent, value) => { onLog(row, "email", sent ? "Email sent" : "Draft", value.body); chrome.toast(sent ? "Email sent." : "Draft saved."); })],
            ["Etta", () => chrome.openModal(<ModalFrame title="Etta" onClose={chrome.closeModal}><p className="text-[13px]">Etta is CINC&apos;s assistant. This demo saved a note that you opened Etta for {row.name}.</p><div className="mt-3 text-right"><Btn kind="teal" onClick={() => { onLog(row, "note", "Opened Etta", "Asked Etta for a summary."); chrome.closeModal(); }}>Save note</Btn></div></ModalFrame>)],
          ].map(([label, action]) => (
            <button key={label as string} type="button" className={`grid place-items-center text-[#1c93b5] ${label === "Dialer" ? "opacity-40" : ""}`} onClick={action as () => void}>
              <span className="grid h-[22px] w-[22px] place-items-center rounded-full border border-[#1c93b5] text-[10px]">{(label as string).slice(0, 1)}</span>
              <span className="text-[8px]">{label as string}</span>
            </button>
          ))}
          <Menu
            label={<span className="grid place-items-center text-[#1c93b5]"><span className="grid h-[22px] w-[22px] place-items-center rounded-full border border-[#1c93b5] text-[10px]">+</span><span className="text-[8px]">More</span></span>}
            items={[
              { label: "Add Reminder", onClick: () => chrome.openModal(<ReminderModal leadId={row.id} onClose={chrome.closeModal} />) },
              { label: "Add Appointment", onClick: () => chrome.openModal(<ApptModal leadId={row.id} onClose={chrome.closeModal} />) },
              { label: "Add AutoTrack", onClick: () => chrome.toast(`AutoTrack queued for ${row.name}.`) },
              { label: "Refer Lead to PROLINC", disabled: true, onClick: () => chrome.toast("PROLINC referral is not enabled on this demo account.") },
              { label: "SkySlope Forms", onClick: () => chrome.openModal(<ModalFrame title="SkySlope Forms" onClose={chrome.closeModal}><p className="text-[13px]">A SkySlope packet would open for {row.name}. This demo stored the request locally.</p><div className="mt-3 text-right"><Btn onClick={chrome.closeModal}>Close</Btn></div></ModalFrame>) },
            ]}
          />
        </div>
      ) : null}
      {!expanded ? (
        <aside className="w-[215px] shrink-0 overflow-auto border-r border-[#eee] bg-white">
          <div className="flex items-center justify-between border-b border-[#eee] px-2 py-1 text-[#1c93b5]">
            <a href={href.leads} aria-label="Close">×</a>
            <button type="button" onClick={onExpand} aria-label="Expand">⤢</button>
            <a href={prev ? href.lead(prev.id, tab) : href.leads} className={prev ? "" : "pointer-events-none opacity-30"}>‹</a>
            <a href={next ? href.lead(next.id, tab) : href.leads} className={next ? "" : "pointer-events-none opacity-30"}>›</a>
          </div>
          <div className="px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[#d9d9d9] text-[11px] font-bold">{row.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>
              <div>
                <p className="text-[14px] font-bold">{row.name}</p>
                <Menu
                  label={<span className="text-[11px] text-[#1c93b5]">{row.verified ? "Verified & unlocked ▾" : "Unverified ▾"}</span>}
                  items={["Verified & unlocked", "Unverified & unlocked", "Unverified & locked"].map((label) => ({ label, onClick: () => chrome.toast(label) }))}
                />
              </div>
            </div>
            <p className="mt-2 text-[12px]">{row.phone}</p>
            <p className="text-[12px] text-[#1c93b5]">{row.email}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              {["Buyer", "Seller", "Partial", "Recruit"].map((type) => (
                <label key={type} className="flex items-center gap-1">
                  <input type="radio" name={`type-${row.id}`} checked={row.type === type} onChange={() => update((current) => ({ ...current, leadType: { ...current.leadType, [row.id]: type } }))} />
                  {type}
                </label>
              ))}
            </div>
            <button type="button" className="mt-2 text-[12px] text-[#1c93b5]" onClick={() => {
              const name = window.prompt("Saved search name");
              if (!name) return;
              update((current) => ({ ...current, savedSearches: { ...current.savedSearches, [row.id]: [...(current.savedSearches[row.id] ?? []), name] } }));
            }}>+ Saved Search</button>
            <p className="mt-2 text-[11px] text-[#666]">{row.views} views · {row.saved} saved · {row.fav} fav · {row.inq} inq</p>
            <div className="mt-2">
              <Menu
                className="w-full"
                label={<span className="flex w-full items-center justify-between bg-[#2e9e5b] px-2 py-1 text-[12px] text-white">{row.pipeline} ▾</span>}
                items={PIPELINES.map((stage) => ({ label: stage, onClick: () => onPipeline(row.id, stage) }))}
              />
            </div>
            <button type="button" className="mt-2 rounded border border-dashed border-[#bbb] px-2 py-0.5 text-[11px]" onClick={() => {
              const label = window.prompt("Label letter");
              if (!label) return;
              const letter = label.slice(0, 1).toUpperCase();
              update((current) => ({ ...current, labels: { ...current.labels, [row.id]: [...new Set([...(current.labels[row.id] ?? []), letter])] } }));
            }}>+ Label</button>
            <div className="mt-3 flex items-center justify-between text-[12px] font-semibold">
              <span>Active Deals</span>
              <a className="font-normal text-[#1c93b5]" href={href.dealsPurchases}>+ Add Deal</a>
            </div>
            {deals.length ? deals.map((deal) => <p key={deal.id} className="text-[12px]">{deal.address}</p>) : <p className="text-[11px] text-[#888]">Track the revenue opportunities associated with this lead. Recently added deals? Try to refresh.</p>}
            <div className="mt-3 bg-[#a7d3df] px-2 py-1 text-[12px] font-bold">Communication</div>
            <p className="px-2 py-1 text-[11px]">Last Touch {row.lastTouch} · Last Login {row.lastLogin}</p>
            <div className="mt-2 bg-[#a7d3df] px-2 py-1 text-[12px] font-bold">Email Information</div>
            <p className="px-2 py-1 text-[11px]">Clicks 0 · Opens 0 · Alert Opens 0% · Phone</p>
            <p className="mt-3 text-[11px] text-[#666]">Registered {row.registered} ago from {row.source}</p>
          </div>
        </aside>
      ) : null}
      <section className="min-w-0 flex-1 overflow-auto p-3">
        <textarea
          className="mb-2 h-[30px] w-full border border-[#d5d5d5] px-2 py-1 text-[13px] outline-none focus:border-[#1c93b5]"
          placeholder="Add a note..."
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            const body = event.currentTarget.value.trim();
            if (!body) return;
            onLog(row, "note", "Note added", body);
            event.currentTarget.value = "";
            chrome.toast("Note added.");
          }}
        />
        <div className="mb-3 grid grid-cols-6 border border-[#e5e5e5] bg-white">
          {tabs.map((item) => (
            <a key={item.id} href={href.lead(row.id, item.id)} className={`border-t-2 py-2 text-center text-[11px] ${tab === item.id ? "border-[#1c93b5] text-[#1c93b5]" : "border-transparent text-[#666]"}`}>
              {item.label}
            </a>
          ))}
        </div>
        {tab === "activity" ? (
          <div>
            <div className="mb-2 flex gap-2">
              <Btn onClick={() => chrome.toast("Activity filters: notes, calls, emails, and system events are all shown.")}>Filters</Btn>
              <Btn onClick={() => chrome.toast(state.signInAlert[row.id] ? "Subscribed to sign-in alerts." : "Not subscribed. Toggle Sign-In Alert from Mass Actions.")}>Subscriptions</Btn>
              <span className="ml-auto text-[12px] text-[#888]">Pinned ▾</span>
            </div>
            {notes.map((note) => (
              <article key={note.id} className="mb-2 border border-[#e5e5e5] border-l-4 border-l-[#1c93b5] bg-white p-3">
                <p className="text-[13px] font-semibold">Note Added</p>
                <p className="text-[12px] text-[#888]">{note.at} · {CRM_AGENT.name}</p>
                <p className="mt-1 text-[13px]">{note.body}</p>
              </article>
            ))}
            <p className="my-2 text-[11px] font-semibold text-[#888]">Most Recent</p>
            {(crm?.activity ?? site?.activity ?? []).map((item) => (
              <article key={item.id} className="mb-2 border border-[#e5e5e5] bg-white p-3">
                <p className="text-[13px] font-semibold">{item.title}</p>
                {"body" in item && item.body ? <p className="text-[12px]">{item.body}</p> : null}
                <p className="text-[11px] text-[#999]">{item.at}</p>
              </article>
            ))}
            <p className="text-[13px] text-[#1c93b5]">Thats Everything!</p>
          </div>
        ) : null}
        {tab === "info" ? <InfoTab row={row} /> : null}
        {tab === "plans" ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Reminders</h3>
              <button type="button" className="text-[#1c93b5]" onClick={() => chrome.openModal(<ReminderModal leadId={row.id} onClose={chrome.closeModal} />)}>⊕ Add a Reminder</button>
            </div>
            {reminders.length ? reminders.map((item) => (
              <article key={item.id} className="mb-2 border border-[#eee] border-l-4 border-l-[#e39b2b] bg-white p-3">
                <p className="text-[11px] font-bold text-[#e39b2b]">{item.day}</p>
                <p className="text-[13px]">{item.title}</p>
                <p className="text-[11px] text-[#888]">Notifying {CRM_AGENT.name} @ {item.due}</p>
                <label className="mt-1 flex items-center gap-2 text-[12px]">
                  <input type="checkbox" checked={item.done} onChange={() => update((current) => ({ ...current, reminders: current.reminders.map((reminder) => reminder.id === item.id ? { ...reminder, done: !reminder.done } : reminder) }))} />
                  Completed
                </label>
                <div className="mt-2 flex gap-2">
                  <Btn kind="danger" onClick={() => update((current) => ({ ...current, reminders: current.reminders.filter((reminder) => reminder.id !== item.id) }))}>Delete</Btn>
                  <Btn kind="teal" onClick={() => chrome.toast("Reminder updated.")}>Edit</Btn>
                </div>
              </article>
            )) : <p className="text-[13px] text-[#888]">No reminders.</p>}
            <h3 className="mt-4 font-semibold">Plans</h3>
            <p className="text-[13px] text-[#888]">No plans assigned.</p>
            <button type="button" className="text-[#1c93b5]" onClick={() => chrome.toast("Plan started for this lead.")}>⊕ Start Plan</button>
          </div>
        ) : null}
        {tab === "appointments" ? (
          <div>
            <div className="mb-2 flex justify-between"><h3 className="font-semibold">Appointments</h3><button type="button" className="text-[#1c93b5]" onClick={() => chrome.openModal(<ApptModal leadId={row.id} onClose={chrome.closeModal} />)}>⊕ Add Appointment</button></div>
            {appts.filter((item) => !item.request).length ? appts.filter((item) => !item.request).map((item) => <p key={item.id} className="mb-1 bg-white p-2">{item.title} · {item.when}</p>) : <p className="text-[13px] text-[#888]">No Appointments.</p>}
            <div className="mt-4 mb-2 flex justify-between"><h3 className="font-semibold">Appointment Requests</h3><button type="button" className="text-[#1c93b5]" onClick={() => chrome.openModal(<ApptModal leadId={row.id} request onClose={chrome.closeModal} />)}>⊕ Add Appointment Request</button></div>
            {appts.filter((item) => item.request).map((item) => <p key={item.id} className="mb-1 bg-white p-2">{item.title}</p>)}
          </div>
        ) : null}
        {tab === "conversations" ? <Conversation row={row} onLog={onLog} /> : null}
        {tab === "plips" ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-[#1c93b5] px-2 py-0.5 text-[12px] text-white">AutoTracks</span>
              <button type="button" className="grid h-7 w-7 place-items-center rounded-full bg-[#1c93b5] text-white" onClick={() => chrome.toast("AutoTrack added.")}>+</button>
            </div>
            <article className="border border-[#e5e5e5] bg-white p-3">
              <div className="flex justify-between"><p className="font-semibold">Follow Up Reminders</p><span className="text-[10px] text-[#999]">CANCELLED</span></div>
              <p className="text-[12px] text-[#888]">General | Started on Oct 18, 2026</p>
              <div className="my-2 h-1.5 bg-[#eee]"><div className="h-full w-0 bg-[#1c93b5]" /></div>
              <p className="text-[12px]">0 of 6 steps completed</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <p className="bg-[#e7f5f8] p-2 text-[12px]">Triggered by New Lead / Start Trigger(s)</p>
                <p className="bg-[#e7f5f8] p-2 text-[12px]">Triggered by Pipeline Complete - Contacted / Stop Trigger(s)</p>
              </div>
              <button type="button" className="mt-2 text-[12px] text-[#1c93b5]" onClick={() => chrome.toast("Steps: Day 1 call, Day 2 email, Day 4 text, Day 7 call, Day 10 email, Day 14 close.")}>View More</button>
            </article>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function InfoTab({ row }: { row: Row }) {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const [edit, setEdit] = useState(false);
  const saved = state.info[row.id] ?? {};
  const [form, setForm] = useState({
    first: saved.first || row.name.split(" ")[0] || "",
    last: saved.last || row.name.split(" ").slice(1).join(" "),
    email: saved.email || row.email,
    cell: saved.cell || row.phone,
    city: saved.city || row.city,
    timeframe: saved.timeframe || row.timeframe,
  });
  const fields: [string, keyof typeof form][] = [["First name", "first"], ["Last name", "last"], ["Email", "email"], ["Cell phone", "cell"], ["City", "city"], ["Timeframe to buy", "timeframe"]];
  return (
    <div className="bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Details</h3>
        <Btn kind="teal" onClick={() => {
          if (edit) {
            update((current) => ({ ...current, info: { ...current.info, [row.id]: form } }));
            chrome.toast("Lead info saved on this device.");
          }
          setEdit((value) => !value);
        }}>{edit ? "Save" : "Edit"}</Btn>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-[12px] font-semibold">Key Info</p>
          {fields.map(([label, key]) => (
            <div key={key} className="mb-2">
              <p className="text-[10px] tracking-wide text-[#888] uppercase">{label}</p>
              {edit ? <input className={inputCls} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /> : <p className="text-[12px]">{form[key] || "—"}</p>}
            </div>
          ))}
          <Btn kind="danger" onClick={() => chrome.toast("Trash this lead from Quick Actions.")}>Trash</Btn>
          <p className="mt-3 text-[12px] text-[#888]">Social Info — No social info found.</p>
        </div>
        <div className="text-[12px]">
          <p className="mb-2 font-semibold">Assignment</p>
          <p>Agent assigned: {row.assigned.agent}</p>
          <p>Partner assigned: {row.assigned.partner}</p>
          <p>Listing agent assigned: {row.assigned.listing}</p>
          <p className="mt-3 font-semibold">User Data</p>
          <p>Registered: {row.registered}</p>
          <p>Source: {row.source}</p>
          <p>Login count: {row.logins}</p>
          <p>Last touch: {row.lastTouch}</p>
          <p className="mt-3 text-[11px] text-[#999]">Sensitive fields stay on this device and are not sent to a server.</p>
        </div>
      </div>
    </div>
  );
}

function Conversation({
  row,
  onLog,
}: {
  row: Row;
  onLog: (row: Row, kind: "call" | "text" | "email" | "note", title: string, body?: string) => void;
}) {
  const [body, setBody] = useState("");
  const [muted, setMuted] = useState(false);
  const chrome = useChrome();
  const { state } = useCinc();
  const texts = state.calls.filter((call) => call.leadId === row.id && call.kind === "text");
  return (
    <div>
      <span className="rounded-full bg-[#1c93b5] px-3 py-1 text-[12px] text-white">Text</span>
      <textarea className="mt-2 h-20 w-full border border-[#ccc] p-2 text-[13px]" placeholder="Enter message" maxLength={320} value={body} onChange={(event) => setBody(event.target.value)} />
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[12px] text-[#888]">{body.length}/320</span>
        <Btn onClick={() => { setMuted((value) => !value); chrome.toast(muted ? "Unmuted." : "Muted."); }}>Mute</Btn>
        <Btn kind="teal" onClick={() => { if (!body.trim()) return; onLog(row, "text", "Text sent", body); setBody(""); chrome.toast("Reply sent."); }}>Reply</Btn>
      </div>
      <p className="text-[11px] text-[#999]">Message and data rates may apply. See more in the public terms.</p>
      {texts.length ? texts.map((text) => <p key={text.id} className="mt-2 bg-white p-2 text-[12px]">{text.at}</p>) : (
        <div className="py-8 text-center">
          <svg viewBox="0 0 80 64" className="mx-auto h-16 w-20 text-[#7ec8e0]">
            <ellipse cx="40" cy="28" rx="18" ry="16" fill="currentColor" />
            <circle cx="33" cy="26" r="2" fill="#243238" />
            <circle cx="47" cy="26" r="2" fill="#243238" />
            <rect x="28" y="44" width="24" height="12" rx="2" fill="#1c93b5" />
          </svg>
          <p className="mt-2 text-[14px] text-[#666]">It&apos;s quiet in here.</p>
        </div>
      )}
    </div>
  );
}

function FilterDrawer(props: {
  showAll: boolean;
  setShowAll: (value: boolean) => void;
  filterQuery: string;
  setFilterQuery: (value: string) => void;
  checks: string[];
  setChecks: (value: string[]) => void;
  count: number;
  onClose: () => void;
  onClear: () => void;
  onSave: () => void;
  dirty: boolean;
  stage: string;
  setStage: (value: string) => void;
  agent: string;
  setAgent: (value: string) => void;
  type: string;
  setType: (value: string) => void;
  source: string;
  setSource: (value: string) => void;
  valid: string;
  setValid: (value: string) => void;
  verified: string;
  setVerified: (value: string) => void;
  includeLabels: string;
  excludeLabels: string;
  mustLabels: string;
  setInclude: (value: string) => void;
  setExclude: (value: string) => void;
  setMust: (value: string) => void;
}) {
  const list = (props.showAll ? FILTER_ALL : FILTER_CHECKS).filter((item) => item.toLowerCase().includes(props.filterQuery.toLowerCase()));
  const toggle = (item: string) => props.setChecks(props.checks.includes(item) ? props.checks.filter((check) => check !== item) : [...props.checks, item]);
  return (
    <div className="fixed inset-0 z-50 bg-black/20" onMouseDown={props.onClose}>
      <aside className="absolute top-0 right-0 flex h-full w-[235px] flex-col bg-white shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#eee] px-3 py-3">
          <h2 className="text-[14px] font-semibold">Lead Criteria</h2>
          <button type="button" className="border border-[#ccc] px-2 py-0.5 text-[12px]" onClick={props.onClose}>Hide ›</button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-3 py-2 text-[12px]">
          <p className="font-semibold">Filters</p>
          {props.showAll ? <input className={`${inputCls} my-2`} placeholder="Search filters..." value={props.filterQuery} onChange={(event) => props.setFilterQuery(event.target.value)} /> : null}
          {list.map((item) => (
            <label key={item} className="flex items-center gap-2 py-0.5">
              <input type="checkbox" checked={props.checks.includes(item)} onChange={() => toggle(item)} />
              {item}
            </label>
          ))}
          <button type="button" className="mt-1 text-[#1c93b5]" onClick={() => props.setShowAll(!props.showAll)}>{props.showAll ? "Show Fewer" : "+ Show All"}</button>
          {props.checks.includes("Assigned Agent") ? <select className={`${inputCls} mt-2`} value={props.agent} onChange={(event) => props.setAgent(event.target.value)}><option>Any</option>{TEAM.map((name) => <option key={name}>{name}</option>)}</select> : null}
          {props.checks.includes("Lead Type") ? <select className={`${inputCls} mt-2`} value={props.type} onChange={(event) => props.setType(event.target.value)}><option>Any</option><option>Buyer</option><option>Seller</option><option>Partial</option><option>Recruit</option></select> : null}
          {props.checks.includes("Source") ? <select className={`${inputCls} mt-2`} value={props.source} onChange={(event) => props.setSource(event.target.value)}><option>Any</option><option>Referral Exchange</option><option>IDX Registration</option><option>Facebook Lead Ad</option><option>Home Valuation</option><option>Search Alert</option><option>Website</option></select> : null}
          {props.checks.includes("Contact Validity") ? <select className={`${inputCls} mt-2`} value={props.valid} onChange={(event) => props.setValid(event.target.value)}><option>Any</option><option>Valid</option><option>Invalid</option></select> : null}
          {props.checks.includes("RealVerified Lead") ? <select className={`${inputCls} mt-2`} value={props.verified} onChange={(event) => props.setVerified(event.target.value)}><option>Any</option><option>Verified</option></select> : null}
          <p className="mt-3 font-semibold">Pipeline Stage</p>
          <select className={`${inputCls} mt-1`} value={props.stage} onChange={(event) => props.setStage(event.target.value)}>
            <option>Any</option>
            {PIPELINES.map((stage) => <option key={stage}>{stage}</option>)}
          </select>
          <p className="mt-3 font-semibold">Labels</p>
          <input className={`${inputCls} mt-1`} placeholder="Include Any With These Labels" value={props.includeLabels} onChange={(event) => props.setInclude(event.target.value.toUpperCase().slice(0, 1))} />
          <input className={`${inputCls} mt-1`} placeholder="Exclude Any With These Labels" value={props.excludeLabels} onChange={(event) => props.setExclude(event.target.value.toUpperCase().slice(0, 1))} />
          <input className={`${inputCls} mt-1`} placeholder="Must Have Each of These Labels" value={props.mustLabels} onChange={(event) => props.setMust(event.target.value.toUpperCase())} />
        </div>
        <div className="border-t border-[#eee] p-3">
          <button type="button" className="mb-2 h-8 w-full bg-[#1c93b5] text-[13px] text-white" onClick={props.onClose}>Show {props.count} Results</button>
          <div className="flex gap-2">
            <Btn disabled={!props.dirty} onClick={props.onSave}>Save</Btn>
            <Btn onClick={props.onClear}>Clear All</Btn>
          </div>
        </div>
      </aside>
    </div>
  );
}

function AddLeadModal({ onClose, onSave }: { onClose: () => void; onSave: (input: { name: string; email: string; phone: string }) => void }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  return (
    <ModalFrame title="Add New Lead" onClose={onClose}>
      <Field label="First name"><input className={inputCls} value={first} onChange={(event) => setFirst(event.target.value)} /></Field>
      <Field label="Last name"><input className={inputCls} value={last} onChange={(event) => setLast(event.target.value)} /></Field>
      <Field label="Email"><input className={inputCls} value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
      <Field label="Cell phone"><input className={inputCls} value={phone} onChange={(event) => setPhone(event.target.value)} /></Field>
      <div className="mt-3 flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind="teal" onClick={() => onSave({ name: `${first} ${last}`.trim() || "New Lead", email, phone })}>Save</Btn>
      </div>
    </ModalFrame>
  );
}

function NoteModal({ onClose, onSave }: { onClose: () => void; onSave: (body: string) => void }) {
  const [body, setBody] = useState("");
  return (
    <ModalFrame title="Add Note" onClose={onClose}>
      <textarea className="h-24 w-full border border-[#ccc] p-2 text-[13px]" value={body} onChange={(event) => setBody(event.target.value)} />
      <div className="mt-3 flex justify-end gap-2"><Btn onClick={onClose}>Cancel</Btn><Btn kind="teal" onClick={() => body.trim() && onSave(body.trim())}>Save</Btn></div>
    </ModalFrame>
  );
}

function LabelModal({ title, onClose, onSave }: { title: string; onClose: () => void; onSave: (label: string) => void }) {
  const [label, setLabel] = useState("");
  return (
    <ModalFrame title={title} onClose={onClose}>
      <Field label="Label"><input className={inputCls} value={label} onChange={(event) => setLabel(event.target.value)} /></Field>
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Cancel</Btn><Btn kind="teal" onClick={() => label.trim() && onSave(label.trim())}>Save</Btn></div>
    </ModalFrame>
  );
}

function ChoiceModal({ title, options, onClose, onSave }: { title: string; options: string[]; onClose: () => void; onSave: (value: string) => void }) {
  const [value, setValue] = useState(options[0]);
  return (
    <ModalFrame title={title} onClose={onClose}>
      <select className={inputCls} value={value} onChange={(event) => setValue(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select>
      <div className="mt-3 flex justify-end gap-2"><Btn onClick={onClose}>Cancel</Btn><Btn kind="teal" onClick={() => onSave(value)}>Save</Btn></div>
    </ModalFrame>
  );
}

function ReassignModal({ onClose, onSave }: { onClose: () => void; onSave: (assign: Assign) => void }) {
  const [assign, setAssign] = useState<Assign>({ agent: "Casey Archibald", partner: "Unassigned", listing: "Unassigned" });
  return (
    <ModalFrame title="Reassign Agents" onClose={onClose}>
      <Field label="Agent"><select className={inputCls} value={assign.agent} onChange={(event) => setAssign({ ...assign, agent: event.target.value })}>{TEAM.map((name) => <option key={name}>{name}</option>)}</select></Field>
      <Field label="Partner"><select className={inputCls} value={assign.partner} onChange={(event) => setAssign({ ...assign, partner: event.target.value })}>{TEAM.map((name) => <option key={name}>{name}</option>)}</select></Field>
      <Field label="Listing agent"><select className={inputCls} value={assign.listing} onChange={(event) => setAssign({ ...assign, listing: event.target.value })}>{LISTING_AGENTS.map((name) => <option key={name}>{name}</option>)}</select></Field>
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Cancel</Btn><Btn kind="teal" onClick={() => onSave(assign)}>Save</Btn></div>
    </ModalFrame>
  );
}

function ReminderModal({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const { update } = useCinc();
  const chrome = useChrome();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("Today");
  return (
    <ModalFrame title="Add a Reminder" onClose={onClose}>
      <Field label="Title"><input className={inputCls} value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
      <Field label="Due"><select className={inputCls} value={due} onChange={(event) => setDue(event.target.value)}><option>Today</option><option>Tomorrow</option><option>Next week</option></select></Field>
      <div className="flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind="teal" onClick={() => {
          if (!title.trim()) return;
          update((current) => ({ ...current, reminders: [...current.reminders, { id: uid("rem"), leadId, title, due, done: false, day: "DAY 1 (CALL)" }] }));
          chrome.toast("Reminder added.");
          onClose();
        }}>Save</Btn>
      </div>
    </ModalFrame>
  );
}

function ApptModal({ leadId, request, onClose }: { leadId: string; request?: boolean; onClose: () => void }) {
  const { update } = useCinc();
  const chrome = useChrome();
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  return (
    <ModalFrame title={request ? "Add Appointment Request" : "Add Appointment"} onClose={onClose}>
      <Field label="Title"><input className={inputCls} value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
      <Field label="When"><input className={inputCls} type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} /></Field>
      <div className="flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind="teal" onClick={() => {
          if (!title.trim()) return;
          update((current) => ({ ...current, appointments: [...current.appointments, { id: uid("appt"), leadId, title, when: when || "Unscheduled", request }] }));
          chrome.toast("Appointment saved.");
          onClose();
        }}>Save</Btn>
      </div>
    </ModalFrame>
  );
}
