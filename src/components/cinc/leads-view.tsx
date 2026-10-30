"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CRM_AGENT, CRM_AUTOTRACKS, CRM_LEADS } from "@/lib/cinc-crm";
import { ACTIVITY_FILTER_GROUPS, LABEL_GROUPS, OFFICE_ROSTER, REMINDER_TIMING, clockTimes } from "@/lib/cinc-options";
import { leadVisibleTo } from "@/lib/office-access";
import { useLeads, type Lead } from "@/lib/leads";
import { DialerPanel } from "./dialer-panel";
import { LeadSearches } from "./lead-searches";
import { useOfficeSession } from "./office-session";
import { useChrome } from "./chrome-context";
import { go, href, type LeadTab } from "./route";
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
  assignedUserId?: string | null;
  partnerUserId?: string | null;
};

function digits(phone: string) {
  return phone.replace(/\D/g, "").length >= 10;
}

function friendlyWhen(at: string) {
  if (!at.includes("T")) return at;
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return at;
  const hour = date.getHours();
  const h12 = hour % 12 || 12;
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} at ${h12}:${min} ${hour >= 12 ? "PM" : "AM"}`;
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
  buyer_signup: "Buyer Signup",
  seller_signup: "Seller Signup",
  home_valuation: "Home Valuation",
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
    type:
      lead.intent === "seller" ||
      lead.intent === "valuation" ||
      lead.source === "seller_signup" ||
      lead.source === "home_valuation"
        ? "Seller"
        : "Buyer",
    pipeline: SITE_PIPE[lead.status] ?? "New Lead",
    registered: ago(lead.createdAt),
    source: [
      SOURCE[lead.source] ?? "Website",
      lead.attribution?.utmSource,
      lead.attribution?.utmCampaign,
    ]
      .filter(Boolean)
      .join(" · "),
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
    assigned: {
      agent: lead.assignedTo || CRM_AGENT.name,
      partner: lead.partnerName || "Unassigned",
      listing: lead.listingAgent || "Unassigned",
    },
    assignedUserId: lead.assignedUserId,
    partnerUserId: lead.partnerUserId,
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
  const { leads, add, appendActivity, database } = useLeads();
  const office = useOfficeSession();
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
  const [lastTab, setLastTab] = useState<LeadTab>("activity");
  useEffect(() => {
    const saved = sessionStorage.getItem("gvhs-lead-tab");
    if (saved === "activity" || saved === "info" || saved === "plans" || saved === "appointments" || saved === "conversations" || saved === "plips") {
      setLastTab(saved);
    }
  }, []);
  useEffect(() => {
    if (!leadId) return;
    sessionStorage.setItem("gvhs-lead-tab", tab);
    setLastTab(tab);
  }, [leadId, tab]);
  const openTab = leadId ? tab : lastTab;

  const assignChoices = useMemo(() => {
    const people = office.roster;
    if (!people.length) return { agents: TEAM, partners: TEAM, listing: LISTING_AGENTS };
    const names = (roles: string[]) => ["Unassigned", ...people.filter((user) => roles.includes(user.role)).map((user) => user.name)];
    return {
      agents: [...names(["admin", "broker", "agent", "isa"]), "Routing Engine"],
      partners: names(["lender"]).length > 1 ? names(["lender"]) : ["Unassigned", ...people.map((user) => user.name)],
      listing: names(["admin", "broker", "agent"]),
    };
  }, [office.roster]);

  function saveAssign(id: string, assign: Assign) {
    if (!office.canReassign) {
      chrome.toast("Your role cannot reassign leads.");
      return;
    }
    update((current) => ({
      ...current,
      assigned: { ...current.assigned, [id]: assign },
    }));
    void fetch("/api/leads/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, agent: assign.agent, partner: assign.partner, listing: assign.listing }),
    }).catch(() => undefined);
  }

  const rows = useMemo(() => {
    const merged = [...leads.map(siteRow), ...crmRows()].map((row) => ({
      ...row,
      pipeline: state.pipeline[row.id] ?? row.pipeline,
      type: state.leadType[row.id] ?? row.type,
      assigned: state.assigned[row.id] ?? row.assigned,
    }));
    if (!office.ready || !office.user) return [];
    if (office.seesAll) return merged;
    return merged.filter((row) =>
      leadVisibleTo(office.user!, {
        assignedTo: row.assigned.agent,
        assignedUserId: state.assigned[row.id] ? null : row.assignedUserId,
        partnerName: row.assigned.partner,
        partnerUserId: state.assigned[row.id] ? null : row.partnerUserId,
      })
    );
  }, [leads, state.pipeline, state.leadType, state.assigned, office.ready, office.user, office.seesAll]);

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
    if (kind === "call" || kind === "text" || kind === "email") {
      update((current) => ({
        ...current,
        calls: [{ id: uid("call"), leadId: row.id, name: row.name, at: nowLabel(), kind, body: body || title }, ...current.calls],
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
          agents={assignChoices.agents}
          partners={assignChoices.partners}
          listing={assignChoices.listing}
          onClose={chrome.closeModal}
          onSave={(assign) => {
            selected.forEach((id) => saveAssign(id, assign));
            chrome.closeModal();
            chrome.toast(office.database?.connected ? "Agents reassigned." : "Agents reassigned on this device.");
          }}
        />,
      );
    } else if (action === "Trash Selected Leads") trash(selected);
    else if (action === "Untrash Selected Leads") untrash(selected.length ? selected : state.trashed);
  }

  const rowPad = view === "Compact" ? "[&>td]:py-1" : view === "Roomy" ? "[&>td]:py-4" : "[&>td]:py-3";

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
      <p
        role="status"
        className={
          database?.connected
            ? "bg-white px-3 py-1 text-[11px] text-[#6a8f74]"
            : "bg-[#fff6e5] px-3 py-1 text-[11px] text-[#8a5a00]"
        }
      >
        {database?.message ?? "Checking whether the database is connected…"}
      </p>
      {!office.ready ? <p className="bg-white px-3 py-2 text-[13px] text-[#666]">Checking your access…</p> : null}
      {mode === "export" ? (
        <p className="bg-[#e8f6fb] px-4 py-2 text-[12px] text-[#1c93b5]">A CSV of the current list downloaded. <a href={href.leads}>Return to leads</a></p>
      ) : null}
      <div className="flex flex-wrap items-center gap-1 border-b border-[#eee] bg-white px-2 py-1">
        <span className="inline-flex h-[22px] items-center rounded-[2px] border border-[#ccc] bg-white">
          <input
            className={checkCls}
            type="checkbox"
            checked={slice.length > 0 && slice.every((row) => selected.includes(row.id))}
            onChange={(event) => setSelected(event.target.checked ? slice.map((row) => row.id) : [])}
          />
          <Menu label={<span className="px-1 text-[9px]">▼</span>} items={[
            { label: "All on page", onClick: () => setSelected(slice.map((row) => row.id)) },
            { label: "None", onClick: () => setSelected([]) },
          ]} />
        </span>
        <Menu
          label={<span className="inline-flex h-[22px] items-center rounded-[2px] border border-[#ccc] bg-white px-2 text-[12px]">Mass Actions ▾</span>}
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
        {open && !expanded ? null : (
          <>
            <button type="button" className="h-[22px] rounded-[2px] border border-[#ccc] bg-white px-2 text-[12px] text-[#999] disabled:opacity-50" disabled={!dirty} onClick={clearFilters}>Clear All</button>
            <button type="button" title="Refresh" className="grid h-[22px] w-[22px] place-items-center bg-[#1c93b5] text-[12px] text-white" onClick={() => { setPage(0); chrome.toast("Lead list refreshed."); }}>↻</button>
            <Menu
              label={<span className="inline-flex h-[22px] w-[150px] items-center rounded-[2px] border border-[#ccc] bg-white px-2 text-[12px]">CINC Filter: {cincFilter} ▾</span>}
              footer="Clear"
              onFooter={() => { setCincFilter("None"); setPage(0); }}
              items={CINC_FILTERS.map((label) => ({ label, onClick: () => { setCincFilter(label); setPage(0); } }))}
            />
            <Menu
              label={<span className="inline-flex h-[22px] w-[170px] items-center rounded-[2px] border border-[#ccc] bg-white px-2 text-[12px]">Custom Filter: {customFilter} ▾</span>}
              footer="Clear"
              onFooter={() => { setCustomFilter("None"); setCustomQuery(""); setPage(0); }}
              items={[...CUSTOM_FILTERS, ...state.customFilters].filter((option) => option.toLowerCase().includes(customQuery.toLowerCase())).map((label) => ({
                label,
                onClick: () => setCustomFilter(label),
              }))}
            />
            <button type="button" title="Save filter" className="grid h-[22px] w-[22px] place-items-center rounded-[2px] border border-[#ccc] bg-white text-[#888]" onClick={() => {
              const name = window.prompt("Name this filter");
              if (!name) return;
              update((current) => ({ ...current, customFilters: [...current.customFilters, name] }));
              chrome.toast("Filter saved on this device.");
            }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2h8l3 3v9H3V2zm2 1v4h6V3H5zm1 7h4v3H6v-3z" /></svg>
            </button>
            <button type="button" title="Column config" className="grid h-[22px] w-[22px] place-items-center rounded-[2px] border border-[#ccc] bg-white" onClick={() => setDrawer(true)}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 4h12M2 8h12M2 12h12" /><circle cx="5" cy="4" r="1.2" fill="white" /><circle cx="10" cy="8" r="1.2" fill="white" /><circle cx="7" cy="12" r="1.2" fill="white" /></svg>
            </button>
            <button type="button" title={showTrash ? "Show active leads" : "Show trashed leads"} className="ml-auto h-[22px] rounded-[2px] border border-[#ccc] bg-white px-2 text-[12px] text-[#1c93b5]" onClick={() => { setShowTrash((value) => !value); setPage(0); }}>{showTrash ? "Active" : "Trash"}</button>
            <button type="button" title="Print" className="grid h-[22px] w-[22px] place-items-center rounded-[2px] border border-[#ccc] bg-white" onClick={() => window.print()}>⎙</button>
            <Menu
              header="View Style"
              label={<span className="inline-flex h-[22px] items-center rounded-[2px] border border-[#ccc] bg-white px-2 text-[12px]">VIEW: {view} ▾</span>}
              items={["Roomy", "Default", "Compact"].map((label) => ({ label, onClick: () => setView(label as typeof view) }))}
            />
            <Menu
              header="Page Size"
              label={<span className="inline-flex h-[22px] items-center rounded-[2px] border border-[#ccc] bg-white px-2 text-[12px]">{pageSize} ☰ ▾</span>}
              items={[5, 10, 25, 50, 100].map((size) => ({ label: String(size), onClick: () => { setPageSize(size); setPage(0); } }))}
            />
            <span className="text-[12px] font-bold">
              {filtered.length ? `${safePage * pageSize + 1} - ${Math.min(filtered.length, (safePage + 1) * pageSize)} of ${filtered.length}` : "0 of 0"}
            </span>
            <button type="button" className="px-1 disabled:opacity-30" disabled={safePage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>‹</button>
            <button type="button" className="px-1 text-[#1c93b5] disabled:opacity-30" disabled={safePage >= pages - 1} onClick={() => setPage((value) => value + 1)}>›</button>
          </>
        )}
      </div>
      {open && !expanded ? null : (
      <div className="flex items-center justify-end bg-white px-3 py-1">
        <button type="button" className="inline-flex h-[22px] items-center gap-1 bg-[#1c93b5] px-2 text-[12px] text-white" onClick={() => chrome.openModal(<AddLeadModal onClose={chrome.closeModal} onSave={(input) => {
          add({ ...input, source: "general" });
          chrome.closeModal();
          chrome.toast("Lead added.");
        }} />)}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><circle cx="6" cy="5" r="2" /><path d="M2 13c.5-2 2-3 4-3s3.5 1 4 3" /><path d="M12 4v4M10 6h4" stroke="white" strokeWidth="1.2" /></svg>
          Add New Lead
        </button>
      </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className={`min-w-0 overflow-auto ${open && !expanded ? "w-[140px] shrink-0 border-r border-[#e5e5e5]" : "flex-1"}`}>
          {open && !expanded ? (
            <ul className="bg-white">
              {slice.map((row) => (
                <li key={row.id} className={`border-b border-[#f0f0f0] ${row.id === leadId ? "bg-[#d5eaf2]" : ""}`}>
                  <a href={href.lead(row.id, openTab)} className="block truncate px-2 py-2 text-[13px] font-bold text-[#1c93b5]">{row.name}</a>
                </li>
              ))}
            </ul>
          ) : (
            <table className="w-full min-w-[1100px] border-collapse bg-white text-left">
              <thead className="sticky top-0 z-10 bg-white text-[12px] font-bold tracking-wide text-black uppercase">
                <tr>
                  {["", "Name/Info", "", "Pipeline", "Registered", "Price/City", "Timeframe", "Last Login", "Last Touch", "Next Reminder", "Activity", "Assigned To"].map((col, index) => (
                    <th key={`${col}-${index}`} className="border-b border-[#eee] px-2 py-2">
                      {col}
                      {col ? <span className="ml-1 inline-block align-middle text-[#888]">▾</span> : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.map((row, index) => (
                  <tr key={row.id} className={`group min-h-[72px] border-b border-[#f0f0f0] align-top hover:bg-[#d5eaf2] ${index % 2 ? "bg-[#f7f7f7]" : "bg-white"} ${rowPad}`}>
                    <td className="px-2">
                      <input className={checkCls} type="checkbox" checked={selected.includes(row.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id))} />
                    </td>
                    <td className="px-2">
                      <div className="flex items-center gap-1">
                        <a href={href.lead(row.id, openTab)} className="text-[13px] font-bold text-[#1c93b5]">{row.name}</a>
                        <span title={row.verified ? "Verified" : "Locked"} className={row.verified ? "text-[#2f6fed]" : "text-[#888]"}>{row.verified ? "✓" : "🔒"}</span>
                      </div>
                      <div className="text-[12px]">
                        {row.phone} <span className={row.phoneValid ? "text-[#2e9e5b]" : "text-[#e39b2b]"}>{row.phoneValid ? "✓" : "!"}</span>
                        <Menu
                          label={<span className="ml-1 text-[10px] text-[#888]">▾</span>}
                          items={[
                            { label: "Call", onClick: () => { log(row, "call", "Call logged"); chrome.toast(`Call to ${row.phone} logged.`); } },
                            { label: "Text", onClick: () => composer.text(row.phone, (value) => { log(row, "text", "Text sent", value.body); chrome.toast("Text sent."); }) },
                            { label: "Copy number", onClick: () => { navigator.clipboard?.writeText(row.phone); chrome.toast("Phone copied."); } },
                          ]}
                        />
                      </div>
                      <button type="button" className="text-[12px] text-[#1c93b5]" onClick={() => composer.email(row.email, (sent, value) => { log(row, "email", sent ? "Email sent" : "Draft", value.body); chrome.toast(sent ? "Email sent." : "Draft saved."); })}>
                        {row.email} <span className="text-[#2e9e5b]">✓</span>
                      </button>
                      <p className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="rounded-full bg-[#4a4a4a] px-1.5 text-[12px] text-white">★ {row.score > 10 ? Math.round(row.score) : Math.round(row.score * 10)}</span>
                        <span className={`rounded px-1 text-[12px] ${row.type === "Seller" ? "bg-[#e5f6ea] text-[#2e9e5b]" : "bg-[#eee] text-[#666]"}`}>{row.type}</span>
                      </p>
                    </td>
                    <td className="px-1">
                      <div className="flex flex-col items-center gap-1">
                        {(state.labels[row.id] ?? []).map((label) => (
                          <span key={label} className="grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] text-white" style={{ background: LABEL_COLORS[label] ?? "#888" }}>{label}</span>
                        ))}
                        <button type="button" className="text-[11px] text-[#1c93b5]" onClick={() => {
                          const label = window.prompt("Label letter");
                          if (!label) return;
                          const letter = label.slice(0, 1).toUpperCase();
                          update((current) => ({ ...current, labels: { ...current.labels, [row.id]: [...new Set([...(current.labels[row.id] ?? []), letter])] } }));
                        }}>+</button>
                      </div>
                    </td>
                    <td className="px-2">
                      <Menu
                        label={<span title={row.pipeline} className={`inline-flex max-w-[128px] truncate rounded border px-1.5 py-0.5 text-[12px] font-semibold normal-case ${pipeColor(row.pipeline)}`}>{row.pipeline === "Contacted" ? "✔ " : ""}{row.pipeline}</span>}
                        items={PIPELINES.map((stage) => ({ label: stage, onClick: () => setPipeline(row.id, stage) }))}
                      />
                      <div className="mt-1">
                        <Menu
                          label={<span className="text-[11px] text-[#1c93b5]">Quick Actions ▾</span>}
                          items={[
                            { label: "+ Add Note", onClick: () => chrome.openModal(<NoteModal onClose={chrome.closeModal} onSave={(body) => { log(row, "note", "Note added", body); chrome.closeModal(); }} />) },
                            { label: "+ New Reminder", onClick: () => chrome.openModal(<ReminderModal leadId={row.id} onClose={chrome.closeModal} />) },
                            { label: "→ Send Text", onClick: () => composer.text(row.phone, (value) => log(row, "text", "Text sent", value.body)) },
                            { label: "→ Send Email", onClick: () => composer.email(row.email, (sent, value) => log(row, "email", sent ? "Email sent" : "Draft", value.body)) },
                            { label: "Trash this Lead", danger: true, onClick: () => trash([row.id]) },
                            { label: "Merge lead", onClick: () => chrome.openModal(
                              <ChoiceModal
                                title={`Merge into ${row.name}`}
                                options={CRM_LEADS.filter((lead) => lead.id !== row.id).slice(0, 12).map((lead) => lead.name)}
                                onClose={chrome.closeModal}
                                onSave={(name) => {
                                  log(row, "note", "Leads merged", `Merged ${name} into ${row.name}. The other record stays in the sample list.`);
                                  chrome.closeModal();
                                  chrome.toast(`Merged ${name} into ${row.name}.`);
                                }}
                              />,
                            ) },
                          ]}
                        />
                      </div>
                    </td>
                    <td className="px-2 text-[12px]">{row.registered}<br />{row.source}</td>
                    <td className="px-2 text-[12px]">{row.price}<br />{row.city}<br /><span className="text-[11px] text-[#999]">⌂ PRE</span></td>
                    <td className="px-2 text-[12px]">{row.timeframe}</td>
                    <td className="px-2 text-[12px]">{row.lastLogin}<br />{row.logins} Total</td>
                    <td className="px-2 text-[12px] leading-5">
                      <span title="Call">☎ {row.lastTouch === "—" ? "-" : row.lastTouch}</span><br />
                      <span title="Email">✉ {row.email ? `${(row.logins % 8) + 1}d` : "-"}</span><br />
                      <span title="Text">✎ {row.phoneValid ? `${(row.views % 6) + 1}h` : "-"}</span>
                    </td>
                    <td className={`px-2 text-[12px] ${row.overdue ? "text-[#d9363e]" : ""}`}>{row.nextReminder}</td>
                    <td className="px-2 text-[12px] leading-5">
                      <span className="text-[#2e9e5b]">👁 {row.views}</span><br />
                      <span className="text-[#e39b2b]">🔖 {row.saved}</span><br />
                      <span className="text-[#d9363e]">♥ {row.fav}</span><br />
                      <span className="text-[#1c93b5]">? {row.inq}</span>
                    </td>
                    <td className="px-2 text-[12px] leading-5 normal-case">
                      {(["agent", "partner", "listing"] as const).map((slot) => (
                        <Menu
                          key={slot}
                          label={<span className="block text-[#1c93b5]">{row.assigned[slot]} ▾</span>}
                          items={(slot === "listing" ? assignChoices.listing : slot === "partner" ? assignChoices.partners : assignChoices.agents).map((name) => ({
                            label: name,
                            onClick: () => saveAssign(row.id, { ...row.assigned, [slot]: name }),
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
            assignChoices={assignChoices}
            onAssign={saveAssign}
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
  assignChoices,
  onAssign,
}: {
  row: Row;
  tab: LeadTab;
  rows: Row[];
  expanded: boolean;
  onExpand: () => void;
  onLog: (row: Row, kind: "call" | "text" | "email" | "note", title: string, body?: string) => void;
  onPipeline: (id: string, stage: string) => void;
  assignChoices: { agents: string[]; partners: string[]; listing: string[] };
  onAssign: (id: string, assign: Assign) => void;
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

  const calls = state.calls.filter((call) => call.leadId === row.id && call.kind === "call").length;
  const texts = state.calls.filter((call) => call.leadId === row.id && call.kind === "text").length;
  const emails = state.calls.filter((call) => call.leadId === row.id && call.kind === "email").length;
  const verify = state.verify[row.id] ?? (row.verified ? "verified" : "locked");
  const [activityChecks, setActivityChecks] = useState<string[]>(["Assigned Agent", "Notes"]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openSteps, setOpenSteps] = useState(false);
  const rail = [
    ["Call", "☎", () => chrome.openModal(
      <DialerPanel title={`Call ${row.name}`} name={row.name} phone={row.phone} onClose={chrome.closeModal} onLog={(outcome, notes) => { onLog(row, "call", `Call: ${outcome}`, notes || outcome); chrome.closeModal(); chrome.toast(`${outcome} logged for ${row.phone}.`); }} />,
    )],
    ["Dialer", "▦", () => chrome.openModal(
      <DialerPanel title="Dialer" name={row.name} phone={row.phone} onClose={chrome.closeModal} onLog={(outcome, notes) => { onLog(row, "call", `Dialer: ${outcome}`, notes || outcome); chrome.closeModal(); chrome.toast(`${outcome} logged.`); }} />,
    )],
    ["Text", "💬", () => go(href.lead(row.id, "conversations"))],
    ["Email", "✉", () => composer.email(row.email, (sent, value) => { onLog(row, "email", sent ? "Email sent" : "Draft", value.body); chrome.toast(sent ? "Email sent." : "Draft saved."); })],
    ["Etta", "✦", () => chrome.openModal(
      <ModalFrame title="Etta" onClose={chrome.closeModal}>
        <p className="text-[13px]">Suggested for {row.name}: follow up on {row.city} and ask about {row.timeframe}.</p>
        <div className="mt-3 flex justify-end gap-2">
          <Btn onClick={() => { onLog(row, "note", "Etta note", `Etta suggested a follow-up for ${row.name}.`); chrome.closeModal(); chrome.toast("Etta note saved."); }}>Save note</Btn>
          <Btn kind="teal" onClick={() => { onLog(row, "text", "Etta text", `Hi ${row.name.split(" ")[0]}, just checking in on your search.`); chrome.closeModal(); go(href.lead(row.id, "conversations")); chrome.toast("Etta text added to the thread."); }}>Send text</Btn>
        </div>
      </ModalFrame>,
    )],
  ] as const;
  return (
    <div className="relative flex min-w-0 flex-1 bg-[#f5f5f5]">
      {!expanded ? (
        <div className="absolute top-14 left-0 z-20 flex w-16 -translate-x-1/2 flex-col items-center gap-2">
          {rail.map(([label, icon, action]) => (
            <button key={label} type="button" className="grid place-items-center text-[#1c93b5]" onClick={action}>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#1c93b5] text-[16px] text-white">{icon}</span>
              <span className="text-[11px] leading-tight">{label}</span>
            </button>
          ))}
          <Menu
            label={<span className="grid place-items-center text-[#1c93b5]"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#1c93b5] text-[18px] text-white">⋯</span><span className="text-[11px]">More</span></span>}
            items={[
              { label: "Add Reminder", onClick: () => chrome.openModal(<ReminderModal leadId={row.id} onClose={chrome.closeModal} />) },
              { label: "Add Appointment", onClick: () => chrome.openModal(<ApptModal leadId={row.id} onClose={chrome.closeModal} />) },
              { label: "Add AutoTrack", onClick: () => chrome.openModal(
                <ChoiceModal
                  title="Add AutoTrack"
                  options={CRM_AUTOTRACKS.map((track) => track.name)}
                  onClose={chrome.closeModal}
                  onSave={(name) => {
                    update((current) => ({
                      ...current,
                      leadTracks: { ...current.leadTracks, [row.id]: [...(current.leadTracks[row.id] ?? []), { id: uid("lt"), name }] },
                    }));
                    chrome.closeModal();
                    go(href.lead(row.id, "plips"));
                    chrome.toast(`${name} added to ${row.name}.`);
                  }}
                />,
              ) },
              { label: "Refer Lead to PROLINC", disabled: true, onClick: () => chrome.toast("PROLINC referral is not enabled on this demo account.") },
              { label: "SkySlope Forms", onClick: () => chrome.openModal(<ModalFrame title="SkySlope Forms" onClose={chrome.closeModal}><p className="text-[13px]">A SkySlope packet would open for {row.name}. This demo stored the request locally.</p><div className="mt-3 text-right"><Btn onClick={chrome.closeModal}>Close</Btn></div></ModalFrame>) },
            ]}
          />
        </div>
      ) : null}
      {!expanded ? (
        <aside className="w-[215px] shrink-0 overflow-auto border-r border-[#eee] bg-white pl-4">
          <div className="flex items-center justify-between border-b border-[#eee] px-2 py-2 text-[18px] text-[#888]">
            <button type="button" aria-label="Close" className="px-1 text-[#666]" onClick={() => go(href.leadsReturn)}>✕</button>
            <button type="button" onClick={onExpand} aria-label="Expand" className="px-1 text-[16px]">⤢</button>
            <button type="button" aria-label="Previous lead" className={prev ? "px-1 text-[20px] text-[#1c93b5]" : "px-1 text-[20px] opacity-30"} disabled={!prev} onClick={() => prev && go(href.lead(prev.id, tab))}>‹</button>
            <button type="button" aria-label="Next lead" className={next ? "px-1 text-[20px] text-[#1c93b5]" : "px-1 text-[20px] opacity-30"} disabled={!next} onClick={() => next && go(href.lead(next.id, tab))}>›</button>
          </div>
          <div className="px-3 py-3 text-center">
            <span className="mx-auto grid h-7 w-7 place-items-center rounded-full border border-[#2f6fed] text-[11px] font-bold">{row.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>
            <p className="mt-1 flex items-center justify-center gap-1 text-[13px] font-bold">
              {row.name}
              <span className="text-[#2f6fed]">{verify === "locked" ? "🔒" : "✓"}</span>
              <Menu
                label={<span className="text-[12px] text-[#888]">▾</span>}
                items={[
                  { label: "Verified & unlocked", onClick: () => update((current) => ({ ...current, verify: { ...current.verify, [row.id]: "verified" } })) },
                  { label: "Unverified & unlocked", onClick: () => update((current) => ({ ...current, verify: { ...current.verify, [row.id]: "unlocked" } })) },
                  { label: "Unverified & locked", onClick: () => update((current) => ({ ...current, verify: { ...current.verify, [row.id]: "locked" } })) },
                ]}
              />
            </p>
            <p className="text-[12px]">
              {row.phone} <span className="text-[#2e9e5b]">✓</span>
              <Menu
                label={<span className="ml-1 text-[12px] text-[#888]">▾</span>}
                items={[
                  { label: "Call", onClick: () => { onLog(row, "call", "Call logged", "Connected"); chrome.toast(`Call to ${row.phone} logged.`); } },
                  { label: "Text", onClick: () => go(href.lead(row.id, "conversations")) },
                  { label: "Copy number", onClick: () => { navigator.clipboard?.writeText(row.phone); chrome.toast("Phone copied."); } },
                ]}
              />
            </p>
            <p className="text-[12px]">{row.email} <span className="text-[#2e9e5b]">✓</span></p>
            <div className="mt-2 space-y-1 text-left text-[11px]">
              {["Buyer", "Seller", "Partial", "Recruit"].map((type) => (
                <label key={type} className="flex items-center gap-1">
                  <input type="radio" name={`type-${row.id}`} checked={row.type === type} onChange={() => update((current) => ({ ...current, leadType: { ...current.leadType, [row.id]: type } }))} />
                  {type}
                </label>
              ))}
            </div>
            <LeadSearches leadId={row.id} leadEmail={row.email} />
            <p className="mt-2 flex justify-center gap-2 text-[11px] text-[#666]"><span>👁 {row.views}</span><span>🔖 {row.saved}</span><span>♥ {row.fav}</span><span>? {row.inq}</span><span>📎 0</span></p>
            <div className="mt-2">
              <Menu
                className="w-full"
                label={<span className="flex w-full items-center justify-between bg-[#2e9e5b] px-2 py-1.5 text-[13px] text-white">{row.pipeline} (10/20/26) ▾</span>}
                items={PIPELINES.map((stage) => ({ label: stage, onClick: () => onPipeline(row.id, stage) }))}
              />
            </div>
            <button type="button" className="mt-2 rounded border border-dashed border-[#bbb] px-2 py-0.5 text-[11px]" onClick={() => chrome.openModal(
              <ApplyLabels
                selected={state.labels[row.id] ?? []}
                onClose={chrome.closeModal}
                onApply={(labels) => { update((current) => ({ ...current, labels: { ...current.labels, [row.id]: labels } })); chrome.closeModal(); chrome.toast("Labels applied."); }}
              />
            )}>+ Label</button>
            <div className="mt-1 flex flex-wrap gap-1">
              {(state.labels[row.id] ?? []).map((label) => <span key={label} className="bg-[#1c93b5] px-1 text-[10px] text-white">{label}</span>)}
            </div>
            <div className="mt-3 flex items-center justify-between text-left text-[12px] font-semibold">
              <span>Active Deals</span>
              <button type="button" className="font-normal text-[#1c93b5]" onClick={() => chrome.openModal(<LeadDealModal client={row.name} onClose={chrome.closeModal} />)}>+ Add Deal</button>
            </div>
            {deals.length ? deals.map((deal) => <p key={deal.id} className="text-left text-[12px]">{deal.address}</p>) : <p className="text-left text-[11px] text-[#888]">Track the revenue opportunities associated with this lead.</p>}
            <div className="mt-3 bg-[#a7d3df] px-2 py-1 text-left text-[12px] font-bold">Communication</div>
            <div className="grid grid-cols-3 gap-1 bg-[#e7f4f8] p-2 text-[10px]">
              {[["Last Touch", row.lastTouch], ["Last Login", row.lastLogin], ["Calls", String(calls)], ["Texts", String(texts)], ["Alerts", String(state.alertFreq[row.id] ? 1 : 0)], ["Emails", String(emails)]].map(([label, value]) => (
                <div key={label}><p className="text-[#666]">{label}</p><p className="text-[16px] font-semibold text-[#243238]">{value}</p></div>
              ))}
            </div>
            <div className="mt-2 bg-[#a7d3df] px-2 py-1 text-left text-[12px] font-bold">Email Information</div>
            <div className="grid grid-cols-2 gap-1 bg-[#e7f4f8] p-2 text-left text-[10px]">
              <p>Email Clicks<br /><b>0</b></p><p>Email Opens<br /><b>0</b></p><p>Alert Opens<br /><b>0</b></p><p>Peak Email Usage<br /><b>—</b></p><p>Common Device<br /><b>Phone</b></p>
            </div>
            <p className="mt-3 flex items-center gap-1 text-left text-[11px] text-[#666]">🪪 Registered {row.registered} ago from {row.source}</p>
          </div>
        </aside>
      ) : null}
      <section className="min-w-0 flex-1 overflow-auto p-3">
        {expanded ? (
          <div className="mb-2 flex items-center gap-4 border border-[#eee] bg-white px-2 py-1 text-[18px] text-[#888]">
            <button type="button" aria-label="Close" className="px-1 text-[#666]" onClick={() => go(href.leadsReturn)}>✕</button>
            <button type="button" onClick={onExpand} aria-label="Collapse" className="px-1 text-[16px]">⤡</button>
            <button type="button" aria-label="Previous lead" className={prev ? "px-1 text-[20px] text-[#1c93b5]" : "px-1 text-[20px] opacity-30"} disabled={!prev} onClick={() => prev && go(href.lead(prev.id, tab))}>‹</button>
            <button type="button" aria-label="Next lead" className={next ? "px-1 text-[20px] text-[#1c93b5]" : "px-1 text-[20px] opacity-30"} disabled={!next} onClick={() => next && go(href.lead(next.id, tab))}>›</button>
          </div>
        ) : null}
        <NoteComposer onSave={(body, pinned) => { onLog(row, "note", pinned ? "Pinned note" : "Note added", body); chrome.toast(pinned ? "Note pinned." : "Note added."); }} />
        <div className="mb-3 grid grid-cols-6 border border-[#e5e5e5] bg-[#fafafa]">
          {tabs.map((item) => (
            <a key={item.id} href={href.lead(row.id, item.id)} className={`border-t-2 bg-white py-2 text-center text-[11px] ${tab === item.id ? "border-[#1c93b5] text-[#1c93b5]" : "border-transparent text-[#666]"}`}>
              {item.label}
            </a>
          ))}
        </div>
        {tab === "activity" ? (
          <div>
            <div className="relative mb-2 flex items-center gap-3">
              <button type="button" className="text-[12px] font-bold" onClick={() => setFiltersOpen((value) => !value)}>Filters</button>
              {filtersOpen ? (
                <div className="absolute top-full left-0 z-20 mt-1 max-h-[560px] w-72 overflow-auto border border-[#ddd] bg-white p-2 text-[12px] shadow">
                  <div className="mb-1 flex justify-between">
                    <button type="button" onClick={() => setActivityChecks(ACTIVITY_FILTER_GROUPS.flatMap((group) => group.items))}>Select All</button>
                    <button type="button" onClick={() => setActivityChecks(["Assigned Agent", "Notes"])}>Reset</button>
                    <button type="button" onClick={() => setFiltersOpen(false)}>X</button>
                  </div>
                  {ACTIVITY_FILTER_GROUPS.map((group) => (
                    <div key={group.name} className="mb-2">
                      <p className="font-bold">{group.name}</p>
                      {group.items.map((item) => (
                        <label key={item} className="block"><input type="checkbox" checked={activityChecks.includes(item)} onChange={() => setActivityChecks((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])} /> {item}</label>
                      ))}
                    </div>
                  ))}
                </div>
              ) : null}
              <button type="button" className="text-[12px] font-bold" onClick={() => {
                const next = !state.signInAlert[row.id];
                update((current) => ({ ...current, signInAlert: { ...current.signInAlert, [row.id]: next } }));
                chrome.toast(next ? "Subscribed to sign-in alerts." : "Sign-in alerts turned off.");
              }}>{state.signInAlert[row.id] ? "Subscriptions: On" : "Subscriptions"}</button>
              <span className="ml-auto text-[12px] text-[#888]">Pinned · {activityChecks.join(", ")}</span>
            </div>
            {activityChecks.includes("Notes") && notes[0] ? (
              <article className="mb-3 border border-[#e5e5e5] bg-white p-3 shadow-sm">
                <p className="text-[13px] font-bold">📝 Note Added</p>
                <p className="text-[11px] text-[#888]">edited {friendlyWhen(notes[0].at)} by {CRM_AGENT.name}</p>
                <p className="mt-2 bg-[#f3f3f3] p-2 text-[13px]">{notes[0].body}</p>
                <div className="mt-2 text-right"><button type="button" className="text-[12px] text-[#1c93b5]" onClick={() => chrome.openModal(<NoteModal initial={notes[0].body} onClose={chrome.closeModal} onSave={(body) => { update((current) => ({ ...current, notes: { ...current.notes, [row.id]: current.notes[row.id].map((note) => note.id === notes[0].id ? { ...note, body } : note) } })); chrome.closeModal(); chrome.toast("Note updated."); }} />)}>Edit Note</button></div>
              </article>
            ) : null}
            <p className="my-2 border-t border-dotted border-[#ccc] pt-2 text-[11px] font-semibold text-[#888]">Most Recent</p>
            <div className="ml-2 border-l border-[#ddd] pl-4">
            {activityChecks.includes("Notes") ? notes.slice(1).map((note) => (
              <article key={note.id} className="relative mb-2 border border-[#e5e5e5] bg-white p-3 shadow-sm">
                <span className="absolute top-3 -left-[22px] h-2 w-2 rounded-full bg-[#1c93b5]" />
                <p className="text-[13px] font-bold">👤 Note Added</p>
                <p className="text-[11px] text-[#888]">{friendlyWhen(note.at)} by {CRM_AGENT.name}</p>
                <p className="mt-1 text-[13px]">{note.body}</p>
              </article>
            )) : null}
            {state.calls.filter((call) => {
              if (call.leadId !== row.id) return false;
              if (call.kind === "email") return activityChecks.includes("Emails");
              if (call.kind === "text") return activityChecks.includes("Text Conversations");
              return activityChecks.includes("Calls");
            }).map((call) => (
              <article key={call.id} className="relative mb-2 border border-[#e5e5e5] bg-white p-3 shadow-sm">
                <span className="absolute top-3 -left-[22px] h-2 w-2 rounded-full bg-[#2e9e5b]" />
                <p className="text-[13px] font-bold">{call.kind === "email" ? "✉" : call.kind === "text" ? "💬" : "☎"} {call.body || call.kind}</p>
                <p className="text-[11px] text-[#999]">{call.at} by {CRM_AGENT.name}</p>
              </article>
            ))}
            {activityChecks.some((item) => ["Assigned Agent", "Pipeline", "Label", "Appointments", "Reminders", "Lead Info Updates"].includes(item)) ? (crm?.activity ?? site?.activity ?? []).map((item) => (
              <article key={item.id} className="relative mb-2 border border-[#e5e5e5] bg-white p-3 shadow-sm">
                <span className="absolute top-3 -left-[22px] h-2 w-2 rounded-full bg-[#bbb]" />
                <p className="text-[13px] font-bold">👤 {item.title}</p>
                {"body" in item && item.body ? <p className="text-[12px]">{item.body}</p> : null}
                <p className="text-[11px] text-[#999]">{friendlyWhen(item.at)}{"actor" in item && item.actor ? ` by ${item.actor}` : ""}</p>
              </article>
            )) : null}
            </div>
            <p className="py-4 text-center text-[12px] text-[#999]">That&apos;s Everything!</p>
          </div>
        ) : null}
        {tab === "info" ? <InfoTab row={row} assignChoices={assignChoices} onAssign={onAssign} onTrash={() => { update((current) => ({ ...current, trashed: [...new Set([...current.trashed, row.id])] })); go(href.leadsReturn); chrome.toast("Lead moved to trash."); }} /> : null}
        {tab === "plans" ? (
          <div>
            <div className="mb-2 flex items-center justify-between border-b border-[#ddd] pb-1">
              <h3 className="font-bold">Reminders</h3>
              <button type="button" className="text-[#1c93b5]" onClick={() => chrome.openModal(<ReminderModal leadId={row.id} onClose={chrome.closeModal} />)}>⊕ Add a Reminder</button>
            </div>
            {reminders.filter((item) => item.day !== "PLAN").length ? reminders.filter((item) => item.day !== "PLAN").map((item) => (
              <article key={item.id} className="mb-2 flex border border-[#eee] border-l-4 border-l-[#e39b2b] bg-white p-3 shadow-sm">
                <div className="flex-1">
                  <p className="text-[11px] font-bold tracking-wide text-[#e39b2b] uppercase">{item.day}</p>
                  <p className="text-[11px] text-[#888]">Assigned to {CRM_AGENT.name}</p>
                  <p className="text-[11px] text-[#888]">Created {item.due}</p>
                  <p className="text-[13px]">{item.title}</p>
                  <label className="mt-1 flex items-center gap-2 text-[12px]">
                    <input type="checkbox" checked={item.done} onChange={() => update((current) => ({ ...current, reminders: current.reminders.map((reminder) => reminder.id === item.id ? { ...reminder, done: !reminder.done } : reminder) }))} />
                    Mark as Completed
                  </label>
                </div>
                <div className="flex flex-col gap-2">
                  <button type="button" className="border border-[#d9363e] px-2 py-1 text-[11px] text-[#d9363e]" onClick={() => update((current) => ({ ...current, reminders: current.reminders.filter((reminder) => reminder.id !== item.id) }))}>DELETE</button>
                  <button type="button" className="bg-[#1c93b5] px-2 py-1 text-[11px] text-white" onClick={() => chrome.openModal(<ReminderModal leadId={row.id} reminderId={item.id} initialTitle={item.title} initialDue={item.due} onClose={chrome.closeModal} />)}>EDIT</button>
                </div>
              </article>
            )) : <p className="text-[13px]">No reminders.</p>}
            <div className="mt-4 mb-2 flex items-center justify-between border-b border-[#ddd] pb-1">
              <h3 className="font-bold">Plans</h3>
              <button type="button" className="text-[#1c93b5]" onClick={() => {
                update((current) => ({ ...current, reminders: [...current.reminders, { id: uid("plan"), leadId: row.id, title: "New Buyer Welcome", due: "Today", done: false, day: "PLAN" }] }));
                chrome.toast("Plan started for this lead.");
              }}>⊕ Start Plan</button>
            </div>
            {reminders.filter((item) => item.day === "PLAN").length ? reminders.filter((item) => item.day === "PLAN").map((item) => <p key={item.id} className="bg-white p-2 text-[13px]">{item.title}</p>) : <p className="text-[13px]">No plans assigned.</p>}
          </div>
        ) : null}
        {tab === "appointments" ? (
          <div>
            <div className="mb-2 flex justify-between border-b border-[#ddd] pb-1"><h3 className="font-bold">Appointments</h3><button type="button" className="text-[#1c93b5]" onClick={() => chrome.openModal(<ApptModal leadId={row.id} onClose={chrome.closeModal} />)}>⊕ Add Appointment</button></div>
            {appts.filter((item) => !item.request).length ? appts.filter((item) => !item.request).map((item) => <p key={item.id} className="mb-1 bg-white p-2">{item.title} · {item.when}</p>) : <p className="text-[13px]">No Appointments.</p>}
            <div className="mt-4 mb-2 flex justify-between border-b border-[#ddd] pb-1"><h3 className="font-bold">Appointment Requests</h3><button type="button" className="text-[#1c93b5]" onClick={() => chrome.openModal(<ApptModal leadId={row.id} request onClose={chrome.closeModal} />)}>⊕ Add Appointment Request</button></div>
            {appts.filter((item) => item.request).map((item) => <p key={item.id} className="mb-1 bg-white p-2">{item.title}</p>)}
          </div>
        ) : null}
        {tab === "conversations" ? <Conversation row={row} onLog={onLog} /> : null}
        {tab === "plips" ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-[#1c93b5] px-2 py-0.5 text-[12px] text-white">AutoTracks</span>
              <button type="button" className="grid h-7 w-7 place-items-center rounded-full bg-[#1c93b5] text-white" onClick={() => chrome.openModal(
                <ChoiceModal
                  title="Add AutoTrack"
                  options={CRM_AUTOTRACKS.map((track) => track.name)}
                  onClose={chrome.closeModal}
                  onSave={(name) => {
                    update((current) => ({ ...current, leadTracks: { ...current.leadTracks, [row.id]: [...(current.leadTracks[row.id] ?? [{ id: "sample-follow", name: "Follow Up Reminders", cancelled: true }]), { id: uid("lt"), name }] } }));
                    chrome.closeModal();
                    chrome.toast(`${name} added.`);
                  }}
                />,
              )}>+</button>
            </div>
            {(state.leadTracks[row.id] ?? [{ id: "sample-follow", name: "Follow Up Reminders", cancelled: true }]).map((track) => (
              <article key={track.id} className="relative mb-3 border border-[#e5e5e5] bg-white p-3 pl-8 shadow-sm">
                <button type="button" className="absolute top-6 -left-3 grid h-6 w-6 place-items-center rounded-full bg-[#bbb] text-white" onClick={() => update((current) => ({ ...current, leadTracks: { ...current.leadTracks, [row.id]: (current.leadTracks[row.id] ?? [{ id: "sample-follow", name: "Follow Up Reminders", cancelled: true }]).filter((item) => item.id !== track.id) } }))}>✕</button>
                {track.cancelled ? <span className="absolute top-0 right-3 bg-[#666] px-2 py-1 text-[10px] text-white">CANCELLED</span> : null}
                <p className="font-bold">{track.name}</p>
                <p className="text-[12px] text-[#888]">General | Started on Oct 18, 2026 at 2:10 PM</p>
                <div className="my-2 h-1.5 bg-[#eee]"><div className="h-full w-1/3 bg-[#1c93b5]" /></div>
                <p className="text-[12px]">2 of 6 steps completed</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="bg-[#e7f5f8] p-2"><p className="text-[12px] font-bold">Triggered by New Lead</p><p className="text-[11px] text-[#888]">Start Trigger(s)</p></div>
                  <div className="bg-[#e7f5f8] p-2"><p className="text-[12px] font-bold">Triggered by Pipeline Complete - Contacted</p><p className="text-[11px] text-[#888]">Stop Trigger(s)</p></div>
                </div>
                {openSteps ? <ol className="mt-2 list-decimal pl-5 text-[12px] text-[#444]"><li>Day 1 call</li><li>Day 2 email</li><li>Day 4 text</li><li>Day 7 call</li><li>Day 10 email</li><li>Day 14 close</li></ol> : null}
                <div className="mt-2 text-right"><button type="button" className="text-[12px] text-[#1c93b5]" onClick={() => setOpenSteps((value) => !value)}>{openSteps ? "View Less" : "View More"}</button></div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function InfoTab({
  row,
  assignChoices,
  onAssign,
  onTrash,
}: {
  row: Row;
  assignChoices: { agents: string[]; partners: string[]; listing: string[] };
  onAssign: (id: string, assign: Assign) => void;
  onTrash: () => void;
}) {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const [edit, setEdit] = useState(false);
  const saved = state.info[row.id] ?? {};
  const [form, setForm] = useState({
    first: saved.first || row.name.split(" ")[0] || "",
    last: saved.last || row.name.split(" ").slice(1).join(" "),
    email: saved.email || row.email,
    email2: saved.email2 || "",
    cell: saved.cell || row.phone,
    home: saved.home || "",
    work: saved.work || "",
    address: saved.address || "",
    city: saved.city || row.city,
    state: saved.state || "BC",
    zip: saved.zip || "",
    timezone: saved.timezone || "America/Vancouver",
    recruit: saved.recruit || (row.type === "Recruit" ? "Yes" : "No"),
    sold: saved.sold || "",
    timeframe: saved.timeframe || row.timeframe,
  });
  const fields: [string, keyof typeof form][] = [
    ["First Name", "first"], ["Last Name", "last"], ["Email", "email"], ["Secondary Contact Email", "email2"],
    ["Cell Phone", "cell"], ["Home Phone", "home"], ["Work Phone", "work"], ["Address", "address"],
    ["City", "city"], ["State", "state"], ["Zip", "zip"], ["Timezone", "timezone"],
    ["Recruit Lead", "recruit"], ["Sold Price", "sold"],
  ];
  return (
    <div className="border border-[#e5e5e5] bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-[#1c93b5]">Details</h3>
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
          <p className="mb-2 border-b border-[#ddd] pb-1 text-[12px] font-semibold">Key Info</p>
          {fields.map(([label, key]) => (
            <div key={key} className="mb-2">
              <p className="text-[10px] font-bold tracking-wide text-[#888] uppercase">{label}</p>
              {edit ? <input className={inputCls} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /> : <p className="text-[13px]">{form[key] || "—"}</p>}
            </div>
          ))}
          <button type="button" className="mt-2 inline-flex items-center gap-1 bg-[#eee] px-2 py-1 text-[12px] text-[#555]" onClick={onTrash}>🗑 Trash</button>
          <p className="mt-3 border-b border-[#ddd] pb-1 text-[12px] font-semibold">Social Info</p>
          <p className="mt-1 text-[12px] text-[#888]">No social info found.</p>
        </div>
        <div className="text-[12px]">
          <p className="mb-2 border-b border-[#ddd] pb-1 font-semibold">Assignment</p>
          {(["agent", "partner", "listing"] as const).map((slot) => (
            <p key={slot}>
              <Menu
                label={<span className="text-[#1c93b5]">{slot === "agent" ? "Agent Assigned" : slot === "partner" ? "Partner Assigned" : "Listing Agent Assigned"} ▾</span>}
                items={(slot === "listing" ? assignChoices.listing : slot === "partner" ? assignChoices.partners : assignChoices.agents).map((name) => ({
                  label: name,
                  onClick: () => onAssign(row.id, { ...row.assigned, [slot]: name }),
                }))}
              />{" "}
              {row.assigned[slot]}
            </p>
          ))}
          <p className="mt-3 border-b border-[#ddd] pb-1 font-semibold">User Data</p>
          {[
            ["Registered", row.registered],
            ["Source", row.source],
            ["Source Page", "Homepage"],
            ["Timeframe to Buy (original)", form.timeframe],
            ["Inquiry Count", String(row.inq)],
            ["Last Login", row.lastLogin],
            ["Login Count", String(row.logins)],
            ["Last Touch", row.lastTouch],
            ["DISC Profile", "—"],
            ["Favorite City", row.city],
            ["Pre-Qualified", "—"],
          ].map(([label, value]) => (
            <div key={label} className="mb-1">
              <p className="text-[10px] font-bold tracking-wide text-[#888] uppercase">{label}</p>
              <p>{value}</p>
            </div>
          ))}
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
  const box = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState("");
  const [muted, setMuted] = useState(false);
  const [more, setMore] = useState(false);
  const chrome = useChrome();
  const { state } = useCinc();
  const texts = state.calls.filter((call) => call.leadId === row.id && call.kind === "text");
  return (
    <div>
      <button type="button" className="rounded-full bg-[#1c93b5] px-3 py-1 text-[12px] text-white" onClick={() => box.current?.focus()}>Text</button>
      <div className="mt-2 border border-[#e5e5e5] bg-white p-3 shadow-sm">
        <textarea ref={box} className="h-16 w-full border border-[#eee] px-2 py-2 text-[13px] outline-none focus:border-[#1c93b5]" placeholder="Enter message" maxLength={320} value={body} onChange={(event) => setBody(event.target.value)} />
        <div className="mt-2 flex items-center gap-2 bg-[#f6f6f6] p-2">
          <span className="text-[12px] text-[#888]">{body.length}/320</span>
          <button type="button" className={`ml-auto px-3 py-1 text-[12px] ${muted ? "bg-[#1c93b5] text-white" : "bg-[#ddd] text-[#555]"}`} onClick={() => { setMuted((value) => !value); chrome.toast(muted ? "Unmuted." : "Muted. Replies stay on this device until you unmute."); }}>Mute</button>
          <button type="button" className="bg-[#1c93b5] px-3 py-1 text-[12px] text-white" onClick={() => {
            if (!body.trim()) return;
            if (muted) { chrome.toast("This conversation is muted."); return; }
            onLog(row, "text", "Text sent", body.trim());
            setBody("");
            chrome.toast("Reply sent.");
          }}>Reply</button>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-[#999]">Images shown below were sent directly by a lead via SMS/MMS. <button type="button" className="text-[#1c93b5]" onClick={() => setMore((value) => !value)}>{more ? "See less" : "See more"}</button></p>
      {more ? <p className="text-[11px] text-[#888]">MMS pictures stay on this device. This demo does not download carrier media.</p> : null}
      {texts.length ? texts.map((text) => (
        <article key={text.id} className="mt-2 border border-[#eee] bg-white p-3">
          <p className="text-[12px] text-[#888]">{text.at.replace(", ", " at ")}</p>
          <p className="mt-2 text-[13px]">{text.body || "Text"}</p>
        </article>
      )) : (
        <div className="mt-3 border border-[#eee] bg-white py-10 text-center">
          <svg viewBox="0 0 120 90" className="mx-auto h-24 w-32 text-[#b7e0ea]">
            <ellipse cx="60" cy="48" rx="36" ry="18" fill="currentColor" />
            <circle cx="46" cy="36" r="14" fill="#8fd0c8" />
            <circle cx="70" cy="34" r="16" fill="#7ec8e0" />
            <rect x="40" y="52" width="40" height="22" rx="8" fill="#6bb7a8" />
            <circle cx="52" cy="40" r="2" fill="#243238" />
            <circle cx="64" cy="40" r="2" fill="#243238" />
          </svg>
          <p className="mt-2 text-[16px] text-[#888]">It&apos;s quiet in here.</p>
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

function NoteModal({ onClose, onSave, initial = "" }: { onClose: () => void; onSave: (body: string, pinned?: boolean) => void; initial?: string }) {
  const [body, setBody] = useState(initial);
  const [kind, setKind] = useState("Call");
  const [pinned, setPinned] = useState(false);
  return (
    <ModalFrame title="Add a note" onClose={onClose}>
      <textarea className="h-24 w-full border border-[#ccc] p-2 text-[13px]" placeholder="Add a note..." value={body} onChange={(event) => setBody(event.target.value)} />
      <div className="mt-2 text-[13px]">
        <label className="mr-3"><input type="radio" checked={kind === "Call"} onChange={() => setKind("Call")} /> Call</label>
        <label className="mr-3"><input type="radio" checked={kind === "General"} onChange={() => setKind("General")} /> General</label>
        <label><input type="checkbox" checked={pinned} onChange={(event) => setPinned(event.target.checked)} /> Pin</label>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Btn onClick={() => setBody("")}>Clear</Btn>
        <Btn kind="teal" disabled={!body.trim()} onClick={() => onSave(`${kind}: ${body.trim()}`, pinned)}>Save</Btn>
      </div>
    </ModalFrame>
  );
}

function NoteComposer({ onSave }: { onSave: (body: string, pinned?: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("Call");
  const [pinned, setPinned] = useState(false);
  const [people, setPeople] = useState<string[]>([]);
  if (!open) {
    return <button type="button" className="mb-2 h-[28px] w-full rounded border border-[#d5d5d5] bg-white px-2 text-left text-[12px] text-[#888]" onClick={() => setOpen(true)}>Add a note...</button>;
  }
  return (
    <div className="mb-2 border border-[#d5d5d5] bg-white p-2 text-[12px]">
      <textarea className="h-20 w-full border border-[#ccc] p-2" placeholder="Add a note..." value={body} onChange={(event) => setBody(event.target.value)} />
      <label className="mr-3"><input type="radio" checked={kind === "Call"} onChange={() => setKind("Call")} /> Call</label>
      <label className="mr-3"><input type="radio" checked={kind === "General"} onChange={() => setKind("General")} /> General</label>
      <label><input type="checkbox" checked={pinned} onChange={(event) => setPinned(event.target.checked)} /> Pin</label>
      <p className="mt-2 font-semibold">Select people to notify</p>
      <p className="text-[11px] text-[#888]">Agents</p>
      <div className="max-h-24 overflow-auto">
        {OFFICE_ROSTER.map((name) => (
          <label key={name} className="mr-2 block"><input type="checkbox" checked={people.includes(name)} onChange={() => setPeople((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name])} /> {name}</label>
        ))}
      </div>
      <p className="text-[11px] text-[#888]">Listing Agents: Casey Archibald · Partner</p>
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" onClick={() => { setBody(""); setPinned(false); setPeople([]); setKind("Call"); }}>Clear</button>
        <button type="button" disabled={!body.trim()} className="text-[#1c93b5] disabled:opacity-40" onClick={() => { onSave(`${kind}: ${body.trim()}${people.length ? ` (notify ${people.join(", ")})` : ""}`, pinned); setBody(""); setOpen(false); }}>Save & Next</button>
        <button type="button" disabled={!body.trim()} className="text-[#1c93b5] disabled:opacity-40" onClick={() => { onSave(`${kind}: ${body.trim()}${people.length ? ` (notify ${people.join(", ")})` : ""}`, pinned); setBody(""); setOpen(false); }}>Save</button>
      </div>
    </div>
  );
}

function ApplyLabels({ selected, onClose, onApply }: { selected: string[]; onClose: () => void; onApply: (labels: string[]) => void }) {
  const [picked, setPicked] = useState(selected);
  const [group, setGroup] = useState(LABEL_GROUPS[0]?.name ?? "");
  const [query, setQuery] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const labels = (LABEL_GROUPS.find((item) => item.name === group)?.labels ?? []).filter((label) => label.toLowerCase().includes(query.toLowerCase()) && (!selectedOnly || picked.includes(label)));
  return (
    <ModalFrame title="Apply Labels" onClose={onClose} wide>
      <div className="grid grid-cols-[180px_1fr] gap-3 text-[13px]">
        <div>
          <p className="font-bold">Groups</p>
          <p className="text-[11px] text-[#888]">Name A–Z</p>
          <label className="text-[12px]"><input type="checkbox" checked={selectedOnly} onChange={(event) => setSelectedOnly(event.target.checked)} /> Selected only ({picked.length})</label>
          {LABEL_GROUPS.map((item) => (
            <button key={item.name} type="button" className={`mt-1 block w-full px-2 py-1 text-left ${group === item.name ? "bg-[#e7f4f8]" : ""}`} onClick={() => setGroup(item.name)}>{item.name}</button>
          ))}
        </div>
        <div>
          <input className={inputCls} placeholder="Search labels" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="mt-2 max-h-64 overflow-auto">
            {labels.map((label) => (
              <label key={label} className="block py-1"><input type="checkbox" checked={picked.includes(label)} onChange={() => setPicked((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label])} /> {label}</label>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-between text-[13px]">
        <button type="button" className="text-[#1c93b5]" onClick={() => onClose()}>Manage labels</button>
        <div className="flex gap-2">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn kind="teal" onClick={() => onApply(picked)}>Apply</Btn>
        </div>
      </div>
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

function ReassignModal({
  agents,
  partners,
  listing,
  onClose,
  onSave,
}: {
  agents: string[];
  partners: string[];
  listing: string[];
  onClose: () => void;
  onSave: (assign: Assign) => void;
}) {
  const [assign, setAssign] = useState<Assign>({
    agent: agents.find((name) => name !== "Unassigned") || "Unassigned",
    partner: "Unassigned",
    listing: "Unassigned",
  });
  return (
    <ModalFrame title="Reassign Agents" onClose={onClose}>
      <Field label="Agent"><select className={inputCls} value={assign.agent} onChange={(event) => setAssign({ ...assign, agent: event.target.value })}>{agents.map((name) => <option key={name}>{name}</option>)}</select></Field>
      <Field label="Partner"><select className={inputCls} value={assign.partner} onChange={(event) => setAssign({ ...assign, partner: event.target.value })}>{partners.map((name) => <option key={name}>{name}</option>)}</select></Field>
      <Field label="Listing agent"><select className={inputCls} value={assign.listing} onChange={(event) => setAssign({ ...assign, listing: event.target.value })}>{listing.map((name) => <option key={name}>{name}</option>)}</select></Field>
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Cancel</Btn><Btn kind="teal" onClick={() => onSave(assign)}>Save</Btn></div>
    </ModalFrame>
  );
}

function LeadDealModal({ client, onClose }: { client: string; onClose: () => void }) {
  const { update } = useCinc();
  const chrome = useChrome();
  const [form, setForm] = useState({ address: "", price: "", potential: "" });
  return (
    <ModalFrame title="Add Deal" onClose={onClose}>
      <Field label="Client"><input className={inputCls} value={client} readOnly /></Field>
      <Field label="Address"><input className={inputCls} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
      <Field label="Price"><input className={inputCls} value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></Field>
      <Field label="Potential"><input className={inputCls} value={form.potential} onChange={(event) => setForm({ ...form, potential: event.target.value })} /></Field>
      <div className="flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind="teal" onClick={() => {
          update((current) => ({
            ...current,
            deals: [...current.deals, { id: uid("deal"), board: "purchases", stage: "showing", status: "Active", createdAt: Date.now(), client, address: form.address || "Address pending", price: form.price || "—", potential: form.potential || "—" }],
          }));
          chrome.toast("Deal added for this lead.");
          onClose();
        }}>Save</Btn>
      </div>
    </ModalFrame>
  );
}

function ReminderModal({ leadId, onClose, reminderId, initialTitle = "Call", initialDue = "" }: { leadId: string; onClose: () => void; reminderId?: string; initialTitle?: string; initialDue?: string }) {
  const { update } = useCinc();
  const chrome = useChrome();
  const { leads } = useLeads();
  const lead = leads.find((item) => item.id === leadId);
  const [kind, setKind] = useState("Call");
  const [name, setName] = useState(initialTitle || "Call");
  const [details, setDetails] = useState("");
  const [date, setDate] = useState(initialDue.includes("-") ? initialDue : new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("12:00");
  const [meridiem, setMeridiem] = useState("AM");
  const [anytime, setAnytime] = useState(false);
  const [notify, setNotify] = useState("Casey Archibald");
  const [timing, setTiming] = useState("On Time");
  return (
    <ModalFrame title="Add Reminder" onClose={onClose}>
      <Field label="Lead"><input className={inputCls} value={lead?.name || "Lead"} readOnly /></Field>
      <div className="mb-2 text-[13px]">
        {["Call", "Email", "Other"].map((item) => <label key={item} className="mr-3"><input type="radio" checked={kind === item} onChange={() => { setKind(item); if (!reminderId) setName(item); }} /> {item}</label>)}
      </div>
      <Field label="Name"><input className={inputCls} value={name} onChange={(event) => setName(event.target.value)} /></Field>
      <Field label="Details"><textarea className="h-20 w-full border border-[#ccc] p-2 text-[13px]" placeholder="Enter a detailed description of the reminder..." value={details} onChange={(event) => setDetails(event.target.value)} /></Field>
      <Field label="Date"><input className={inputCls} type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
      <div className="mb-2 flex items-center gap-2 text-[13px]">
        <select className={inputCls} disabled={anytime} value={time} onChange={(event) => setTime(event.target.value)}>{clockTimes().map((item) => <option key={item}>{item}</option>)}</select>
        <select className={inputCls} disabled={anytime} value={meridiem} onChange={(event) => setMeridiem(event.target.value)}><option>AM</option><option>PM</option></select>
        <label><input type="checkbox" checked={anytime} onChange={(event) => setAnytime(event.target.checked)} /> Anytime</label>
      </div>
      <Field label="Notify">
        <select className={inputCls} value={notify} onChange={(event) => setNotify(event.target.value)}>{OFFICE_ROSTER.map((item) => <option key={item}>{item}</option>)}</select>
      </Field>
      <Field label="Reminder timing">
        <select className={inputCls} value={timing} onChange={(event) => setTiming(event.target.value)}>{REMINDER_TIMING.map((item) => <option key={item}>{item}</option>)}</select>
      </Field>
      <div className="flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind="teal" onClick={() => {
          const due = anytime ? `${date} Anytime` : `${date} ${time} ${meridiem}`;
          const title = `${kind}: ${name}${details ? ` — ${details}` : ""} (${notify}, ${timing})`;
          update((current) => ({
            ...current,
            reminders: reminderId
              ? current.reminders.map((item) => item.id === reminderId ? { ...item, title, due } : item)
              : [...current.reminders, { id: uid("rem"), leadId, title, due, done: false, day: kind.toUpperCase() }],
          }));
          chrome.toast("Reminder saved.");
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
