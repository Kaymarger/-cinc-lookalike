"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CRM_AGENT, CRM_OPEN_HOUSES, CRM_PROPERTIES, CRM_TODAY_FEED } from "@/lib/cinc-crm";
import { statusLabel } from "@/lib/autotrack";
import { useLeads } from "@/lib/leads";
import { AutoTrackWizard, loadAutoTracks } from "./autotrack-builder";
import { useChrome } from "./chrome-context";
import { useOfficeSession } from "./office-session";
import { OfficeGeneralSettings } from "./office-general";
import { href } from "./route";
import { INTEGRATIONS, NOTIFY_GROUPS, nowLabel, uid, useCinc, type Deal, type DealStage, type Mail, type Template } from "./store";
import { MARKET_AREAS, templateAudience } from "@/lib/cinc-lists";
import { BillingPlaceholder, CustomFieldsPanel, DialerSettingsPanel, PageEditor, SearchSettingsPanel, ThemeLayoutPicker } from "./office-panels";
import { loadOfficePrefs, saveOfficePrefs } from "./office-prefs";
import { Btn, checkCls, EmptyArt, Field, inputCls, Menu, ModalFrame, useComposer } from "./ui";

const AGENT_NUMBER = "4829103344556677";
const MDID = "MM8D0000AAAA0000BBBB0000CCCC0001";

const toolBtn = "inline-flex h-[22px] items-center gap-1 rounded-[2px] border border-[#ccc] bg-white px-2 text-[12px] text-[#333] disabled:opacity-40";

function queuedMail(partial: Pick<Mail, "kind" | "to" | "subject" | "body"> & Partial<Pick<Mail, "folder" | "from" | "unread">>): Mail {
  return {
    id: uid("mail"),
    folder: partial.folder ?? "sent",
    kind: partial.kind,
    from: partial.from ?? "Kayla Gerak",
    to: partial.to,
    subject: partial.subject,
    body: partial.body,
    at: nowLabel(),
    unread: partial.unread,
  };
}

function ordinal(day: number) {
  const suffix = ["th", "st", "nd", "rd"];
  const value = day % 100;
  return `${day}${suffix[(value - 20) % 10] || suffix[value] || suffix[0]}`;
}

export function LaunchpadView() {
  const { leads } = useLeads();
  const { state, update } = useCinc();
  const chrome = useChrome();
  const office = useOfficeSession();
  const [tab, setTab] = useState("Contact Requested");
  useEffect(() => {
    const reset = () => setTab("Contact Requested");
    window.addEventListener("cinc-launchpad-home", reset);
    return () => window.removeEventListener("cinc-launchpad-home", reset);
  }, []);
  const [types, setTypes] = useState<string[]>(["All"]);
  const [statuses, setStatuses] = useState<string[]>(["Awaiting Response"]);
  const [prospect, setProspect] = useState("New Lead - P1");
  const [due, setDue] = useState("Due: Today and Overdue");
  const [flip, setFlip] = useState(false);
  const [openActs, setOpenActs] = useState<string[]>([]);
  const [trendType, setTrendType] = useState("All");
  const [trendSort, setTrendSort] = useState("Last Call Least Recent");
  const today = new Date();
  const weekday = today.toLocaleDateString("en-US", { weekday: "long" });
  const month = today.toLocaleDateString("en-US", { month: "long" });
  const dateLine = `${weekday}, ${month}`;
  const requests = [
    ...CRM_TODAY_FEED.map((item) => ({ ...item, sourceId: item.id })),
    ...leads
      .filter((lead) => lead.source === "showing_request" || lead.source === "ask_question")
      .map((lead) => ({
        id: lead.id,
        sourceId: lead.id,
        name: lead.name,
        at: "Just now",
        verified: lead.source === "registration",
        kind: lead.source === "showing_request" ? "Showing Request" : "Property Inquiry",
        message: lead.notes || lead.propertyAddress || "New website request",
        address: lead.propertyAddress || "Greater Vancouver",
        price: "",
        image: CRM_PROPERTIES[0].image,
      })),
  ];
  const visible = requests.filter((item) => {
    const status = state.requests[item.id] ?? "awaiting";
    const statusLabel = status === "awaiting" ? "Awaiting Response" : status === "acted" ? "Acted On" : "Dismissed";
    const typeOk = types.includes("All") || types.includes(item.kind);
    const statusOk = statuses.includes(statusLabel);
    return typeOk && statusOk;
  });
  const tabs = [
    ["Contact Requested", requests.filter((item) => (state.requests[item.id] ?? "awaiting") === "awaiting").length],
    ["Prospecting", 0],
    ["Lead Reminders", state.reminders.filter((item) => !item.done).length],
    ["Deal Reminders", 0],
    ["Trending Leads", 0],
  ] as const;

  const shownRequests = visible.slice(0, 12);
  const openReminders = state.reminders.filter((item) => {
    if (item.done) return false;
    if (due === "Due Today") return item.due === "Today";
    if (due === "Due Next Week") return item.due === "Next week" || item.due === "Tomorrow";
    if (due === "Overdue") return /\d{4}/.test(item.due);
    if (due === "Due This Week") return item.due === "Today" || item.due === "Tomorrow" || /\d{4}/.test(item.due);
    return true;
  });
  return (
    <div className="bg-[#f5f5f5] p-4">
      <h1 className="text-[22px] font-normal text-[#243238]">Welcome back, {office.user?.name || "Casey Archibald"}.</h1>
      <p className="mt-1 text-[13px] text-[#555]">
        {dateLine} {ordinal(today.getDate())}. You have{" "}
        <a href={href.calendar} className="font-semibold text-[#1c93b5]">{state.appointments.filter((item) => item.when.startsWith(new Date().toISOString().slice(0, 10))).length} appointment{state.appointments.filter((item) => item.when.startsWith(new Date().toISOString().slice(0, 10))).length === 1 ? "" : "s"}</a> scheduled today.
      </p>
      <section className="mt-4 border border-[#e5e5e5] bg-white">
        <div className="flex flex-wrap items-end gap-1 border-b border-[#e5e5e5] px-3">
          {tabs.map(([label, count]) => (
            <button key={label} type="button" className={`h-[54px] px-3 text-[14px] ${tab === label ? "border-b-2 border-[#329bb9] font-semibold text-[#329bb9]" : "text-[#666]"}`} onClick={() => setTab(label)}>
              {label}
              {label === "Contact Requested" && count ? <span className="ml-1 rounded-full bg-[#d9363e] px-1.5 py-0.5 text-[10px] font-bold text-white">{count > 99 ? "99+" : count}</span> : null}
            </button>
          ))}
        </div>
        <div className="p-4">
          {tab === "Contact Requested" ? (
            <>
              <div className="mb-3 flex gap-3 text-[12px]">
                <Menu
                  label={<span className="inline-flex h-8 w-[150px] items-center justify-between border border-[#ccc] bg-white px-2 text-[13px]">Type: {types[0]} ▾</span>}
                  items={["All", "AI Ready", "Cash Offer Inquiry", "Etta Message", "HomePulse Inquiry", "Property Inquiry", "Showing Request", "Clear"].map((label) => ({
                    label,
                    onClick: () => setTypes(label === "Clear" || label === "All" ? ["All"] : types.includes("All") ? [label] : types.includes(label) ? types.filter((item) => item !== label) : [...types, label]),
                  }))}
                />
                <Menu
                  label={<span className="inline-flex h-8 w-[190px] items-center justify-between border border-[#ccc] bg-white px-2 text-[13px]">{statuses[0]} ▾</span>}
                  items={["Awaiting Response", "Acted On", "Dismissed", "Clear"].map((label) => ({
                    label,
                    onClick: () => setStatuses(label === "Clear" ? ["Awaiting Response"] : statuses.includes(label) ? statuses.filter((item) => item !== label) : [...statuses, label]),
                  }))}
                />
              </div>
              {shownRequests.length ? shownRequests.map((item) => (
                <article key={item.id} className="mb-3 flex min-h-[150px] gap-0 border border-[#e3e3e3] bg-white">
                  <div className="grid w-14 shrink-0 place-items-center border-r border-[#eee] text-[#1c93b5]">
                    {item.kind === "Showing Request" ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="5" width="16" height="15" rx="1" /><path d="M4 9h16M8 3v4M16 3v4" /></svg>
                    ) : (
                      <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#1c93b5] text-[16px]">?</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 p-3">
                    <div className="flex items-start gap-2">
                      <div>
                        <a className="text-[13px] font-bold text-[#1c93b5]" href={href.lead(item.sourceId)}>{item.name}</a>
                        <span className="ml-1 text-[#2f6fed]" title={item.verified ? "Verified" : "Locked"}>{item.verified ? "✓" : "🔒"}</span>
                        <p className="text-[11px] text-[#999]">{item.at}</p>
                      </div>
                      <span className="ml-auto">
                        <Menu
                          label={<span className="px-1 text-[16px]">⋮</span>}
                          items={[
                            { label: "Mark Acted On", onClick: () => update((current) => ({ ...current, requests: { ...current.requests, [item.id]: "acted" } })) },
                            { label: "Dismiss", onClick: () => update((current) => ({ ...current, requests: { ...current.requests, [item.id]: "dismissed" } })) },
                          ]}
                        />
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] font-bold">{item.kind}</p>
                    <p className="mt-1 bg-[#f3f3f3] px-2 py-1.5 text-[12px] text-[#666]">{item.message}</p>
                    <div className="mt-2 flex gap-2">
                      <img src={item.image} alt="" className="h-[58px] w-[80px] object-cover" />
                      <div>
                        <a className="text-[13px] font-bold text-[#1c93b5]" href="/search">{item.address}</a>
                        <p className="text-[12px]">{item.price}</p>
                      </div>
                    </div>
                  </div>
                </article>
              )) : <EmptyArt title="Congrats! All caught up on requests." body="Keep up the good work." />}
              {visible.length > shownRequests.length ? <p className="text-center text-[12px] text-[#888]">Showing {shownRequests.length} of {visible.length}.</p> : null}
            </>
          ) : null}
          {tab === "Prospecting" ? (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <select className="h-7 border border-[#ccc] text-[12px]" value={prospect} onChange={(event) => setProspect(event.target.value)}>
                  <option>New Lead - P1</option>
                  <option>Attempted Contact - P2 Call Again</option>
                  <option>Recent Login - P3 Call Active</option>
                </select>
                <button type="button" className="grid h-7 w-7 place-items-center bg-[#1c93b5] text-white" onClick={() => { setFlip((value) => !value); chrome.toast("Prospecting list refreshed."); }}>↻</button>
                <Menu label={<span className="bg-[#1c93b5] px-2 py-1 text-[12px] text-white">Actions ▾</span>} items={[{ label: "Start a dialer campaign", href: href.dialer }]} />
              </div>
              <p className="mb-2 text-[12px] text-[#888]">
                {prospect.startsWith("New") ? "Leads in the New Lead pipeline. Update pipeline after calling." : prospect.includes("P2") ? "Leads in Attempted Contact who registered last 14 days." : "Attempted Contact leads who were active within 30 days."}
              </p>
              <table className="w-full text-left text-[12px]">
                <thead className="text-[10px] uppercase text-[#888]"><tr><th>Lead Name</th><th>Pipeline</th><th>Call Info</th><th>Last Login</th></tr></thead>
                <tbody>
                  {(flip ? [...leads].reverse() : leads).slice(0, 4).map((lead) => (
                    <tr key={lead.id} className="border-t border-[#eee]">
                      <td className="py-2"><a className="text-[#1c93b5]" href={href.lead(lead.id)}>{lead.name}</a></td>
                      <td>{lead.status}</td>
                      <td>Last Call - Never / Total Calls - 0</td>
                      <td>—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {tab === "Lead Reminders" ? (
            <div>
              <div className="mb-3 flex gap-2">
                <select className="h-7 border border-[#ccc] text-[12px]" value={due} onChange={(event) => setDue(event.target.value)}>
                  {["Due: Today and Overdue", "Due Today", "Due This Week", "Due Next Week", "Overdue"].map((option) => <option key={option}>{option}</option>)}
                </select>
                <a href={href.tasks} className="bg-[#1c93b5] px-2 py-1 text-[12px] text-white">View All Reminders</a>
              </div>
              {openReminders.map((item) => (
                <article key={item.id} className="mb-2 flex gap-2 border border-[#eee] p-3">
                  <button type="button" className="text-[#2e9e5b]" onClick={() => update((current) => ({ ...current, reminders: current.reminders.map((reminder) => reminder.id === item.id ? { ...reminder, done: true } : reminder) }))}>✓</button>
                  <div>
                    <a className="text-[#1c93b5]" href={href.lead(item.leadId)}>{item.title}</a>
                    <p className="text-[12px] text-[#d9363e]">Overdue: {item.due}</p>
                  </div>
                </article>
              ))}
              {!openReminders.length ? <p className="text-[13px] text-[#888]">No reminders for this range.</p> : null}
            </div>
          ) : null}
          {tab === "Deal Reminders" ? <p className="text-[13px] text-[#555]">You&apos;re all caught up on your Reminders! Keep up the good work.</p> : null}
          {tab === "Trending Leads" ? (
            <div>
              <div className="mb-3 flex gap-2 text-[12px]">
                <select className="h-7 border border-[#ccc]" value={trendType} onChange={(event) => setTrendType(event.target.value)}>
                  <option value="All">Type: All</option>
                  <option value="Buyer">Buyer</option>
                  <option value="Seller">Seller</option>
                </select>
                <button type="button" onClick={() => setOpenActs(openActs.length ? [] : CRM_TODAY_FEED.slice(0, 6).map((item) => item.id))}>Expand All ⇅</button>
                <select className="h-7 border border-[#ccc]" value={trendSort} onChange={(event) => setTrendSort(event.target.value)}>
                  <option value="Last Call Least Recent">Sort By: Last Call Least Recent</option>
                  <option value="Last Login">Sort By: Last Login</option>
                </select>
              </div>
              {[...CRM_TODAY_FEED.slice(0, 6)]
                .filter((item) => trendType === "All" || (trendType === "Buyer" ? item.kind === "Property Inquiry" : item.kind === "Showing Request"))
                .sort((a, b) => (trendSort === "Last Login" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)))
                .map((item) => (
                <article key={item.id} className="mb-2 border border-[#eee] p-3">
                  <a className="font-semibold text-[#1c93b5]" href={href.lead(item.id)}>{item.name}</a>
                  <p className="text-[12px]">High Property Views</p>
                  <p className="text-[12px] text-[#888]">Last Call: —</p>
                  <button type="button" className="text-[12px] text-[#1c93b5]" onClick={() => setOpenActs((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}>View Additional Activities (2)</button>
                  {openActs.includes(item.id) ? <p className="mt-1 text-[12px] text-[#666]">Viewed a listing · Saved a search</p> : null}
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

const CALL_ROWS = [
  ["Kayla Gerak", "Oct 21, 2026 at 3:49 PM", 39, 31, 0, 0],
  ["Casey Archibald", "Oct 21, 2026 at 2:11 PM", 34, 27, 0, 0],
  ["Anastasiia Borovyk", "Oct 21, 2026 at 11:04 AM", 15, 12, 0, 0],
  ["Kevin Barrett", "Oct 20, 2026 at 4:22 PM", 11, 9, 0, 0],
  ["Cassie Kang", "Oct 20, 2026 at 9:15 AM", 10, 8, 0, 0],
  ["Chantel Machnik", "Oct 19, 2026 at 6:40 PM", 1, 1, 0, 0],
] as const;

export function CallSummaryView() {
  const chrome = useChrome();
  const [frame, setFrame] = useState("Today");
  const [agentFilter, setAgentFilter] = useState("All");
  const [customDays, setCustomDays] = useState(2);
  const [sortKey, setSortKey] = useState<"agent" | "login" | "calls" | "vm">("agent");
  const [dir, setDir] = useState<1 | -1>(1);
  const rows = [...CALL_ROWS].filter((row) => agentFilter === "All" || row[0] === agentFilter).sort((a, b) => {
    const av = sortKey === "agent" ? a[0] : sortKey === "login" ? a[1] : sortKey === "calls" ? a[2] : a[4];
    const bv = sortKey === "agent" ? b[0] : sortKey === "login" ? b[1] : sortKey === "calls" ? b[2] : b[4];
    return av < bv ? -dir : av > bv ? dir : 0;
  });
  function sort(key: typeof sortKey) {
    if (sortKey === key) setDir((value) => (value === 1 ? -1 : 1));
    else { setSortKey(key); setDir(1); }
  }
  const factor = frame === "Today" ? 1 : frame === "Last 7 Days" ? 3 : frame === "Last 30 Days" || frame === "This Month" ? 6 : frame === "Custom" ? customDays : 4;
  return (
    <div className="p-4">
      <div className="border border-[#e5e5e5] bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
        <Menu
          label={<span className={`${toolBtn} w-[150px] justify-between`}>Agent: <b>{agentFilter}</b> ▾</span>}
          items={["All", ...CALL_ROWS.map((row) => row[0])].map((label) => ({ label, onClick: () => setAgentFilter(label) }))}
        />
        <Menu
          label={<span className={`${toolBtn} w-[150px] justify-between`}>Timeframe: <b>{frame}</b> ▾</span>}
          items={["Today", "Last 7 Days", "Last 30 Days", "This Month", "Last Month", "Custom"].map((label) => ({
            label,
            onClick: () => {
              if (label === "Custom") {
                const days = window.prompt("Custom range in days", "14");
                const count = Number(days);
                if (!count) return;
                setCustomDays(Math.max(1, Math.round(count / 7)));
              }
              setFrame(label);
            },
          }))}
        />
        </div>
        <table className="mt-3 w-full border-collapse text-left text-[12px]">
          <thead className="bg-[#f6f6f6] text-[12px] font-bold text-black">
            <tr>
              {([["Agent", "agent"], ["Last Login", "login"], ["Call Logs", ""], ["Calls", "calls"], ["Voicemails", "vm"]] as const).map(([label, key]) => (
                <th key={label} className="border-b border-[#e5e5e5] px-2 py-2">
                  {key ? <button type="button" onClick={() => sort(key)}>{label} ↑↓</button> : label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="h-7 border-b border-[#eee]">
                <td className="px-2">{row[0]}</td>
                <td className="px-2">{row[1]}</td>
                <td className="px-2"><button type="button" className="text-[#1c93b5]" onClick={() => chrome.openModal(<ModalFrame title={`${row[0]} logs`} onClose={chrome.closeModal}><p className="text-[13px]">{row[2] * factor} sample calls in {frame}. Nothing is dialed.</p><div className="mt-3 text-right"><Btn kind="teal" onClick={chrome.closeModal}>Close</Btn></div></ModalFrame>)}>View Logs</button></td>
                <td className="px-2">{row[2] * factor} calls to <button type="button" className="font-bold text-[#1c93b5]" onClick={() => chrome.openModal(<ModalFrame title={`${row[0]} leads`} onClose={chrome.closeModal}><ul className="text-[13px]">{["Morgan Ellis", "Jordan Blake", "Avery Quinn"].slice(0, Math.max(1, Math.min(3, row[3]))).map((name) => <li key={name} className="border-b border-[#eee] py-1">{name}</li>)}</ul><div className="mt-3 text-right"><Btn kind="teal" onClick={chrome.closeModal}>Close</Btn></div></ModalFrame>)}>{row[3] * factor} Leads</button></td>
                <td className="px-2">{row[4] * (frame === "Today" ? 1 : factor)} voicemails to <span className="text-[#1c93b5]">{row[5] * (frame === "Today" ? 1 : factor)} Leads</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const PURCHASE_STAGES: { id: DealStage; label: string }[] = [
  { id: "showing", label: "Showing" },
  { id: "offer", label: "Offer Made" },
  { id: "contract", label: "Under Contract" },
  { id: "closed", label: "Closed" },
];
const LISTING_STAGES: { id: DealStage; label: string }[] = [
  { id: "prelisting", label: "Pre-Listing" },
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "closed", label: "Closed" },
];

export function DealsView({ board }: { board: "purchases" | "listings" }) {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const stages = board === "listings" ? LISTING_STAGES : PURCHASE_STAGES;
  const [status, setStatus] = useState("Active");
  const [created, setCreated] = useState("Anytime");
  const [sort, setSort] = useState("Reminder Due Date");
  const [agent, setAgent] = useState("All");
  const agents = ["All", "Casey Archibald", "Kayla Gerak", "Anastasiia Borovyk", "Kevin Barrett"];
  const deals = state.deals
    .filter((deal) => deal.board === board && (status === "All" || deal.status === status))
    .filter((deal) => agent === "All" || (deal.agent || "Unassigned") === agent)
    .filter((deal) => created === "Anytime" || Date.now() - deal.createdAt < (created === "Last 7 Days" ? 7 : 30) * 86400000)
    .sort((a, b) => sort === "Price" ? a.price.localeCompare(b.price) : b.createdAt - a.createdAt);

  const money = (amount: number) => (amount > 0 ? `$${amount.toLocaleString("en-CA")}` : "$--");
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#eef3f6]">
      <div className="flex min-h-0 flex-1 flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-5 text-[15px] font-semibold">
          <a href={href.dealsPurchases} className={board === "purchases" ? "border-b-[3px] border-[#1c93b5] pb-1 text-[#1c93b5]" : "pb-1 text-[#666]"}>Purchases</a>
          <a href={href.dealsListings} className={board === "listings" ? "border-b-[3px] border-[#1c93b5] pb-1 text-[#1c93b5]" : "pb-1 text-[#666]"}>Listings</a>
          <button type="button" className="pb-1 text-[13px] font-normal text-[#1c93b5]" onClick={() => chrome.openModal(<ModalFrame title="Advertise Listings" onClose={chrome.closeModal}><Field label="Subject"><input className={inputCls} defaultValue="Listings to advertise" /></Field><Field label="Message"><textarea className="h-20 w-full border border-[#ccc] p-2 text-[13px]" defaultValue="Share the current deal listings with matching leads." /></Field><div className="mt-3 text-right"><Btn kind="teal" onClick={() => { chrome.toast("Advertising request saved."); chrome.closeModal(); }}>Send</Btn></div></ModalFrame>)}>Advertise Listings</button>
        </div>
        <button type="button" className="inline-flex h-[22px] items-center rounded-[2px] bg-[#1c93b5] px-2 text-[12px] text-white" onClick={() => chrome.openModal(<DealModal board={board} onClose={chrome.closeModal} />)}>
          Add Deal
        </button>
      </div>
      <div className="mb-3 flex w-full items-center gap-2 text-[12px]">
        <Menu className="w-[130px]" label={<span className={`${toolBtn} w-[130px] justify-between`}>Status: <b>{status}</b> ▾</span>} items={["Active", "Archived", "All"].map((label) => ({ label, onClick: () => setStatus(label) }))} />
        <Menu className="w-[150px]" label={<span className={`${toolBtn} w-[150px] justify-between`}>Created: <b>{created}</b> ▾</span>} items={["Anytime", "Last 7 Days", "Last 30 Days"].map((label) => ({ label, onClick: () => setCreated(label) }))} />
        <Menu className="w-[180px]" label={<span className={`${toolBtn} w-[180px] justify-between`}>Assigned Agent: <b>{agent}</b> ▾</span>} items={agents.map((label) => ({ label, onClick: () => setAgent(label) }))} />
        <Menu className="ml-auto" label={<span className={`${toolBtn} min-w-[180px] justify-between`}>↑↓ Sort By: <b>{sort}</b> ▾</span>} items={["Reminder Due Date", "Newest", "Price"].map((label) => ({ label, onClick: () => setSort(label) }))} />
      </div>
      <div className="relative grid min-h-0 flex-1 grid-cols-4 gap-3">
        {stages.map((stage) => {
          const cards = deals.filter((deal) => deal.stage === stage.id);
          return (
            <section key={stage.id} className="flex min-h-[420px] flex-col border border-[#e1e1e1] bg-[#f1f1f1]">
              <header className="bg-white px-2 py-2">
                <div className="text-[12px] font-bold tracking-wide text-black uppercase">
                  <span>{stage.label} {cards.length}</span>
                </div>
                <p className="text-[11px] text-[#777]">{money(cards.reduce((sum, deal) => sum + (Number(String(deal.price).replace(/[^0-9.]/g, "")) || 0), 0))} | <span className="underline decoration-dotted">{money(cards.reduce((sum, deal) => sum + (Number(String(deal.potential).replace(/[^0-9.]/g, "")) || 0), 0))} Potential</span></p>
              </header>
              <div className="flex-1 p-2">
                {cards.map((deal) => (
                  <article key={deal.id} className="mb-2 bg-white p-2 shadow-sm">
                    <p className="text-[12px]">{deal.address || "--"}</p>
                    <p className="text-[11px] text-[#888]">{deal.client || "--"}</p>
                    <p className="text-[11px] text-[#1c93b5]">{deal.price && deal.price !== "$0" ? deal.price : "$--"}</p>
                    <p className="text-[11px] text-[#888]">--</p>
                    <p className="text-[11px] text-[#666]">No current upcoming tasks assigned</p>
                    <div className="mt-1 flex gap-2">
                      <select className="h-6 border border-[#ccc] text-[11px]" value={deal.stage} onChange={(event) => update((current) => ({ ...current, deals: current.deals.map((item) => item.id === deal.id ? { ...item, stage: event.target.value as DealStage } : item) }))}>
                        {stages.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                      </select>
                      <button type="button" className="text-[11px] text-[#d9363e]" onClick={() => update((current) => ({ ...current, deals: current.deals.filter((item) => item.id !== deal.id) }))}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
        {!deals.length ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="pointer-events-auto bg-white px-8 py-5 text-center shadow-md">
              <p className="text-[15px] font-bold">No Deals Found Matching Your Filters</p>
              <p className="text-[13px] text-[#666]">Try selecting different filters to view your deals</p>
            </div>
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}

function DealModal({ board, onClose }: { board: "purchases" | "listings"; onClose: () => void }) {
  const { update } = useCinc();
  const chrome = useChrome();
  const stages = board === "listings" ? LISTING_STAGES : PURCHASE_STAGES;
  const [form, setForm] = useState({ client: "", address: "", price: "", potential: "", stage: stages[0].id });
  return (
    <ModalFrame title="Add Deal" onClose={onClose}>
      <Field label="Client"><input className={inputCls} value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })} /></Field>
      <Field label="Address"><input className={inputCls} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
      <Field label="Price"><input className={inputCls} value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></Field>
      <Field label="Potential"><input className={inputCls} value={form.potential} onChange={(event) => setForm({ ...form, potential: event.target.value })} /></Field>
      <Field label="Stage">
        <select className={inputCls} value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value as DealStage })}>
          {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
        </select>
      </Field>
      <div className="flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind="teal" onClick={() => {
          const client = form.client.trim();
          const address = form.address.trim();
          const price = Number(String(form.price).replace(/[^0-9.]/g, ""));
          if (!client) { chrome.toast("Enter a client name."); return; }
          if (!address) { chrome.toast("Enter an address."); return; }
          if (!price) { chrome.toast("Enter a price."); return; }
          const deal: Deal = { id: uid("deal"), board, status: "Active", createdAt: Date.now(), ...form, client, address, price: `$${price.toLocaleString("en-CA")}` };
          update((current) => ({ ...current, deals: [...current.deals, deal] }));
          chrome.toast("Deal added.");
          onClose();
        }}>Save</Btn>
      </div>
    </ModalFrame>
  );
}

export function InboxView({ folder }: { folder: "inbox" | "sent" | "drafts" | "trashed" | "templates" }) {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const composer = useComposer();
  const [group, setGroup] = useState("Uncategorized");
  const [picked, setPicked] = useState<string[]>([]);
  const [commType, setCommType] = useState("Any");
  const [messageType, setMessageType] = useState("Both");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  useEffect(() => {
    setBooting(true);
    const timer = window.setTimeout(() => setBooting(false), 350);
    return () => window.clearTimeout(timer);
  }, [folder]);
  const [sortKey, setSortKey] = useState<"name" | "type" | "by">("name");
  const query = chrome.leadSearch;
  const messages = state.mail.filter((mail) => {
    if (mail.folder !== folder) return false;
    if (unreadOnly && !mail.unread) return false;
    if (messageType === "Email" && mail.kind !== "email") return false;
    if (messageType === "Text" && mail.kind !== "text") return false;
    const notification = (mail.from || "").toLowerCase() === "system" || mail.subject.startsWith("Test:");
    if (commType === "Notifications Only" && !notification) return false;
    if (commType === "Conversations Only" && notification) return false;
    return `${mail.subject} ${mail.body} ${mail.to} ${mail.from ?? ""}`.toLowerCase().includes(query.toLowerCase());
  });
  const pageSize = 25;
  const pages = Math.max(1, Math.ceil(messages.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = messages.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const opened = messages.find((mail) => mail.id === openId);

  function send(kind: "email" | "text", value: { to: string; subject?: string; body: string }, target: "sent" | "drafts") {
    if (target === "drafts") {
      update((current) => ({
        ...current,
        mail: [{ id: uid("mail"), folder: "drafts", kind, to: value.to, subject: value.subject || kind, body: value.body, at: nowLabel() }, ...current.mail],
      }));
      chrome.toast("Draft saved.");
      return;
    }
    void fetch("/api/office/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: kind === "email" ? "email" : "sms", to: value.to, subject: value.subject, body: value.body }),
    }).then(async (response) => {
      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        chrome.toast(data?.message || "That message was not sent.");
        return;
      }
      update((current) => ({
        ...current,
        mail: [{ id: uid("mail"), folder: "sent", kind, to: value.to, subject: value.subject || kind, body: value.body, at: nowLabel() }, ...current.mail],
      }));
      chrome.toast(kind === "email" ? "Email sent." : "Text sent.");
    });
  }

  if (folder === "templates") {
    const templateQuery = query.trim().toLowerCase();
    const rows = [...state.templates.filter((item) => item.group === group && (!templateQuery || `${item.name} ${item.type} ${item.createdBy}`.toLowerCase().includes(templateQuery)))].sort((a, b) => {
      const av = sortKey === "name" ? a.name : sortKey === "type" ? a.type : a.createdBy;
      const bv = sortKey === "name" ? b.name : sortKey === "type" ? b.type : b.createdBy;
      return av.localeCompare(bv);
    });
    return (
      <div className="flex h-full min-h-0 flex-col bg-[#f5f5f5] p-4">
        <div className="mb-3 bg-white px-4 py-5 text-center shadow-sm">
          <h2 className="text-[16px] font-bold">Template Manager</h2>
          <p className="text-[12px] text-[#888]">Create a new template, edit existing templates, or group templates together.</p>
        </div>
        <div className="flex min-h-0 flex-1 gap-3">
          <aside className="w-56 shrink-0 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[13px] font-semibold">Groups</span>
              <button type="button" className="border border-[#1c93b5] px-2 py-0.5 text-[12px] text-[#1c93b5]" onClick={() => {
                const name = window.prompt("Group name");
                if (!name) return;
                update((current) => ({ ...current, groups: [...current.groups, name] }));
              }}>+ Add Group</button>
            </div>
            {state.groups.map((name) => {
              const count = state.templates.filter((item) => item.group === name).length;
              const on = group === name;
              return (
                <button key={name} type="button" className={`mb-1 flex h-[30px] w-full items-center gap-2 px-2 text-left text-[13px] ${on ? "bg-[#3a97c4] text-white" : "hover:bg-[#f6f6f6]"}`} onClick={() => setGroup(name)}>
                  <span className="min-w-0 flex-1 truncate">{name} ({count})</span>
                  {on ? <span>▸</span> : null}
                </button>
              );
            })}
          </aside>
          <div className="min-w-0 flex-1 bg-white p-3 shadow-sm">
            <div className="mb-2 flex justify-end gap-2">
              <button type="button" className="bg-[#1c93b5] px-2 py-1 text-[12px] text-white" onClick={() => chrome.openModal(<TemplateModal group={group} onClose={chrome.closeModal} />)}>New Template</button>
              <button type="button" className="border border-[#1c93b5] px-2 py-1 text-[12px] text-[#1c93b5]" onClick={() => {
                if (!picked.length) { chrome.toast("Select at least one template."); return; }
                const name = window.prompt("Move selected to group", group);
                if (!name) return;
                update((current) => ({
                  ...current,
                  groups: current.groups.includes(name) ? current.groups : [...current.groups, name],
                  templates: current.templates.map((item) => picked.includes(item.id) ? { ...item, group: name } : item),
                }));
                setPicked([]);
              }}>Move Selected to Group</button>
              <button type="button" title="Copy" className={toolBtn} onClick={() => {
                if (!picked.length) { chrome.toast("Select at least one template."); return; }
                const chosen = state.templates.filter((item) => picked.includes(item.id));
                update((current) => ({ ...current, templates: [...current.templates, ...chosen.map((item) => ({ ...item, id: uid("tpl"), name: `${item.name} copy` }))] }));
                chrome.toast("Copied on this device.");
              }}>Copy</button>
              <button type="button" title="Share" className={toolBtn} onClick={() => { const link = `${window.location.origin}/dashboard/spa#inbox/templates`; navigator.clipboard?.writeText(link); chrome.toast("Share link copied."); }}>Share</button>
              <button type="button" title="Trash" className={toolBtn} onClick={() => { if (!picked.length) { chrome.toast("Select at least one template."); return; } update((current) => ({ ...current, templates: current.templates.filter((item) => !picked.includes(item.id)) })); setPicked([]); chrome.toast(`Deleted ${picked.length} template${picked.length === 1 ? "" : "s"}.`); }}>Trash</button>
            </div>
            <table className="w-full text-left text-[12px]">
              <thead className="text-[12px] font-normal text-[#555]">
                <tr>
                  <th className="w-6" />
                  <th className="py-1"><button type="button" onClick={() => setSortKey("name")}>Template Name ↑</button></th>
                  <th><button type="button" onClick={() => setSortKey("type")}>Type ↑</button></th>
                  <th><button type="button" onClick={() => setSortKey("by")}>Created By ↑</button></th>
                  <th>Last Edited</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="h-6 border-t border-[#eee]">
                    <td><input className={checkCls} type="checkbox" checked={picked.includes(row.id)} onChange={(event) => setPicked(event.target.checked ? [...picked, row.id] : picked.filter((id) => id !== row.id))} /></td>
                    <td className="text-[#1c93b5]">{row.type === "Text" ? "☎ " : ""}<button type="button" className="text-[#1c93b5]" onClick={() => chrome.openModal(<TemplateModal group={row.group} initial={row} onClose={chrome.closeModal} />)}>{row.name}</button></td>
                    <td>{templateAudience(row.name)}</td>
                    <td>{row.createdBy}</td>
                    <td>{row.edited}</td>
                    <td><button type="button" className="text-[#1c93b5]" onClick={() => chrome.openModal(<ModalFrame title={`${row.name} analytics`} onClose={chrome.closeModal}><p className="text-[13px]">Sends 0 · Opens 0 · Clicks 0. Nothing has been sent from this template.</p><div className="mt-3 text-right"><Btn kind="teal" onClick={chrome.closeModal}>Close</Btn></div></ModalFrame>)}>Analytics</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const composeOff = folder === "sent";
  const showCompose = folder === "inbox" || folder === "sent";
  const showFilters = folder === "inbox" || folder === "trashed";
  const countLabel = messages.length ? `${safePage * pageSize + 1} - ${Math.min(messages.length, (safePage + 1) * pageSize)} of ${messages.length}` : "0 messages";
  if (booting) return <p className="p-6 text-[13px] text-[#666]">Loading…</p>;
  const allPicked = slice.length > 0 && slice.every((mail) => picked.includes(mail.id));
  function needPick() {
    if (picked.length) return false;
    chrome.toast("Select at least one message.");
    return true;
  }
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e5e5e5] bg-white px-3 py-2">
        <span className="inline-flex h-[22px] items-center border border-[#ccc] bg-white">
          <input className={checkCls} type="checkbox" checked={allPicked} onChange={(event) => setPicked(event.target.checked ? slice.map((mail) => mail.id) : [])} />
          <Menu label={<span className="px-1 text-[10px]">▾</span>} items={[
            { label: "All", onClick: () => setPicked(slice.map((mail) => mail.id)) },
            { label: "None", onClick: () => setPicked([]) },
            { label: "Read", onClick: () => setPicked(slice.filter((mail) => !mail.unread).map((mail) => mail.id)) },
            { label: "Unread", onClick: () => setPicked(slice.filter((mail) => mail.unread).map((mail) => mail.id)) },
          ]} />
        </span>
        {folder === "trashed" ? (
          <button type="button" className={`${toolBtn} text-[#1c93b5]`} onClick={() => {
            if (needPick()) return;
            update((current) => ({ ...current, mail: current.mail.map((mail) => picked.includes(mail.id) ? { ...mail, folder: "inbox" } : mail) }));
            chrome.toast(`Restored ${picked.length}.`);
            setPicked([]);
          }}>Undo</button>
        ) : null}
        {showFilters ? (
          <div className="relative">
            <button type="button" className={`${toolBtn} text-[#1c93b5]`} onClick={() => setFiltersOpen((value) => !value)}>Filters</button>
            {filtersOpen ? (
              <div className="absolute top-7 left-0 z-30 w-64 border border-[#ddd] bg-white p-3 text-left text-[12px] shadow-md">
                <p className="font-bold">Communication Type</p>
                {["Any", "Conversations Only", "Notifications Only"].map((item) => (
                  <label key={item} className="mt-1 block"><input type="radio" name="comm-type" checked={commType === item} onChange={() => { setCommType(item); setPage(0); }} /> {item}</label>
                ))}
                <p className="mt-2 font-bold">Message Type</p>
                {["Both", "Email", "Text"].map((item) => (
                  <label key={item} className="mt-1 block"><input type="radio" name="msg-type" checked={messageType === item} onChange={() => { setMessageType(item); setPage(0); }} /> {item}</label>
                ))}
                <label className="mt-2 block"><input type="checkbox" checked={unreadOnly} onChange={(event) => { setUnreadOnly(event.target.checked); setPage(0); }} /> Unread Only</label>
              </div>
            ) : null}
          </div>
        ) : null}
        <span className="ml-auto text-[12px] font-bold">{countLabel}</span>
        <button type="button" className="px-1 disabled:opacity-30" disabled={safePage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>‹</button>
        <button type="button" className="px-1 disabled:opacity-30" disabled={safePage >= pages - 1} onClick={() => setPage((value) => value + 1)}>›</button>
        {showCompose ? (
          <>
            <button type="button" disabled={composeOff} className="h-[22px] bg-[#1c93b5] px-2 text-[12px] text-white disabled:opacity-40" onClick={() => composer.email("", (sent, value) => send("email", value, sent ? "sent" : "drafts"))}>New Email</button>
            <button type="button" disabled={composeOff} className="h-[22px] border border-[#1c93b5] bg-white px-2 text-[12px] text-[#1c93b5] disabled:opacity-40" onClick={() => composer.text("", (value) => send("text", value, "sent"))}>New Text</button>
          </>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-[#f5f5f5] p-3">
        {opened ? (
          <article className="bg-white p-4 shadow-sm">
            <button type="button" className="mb-2 text-[12px] text-[#1c93b5]" onClick={() => setOpenId(null)}>Back</button>
            <h2 className="font-bold">{opened.subject || "(no subject)"}</h2>
            <p className="text-[12px] text-[#888]">{opened.from || opened.to || "(no recipient)"} · {opened.at}</p>
            <p className="mt-3 text-[13px]">{opened.body || "Empty message."}</p>
            <form className="mt-4 border-t border-[#eee] pt-3" onSubmit={(event) => { event.preventDefault(); const body = new FormData(event.currentTarget).get("reply"); if (!body) return; chrome.toast("Reply saved in Sent."); update((current) => ({ ...current, mail: [{ id: uid("mail"), folder: "sent", kind: opened.kind, from: CRM_AGENT.name, to: opened.from || opened.to, subject: `Re: ${opened.subject || ""}`, body: String(body), at: "Just now", unread: false }, ...current.mail] })); }}>
              <textarea name="reply" className="h-20 w-full border border-[#ccc] p-2 text-[13px]" placeholder="Write a reply" />
              <button type="submit" className="mt-2 bg-[#1c93b5] px-3 py-1 text-[12px] text-white">Send</button>
            </form>
          </article>
        ) : (
          <div className="bg-white shadow-sm">
            {slice.length ? slice.map((mail) => (
              <div key={mail.id} className={`flex min-h-8 w-full items-center gap-2 border-b border-[#eee] px-2 py-1 text-left text-[12px] ${mail.unread ? "bg-[#f3fbfd] font-bold" : ""}`}>
                <input className={checkCls} type="checkbox" checked={picked.includes(mail.id)} onChange={(event) => setPicked(event.target.checked ? [...picked, mail.id] : picked.filter((id) => id !== mail.id))} />
                <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => { setOpenId(mail.id); update((current) => ({ ...current, mail: current.mail.map((item) => item.id === mail.id ? { ...item, unread: false } : item) })); }}>
                {folder === "drafts" ? (
                  <>
                    <span className={`w-36 truncate ${mail.to ? "font-semibold" : "text-[#aaa]"}`}>{mail.to || "(no recipient)"}</span>
                    <span className={`min-w-0 flex-1 truncate ${mail.subject ? "" : "text-[#aaa]"}`}>{mail.subject || "(no subject)"}</span>
                  </>
                ) : folder === "sent" ? (
                  <>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#3a97c4] text-[11px] font-bold text-white">{(mail.from || "SA").slice(0, 2).toUpperCase()}</span>
                    <span className="min-w-0 flex-1 truncate">Some Agent / Some subject</span>
                  </>
                ) : (
                  <>
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[13px] text-white ${mail.kind === "text" ? "bg-[#2e9e5b]" : "bg-[#1c93b5]"}`}>{mail.kind === "text" ? "💬" : "✉"}</span>
                    <span className="w-16 truncate font-bold">{mail.from || "System"}</span>
                    <span className="min-w-0 flex-1 truncate">{mail.body}</span>
                  </>
                )}
                <span className="font-bold">{mail.at}</span>
                </button>
              </div>
            )) : <p className="px-4 py-10 text-center text-[13px] text-[#666]">No messages in this folder.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateModal({ group, onClose, initial }: { group: string; onClose: () => void; initial?: Template }) {
  const { update } = useCinc();
  const chrome = useChrome();
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<"Email" | "Text">(initial?.type ?? "Email");
  const [body, setBody] = useState(initial?.body ?? "");
  return (
    <ModalFrame title={initial ? "Edit Template" : "New Template"} onClose={onClose}>
      <Field label="Name"><input className={inputCls} value={name} onChange={(event) => setName(event.target.value)} /></Field>
      <Field label="Type"><select className={inputCls} value={type} onChange={(event) => setType(event.target.value as "Email" | "Text")}><option>Email</option><option>Text</option></select></Field>
      <textarea className="h-24 w-full border border-[#ccc] p-2 text-[13px]" value={body} onChange={(event) => setBody(event.target.value)} />
      <div className="mt-3 flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind="teal" onClick={() => {
          update((current) => ({
            ...current,
            templates: initial
              ? current.templates.map((item) => item.id === initial.id ? { ...item, name: name || item.name, type, body, edited: nowLabel() } : item)
              : [...current.templates, { id: uid("tpl"), group, name: name || "Untitled", type, createdBy: CRM_AGENT.name, edited: nowLabel(), body }],
          }));
          chrome.toast(initial ? "Template updated." : "Template saved.");
          onClose();
        }}>Save</Btn>
      </div>
    </ModalFrame>
  );
}

export function AutoTracksView() {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const [cat, setCat] = useState("General");
  const [openTrack, setOpenTrack] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [stats, setStats] = useState<Record<string, { openRate: number | null; clickRate: number | null; leads: number; touches: number }>>({});
  useEffect(() => {
    void loadAutoTracks().then((data) => {
      if (!data) return;
      setHiddenIds(data.hiddenIds);
      setStats(data.stats);
      update((current) => ({ ...current, tracks: data.tracks }));
    });
  }, [update]);
  const tracks = useMemo(() => {
    const hidden = new Set([...state.hiddenTracks, ...hiddenIds]);
    return state.tracks.filter((track) => !hidden.has(track.id));
  }, [hiddenIds, state.hiddenTracks, state.tracks]);
  const trackQuery = chrome.leadSearch.trim().toLowerCase();
  const immediate = {
    id: "cinc-immediate",
    name: "Immediate!",
    category: "General",
    status: "active" as const,
    trigger: "New lead",
    visibility: "private" as const,
    owner: "CINC",
    captured: true,
    steps: [{ id: "cinc-immediate-1", day: 1, action: "email" as const, subject: "Welcome", body: "", format: "html" as const, to: "", from: "", template: "", schedule: "immediate" as const, scheduleTime: "", meridiem: "AM" as const, delayMinutes: 0, afterPrevious: false, calendarOn: "", attachments: [], videoUrl: "", videoTitle: "", reminderType: "", blocking: false }],
  };
  const catalog = tracks.some((track) => track.name === "Immediate!") ? tracks : [immediate, ...tracks];
  const shown = catalog.filter((track) => track.category === cat && (!trackQuery || track.name.toLowerCase().includes(trackQuery)));
  const active = tracks.filter((track) => track.status === "active").length;
  const paused = tracks.filter((track) => track.status === "paused").length;
  return (
    <div className="p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="flex items-end divide-x divide-[#ddd] border-b border-[#e5e5e5]">
          {[
            [String(tracks.length), "Total"],
            [String(active), "Active"],
            [String(paused), "Paused"],
          ].map(([value, label]) => (
            <div key={label} className="min-w-[72px] px-4 pb-1 text-center">
              <p className="text-[28px] leading-none font-light text-[#1c93b5]">{value}</p>
              <p className="mt-1 text-[12px] text-[#777]">{label}</p>
            </div>
          ))}
        </div>
        <button type="button" className="h-8 bg-[#1c93b5] px-3 text-[13px] text-white" onClick={() => chrome.openModal(<AutoTrackWizard onClose={chrome.closeModal} onSaved={setCat} />)}>✚ Start/Edit an AutoTrack</button>
      </div>
      <div className="mb-3 flex flex-wrap gap-1">
        {["General", "Buyer", "Listing", "Nurture", "Past Client", "My AutoTracks"].map((label) => (
          <button key={label} type="button" className={`rounded border px-3 py-1 text-[12px] ${cat === label ? "border-[#1c93b5] bg-[#f3fbfd] font-semibold text-[#1c93b5]" : "border-[#ddd] bg-white text-[#555]"}`} onClick={() => setCat(label)}>{label}</button>
        ))}
      </div>
      <div className="border border-[#e5e5e5] bg-white shadow-sm">
        {shown.map((track) => {
          const stat = stats[track.id];
          const steps = track.steps ?? [];
          const days = steps.length ? Math.max(...steps.map((step) => step.day)) : 0;
          const touches = steps.filter((step) => step.action === "email" || step.action === "text").length;
          const statsRow = [
            ["Completed", "0"],
            ["Touches", String(touches)],
            ["Steps", String(steps.length)],
          ];
          if (stat?.openRate != null) statsRow.unshift(["% Open Rate", String(stat.openRate)]);
          if (stat?.clickRate != null) statsRow.splice(stat?.openRate != null ? 1 : 0, 0, ["% Click Rate", String(stat.clickRate)]);
          return (
            <article key={track.id} className="border-t border-[#eee]">
              <div className="flex items-center gap-4 bg-[#f3f3f3] px-4 py-3">
                <div className="min-w-0 flex-1">
                  <button type="button" className="text-[15px] font-semibold text-[#243238]" onClick={() => setOpenTrack(openTrack === track.id ? null : track.id)}>
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#1c93b5]" />
                    {track.name}
                  </button>
                  <p className="text-[12px] text-[#666]">Duration: {days} Day{days === 1 ? "" : "s"}</p>
                  <p className="text-[12px] text-[#666]">{(track.owner === "CINC" || /cinc template/i.test(track.name) ? "Private" : track.visibility === "private" ? "Private" : "Public")} ({track.owner === "CINC" || /cinc template/i.test(track.name) ? "CINC" : track.owner || CRM_AGENT.name})</p>
                </div>
                <div className="w-16 text-center">
                  <div className={`mx-auto grid h-12 w-12 place-items-center rounded-full border-2 ${track.status === "active" ? "border-[#1c93b5] text-[#1c93b5]" : "border-[#bbb] text-[#999]"}`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M9 1 3 9h4l-1 6 7-9H9z" /></svg>
                  </div>
                  <p className="mt-1 text-[11px] text-[#666]">{statusLabel(track.status)}</p>
                </div>
                <div>
                  <p className="mb-1 text-center text-[11px] text-[#888]">Email</p>
                  <div className="flex gap-3">
                    {statsRow.map(([label, value]) => (
                      <div key={label} className="w-14 text-center">
                        <div className="mx-auto grid h-11 w-11 place-items-center rounded-full border-2 border-[#d5e8ee] text-[12px] text-[#7aa]">{value}</div>
                        <p className="mt-1 text-[10px] leading-tight text-[#888]">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {openTrack === track.id ? (
                <>
                <table className="w-full border-t border-[#e5e5e5] bg-white text-left text-[12px]">
                  <thead className="text-[11px] uppercase text-[#666]">
                    <tr>{["Status", "Lead", "Progress", "Date Assigned", "Open Rate", "Click Rate", "Agent Assigned"].map((column) => <th key={column} className="px-3 py-2">{column}</th>)}</tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-[#eee]">
                      <td className="px-3 py-2">{statusLabel(track.status)}</td>
                      <td className="px-3 py-2">No leads assigned</td>
                      <td className="px-3 py-2">{track.steps?.length ? `0 / ${track.steps.length}` : ""}</td>
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2">{stat?.openRate == null ? "" : `${stat.openRate}%`}</td>
                      <td className="px-3 py-2">{stat?.clickRate == null ? "" : `${stat.clickRate}%`}</td>
                      <td className="px-3 py-2">{track.owner || CRM_AGENT.name}</td>
                    </tr>
                  </tbody>
                </table>
                <button type="button" className="block w-full bg-[#1c93b5] py-2 text-center text-[12px] font-semibold tracking-wide text-white" onClick={() => chrome.openModal(<AutoTrackWizard initial={track.id === "cinc-immediate" ? undefined : track} onClose={chrome.closeModal} onSaved={setCat} />)}>START/EDIT AN AUTOTRACK</button>
                </>
              ) : null}
            </article>
          );
        })}
        {!shown.length ? <p className="px-4 py-8 text-center text-[13px] text-[#888]">No AutoTracks in this group.</p> : null}
      </div>
    </div>
  );
}


const BEHAVIORS: { group: string; items: string[] }[] = [
  {
    group: "General Behavior",
    items: [
      "Lead updated their phone number upon visit to the site.",
      "Lead submitted a Property Inquiry.",
      "Lead viewed the same property 3 times within 5 days.",
      "Lead opened an email after 30 days of inactivity.",
      "Lead hasn't logged in for 30 days and logs back in.",
      "Lead viewed any property 10 times within 7 days.",
      "Lead favorited 3 properties within 14 days.",
      "Lead submitted a home evaluation 7 or more days after registration.",
    ],
  },
  {
    group: "Pipeline Behavior",
    items: [
      "Lead in the sold pipeline returns to the site after a year or more.",
      "Lead in the contacted pipeline returns to the site after 30 days, and there have been no call notes applied and no appointments set.",
      "Lead moved to Appointment Set.",
      "Lead became an Active Client.",
    ],
  },
];

export function BehavioralView() {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const query = chrome.leadSearch.trim().toLowerCase();
  return (
    <div className="p-4">
      <div className="border border-[#e5e5e5] bg-white p-5 shadow-sm">
        <h2 className="text-[20px] font-bold text-[#243238]">Behavioral Messaging</h2>
        <div className="my-3 border-t border-dotted border-[#ccc]" />
        <p className="mb-4 text-[13px] text-[#333]">Automated Behavioral Messages are text + email communications sent to your leads when they take an action on your site. When a lead performs the action identified below, we will send them a text message. If they do not have a subscribed phone number, then we will send an email. We will only send one per day and only one of each type every two weeks.</p>
        {BEHAVIORS.map((group) => {
          const items = group.items.filter((item) => !query || item.toLowerCase().includes(query));
          if (!items.length) return null;
          return (
          <section key={group.group} className="mb-4">
            <div className="grid grid-cols-[1fr_90px_90px] bg-[#d7eef3] px-3 py-2 text-[13px] font-semibold">
              <span>{group.group}</span><span>Text</span><span>Email</span>
            </div>
            {items.map((item) => {
              const on = Boolean(state.behavioral[item]);
              return (
                <div key={item} className="grid grid-cols-[1fr_90px_90px] items-center border-b border-[#eee] px-3 py-3">
                  <div className="flex items-center gap-3">
                    <button type="button" className={`inline-flex h-6 w-10 items-center rounded-full px-0.5 ${on ? "justify-end bg-[#1c93b5]" : "justify-start bg-[#cfcfcf]"}`} aria-pressed={on} onClick={() => update((current) => ({ ...current, behavioral: { ...current.behavioral, [item]: !on } }))}>
                      <span className="h-5 w-5 rounded-full bg-white" />
                    </button>
                    <p className="text-[13px]">{item}</p>
                  </div>
                  <button type="button" className="text-left text-[13px] text-[#1c93b5]" onClick={() => chrome.openModal(<ModalFrame title="Text preview" onClose={chrome.closeModal}><p className="text-[13px]">{item}</p><p className="mt-2 text-[13px] text-[#555]">Hi, this is Kayla with Archibald Real Estate Group. Reply STOP to opt out.</p><div className="mt-3 text-right"><Btn kind="teal" onClick={chrome.closeModal}>Close</Btn></div></ModalFrame>)}>View</button>
                  <button type="button" className="text-left text-[13px] text-[#1c93b5]" onClick={() => chrome.openModal(<ModalFrame title="Email preview" onClose={chrome.closeModal}><p className="text-[13px] font-semibold">{item}</p><p className="mt-2 text-[13px] text-[#555]">Kayla Gerak · Archibald Real Estate Group · (604) 363-7858</p><div className="mt-3 text-right"><Btn kind="teal" onClick={chrome.closeModal}>Close</Btn></div></ModalFrame>)}>View</button>
                </div>
              );
            })}
          </section>
          );
        })}
      </div>
    </div>
  );
}

export function AiView() {
  const chrome = useChrome();
  const { update } = useCinc();
  const query = chrome.leadSearch.trim().toLowerCase();
  const ask = () => {
    update((current) => ({ ...current, integrations: { ...current.integrations, "CINC AI": true }, mail: [queuedMail({ kind: "email", to: "agent@example.com", subject: "CINC AI request", body: `Request received for ${CRM_AGENT.name}. Nothing is sent to a live model.` }), ...current.mail] }));
    chrome.openModal(<ModalFrame title="Get CINC AI" onClose={chrome.closeModal}><p className="text-[13px]">Request received for {CRM_AGENT.name}. A copy is in Sent. This demo does not call a live model.</p><div className="mt-3 text-right"><Btn kind="teal" onClick={chrome.closeModal}>Close</Btn></div></ModalFrame>);
  };
  const cards = [
    ["Behavioral Learning", "Adaptive conversations based on lead behavior captured within CINC CRM. The next message follows what the lead actually did."],
    ["Tested & Proven Scripts", "Uses scripts that have already been tried with similar leads."],
    ["Industry Leader", "Built for real estate teams that live in their CRM."],
  ].filter(([title, body]) => !query || `${title} ${body}`.toLowerCase().includes(query));
  return (
    <div className="bg-white px-8 py-8">
      <div className="grid gap-6 md:grid-cols-3">
        {cards.map(([title, body]) => (
          <article key={title} className="border border-[#e5e5e5] p-4">
            <h3 className="font-bold text-[#1c93b5]">{title}</h3>
            <p className="mt-2 text-[13px] text-[#555]">{body}</p>
          </article>
        ))}
      </div>
      <p className="mt-8 max-w-3xl text-[15px] leading-6 text-[#333]">CINC AI follows what a lead does in your CRM and drafts the next text or email from that activity.</p>
      <p className="mt-3 max-w-3xl text-[15px] leading-6 text-[#333]">Your team reviews the message before it sends, using scripts that have already been tried with similar leads.</p>
      <button type="button" className="mt-6 bg-[#1c93b5] px-4 py-2 text-[14px] font-semibold text-white" onClick={ask}>Get CINC AI</button>
    </div>
  );
}

function PropertyNav({ sub }: { sub: "list" | "text" | "open" | "virtual" | "add" }) {
  const items = [
    ["Listings Dashboard", href.properties, sub === "list"],
    ["Text Responder", href.textResponder, sub === "text"],
    ["Upcoming Open Houses", href.openHouses, sub === "open"],
    ["Virtual Open Houses", href.virtualOpenHouses, sub === "virtual"],
    ["Add Pocket Listing", href.addProperty, sub === "add"],
  ] as const;
  return (
    <div className="flex flex-wrap gap-4 border-b border-[#e5e5e5] bg-white px-4 py-2 text-[13px]">
      {items.map(([label, hrefValue, on]) => (
        <a key={label} href={hrefValue} className={on ? "border-b-2 border-[#1c93b5] font-semibold text-[#1c93b5]" : "text-[#555]"}>{label}</a>
      ))}
    </div>
  );
}

export function PropertiesView({ sub }: { sub: "list" | "text" | "open" | "virtual" | "add" }) {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const composer = useComposer();
  const [mode, setMode] = useState<"mls" | "pocket">("mls");
  const [office, setOffice] = useState("My Office/Agents Listings");
  const [statusFilter, setStatusFilter] = useState("Any");
  const [bedsFilter, setBedsFilter] = useState("Any");
  const [typeFilter, setTypeFilter] = useState("Any");
  const [priceFilter, setPriceFilter] = useState("Any");
  const nav = sub === "list" || sub === "add" ? <PropertyNav sub={sub} /> : null;
  if (sub === "text") return <TextResponder />;
  if (sub === "add") return <div>{nav}<AddPocket /></div>;
  if (sub === "virtual") {
    return (
      <div className="p-4">
        <div className="bg-white px-3 py-2 text-[13px] text-[#444]">No Virtual Open Houses found.</div>
      </div>
    );
  }
  if (sub === "open") {
    const extra = state.openHouses.filter((item) => !item.virtual);
    return (
      <div>
        <div className="space-y-3 p-4">
        {CRM_OPEN_HOUSES.map((item) => (
          <article key={item.id} className="border border-[#e5e5e5] bg-white">
            <div className="grid grid-cols-3 bg-[#d7eef3] py-1 text-center text-[12px] font-bold text-[#1c93b5]">
              <span>MLS Listing</span><span>Details</span><span>Showing</span>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3 text-[12px]">
              <div className="flex gap-2">
                <img src={item.image} alt="" className="h-[38px] w-[50px] border border-[#ddd] object-cover" />
                <div>
                  <p className="font-bold text-[#1c93b5]">{item.address}</p>
                  <p>MLS # {item.mls}</p>
                </div>
              </div>
              <div>
                <p className="font-bold">{item.price}</p>
                <p>{item.beds}bd | {item.baths}ba | {item.sqft.toLocaleString()} sqft</p>
                <p className="italic">Last updated {item.updated}</p>
              </div>
              <p>{item.when}</p>
            </div>
          </article>
        ))}
        {extra.map((item) => (
          <article key={item.id} className="border border-[#e5e5e5] bg-white p-3 text-[12px]">
            <p className="font-bold text-[#1c93b5]">{item.address}</p>
            <p>{item.when}</p>
          </article>
        ))}
      </div>
      </div>
    );
  }
  const query = chrome.leadSearch.trim().toLowerCase();
  const listings = (mode === "pocket"
    ? state.pocket.map((item) => ({ ...item, updated: "Just now", image: CRM_PROPERTIES[0].image }))
    : CRM_PROPERTIES.filter((item) => {
        if (office === "Featured Listings") return /feature/i.test(item.feature);
        if (office === "Listed in the past 24 hours") return item.status === "Active";
        if (office === "My Listings" || office === "Kayla Gerak") return Number(item.mls.slice(-1)) % 2 === 0;
        if (office === "Casey Archibald") return Number(item.mls.slice(-1)) % 2 === 1;
        return true;
      })
  ).filter((item) => !query || `${item.address} ${item.mls} ${item.feature}`.toLowerCase().includes(query))
    .filter((item) => statusFilter === "Any" || item.status === statusFilter)
    .filter((item) => bedsFilter === "Any" || item.beds >= Number(bedsFilter))
    .filter((item) => {
      if (priceFilter === "Any") return true;
      const price = Number(String(item.price).replace(/[^0-9.]/g, ""));
      if (priceFilter === "Under $1M") return price > 0 && price < 1_000_000;
      if (priceFilter === "$1M – $2M") return price >= 1_000_000 && price <= 2_000_000;
      return price > 2_000_000;
    });
  return (
    <div>
      {nav}
      <div className="flex">
        <aside className="w-44 shrink-0 border-r border-[#eee] bg-white p-3 text-[12px]">
          <p className="mb-2 font-bold">Agents</p>
          {["All", "Casey Archibald", "Kayla Gerak", "Anastasiia Borovyk", "Kevin Barrett"].map((name) => (
            <button key={name} type="button" className={`block w-full py-1 text-left ${office === name || (name === "All" && office === "All MLS Listings") ? "font-semibold text-[#1c93b5]" : ""}`} onClick={() => setOffice(name === "All" ? "All MLS Listings" : name)}>{name}</button>
          ))}
        </aside>
        <div className="min-w-0 flex-1 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 bg-white p-3 shadow-sm">
        <button type="button" className={`h-[22px] px-3 text-[12px] text-white ${mode === "mls" ? "bg-[#1c93b5]" : "bg-[#8fb8c4]"}`} onClick={() => setMode("mls")}>Show MLS Listings</button>
        <button type="button" className={`h-[22px] px-3 text-[12px] text-white ${mode === "pocket" ? "bg-[#1c93b5]" : "bg-[#8fb8c4]"}`} onClick={() => setMode("pocket")}>Show Pocket Listings</button>
        <select className="h-[22px] border border-[#ccc] bg-white px-1 text-[12px]" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Any</option><option>Active</option><option>Pending</option><option>Sold</option></select>
        <select className="h-[22px] border border-[#ccc] bg-white px-1 text-[12px]" value={bedsFilter} onChange={(event) => setBedsFilter(event.target.value)}><option>Any</option><option value="1">1+ beds</option><option value="2">2+ beds</option><option value="3">3+ beds</option><option value="4">4+ beds</option></select>
        <select className="h-[22px] border border-[#ccc] bg-white px-1 text-[12px]" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>Any</option><option>House</option><option>Condo</option><option>Townhouse</option></select>
        <select className="h-[22px] border border-[#ccc] bg-white px-1 text-[12px]" value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)}><option>Any</option><option>Under $1M</option><option>$1M – $2M</option><option>Over $2M</option></select>
        <Menu label={<span className={toolBtn}>{office} ▾</span>} items={["All MLS Listings", "My Office/Agents Listings", "Listed in the past 24 hours", "Featured Listings", "Casey Archibald", "Kayla Gerak"].map((label) => ({ label, onClick: () => setOffice(label) }))} />
        <Menu label={<span className={toolBtn}>Mass Actions ▾</span>} items={[
          { label: "Export visible listings", onClick: () => {
            const lines = ["Address,MLS,Status,Price", ...listings.map((item) => `"${item.address}",${item.mls},${item.status},${item.price}`)];
            const blob = new Blob([lines.join("\n")], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "listings.csv";
            link.click();
            URL.revokeObjectURL(url);
          } },
          { label: "Advertise visible listings", onClick: () => chrome.toast(listings.length ? `Advertising request saved for ${listings.length} listings.` : "No listings to advertise.") },
        ]} />
        <button type="button" className="ml-auto h-[22px] bg-[#1c93b5] px-3 text-[12px] text-white" onClick={() => chrome.openModal(<ModalFrame title="Advertise Listings" onClose={chrome.closeModal}><Field label="Subject"><input className={inputCls} defaultValue="New listings this week" /></Field><Field label="Message"><textarea className="h-20 w-full border border-[#ccc] p-2 text-[13px]" defaultValue={`Please review ${listings.length} listings.`} /></Field><div className="mt-3 text-right"><Btn kind="teal" onClick={() => { chrome.toast("Advertising request saved."); chrome.closeModal(); }}>Send</Btn></div></ModalFrame>)}>Advertise Listings</button>
        {mode === "pocket" ? <a href={href.addProperty} className="h-[22px] bg-[#1c93b5] px-3 text-[12px] leading-[22px] text-white">Add Pocket Listing</a> : null}
      </div>
      <div className="space-y-3">
        {listings.map((item) => (
          <article key={item.id} className="border border-[#e5e5e5] bg-white">
            <div className="relative grid grid-cols-4 bg-[#d7eef3] py-1 pr-8 text-center text-[12px] font-bold whitespace-nowrap text-[#1c93b5]">
              <span>MLS Listing</span><span>Details</span><span>Feature</span><span>Actions</span>
              <button type="button" title="Share" className="absolute top-1 right-2 text-[#1c93b5]" onClick={() => { navigator.clipboard?.writeText(item.address); chrome.toast("Listing link copied."); }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="4" cy="8" r="1.6" /><circle cx="12" cy="4" r="1.6" /><circle cx="12" cy="12" r="1.6" /><path d="M5.5 7.2 10.4 4.8M5.5 8.8l4.9 2.4" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 p-3 text-[12px]">
              <div className="flex gap-2">
                <img src={item.image} alt="" className="h-[38px] w-[50px] border border-[#ddd] object-cover" />
                <div>
                  <a className="font-bold text-[#1c93b5]" href="/search">{item.address}</a>
                  <p>MLS # {item.mls}</p>
                  <p>MLS Status: {item.status}</p>
                  <button type="button" className="text-[#1c93b5]" onClick={() => composer.email(item.address, (sent, value) => { const subject = value.subject || item.address; if (!sent) { update((current) => ({ ...current, mail: [{ id: uid("mail"), folder: "drafts" as const, kind: "email" as const, to: value.to, subject, body: value.body, at: nowLabel() }, ...current.mail] })); chrome.toast("Draft saved."); return; } void fetch("/api/office/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: "email", to: value.to, subject, body: `${item.address}\n${value.body}` }) }).then(async (response) => { const data = (await response.json().catch(() => null)) as { message?: string } | null; if (!response.ok) { chrome.toast(data?.message || "That email was not sent."); return false; } update((current) => ({ ...current, mail: [{ id: uid("mail"), folder: "sent" as const, kind: "email" as const, to: value.to, subject, body: value.body, at: nowLabel() }, ...current.mail] })); chrome.toast("Email sent."); return true; }); })}>Send Message</button>
                </div>
              </div>
              <div>
                <p className="font-bold">{item.price}</p>
                <p>{item.beds}bd | {item.baths}ba | {item.sqft.toLocaleString()} sqft</p>
                <p className="italic">Last updated {item.updated}</p>
              </div>
              <p>{item.feature}</p>
              <div className="flex flex-col items-start gap-1">
                <button type="button" className={toolBtn} onClick={() => update((current) => ({ ...current, buyerMatches: { ...current.buyerMatches, [item.id]: !current.buyerMatches[item.id] } }))}>{state.buyerMatches[item.id] ? "Matches on" : "Buyer Matches"}</button>
                <a className={toolBtn} href={href.textResponder}>Text Responder</a>
                {mode === "pocket" ? (
                  <>
                    <button type="button" className="font-semibold text-[#1c93b5]" onClick={() => {
                      const price = window.prompt("Price", item.price);
                      if (price == null) return;
                      update((current) => ({ ...current, pocket: current.pocket.map((pocket) => pocket.id === item.id ? { ...pocket, price } : pocket) }));
                    }}>EDIT</button>
                    <button type="button" className="font-semibold text-[#d9363e]" onClick={() => update((current) => ({ ...current, pocket: current.pocket.filter((pocket) => pocket.id !== item.id) }))}>DELETE</button>
                  </>
                ) : null}
              </div>
            </div>
          </article>
        ))}
        {!listings.length ? <p className="bg-white p-6 text-center text-[13px] text-[#888]">{mode === "pocket" ? "No pocket listings yet." : "No listings match."}</p> : null}
      </div>
        </div>
      </div>
    </div>
  );
}

function CampaignModal({ onClose }: { onClose: () => void }) {
  const { update } = useCinc();
  const chrome = useChrome();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [property, setProperty] = useState("Any listing");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  return (
    <ModalFrame title="New Campaign" onClose={onClose}>
      {error ? <p role="alert" className="mb-2 bg-[#fde7ec] px-2 py-1 text-[12px] text-[#c62828]">{error}</p> : null}
      <Field label="Campaign name"><input autoFocus className={inputCls} value={name} onChange={(event) => setName(event.target.value)} /></Field>
      <Field label="Texting number"><input className={inputCls} readOnly value="(604) 363-7858" /></Field>
      <Field label="Text response"><textarea className="h-24 w-full border border-[#ccc] p-2 text-[13px]" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Thanks for your interest. Reply STOP to opt out." /></Field>
      <Field label="Property">
        <select className={inputCls} value={property} onChange={(event) => setProperty(event.target.value)}>
          <option>Any listing</option>
          {CRM_PROPERTIES.map((item) => <option key={item.id}>{item.address}</option>)}
        </select>
      </Field>
      <Field label="Property text code"><input className={inputCls} value={code} onChange={(event) => setCode(event.target.value)} placeholder="TXT10" /></Field>
      <label className="mb-2 block text-[13px]"><input type="checkbox" defaultChecked /> Active</label>
      <div className="mt-3 flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind="teal" onClick={() => {
          if (!name.trim() || !message.trim()) { setError("Enter a campaign name and a text response."); return; }
          update((current) => ({ ...current, campaigns: [...current.campaigns, { id: uid("camp"), name: name.trim(), message: message.trim(), active: true, number: "(604) 363-7858", property, code: code.trim() || `TXT${current.campaigns.length + 10}` }] }));
          chrome.toast("Campaign saved.");
          onClose();
        }}>Save</Btn>
      </div>
    </ModalFrame>
  );
}

function TextResponder() {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const [line, setLine] = useState("778-200-5837");
  useEffect(() => {
    void fetch("/api/office/send", { cache: "no-store" }).then(async (response) => {
      const data = (await response.json().catch(() => null)) as { fromNumber?: string | null } | null;
      const digits = (data?.fromNumber || "").replace(/\D/g, "");
      const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
      if (local.length === 10) setLine(`${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`);
    }).catch(() => undefined);
  }, []);
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center">
        <h2 className="flex-1 text-center text-[16px] font-bold">Your texting number: {line}</h2>
        <button type="button" className="mr-2 h-[22px] bg-[#1c93b5] px-3 text-[12px] text-white" onClick={() => chrome.openModal(
          <ModalFrame title="Text templates" onClose={chrome.closeModal}>
            <ul className="max-h-64 space-y-2 overflow-auto text-[13px]">
              {state.templates.filter((item) => item.type === "Text").map((item) => (
                <li key={item.id} className="border border-[#eee] p-2">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-[#666]">{item.body || `Hi, this is Casey Archibald at Archibald Real Estate Group. ${item.name}. Call or text (604) 363-7858. Reply STOP to opt out.`}</p>
                </li>
              ))}
              {!state.templates.some((item) => item.type === "Text") ? <li>No text templates yet.</li> : null}
            </ul>
            <div className="mt-3 text-right"><Btn onClick={chrome.closeModal}>Close</Btn></div>
          </ModalFrame>
        )}>Templates</button>
        <button type="button" className="h-[22px] bg-[#1c93b5] px-3 text-[12px] text-white" onClick={() => chrome.openModal(<CampaignModal onClose={chrome.closeModal} />)}>New Campaign</button>
      </div>
      <table className="w-full border border-[#e5e5e5] bg-white text-left text-[12px]">
        <thead>
          <tr>{["Campaign", "Number", "Text Response", "Property", "Text Code", "Actions"].map((col) => <th key={col} className="border-r border-[#eee] px-2 py-2 font-semibold">{col}</th>)}</tr>
        </thead>
        <tbody>
          {state.campaigns.map((item) => (
            <tr key={item.id} className="border-t border-[#eee]">
              <td className="px-2 py-2">{item.name}</td>
              <td>{item.number || "(604) 363-7858"}</td>
              <td>{item.message}</td>
              <td>{item.property || "—"}</td>
              <td>{item.code || "—"}</td>
              <td>
                <button type="button" className="text-[#1c93b5]" onClick={() => update((current) => ({ ...current, campaigns: current.campaigns.map((camp) => camp.id === item.id ? { ...camp, active: !camp.active } : camp) }))}>{item.active ? "Pause" : "Resume"}</button>
                {" · "}
                <button type="button" className="text-[#d9363e]" onClick={() => update((current) => ({ ...current, campaigns: current.campaigns.filter((camp) => camp.id !== item.id) }))}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddPocket() {
  const { update } = useCinc();
  const chrome = useChrome();
  const [form, setForm] = useState({ address: "", city: "Vancouver", postal: "", price: "", beds: "3", baths: "2", sqft: "1400", lot: "", type: "House", year: "1998", status: "Active", agent: "Kayla Gerak", description: "" });
  const [error, setError] = useState("");
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-3 text-[18px] font-semibold">Add Pocket Listing</h1>
      <div className="bg-white p-4">
        {error ? <p role="alert" className="mb-2 bg-[#fde7ec] px-2 py-1 text-[12px] text-[#c62828]">{error}</p> : null}
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Street address"><input className={inputCls} value={form.address} onChange={(event) => set("address", event.target.value)} /></Field>
          <Field label="City"><input className={inputCls} value={form.city} onChange={(event) => set("city", event.target.value)} /></Field>
          <Field label="Postal code"><input className={inputCls} value={form.postal} onChange={(event) => set("postal", event.target.value)} /></Field>
          <Field label="Price"><input className={inputCls} value={form.price} onChange={(event) => set("price", event.target.value)} /></Field>
          <Field label="Beds"><input className={inputCls} value={form.beds} onChange={(event) => set("beds", event.target.value)} /></Field>
          <Field label="Baths"><input className={inputCls} value={form.baths} onChange={(event) => set("baths", event.target.value)} /></Field>
          <Field label="Sqft"><input className={inputCls} value={form.sqft} onChange={(event) => set("sqft", event.target.value)} /></Field>
          <Field label="Lot size"><input className={inputCls} value={form.lot} onChange={(event) => set("lot", event.target.value)} /></Field>
          <Field label="Property type">
            <select className={inputCls} value={form.type} onChange={(event) => set("type", event.target.value)}><option>House</option><option>Condo</option><option>Townhouse</option><option>Land</option></select>
          </Field>
          <Field label="Year built"><input className={inputCls} value={form.year} onChange={(event) => set("year", event.target.value)} /></Field>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={(event) => set("status", event.target.value)}><option>Active</option><option>Pending</option><option>Sold</option></select>
          </Field>
          <Field label="Listing agent">
            <select className={inputCls} value={form.agent} onChange={(event) => set("agent", event.target.value)}><option>Kayla Gerak</option><option>Casey Archibald</option><option>Anastasiia Borovyk</option><option>Kevin Barrett</option></select>
          </Field>
        </div>
        <Field label="Description"><textarea className="mt-2 h-24 w-full border border-[#ccc] p-2 text-[13px]" value={form.description} onChange={(event) => set("description", event.target.value)} /></Field>
        <div className="mt-3 flex justify-end gap-2">
          <a href={href.properties} className="inline-flex h-6 items-center border border-[#ccc] px-2 text-[12px]">Cancel</a>
          <Btn kind="teal" onClick={() => {
            if (!form.address.trim() || !form.price.trim()) { setError("Enter a street address and a price."); return; }
            update((current) => ({ ...current, pocket: [...current.pocket, { id: uid("pocket"), address: `${form.address}, ${form.city}`, mls: "POCKET", status: form.status, price: form.price, beds: Number(form.beds) || 0, baths: Number(form.baths) || 0, sqft: Number(form.sqft) || 0, feature: form.type }] }));
            chrome.toast("Pocket listing saved.");
            window.location.href = href.properties;
          }}>Save</Btn>
        </div>
      </div>
    </div>
  );
}

export function SellerView() {
  const office = useOfficeSession();
  const [sites, setSites] = useState<{ id: string; name: string; address: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  useEffect(() => {
    void loadOfficePrefs().then((prefs) => {
      if (Array.isArray(prefs.sellerSites)) setSites(prefs.sellerSites as { id: string; name: string; address: string }[]);
    });
  }, []);
  const allowed = !office.ready || !office.user || office.user.role === "admin" || office.user.role === "broker";
  if (!allowed) return <div className="p-4 text-[13px]">You do not have permission to edit Seller Suite pages</div>;
  return (
    <div className="p-4">
      <h1 className="text-[18px] font-semibold">Seller Suite</h1>
      <p className="mt-2 text-[13px] text-[#555]">Seller sites for this office.</p>
      <div className="mt-4 flex gap-2">
        <button type="button" className="bg-[#1c93b5] px-3 py-1 text-[13px] text-white" onClick={() => setCreating(false)}>View All Sites</button>
        <button type="button" className="border border-[#1c93b5] px-3 py-1 text-[13px] text-[#1c93b5]" onClick={() => setCreating(true)}>Add New Site</button>
      </div>
      {creating ? (
        <form className="mt-4 max-w-lg border border-[#1c93b5] bg-white p-4 text-[13px]" onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || !address.trim()) return;
          const next = [...sites, { id: `site-${Date.now()}`, name: name.trim(), address: address.trim() }];
          setSites(next);
          void saveOfficePrefs({ sellerSites: next });
          void fetch("/api/site/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sellerSites: next }) });
          setName("");
          setAddress("");
          setCreating(false);
        }}>
          <h2 className="mb-3 text-[16px] font-semibold">Create seller site</h2>
          <label className="mb-2 block">Site name<input className="mt-1 h-8 w-full border border-[#ccc] px-2" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="mb-3 block">Home address<input className="mt-1 h-8 w-full border border-[#ccc] px-2" value={address} onChange={(event) => setAddress(event.target.value)} /></label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCreating(false)}>Cancel</button>
            <button type="submit" className="bg-[#1c93b5] px-3 py-1 text-white">Create site</button>
          </div>
        </form>
      ) : (
        <div className="mt-4 border border-[#e5e5e5] bg-white">
          <h2 className="border-b border-[#eee] px-3 py-2 font-semibold">All sites</h2>
          {sites.length ? sites.map((site) => (
            <article key={site.id} className="flex items-center justify-between border-b border-[#f3f3f3] px-3 py-2 text-[13px]">
              <div>
                <p className="font-semibold">{site.name}</p>
                <p className="text-[#666]">{site.address}</p>
                <p className="text-[12px] text-[#1c93b5]">/seller-site/{site.id}</p>
              </div>
              <div className="flex gap-2">
                <a className="text-[#1c93b5]" href={`/seller-site/${site.id}`}>Visit</a>
                <button type="button" className="text-[#1c93b5]" onClick={() => { setCreating(true); setName(site.name); setAddress(site.address); }}>Editor</button>
                <button type="button" className="text-[#d9363e]" onClick={() => {
                const next = sites.filter((item) => item.id !== site.id);
                setSites(next);
                void saveOfficePrefs({ sellerSites: next });
                void fetch("/api/site/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sellerSites: next }) });
              }}>Remove</button>
              </div>
            </article>
          )) : <p className="px-3 py-6 text-[13px] text-[#666]">No seller sites yet. Use Add New Site to create one.</p>}
        </div>
      )}
    </div>
  );
}

export function WebsiteView({ page }: { page: string }) {
  const pages = [
    ["home", "Home", "/dashboard/spa#website/pages/home"],
    ["about", "About", "/dashboard/spa#website/pages/about"],
    ["branded", "Branded Site", "/dashboard/spa#website/pages/branded"],
    ["branded-about", "Branded About", "/dashboard/spa#website/pages/branded-about"],
    ["custom", "Add Custom Page", "/dashboard/spa#website/pages/custom"],
  ] as const;
  return (
    <div>
      <div className="flex flex-wrap gap-4 border-b border-[#e5e5e5] bg-white px-4 py-2 text-[13px]">
        {pages.map(([id, label, link]) => (
          <a key={id} href={link} className={page === id ? "font-semibold text-[#1c93b5]" : "text-[#555]"}>{label}</a>
        ))}
      </div>
      {page === "theme" ? <div className="p-4"><ThemeLayoutPicker /></div> : <PageEditor page={page} />}
    </div>
  );
}

function pageStats(_id: string) {
  return { leads: 0, views: 0, conv: 0 };
}

export function LandingView({ category }: { category: "all" | "buyers" | "sellers" | "contact" }) {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const [sort, setSort] = useState<"title" | "leads" | "views" | "conv">("title");
  const [dir, setDir] = useState<1 | -1>(1);
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  useEffect(() => {
    if (window.location.hash.includes("add")) setCreating(true);
  }, []);
  useEffect(() => {
    void fetch("/api/site/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ landingPages: state.landingPages }) });
  }, [state.landingPages]);
  const [pageQuery, setPageQuery] = useState("");
  const query = (pageQuery || chrome.leadSearch).trim().toLowerCase();
  const rows = state.landingPages
    .filter((page) => category === "all" || page.category === category)
    .filter((page) => !query || page.name.toLowerCase().includes(query))
    .sort((a, b) => {
      const as = pageStats(a.id);
      const bs = pageStats(b.id);
      const av = sort === "title" ? a.name : sort === "leads" ? as.leads : sort === "views" ? as.views : as.conv;
      const bv = sort === "title" ? b.name : sort === "leads" ? bs.leads : sort === "views" ? bs.views : bs.conv;
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  function head(label: string, key: typeof sort) {
    return (
      <button type="button" onClick={() => { if (sort === key) setDir((value) => (value === 1 ? -1 : 1)); else { setSort(key); setDir(1); } }}>
        {label} {key === "title" ? "▲" : "⇅"}
      </button>
    );
  }
  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap gap-4 border-b border-[#e5e5e5] pb-2 text-[13px]">
        <a href={href.landing} className={category === "all" ? "font-semibold text-[#1c93b5]" : "text-[#555]"}>All</a>
        <a href={href.landingCat("buyers")} className={category === "buyers" ? "font-semibold text-[#1c93b5]" : "text-[#555]"}>Buyers</a>
        <a href={href.landingCat("sellers")} className={category === "sellers" ? "font-semibold text-[#1c93b5]" : "text-[#555]"}>Sellers</a>
        <a href={href.landingCat("contact")} className={category === "contact" ? "font-semibold text-[#1c93b5]" : "text-[#555]"}>Contact</a>
      </div>
      <input className="mb-3 h-8 w-full max-w-sm border border-[#ccc] px-2 text-[13px]" placeholder="Search landing pages..." value={pageQuery} onChange={(event) => setPageQuery(event.target.value)} />
      <button type="button" className="mb-3 inline-flex h-[22px] items-center gap-1 bg-[#1c93b5] px-3 text-[12px] text-white" onClick={() => setCreating(true)}>⊕ Add Landing Page</button>
      {creating ? (
        <form className="mb-4 max-w-lg border border-[#1c93b5] bg-white p-4 text-[13px]" onSubmit={(event) => {
          event.preventDefault();
          const name = draftName.trim();
          if (!name) return;
          const cat = category === "all" ? "buyers" : category;
          update((current) => ({ ...current, landingPages: [...current.landingPages, { id: uid("lp"), name, category: cat, url: `/info/${name.toLowerCase().replace(/\s+/g, "-")}`, active: false }] }));
          setDraftName("");
          setCreating(false);
          chrome.toast("Landing page created.");
        }}>
          <h2 className="mb-3 text-[16px] font-semibold">Create Landing Page</h2>
          <label className="block">Name<input className="mt-1 h-8 w-full border border-[#ccc] px-2" value={draftName} onChange={(event) => setDraftName(event.target.value)} /></label>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setCreating(false)}>Cancel</button>
            <button type="submit" className="bg-[#1c93b5] px-3 py-1 text-white">Create</button>
          </div>
        </form>
      ) : null}
      <div className="mb-2 grid grid-cols-[1fr_70px_110px_90px_140px] px-3 text-[12px] font-bold">
        <span>{head("Title", "title")}</span>
        <span className="text-center">{head("Leads", "leads")}</span>
        <span className="text-center">{head("Unique Views", "views")}</span>
        <span className="text-center">{head("Conversion", "conv")}</span>
        <span />
      </div>
      <div className="space-y-2">
        {rows.map((page) => (
          <article key={page.id} className="grid grid-cols-[1fr_70px_110px_90px_140px] items-center bg-[#e8e8e8] px-3 py-2 shadow-sm">
            <div>
              <p className="text-[13px] font-bold">{page.name}</p>
              <p className="text-[11px]">Owner: CINC <span className="ml-1 bg-black px-1 text-[10px] text-white uppercase">{page.category}</span> {!page.active ? <span className="ml-1 bg-[#d9363e] px-1 text-[10px] text-white">Disabled</span> : null} <span className="ml-1 bg-[#1c93b5] px-1 text-[10px] text-white">CINC</span></p>
              <p className="text-[12px] text-[#1c93b5]">url: {page.url}</p>
            </div>
            <p className="text-center text-[13px] font-bold">{pageStats(page.id).leads}</p>
            <p className="text-center text-[13px] font-bold">{pageStats(page.id).views}</p>
            <p className="text-center text-[13px] font-bold">{pageStats(page.id).conv}%</p>
            <div className="flex justify-end gap-2">
              <button type="button" className="h-[22px] bg-[#1c93b5] px-3 text-[12px] text-white" onClick={() => {
                const name = window.prompt("Page name", page.name);
                if (!name) return;
                update((current) => ({ ...current, landingPages: current.landingPages.map((item) => item.id === page.id ? { ...item, name } : item) }));
              }}>Edit</button>
              <button type="button" className="border border-[#d9363e] px-2 py-0.5 text-[12px] text-[#d9363e]" onClick={() => update((current) => ({ ...current, landingPages: current.landingPages.filter((item) => item.id !== page.id) }))}>Remove</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

async function savePreferences(patch: Record<string, unknown>): Promise<string | null> {
  const response = await fetch("/api/office/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = (await response.json().catch(() => null)) as { message?: string } | null;
  return response.ok ? null : data?.message || "Could not save those settings.";
}

export function SettingsTabs({ active }: { active: string }) {
  const tabs: [string, string, string][] = [
    ["profile", "Profile", href.profile],
    ["settings", "Settings", href.settings],
    ["integrations", "Integrations", href.integrations],
    ["advanced", "Advanced", href.advanced],
    ["notifications", "Notifications", href.notifications],
    ["customlinks", "Custom Links", href.customLinks],
  ];
  return (
    <div className="mb-4 flex border border-[#c8c8c8] bg-[#f3f3f3] text-[13px]">
      {tabs.map(([id, label, link]) => (
        <a
          key={id}
          href={link}
          className={`flex-1 border-r border-[#d0d0d0] py-2.5 text-center last:border-r-0 ${active === id ? "border-t-[3px] border-t-[#1c93b5] bg-white font-semibold text-[#243238]" : "text-[#555] hover:bg-white"}`}
        >
          {label}
        </a>
      ))}
    </div>
  );
}

export function SettingsView({ tab }: { tab: "profile" | "settings" | "integrations" | "advanced" | "notifications" | "customlinks" | "general" | "searchpage" | "dialer" | "fields" | "theme" | "billing" }) {
  const { update } = useCinc();
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    fetch("/api/office/preferences", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as { preferences?: Record<string, unknown> } | null;
        const prefs = data?.preferences;
        if (!response.ok || !prefs) return;
        update((current) => ({
          ...current,
          settings: { ...current.settings, ...((prefs.settings as object) || {}) },
          notifications: { ...current.notifications, ...((prefs.notifications as object) || {}) },
          customLinks: Array.isArray(prefs.customLinks) ? prefs.customLinks as typeof current.customLinks : current.customLinks,
          advanced: { ...current.advanced, ...((prefs.advanced as object) || {}) },
        }));
      })
      .catch(() => undefined);
  }, [update]);
  return (
    <div className="p-4">
      {tab === "general" || tab === "searchpage" || tab === "dialer" || tab === "fields" || tab === "theme" || tab === "billing" ? <OfficeSettingsPage tab={tab} /> : <SettingsTabs active={tab} />}
      {tab === "profile" ? <ProfileTab /> : null}
      {tab === "settings" ? <SettingsTab /> : null}
      {tab === "integrations" ? <IntegrationsTab /> : null}
      {tab === "notifications" ? <NotificationsTab /> : null}
      {tab === "customlinks" ? <CustomLinksTab /> : null}
      {tab === "advanced" ? <AdvancedTab /> : null}
    </div>
  );
}

function ProfileTab() {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const office = useOfficeSession();
  const profile = state.profile;
  const set = (key: keyof typeof profile, value: string) => update((current) => ({ ...current, profile: { ...current.profile, [key]: value } }));
  const hydrated = useRef(false);
  useEffect(() => {
    const user = office.user;
    if (!user || hydrated.current) return;
    hydrated.current = true;
    queueMicrotask(() => {
      update((current) => ({
        ...current,
        profile: {
          ...current.profile,
          email: user.email,
          cell: user.cell,
          home: user.home,
          office: user.office,
          first: user.firstName,
          last: user.lastName,
          title: user.title,
          license: user.license,
          loan: user.loan,
          bio: user.bio,
          subdomain: user.subdomain,
          facebook: user.facebook,
          google: user.google,
          pinterest: user.pinterest,
          twitter: user.twitter,
          instagram: user.instagram,
          youtube: user.youtube,
          linkedin: user.linkedin,
          signature: user.signature,
        },
      }));
    });
  }, [office.user, update]);
  async function persist(okMessage: string) {
    if (!office.user || office.user.id === "bootstrap" || !office.database?.connected) {
      chrome.toast(office.database && !office.database.connected ? office.database.message : `${okMessage} on this device.`);
      return;
    }
    const current = state.profile;
    const response = await fetch(`/api/office/users/${office.user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: current.email,
        cell: current.cell,
        home: current.home,
        office: current.office,
        firstName: current.first,
        lastName: current.last,
        title: current.title,
        license: current.license,
        loan: current.loan,
        bio: current.bio,
        subdomain: current.subdomain,
        facebook: current.facebook,
        google: current.google,
        pinterest: current.pinterest,
        twitter: current.twitter,
        instagram: current.instagram,
        youtube: current.youtube,
        linkedin: current.linkedin,
        signature: current.signature,
      }),
    });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    chrome.toast(response.ok ? `${okMessage} Saved in the office database.` : data?.message || "Could not save your profile.");
    if (response.ok) office.refresh();
  }
  const [recoveryUrl, setRecoveryUrl] = useState<string | null>(null);
  const [recoveryNote, setRecoveryNote] = useState<string | null>(null);
  async function sendRecovery(channel: "email" | "text") {
    if (!office.user || office.user.id === "bootstrap" || !office.database?.connected) {
      chrome.toast(office.database && !office.database.connected ? office.database.message : "Recovery links need the office database.");
      return;
    }
    const response = await fetch(`/api/office/users/${office.user.id}/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "reset", channel }),
    });
    const data = (await response.json().catch(() => null)) as { url?: string; message?: string } | null;
    if (!response.ok || !data?.url) {
      chrome.toast(data?.message || "Could not create a recovery link.");
      return;
    }
    setRecoveryUrl(data.url);
    setRecoveryNote(data.message || "Copy this link.");
    chrome.toast(data.message || "Recovery link ready.");
  }
  const socials: [string, keyof typeof profile][] = [
    ["Facebook Page", "facebook"],
    ["Google+ Page", "google"],
    ["Pinterest Page", "pinterest"],
    ["Twitter Profile", "twitter"],
    ["Instagram Profile", "instagram"],
    ["YouTube Channel", "youtube"],
    ["LinkedIn Profile", "linkedin"],
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
      <Card title="Login Info">
        <div className="mb-2 flex items-center justify-between text-[13px]"><span>Email</span><span>{profile.email}</span></div>
        <div className="mb-3 flex items-center justify-between text-[13px]"><span className="font-bold">Cell Phone</span><span>{profile.cell || "—"}</span></div>
        <OfficeLine />
        <PasswordReset />
        <div className="mt-3 flex justify-end gap-2">
          <Btn kind="blue" onClick={() => void sendRecovery("email")}>Send Email Recovery Link</Btn>
          <Btn kind="blue" onClick={() => void sendRecovery("text")}>Send Text Recovery Link</Btn>
        </div>
        {recoveryUrl ? (
          <div className="mt-3 border border-[#1c93b5] bg-[#f3fafc] p-3 text-[13px]">
            <p className="font-semibold text-[#243238]">{recoveryNote}</p>
            <p className="mt-1 break-all text-[#1c93b5]">{recoveryUrl}</p>
          </div>
        ) : null}
      </Card>
      <Card title="Site Subdomain">
        <label className="mb-1 block text-right text-[12px]">Subdomain</label>
        <input className={inputCls} value={profile.subdomain} onChange={(event) => set("subdomain", event.target.value)} />
        <p className="mt-1 text-[12px]">.greatervancouverhomesearch.com</p>
        <div className="mt-2 text-right"><Btn kind="blue" onClick={() => void persist("Subdomain saved.")}>Update</Btn></div>
      </Card>
      <Card title="Agent CINC Number">
        <CincNumberField />
      </Card>
      <Card title="Agent Links & Social Media">
        {socials.map(([label, key]) => (
          <label key={key} className="mb-2 grid grid-cols-[140px_1fr] items-center gap-2 text-[12px]">
            <span className="text-right">{label}</span>
            <input className={inputCls} value={profile[key]} onChange={(event) => set(key, event.target.value)} />
          </label>
        ))}
        <div className="text-right"><Btn kind="blue" onClick={() => void persist("Social links saved.")}>Update</Btn></div>
      </Card>
      </div>
      <div className="space-y-4">
      <Card title="Personal Info">
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="First name"><input className={inputCls} value={profile.first} onChange={(event) => set("first", event.target.value)} /></Field>
          <Field label="Last name"><input className={inputCls} value={profile.last} onChange={(event) => set("last", event.target.value)} /></Field>
          <Field label="Home phone"><input className={inputCls} value={profile.home} onChange={(event) => set("home", event.target.value)} /></Field>
          <Field label="Office phone"><input className={inputCls} value={profile.office} onChange={(event) => set("office", event.target.value)} /></Field>
          <Field label="Title"><input className={inputCls} value={profile.title} onChange={(event) => set("title", event.target.value)} /></Field>
          <Field label="License number"><input className={inputCls} value={profile.license} onChange={(event) => set("license", event.target.value)} /></Field>
        </div>
        <Field label="Loan app URL"><input className={inputCls} value={profile.loan} onChange={(event) => set("loan", event.target.value)} /></Field>
        <Field label="Photo">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-[#1c93b5] text-[#1c93b5]">
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="8" cy="6" r="2.2" /><path d="M3 13c.7-2.2 2.4-3.2 5-3.2s4.3 1 5 3.2" /></svg>
            </span>
            <label className="inline-flex h-9 cursor-pointer items-center border border-[#1c93b5] px-3 text-[13px] text-[#1c93b5]">
              Select File
              <input className="sr-only" type="file" onChange={(event) => set("photoName", event.target.files?.[0]?.name || "")} />
            </label>
            {profile.photoName ? <span className="text-[12px] text-[#666]">{profile.photoName}</span> : null}
          </div>
        </Field>
        <Field label="Biography"><textarea className="h-20 w-full border border-[#ccc] p-2 text-[13px]" value={profile.bio} onChange={(event) => set("bio", event.target.value)} /></Field>
        <div className="text-right"><Btn kind="blue" onClick={() => void persist("Personal info saved.")}>Update</Btn></div>
      </Card>
      <Card title="Signature">
        <p className="mb-1 text-[12px] text-[#888]">Paragraph · 12pt</p>
        <textarea className="h-24 w-full border border-[#ccc] p-2 text-[13px]" value={profile.signature} onChange={(event) => set("signature", event.target.value)} />
        <div className="mt-2 text-right"><Btn kind="blue" onClick={() => void persist("Signature saved.")}>Update</Btn></div>
      </Card>
      </div>
    </div>
  );
}

function PasswordReset() {
  const office = useOfficeSession();
  const chrome = useChrome();
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [message, setMessage] = useState("");
  const rules = [
    next.length >= 8,
    /[A-Za-z]/.test(next) && /\d/.test(next),
    next.length > 0 && next === again,
  ];
  return (
    <div className="mt-3 border-t border-[#eee] pt-3 text-[13px]">
      <label className="mb-2 block">New Password<input type="password" className={inputCls} value={next} onChange={(event) => setNext(event.target.value)} autoComplete="new-password" /></label>
      <label className="mb-2 block">Reenter Password<input type="password" className={inputCls} value={again} onChange={(event) => setAgain(event.target.value)} autoComplete="new-password" /></label>
      <p className="mb-1 font-semibold">Password Requirements</p>
      <ul className="mb-2 list-disc pl-5 text-[12px]">
        <li className={rules[0] ? "text-[#2e9e5b]" : ""}>At least 8 characters</li>
        <li className={rules[1] ? "text-[#2e9e5b]" : ""}>A letter and a number</li>
        <li className={rules[2] ? "text-[#2e9e5b]" : ""}>The two passwords match</li>
      </ul>
      <Btn kind="blue" disabled={!rules.every(Boolean)} onClick={() => {
        if (!office.user) { setMessage("Sign in to reset the password."); return; }
        void fetch(`/api/office/users/${office.user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: next }),
        }).then(async (response) => {
          const data = (await response.json().catch(() => null)) as { message?: string } | null;
          const text = response.ok ? "Password updated." : data?.message || "Could not reset the password.";
          setMessage(text);
          chrome.toast(text);
          if (response.ok) { setNext(""); setAgain(""); }
        });
      }}>Reset Password</Btn>
      {message ? <p className="mt-2 text-[12px] text-[#1c93b5]">{message}</p> : null}
    </div>
  );
}

function CincNumberField() {
  const [value, setValue] = useState(AGENT_NUMBER);
  const [note, setNote] = useState("");
  useEffect(() => {
    void loadOfficePrefs().then((prefs) => {
      if (typeof prefs.cincNumber === "string" && prefs.cincNumber) setValue(prefs.cincNumber);
    });
  }, []);
  return (
    <>
      <input className={inputCls} value={value} onChange={(event) => setValue(event.target.value)} />
      <div className="mt-2 text-right"><Btn kind="blue" onClick={() => { void saveOfficePrefs({ cincNumber: value }).then((error) => setNote(error || "Agent CINC number saved.")); }}>Update</Btn></div>
      {note ? <p className="mt-2 text-[12px] text-[#1c93b5]">{note}</p> : null}
    </>
  );
}

function OfficeLine() {
  const [line, setLine] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    void fetch("/api/office/send", { cache: "no-store" }).then(async (response) => {
      const data = (await response.json().catch(() => null)) as { fromNumber?: string | null } | null;
      setLine(data?.fromNumber || null);
    }).catch(() => setLine(null));
  }, []);
  return (
    <p className="mb-3 text-[13px]">
      {line === undefined ? "Checking the calling line…" : line ? `Calls and texts from a lead use ${line}.` : "Calling and texting are not connected."}
    </p>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-[#1c93b5] bg-[#e6e6e6] p-4">
      <h2 className="mb-3 text-center text-[20px] font-bold tracking-tight text-[#243238]">{title}</h2>
      <div className="bg-white p-4">{children}</div>
    </section>
  );
}

function SettingsTab() {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const form = state.settings;
  const set = (key: keyof typeof form, value: string) => update((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
  const left: [string, keyof typeof form, string[]][] = [
    ["Lead Text Alerts", "leadTextAlerts", ["Disabled", "Enabled"]],
    ["Plain Text Emails", "plainText", ["No", "Yes"]],
    ["Chat Notifications", "chat", ["Disabled", "Enabled"]],
    ["Contact Info Notification", "contactInfo", ["No", "Yes"]],
    ["Receive Lead Summary", "leadSummary", ["No", "Yes"]],
    ["...how often?", "summaryOften", ["Daily", "Weekly", "Monthly"]],
  ];
  const right: [string, keyof typeof form, string[]][] = [
    ["Login Landing Page", "landing", ["Leads Dashboard", "Launchpad"]],
    ["User Usage Report", "usageReport", ["Off", "On"]],
    ["Property View Report", "viewReport", ["Off", "On"]],
  ];
  return (
    <div className="border border-[#e5e5e5] bg-white p-4">
      <div className="grid gap-8 md:grid-cols-2">
        <div>{left.map(([label, key, options]) => (
          <label key={key} className="mb-3 grid grid-cols-[1fr_300px] items-center gap-3 text-[16px]">
            <span className="text-right font-bold">{label}</span>
            <select className="h-10 border border-[#ccc] bg-white px-2 text-[16px]" value={form[key]} onChange={(event) => set(key, event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select>
          </label>
        ))}</div>
        <div>
          {right.map(([label, key, options]) => (
            <label key={key} className="mb-3 grid grid-cols-[1fr_300px] items-center gap-3 text-[16px]">
              <span className="text-right font-bold">{label}</span>
              <select className="h-10 border border-[#ccc] bg-white px-2 text-[16px]" value={form[key]} onChange={(event) => set(key, event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select>
            </label>
          ))}
          <label className="mb-3 grid grid-cols-[1fr_300px] items-center gap-3 text-[16px]">
            <span className="text-right font-bold">Property View Count</span>
            <input className="h-10 border border-[#ccc] px-2 text-[16px]" inputMode="numeric" value={form.viewCount} onChange={(event) => set("viewCount", event.target.value.replace(/[^0-9]/g, ""))} />
          </label>
          <label className="mb-3 grid grid-cols-[1fr_300px] items-center gap-3 text-[16px]">
            <span className="text-right font-bold">Property View Notes</span>
            <select className="h-10 border border-[#ccc] bg-white px-2 text-[16px]" value={form.viewNotes} onChange={(event) => set("viewNotes", event.target.value)}><option>Off</option><option>On</option></select>
          </label>
          <p className="grid grid-cols-[1fr_300px] text-[13px]"><span className="text-right font-bold">Agent MDID</span><strong className="pl-3 font-mono text-[12px]">{MDID}</strong></p>
        </div>
      </div>
      <div className="mt-4 text-right"><Btn kind="blue" onClick={() => { void savePreferences({ settings: form }).then((error) => chrome.toast(error || "Settings saved.")); }}>Update</Btn></div>
    </div>
  );
}

function BrandLogo({ name }: { name: string }) {
  if (name === "Google") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.6a4.8 4.8 0 0 1-2.1 3.2v2.6h3.4c2-1.8 3.1-4.5 3.1-7.6z" />
        <path fill="#34A853" d="M12 23c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M6.2 14.6A6.6 6.6 0 0 1 5.8 12c0-.9.1-1.8.4-2.6V6.7H2.7A11 11 0 0 0 1 12c0 1.8.4 3.5 1.2 5l4-2.4z" />
        <path fill="#EA4335" d="M12 5.4c1.5 0 2.9.5 4 1.5l3-3A11 11 0 0 0 2.7 6.7l3.5 2.7C7 7.2 9.3 5.4 12 5.4z" />
      </svg>
    );
  }
  if (name === "Slack") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path fill="#E01E5A" d="M8 15.5A2.5 2.5 0 1 1 5.5 13H8z" /><path fill="#E01E5A" d="M9 15.5A2.5 2.5 0 1 1 11.5 18V16" />
        <path fill="#36C5F0" d="M8.5 8A2.5 2.5 0 1 1 11 5.5V8z" /><path fill="#36C5F0" d="M8.5 9A2.5 2.5 0 1 1 6 11.5H8" />
        <path fill="#2EB67D" d="M16 8.5A2.5 2.5 0 1 1 18.5 11H16z" /><path fill="#2EB67D" d="M15 8.5A2.5 2.5 0 1 1 12.5 6v2" />
        <path fill="#ECB22E" d="M15.5 16A2.5 2.5 0 1 1 13 18.5V16z" /><path fill="#ECB22E" d="M15.5 15A2.5 2.5 0 1 1 18 12.5H16" />
      </svg>
    );
  }
  const tone = name.startsWith("Zillow") ? "#006aff" : name === "Zapier" ? "#ff4a00" : name === "Dotloop" ? "#1f4b99" : name === "Mojo" ? "#111" : name === "API Nation" ? "#6b4eff" : name === "CRM Connect" ? "#1c93b5" : "#333";
  const mark = name === "Zapier" ? "⚡" : name.startsWith("Zillow") ? "Z" : name === "Dotloop" ? "dl" : name === "Mojo" ? "M" : name === "API Nation" ? "AN" : name === "CRM Connect" ? "CC" : "✉";
  return <span className="grid h-6 min-w-6 place-items-center rounded px-1 text-[11px] font-bold text-white" style={{ background: tone }}>{mark}</span>;
}

function IntegrationsTab() {
  const { state, update } = useCinc();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div>
      {INTEGRATIONS.map((name) => (
        <section key={name} className="mb-2 border border-[#eee] bg-white shadow-sm">
          <button type="button" className="flex h-12 w-full items-center justify-between px-4 text-left" onClick={() => setOpen(open === name ? null : name)}>
            <span className="flex items-center gap-3">
              <BrandLogo name={name} />
              <span className={name === "External Email Tracking" ? "text-[15px] font-bold text-[#222]" : "text-[15px] text-[#333]"}>{name}</span>
            </span>
            <span className="text-[18px] text-[#888]">▾</span>
          </button>
          {open === name ? (
            <div className="px-4 pb-4 text-[13px]">
              <p className="mb-2 text-[#555]">Connect {name} for this demo account. Nothing is sent to {name}.</p>
              <Btn kind="teal" onClick={() => update((current) => ({ ...current, integrations: { ...current.integrations, [name]: !current.integrations[name] } }))}>
                {state.integrations[name] ? "Disconnect" : "Connect"}
              </Btn>
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}

function PondModal({ onClose }: { onClose: () => void }) {
  const { state, update } = useCinc();
  const names = ["Anastasiia Borovyk", "Casey Archibald", "Cassie Kang", "Kevin Barrett", "Chantel Machnik"];
  return (
    <ModalFrame title="Pond agent notifications" onClose={onClose}>
      <p className="mb-2 text-[13px] text-[#666]">Kayla Gerak owns the pond. A checked agent gets an in-office copy. Pond alerts are not texted.</p>
      {names.map((name) => {
        const on = Boolean(state.notifications[`pond:${name}`]?.cinc);
        return (
          <label key={name} className="flex items-center gap-2 py-1 text-[13px]">
            <input
              type="checkbox"
              checked={on}
              onChange={() => update((current) => ({
                ...current,
                notifications: { ...current.notifications, [`pond:${name}`]: { cinc: !on, email: false, text: false } },
              }))}
            />
            {name}
          </label>
        );
      })}
      <div className="mt-3 text-right"><Btn kind="teal" onClick={onClose}>Done</Btn></div>
    </ModalFrame>
  );
}

function NotificationsTab() {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const [dest, setDest] = useState<{ alertEmail: string | null; agentEmail: string; channels: { email: boolean; sms: boolean } } | null>(null);
  const [alerts, setAlerts] = useState<{ id: string; title: string; body: string; createdAt: string }[]>([]);
  function loadAlerts() {
    void fetch("/api/office/notifications", { cache: "no-store" }).then(async (response) => {
      const data = (await response.json().catch(() => null)) as { alertEmail?: string | null; agentEmail?: string; channels?: { email: boolean; sms: boolean }; alerts?: { id: string; title: string; body: string; createdAt: string }[] } | null;
      if (!response.ok || !data) return;
      setDest({ alertEmail: data.alertEmail ?? null, agentEmail: data.agentEmail || "", channels: data.channels || { email: false, sms: false } });
      setAlerts(data.alerts || []);
    });
  }
  useEffect(() => { loadAlerts(); }, []);
  return (
    <div className="bg-white p-4">
      <h2 className="text-[13px] font-bold tracking-wide">WHERE ALERTS GO</h2>
      <div className="my-3 border border-[#1c93b5] bg-[#f3fafc] p-3 text-[13px] leading-5">
        <p><strong>New leads:</strong> an in-app office alert, plus one email to {dest?.alertEmail || "the office alert mailbox (not set yet)"}. No text is sent.</p>
        <p className="mt-1"><strong>Other agent alerts:</strong> the office alert list on this page. Email, when that box is checked, goes to {dest?.agentEmail || "the signed-in agent"}. {dest?.channels.email ? "Email sending is connected." : "Email sending is not connected, so those boxes stay in the office list only."}</p>
        <p className="mt-1"><strong>Text:</strong> agent notifications are not texted. Calling and texting a lead uses the office line{dest?.channels.sms ? "" : ", which is not connected"}.</p>
      </div>
      {alerts.length ? (
        <ul className="mb-4 max-h-40 overflow-auto border border-[#eee]">
          {alerts.slice(0, 8).map((item) => (
            <li key={item.id} className="border-b border-[#f0f0f0] px-2 py-1 text-[12px]"><span className="font-semibold">{item.title}</span> <span className="text-[#666]">{item.body.slice(0, 140)}</span></li>
          ))}
        </ul>
      ) : <p className="mb-3 text-[12px] text-[#666]">No office alerts yet.</p>}
      <h2 className="text-[13px] font-bold tracking-wide">MASTER SETTINGS</h2>
      <div className="my-3 border border-[#eee] p-3">
        <p className="mb-2 text-[12px] font-bold">Subscription</p>
        {(["cinc", "email", "text"] as const).map((key) => (
          <label key={key} className="mr-4 text-[13px] capitalize" title={key === "text" ? "Agent alerts are not texted." : undefined}>
            <input type="checkbox" disabled={key === "text"} checked={key === "text" ? false : Boolean(state.notifications.subscription?.[key] ?? true)} onChange={() => {
              if (key === "text") return;
              const current = state.notifications.subscription ?? { cinc: true, email: true, text: false };
              const subscription = { ...current, [key]: !current[key] };
              update((next) => ({ ...next, notifications: { ...next.notifications, subscription } }));
            }} /> {key === "cinc" ? "In the office" : key === "email" ? "Email" : "Text off"}
          </label>
        ))}
        <div className="mt-3"><Btn kind="teal" onClick={() => { void savePreferences({ notifications: state.notifications }).then((error) => chrome.toast(error || "Notifications updated.")); }}>Update</Btn></div>
      </div>
      {NOTIFY_GROUPS.map((group) => (
        <section key={group.title} className="mb-4">
          <h3 className="mb-2 text-[11px] font-bold tracking-wide uppercase">{group.title}</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {group.items.map((item) => {
              const pref = state.notifications[item.id] ?? { cinc: false, email: false, text: true };
              const toggle = (key: "cinc" | "email" | "text") => {
                const next = { ...pref, [key]: !pref[key] };
                const notifications = { ...state.notifications, [item.id]: next };
                update((current) => ({ ...current, notifications }));
                void savePreferences({ notifications }).then((error) => {
                  if (error) chrome.toast(error);
                });
              };
              return (
                <article key={item.id} className="relative bg-[#f3f3f3] p-3">
                  <button type="button" className="absolute top-2 right-2 bg-[#1c93b5] px-1 text-[10px] text-white" onClick={() => { void fetch("/api/office/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: item.id, email: item.id === "New Leads" ? true : pref.email }) }).then(async (response) => { const data = (await response.json().catch(() => null)) as { message?: string } | null; chrome.toast(data?.message || "Test saved in the office alert list."); loadAlerts(); }); }}>TEST</button>
                  <p className="pr-10 text-[13px] font-bold">{item.id}</p>
                  <p className="mt-1 text-[12px] text-[#666]">{item.description}</p>
                  <div className="mt-2 flex gap-3 text-[11px]">
                    {(["cinc", "email", "text"] as const).filter((key) => !item.channels || item.channels.includes(key)).map((key) => (
                      <label key={key} title={key === "text" ? "Agent alerts are not texted." : undefined}><input type="checkbox" checked={key === "text" ? false : pref[key]} disabled={key === "text"} onChange={() => { if (key !== "text") toggle(key); }} /> {key === "cinc" ? "In the office" : key === "email" ? "Email" : "Text off"}</label>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function AdvancedTab() {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const form = state.advanced;
  const set = (key: string, value: string) => update((current) => ({ ...current, advanced: { ...current.advanced, [key]: value } }));
  const left: [string, string, string[] | null][] = [
    ["Status", "status", ["Active", "Inactive", "On Vacation", "Disabled"]],
    ["User Level", "userLevel", ["Agent", "ListingAgent", "Partner", "Broker"]],
    ["Dialer Daily Summary", "dialerSummary", ["Enabled", "Disabled"]],
    ["Featured", "featured", ["Yes", "No"]],
    ["Featured Order", "featuredOrder", null],
    ["Enable Blogging", "blogging", ["Yes", "No"]],
    ["License Number", "licenseNumber", null],
  ];
  return (
    <div className="border border-[#ddd] bg-white p-4">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          {left.map(([label, key, options]) => (
            <label key={key} className="mb-3 grid grid-cols-[180px_1fr] items-center gap-2 text-[14px]">
              <span className="text-right font-bold">{label}</span>
              {options ? (
                <select className="h-9 border border-[#ccc] px-2" value={String((form as Record<string, string>)[key] || options[0])} onChange={(event) => set(key, event.target.value)}>
                  {options.map((option) => <option key={option}>{option}</option>)}
                </select>
              ) : (
                <input className="h-9 border border-[#ccc] px-2" value={String((form as Record<string, string>)[key] || "")} onChange={(event) => set(key, key === "featuredOrder" ? event.target.value.replace(/[^\d]/g, "") : event.target.value)} />
              )}
            </label>
          ))}
        </div>
        <div>
          {([
            ["Lead Alert CC", "leadAlertCc"],
            ["Listing Alert Lead Alert CC", "listingAlertCc"],
            ["Company Name", "companyName"],
            ["CANADAWEST Agent ID", "canadawestId"],
          ] as const).map(([label, key]) => (
            <label key={key} className="mb-3 grid grid-cols-[200px_1fr] items-center gap-2 text-[14px]">
              <span className="text-right font-bold">{label}</span>
              <input className="h-9 border border-[#ccc] px-2" value={String((form as Record<string, string>)[key] || "")} onChange={(event) => set(key, event.target.value)} />
            </label>
          ))}
          <label className="mb-3 grid grid-cols-[200px_1fr] items-center gap-2 text-[14px]">
            <span className="text-right font-bold">Assigned Pond</span>
            <select className="h-9 border border-[#ccc] px-2" value={form.assignedPond || "--None--"} onChange={(event) => set("assignedPond", event.target.value)}>
              <option>--None--</option>
              <option>Kayla Gerak</option>
            </select>
          </label>
        </div>
      </div>
      <div className="text-right"><Btn kind="blue" onClick={() => { void savePreferences({ advanced: state.advanced }).then((error) => chrome.toast(error || "Advanced settings saved.")); }}>Update</Btn></div>
    </div>
  );
}

function OfficeSettingsPage({ tab }: { tab: "general" | "searchpage" | "dialer" | "fields" | "theme" | "billing" }) {
  if (tab === "general") return <OfficeGeneralSettings />;
  if (tab === "searchpage") return <SearchSettingsPanel />;
  if (tab === "dialer") return <DialerSettingsPanel />;
  if (tab === "theme") return <ThemeLayoutPicker />;
  if (tab === "billing") return <BillingPlaceholder />;
  return <CustomFieldsPanel />;
}

function CustomLinksTab() {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  return (
    <div className="border border-[#e5e5e5] bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px]">For my subdomain:</h2>
        <div className="flex gap-2">
          <button type="button" className="h-[22px] bg-[#1c93b5] px-3 text-[12px] text-white" onClick={() => setCreating(true)}>✚ Create</button>
          <button type="button" className="h-[22px] bg-[#1c93b5] px-3 text-[12px] text-white" onClick={() => {
            const customLinks = label.trim() ? [...state.customLinks, { id: uid("link"), label, url }] : state.customLinks;
            if (label.trim()) {
              update((current) => ({ ...current, customLinks }));
              setLabel("");
              setUrl("");
              setCreating(false);
            }
            void savePreferences({ customLinks }).then((error) => chrome.toast(error || "Custom links saved."));
          }}>Save</button>
        </div>
      </div>
      {creating ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <input className="h-7 border border-[#ccc] px-2 text-[12px]" placeholder="Label" value={label} onChange={(event) => setLabel(event.target.value)} />
          <input className="h-7 border border-[#ccc] px-2 text-[12px]" placeholder="https://" value={url} onChange={(event) => setUrl(event.target.value)} />
          <Btn onClick={() => { if (!label.trim()) return; update((current) => ({ ...current, customLinks: [...current.customLinks, { id: uid("link"), label, url }] })); setLabel(""); setUrl(""); setCreating(false); }}>Add</Btn>
        </div>
      ) : null}
      {state.customLinks.length ? (
        <ul className="mt-3">{state.customLinks.map((link) => (
          <li key={link.id} className="flex items-center justify-between border-t border-[#eee] py-2 text-[13px]">
            <span>{link.label} — {link.url}</span>
            <button type="button" className="text-[#d9363e]" onClick={() => update((current) => ({ ...current, customLinks: current.customLinks.filter((item) => item.id !== link.id) }))}>Delete</button>
          </li>
        ))}</ul>
      ) : null}
    </div>
  );
}

export function PlansView() {
  const { state, update } = useCinc();
  return (
    <div className="grid gap-4 p-6 md:grid-cols-2">
      {[["agent", "CINC Agent"], ["team", "CINC Team"]].map(([id, label]) => (
        <article key={id} className="bg-white p-5">
          <h2 className="text-[18px] font-semibold">{label}</h2>
          <p className="mt-1 text-[13px] text-[#666]">{id === "agent" ? "One agent seat for Kayla Gerak." : "Shared inbox and pond routing for the team."}</p>
          <button type="button" className={`mt-3 px-3 py-1 text-[13px] text-white ${state.plan === id ? "bg-[#2e9e5b]" : "bg-[#1c93b5]"}`} onClick={() => update((current) => ({ ...current, plan: id as "agent" | "team" }))}>{state.plan === id ? "Current plan" : "Select"}</button>
        </article>
      ))}
    </div>
  );
}

export function DialerView() {
  const { leads } = useLeads();
  const chrome = useChrome();
  const [index, setIndex] = useState(0);
  const [voice, setVoice] = useState<boolean | null>(null);
  const [fromNumber, setFromNumber] = useState<string | null>(null);
  const people = [...leads.map((lead) => ({ id: lead.id, name: lead.name, phone: lead.phone })), ...[{ id: "crm-1", name: "Morgan Ellis", phone: "(604) 555-0188" }]];
  const current = people[index];
  useEffect(() => {
    void fetch("/api/office/send", { cache: "no-store" }).then(async (response) => {
      const data = (await response.json().catch(() => null)) as { channels?: { voice?: boolean }; fromNumber?: string | null } | null;
      setVoice(Boolean(data?.channels?.voice));
      setFromNumber(data?.fromNumber || null);
    });
  }, []);
  async function call() {
    if (!current?.phone) return;
    const response = await fetch("/api/office/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "voice", to: current.phone, body: `Call ${current.name}` }),
    });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    chrome.toast(response.ok ? `Twilio is calling ${current.phone}.` : data?.message || "That call was not placed.");
    if (response.ok) setIndex((value) => (value + 1) % people.length);
  }
  return (
    <div className="mx-auto max-w-lg p-6">
      <div className="bg-white p-5 text-center">
        <p className="text-[12px] uppercase text-[#888]">Dialer</p>
        {voice === false ? <p className="mt-2 bg-[#fff6e5] px-3 py-2 text-left text-[13px] text-[#8a5a00]">Calling is not connected.</p> : <p className="mt-2 text-[13px] text-[#555]">Calls leave from {fromNumber || "the office line"}.</p>}
        <p className="mt-2 text-[20px] font-semibold">{current?.name}</p>
        <p className="text-[#1c93b5]">{current?.phone}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Btn kind="teal" disabled={voice === false} onClick={() => void call()}>Call with Twilio</Btn>
          <Btn onClick={() => setIndex((value) => (value + 1) % people.length)}>Skip</Btn>
        </div>
      </div>
    </div>
  );
}

function CalendarAppointmentForm({
  dayLabel,
  when,
  existing,
  onClose,
}: {
  dayLabel: string;
  when: string;
  existing?: { id: string; title: string; when: string; agent?: string; eventType?: string; location?: string; end?: string; message?: string; isPrivate?: boolean };
  onClose: () => void;
}) {
  const { update } = useCinc();
  const chrome = useChrome();
  const [title, setTitle] = useState(existing?.title || "");
  const office = useOfficeSession();
  const [agent, setAgent] = useState(existing?.agent || office.user?.name || "Casey Archibald");
  const [eventType, setEventType] = useState(existing?.eventType || "Showing");
  const [location, setLocation] = useState(existing?.location || "");
  const [start, setStart] = useState(existing?.when || when);
  const [end, setEnd] = useState(existing?.end || when);
  const [message, setMessage] = useState(existing?.message || "");
  const [isPrivate, setPrivate] = useState(Boolean(existing?.isPrivate));
  const [error, setError] = useState("");
  return (
    <ModalFrame title={existing ? "Edit Appointment" : `Appointment on ${dayLabel}`} onClose={onClose}>
      <Field label="Title"><input className={inputCls} value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
      <Field label="Agent"><input className={inputCls} value={agent} onChange={(event) => setAgent(event.target.value)} /></Field>
      <Field label="Event type">
        <select className={inputCls} value={eventType} onChange={(event) => setEventType(event.target.value)}>
          {["Showing", "Listing appointment", "Meeting", "Call", "Other"].map((item) => <option key={item}>{item}</option>)}
        </select>
      </Field>
      <Field label="Location"><input className={inputCls} value={location} onChange={(event) => setLocation(event.target.value)} /></Field>
      <Field label="Start"><input className={inputCls} type="date" value={start.slice(0, 10)} onChange={(event) => setStart(event.target.value)} /></Field>
      <Field label="End"><input className={inputCls} type="date" value={end.slice(0, 10)} onChange={(event) => setEnd(event.target.value)} /></Field>
      <Field label="Message"><textarea className="h-20 w-full border border-[#ccc] p-2 text-[13px]" value={message} onChange={(event) => setMessage(event.target.value)} /></Field>
      <label className="mb-2 block text-[13px]"><input type="checkbox" checked={isPrivate} onChange={(event) => setPrivate(event.target.checked)} /> Private</label>
      {error ? <p role="alert" className="mb-2 bg-[#fde7ec] px-2 py-1 text-[12px] text-[#c62828]">{error}</p> : null}
      <div className="flex justify-end gap-2">
        {existing ? <Btn onClick={() => {
          if (!window.confirm("Delete this appointment?")) return;
          update((current) => ({ ...current, appointments: current.appointments.filter((item) => item.id !== existing.id) }));
          chrome.toast("Appointment deleted.");
          onClose();
        }}>Delete</Btn> : null}
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind="teal" onClick={() => {
          if (!title.trim()) { setError("Enter a title."); return; }
          if (!start || !end) { setError("Choose a start and end date."); return; }
          const next = { title: title.trim(), when: start, end, agent, eventType, location, message, isPrivate, leadId: "" };
          update((current) => ({
            ...current,
            appointments: existing
              ? current.appointments.map((item) => item.id === existing.id ? { ...item, ...next } : item)
              : [...current.appointments, { id: uid("appt"), ...next }],
          }));
          chrome.toast(existing ? "Appointment updated." : "Appointment saved.");
          onClose();
        }}>Save</Btn>
      </div>
    </ModalFrame>
  );
}

export function CalendarView() {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const vancouver = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const todayYear = Number(vancouver.find((part) => part.type === "year")?.value);
  const todayMonth = Number(vancouver.find((part) => part.type === "month")?.value);
  const todayDay = Number(vancouver.find((part) => part.type === "day")?.value);
  const [cursor, setCursor] = useState(new Date(todayYear, todayMonth - 1, 1));
  const [mode, setMode] = useState<"month" | "week" | "day" | "agenda">("day");
  const office = useOfficeSession();
  const { leads } = useLeads();
  const appointments = state.appointments.filter((item) => !/qa audit appt/i.test(item.title || ""));
  const requests = leads.filter((lead) => lead.source === "showing_request");
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const cells = [...Array.from({ length: firstWeekday }, () => 0), ...Array.from({ length: days }, (_, index) => index + 1)];
  const pad = (value: number) => String(value).padStart(2, "0");
  const isoFor = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
  const [selected, setSelected] = useState(isoFor(todayYear, todayMonth, todayDay));
  function apptDay(when: string) {
    return when.match(/\d{4}-\d{2}-\d{2}/)?.[0] || "";
  }
  function openNew(iso: string) {
    setSelected(iso);
    const [y, m, d] = iso.split("-").map(Number);
    chrome.openModal(<CalendarAppointmentForm dayLabel={`${names[(m || 1) - 1]} ${d}`} when={iso} onClose={chrome.closeModal} />);
  }
  const owner = office.user ? `${office.user.name}, You` : "Casey Archibald, You";
  const selectedDate = new Date(`${selected}T12:00:00`);
  const agendaLabel = selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return (
    <div className="grid gap-[11px] bg-[#f5f5f5] p-3 lg:grid-cols-[321px_1fr]">
      <aside className="border border-[#e5e5e5] bg-white text-[13px]">
        <div className="flex items-center justify-between bg-[#329bb9] px-3 py-2 text-[13px] font-semibold text-white">
          Mini Calendar
          <span aria-hidden>⌃</span>
        </div>
        <div className="px-3 py-2">
          <div className="mb-1 flex items-center justify-between text-[13px]">
            <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Previous month">‹</button>
            <span>{names[month]} {year}</span>
            <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Next month">›</button>
          </div>
          <div className="grid grid-cols-7 text-center text-[12px] text-[#666]">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
          </div>
          <div className="grid grid-cols-7 text-center text-[13px]">
            {cells.map((day, index) => (
              <button key={`mini-${index}`} type="button" className={`h-7 ${day && isoFor(year, month + 1, day) === selected ? "rounded-full bg-[#329bb9] text-white" : ""}`} onClick={() => { if (!day) return; setSelected(isoFor(year, month + 1, day)); setMode("day"); }}>{day || ""}</button>
            ))}
          </div>
        </div>
        <p className="px-3 py-2 text-[12px] text-[#666]">{owner}</p>
        <div className="flex items-center justify-between bg-[#4a4a4a] px-3 py-2 text-[12px] font-semibold tracking-wide text-white uppercase">
          <span>Event Calendars</span>
          <span aria-hidden>⌃</span>
        </div>
        {["US Holiday", "CA Holiday", "CINC University"].map((label) => (
          <label key={label} className="flex items-center justify-between border-b border-[#eee] px-3 py-2 text-[13px]">
            {label}
            <input type="checkbox" className="size-3.5" />
          </label>
        ))}
      </aside>
      <div className="min-w-0 bg-[#f5f5f5]">
        <div className="flex h-12 items-center bg-[#4a4a4a] px-4 text-[26px] font-semibold text-white">
          <span>{agendaLabel}</span>
          <button type="button" className="ml-3 text-[20px]" aria-label="Previous day" onClick={() => {
            const next = new Date(`${selected}T12:00:00`);
            next.setDate(next.getDate() - 1);
            setSelected(isoFor(next.getFullYear(), next.getMonth() + 1, next.getDate()));
            setMode("day");
          }}>‹</button>
          <button type="button" className="ml-1 text-[20px]" aria-label="Next day" onClick={() => {
            const next = new Date(`${selected}T12:00:00`);
            next.setDate(next.getDate() + 1);
            setSelected(isoFor(next.getFullYear(), next.getMonth() + 1, next.getDate()));
            setMode("day");
          }}>›</button>
          <button type="button" className="ml-auto bg-[#329bb9] px-2 py-1 text-[12px] font-normal text-white" onClick={() => openNew(selected)}>Add Appointment</button>
        </div>
        <div className="flex gap-1 bg-white px-2 py-1">
          {([["day", "day"], ["agenda", "my agenda"], ["week", "week"], ["month", "month"]] as const).map(([item, label]) => (
            <button key={item} type="button" className={`border px-2 py-1 text-[12px] lowercase ${mode === item ? "border-[#329bb9] text-[#329bb9]" : "border-[#ccc]"}`} onClick={() => setMode(item)}>{label}</button>
          ))}
        </div>
        {mode === "agenda" ? (
          <ul>{appointments.length ? appointments.map((item) => <li key={item.id} className="border-b border-[#eee] py-2">{names[Number((apptDay(item.when) || "0000-01-01").slice(5, 7)) - 1] || ""} {Number((apptDay(item.when) || "").slice(8, 10)) || ""}, {(apptDay(item.when) || "").slice(0, 4)} · {item.title}</li>) : <li className="py-4 text-[#888]">No events.</li>}</ul>
        ) : mode === "week" ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }, (_, index) => {
              const base = new Date(`${selected}T12:00:00`);
              const start = new Date(base);
              start.setDate(base.getDate() - base.getDay() + index);
              const iso = isoFor(start.getFullYear(), start.getMonth() + 1, start.getDate());
              const items = appointments.filter((item) => apptDay(item.when) === iso);
              return (
                <div key={iso} className="min-h-28 border border-[#eee] p-1">
                  <button type="button" className="font-semibold text-[#1c93b5]" onClick={() => openNew(iso)}>{start.getDate()}</button>
                  {items.map((item) => <p key={item.id} className="mt-1 text-[11px] text-[#1c93b5]">{item.title}</p>)}
                </div>
              );
            })}
          </div>
        ) : mode === "day" ? (
          <div className="border border-[#1c93b5] p-3">
            <p className="font-semibold">{names[Number(selected.slice(5, 7)) - 1]} {Number(selected.slice(8, 10))}, {selected.slice(0, 4)}</p>
            {appointments.filter((item) => apptDay(item.when) === selected).map((item) => <p key={item.id} className="text-[#1c93b5]">{item.title} · {item.when}</p>)}
            {!appointments.some((item) => apptDay(item.when) === selected) ? <p className="text-[13px] text-[#888]">No appointments on this day.</p> : null}
            <h2 className="mt-4 font-bold">Appointment Requests</h2>
            {requests.length ? requests.map((lead) => (
              <article key={lead.id} className="mt-3 border-t border-[#eee] pt-2">
                <p className="font-semibold text-[#329bb9]">{lead.name}</p>
                <p>{lead.propertyAddress || "Showing request"}</p>
                <p className="text-[12px] text-[#666]">Expiry Date: {lead.createdAt.slice(0, 10) || "—"}</p>
                <p className="text-[12px]">Agent Accepted: {appointments.some((item) => item.leadId === lead.id) ? "Yes" : "No"}</p>
              </article>
            )) : <p className="mt-3 text-[#888]">No appointment requests.</p>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 text-center text-[11px] text-[#888]">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <div key={day}>{day}</div>)}</div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, index) => {
                const on = day === todayDay && month + 1 === todayMonth && year === todayYear;
                return (
                  <div key={index} role="presentation" className={`h-16 border p-1 text-left text-[12px] ${on ? "border-[#1c93b5] bg-[#e7f5f8]" : "border-[#eee]"}`}>
                    <button type="button" className="block w-full text-left" onClick={() => {
                      if (!day) return;
                      openNew(isoFor(year, month + 1, day));
                    }}>
                      {day || ""}
                    </button>
                    {day ? appointments.filter((item) => apptDay(item.when) === isoFor(year, month + 1, day)).map((item) => (
                      <button key={item.id} type="button" className="block w-full truncate text-left text-[10px] text-[#1c93b5]" onClick={() => chrome.openModal(<CalendarAppointmentForm dayLabel={`${names[month]} ${day}`} when={item.when} existing={item} onClose={chrome.closeModal} />)}>
                        {item.title}
                      </button>
                    )) : null}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function TasksView() {
  const { state, update } = useCinc();
  const chrome = useChrome();
  return (
    <div className="p-4">
      <div className="bg-white p-4">
        {state.reminders.map((item) => (
          <label key={item.id} className="flex items-center gap-2 border-b border-[#eee] py-2 text-[13px]">
            <input type="checkbox" checked={item.done} onChange={() => { update((current) => ({ ...current, reminders: current.reminders.map((reminder) => reminder.id === item.id ? { ...reminder, done: !reminder.done } : reminder) })); chrome.toast(item.done ? "Reminder reopened." : "Reminder completed."); }} />
            <a href={item.leadId ? href.lead(item.leadId) : href.tasks} className="text-[#1c93b5]">{item.title}</a>
            <span className="ml-auto text-[12px] text-[#888]">{item.due}</span>
          </label>
        ))}
        {!state.reminders.length ? <p className="text-[13px] text-[#888]">No tasks.</p> : null}
      </div>
    </div>
  );
}

export function MarketingView() {
  const chrome = useChrome();
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [year, setYear] = useState(previous.getFullYear());
  const [month, setMonth] = useState(previous.getMonth());
  const [report, setReport] = useState<{ locations: { location: string; leads: number; cost: number | null }[]; totalLeads: number; searchBudget: number; listcastBudget: number }>({ locations: [], totalLeads: 0, searchBudget: 0, listcastBudget: 0 });
  const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  useEffect(() => {
    void fetch(`/api/office/marketing?year=${year}&month=${month + 1}`, { cache: "no-store" }).then(async (response) => {
      const data = await response.json().catch(() => null);
      if (data?.ok) setReport(data);
    });
  }, [year, month]);
  function shift(delta: number) {
    const next = new Date(year, month + delta, 1);
    const cap = new Date();
    if (next.getFullYear() > cap.getFullYear() || (next.getFullYear() === cap.getFullYear() && next.getMonth() > cap.getMonth())) return;
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }
  const known = new Set(MARKET_AREAS.map((name) => name.toLowerCase()));
  const areaRows = report.locations.filter((row) => row.leads > 0).map((row) => ({
    location: row.location,
    leads: row.leads,
    cost: report.searchBudget > 0 ? Math.round(report.searchBudget / row.leads) : null,
  }));
  const otherLeads = report.locations.filter((row) => !known.has(row.location.toLowerCase())).reduce((sum, row) => sum + row.leads, 0);
  const areaTotal = areaRows.reduce((sum, row) => sum + row.leads, 0) + otherLeads;
  function exportCsv() {
    const lines = ["LOCATION,LEADS,COST PER LEAD", ...areaRows.map((row) => `${row.location},${row.leads},${row.cost ?? ""}`), `Total,${areaTotal},`];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "search-marketing.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  async function contact() {
    const response = await fetch("/api/office/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "email", to: "agent@example.com", subject: "Campaign question", body: "Need to discuss the search campaign." }),
    });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    chrome.toast(response.ok ? "Contact email sent." : data?.message || "That email was not sent.");
  }
  async function saveBudget(key: "searchBudget" | "listcastBudget", value: number) {
    const current = await fetch("/api/office/settings", { cache: "no-store" }).then((response) => response.json());
    const settings = { ...(current.settings ?? {}), [key]: value };
    const response = await fetch("/api/office/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    if (response.ok) {
      setReport((row) => ({ ...row, [key]: value }));
      chrome.toast("Budget saved.");
    }
  }
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-3">
        <button type="button" onClick={() => shift(-1)}>‹</button>
        <span className="font-semibold">{names[month]} {year}</span>
        <button type="button" onClick={() => shift(1)}>›</button>
        <Menu className="ml-auto" label={<span className="border border-[#ccc] bg-white px-2 py-1 text-[12px]">Export All ▾</span>} items={[{ label: "Excel (.csv)", onClick: exportCsv }]} />
      </div>
      <div className="mb-4 flex gap-3">
        <article className="border border-[#e5e5e5] bg-white px-4 py-3"><p className="text-[12px] text-[#888]">Search ($)</p><p className="text-[22px] text-[#1c93b5]">${report.searchBudget}</p></article>
        <article className="border border-[#e5e5e5] bg-white px-4 py-3"><p className="text-[12px] text-[#888]">ListCast ($)</p><p className="text-[22px] text-[#1c93b5]">${report.listcastBudget}</p></article>
      </div>
      <h2 className="mb-2 font-bold">Google Marketing</h2>
      <p className="mb-3 text-[13px] text-[#555]">Google lead counts for {names[month]} {year}: {report.totalLeads}. Budget on file: ${report.searchBudget.toLocaleString("en-CA")}.</p>
      <h2 className="mb-2 font-bold">Search Marketing</h2>
      <div className="grid gap-3 lg:grid-cols-[300px_1fr]">
        <article className="border border-[#e5e5e5] bg-white p-3 text-[13px]">
          <p className="font-semibold">Budget</p>
          <p className="mt-2 text-[20px] font-semibold text-[#1c93b5]">BUYER ${report.searchBudget.toLocaleString("en-CA")}</p>
          <label className="mt-2 block text-[12px]">BUYER $<input className="ml-1 w-24 border border-[#ccc] px-1" defaultValue={report.searchBudget} onBlur={(event) => void saveBudget("searchBudget", Number(event.target.value) || 0)} /></label>
          <label className="mt-1 block text-[12px]">ListCast $<input className="ml-1 w-24 border border-[#ccc] px-1" defaultValue={report.listcastBudget} onBlur={(event) => void saveBudget("listcastBudget", Number(event.target.value) || 0)} /></label>
          <button type="button" className="mt-3 bg-[#1c93b5] px-3 py-1 text-[12px] text-white" onClick={() => void contact()}>Need to discuss your campaign?</button>
          <p className="mt-3 text-[12px] leading-5 text-[#666]">Lead counts are people who registered on the site during the selected month, grouped by the city or search they used. Cost per lead divides the buyer search budget by those leads. Google Marketing shows the same lead counts beside the office Google budget. This page does not purchase advertising, and the figures are not a quote from Google or any other ad network.</p>
          <p className="mt-3 font-semibold">Target Areas <span title="The six areas with the most buyer and seller leads this month." className="text-[12px] text-[#1c93b5]">?</span></p>
          <p className="text-[12px] text-[#666]">top 6 areas for buyer and seller leads</p>
          {(() => {
            const pieRows = [...report.locations].filter((row) => row.leads > 0).sort((a, b) => b.leads - a.leads).slice(0, 6);
            const pieTotal = pieRows.reduce((sum, row) => sum + row.leads, 0);
            const colors = ["#1c93b5", "#16324f", "#2e9e5b", "#e39b2b", "#5c6b7a", "#8fd3e8"];
            if (!pieTotal) return <p className="mt-3 text-[12px] text-[#888]">No leads in this month.</p>;
            const slices = pieRows.reduce<{ nodes: React.ReactNode[]; angle: number }>((acc, row, index) => {
              const sweep = (row.leads / pieTotal) * Math.PI * 2;
              const start = acc.angle;
              const end = start + sweep;
              const large = sweep > Math.PI ? 1 : 0;
              const x1 = 80 + 70 * Math.cos(start);
              const y1 = 80 + 70 * Math.sin(start);
              const x2 = 80 + 70 * Math.cos(end);
              const y2 = 80 + 70 * Math.sin(end);
              acc.nodes.push(<path key={row.location} d={`M80 80 L${x1} ${y1} A70 70 0 ${large} 1 ${x2} ${y2} Z`} fill={colors[index % colors.length]} />);
              acc.angle = end;
              return acc;
            }, { nodes: [], angle: -Math.PI / 2 });
            return (
              <>
                <svg viewBox="0 0 160 160" className="mx-auto mt-2 h-56 w-56" aria-label="Target areas pie chart">{slices.nodes}</svg>
                <ul className="mt-2 space-y-1 text-[12px]">
                  {pieRows.map((row, index) => (
                    <li key={row.location} className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5" style={{ background: colors[index % colors.length] }} />
                      {row.location} ({row.leads} lead{row.leads === 1 ? "" : "s"})
                    </li>
                  ))}
                </ul>
              </>
            );
          })()}
          <p className="mt-2 text-[12px] text-[#666]">All other areas: {otherLeads}</p>
        </article>
        <table className="w-full border border-[#e5e5e5] bg-white text-left text-[13px]">
          <thead className="bg-[#f6f6f6] text-[11px] uppercase"><tr><th className="px-3 py-2">Location</th><th>Leads</th><th>%</th><th>Cost per lead</th></tr></thead>
          <tbody>
            {areaRows.length ? areaRows.map((row) => <tr key={row.location} className="border-t border-[#eee]"><td className="px-3 py-2">{row.location}</td><td>{row.leads}</td><td>{areaTotal ? `${Math.round((row.leads / areaTotal) * 100)}%` : "0%"}</td><td>{row.cost == null ? "—" : `$${row.cost}`}</td></tr>) : <tr><td className="px-3 py-3 text-[#888]" colSpan={4}>No leads in this month.</td></tr>}
            <tr className="border-t border-[#ddd] font-bold"><td className="px-3 py-2">Total</td><td>{areaTotal}</td><td /></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function GmailView() {
  const [gmail, setGmail] = useState<boolean | null>(null);
  useEffect(() => {
    void fetch("/api/office/send", { cache: "no-store" }).then(async (response) => {
      const data = (await response.json().catch(() => null)) as { channels?: { gmail?: boolean } } | null;
      setGmail(Boolean(data?.channels?.gmail));
    }).catch(() => setGmail(false));
  }, []);
  return (
    <div className="p-6">
      <h1 className="text-[18px] font-semibold">Gmail Inbox</h1>
      {gmail ? (
        <p className="mt-3 text-[13px] text-[#666]">No new Gmail messages.</p>
      ) : (
        <p className="mt-3 bg-[#fff6e5] px-3 py-2 text-[13px] text-[#8a5a00]">Gmail is not connected.</p>
      )}
    </div>
  );
}

export function BrokerLaunchpad() {
  const { leads } = useLeads();
  const { state } = useCinc();
  const today = new Date();
  const due = state.reminders.filter((item) => !item.done).length;
  const header = `${today.toLocaleDateString("en-US", { weekday: "long" })}, ${today.toLocaleDateString("en-US", { month: "long" })} ${today.getDate()} | VIEW: All Agents | Today your team has ${due} reminder${due === 1 ? "" : "s"} due…`;
  const cities = topCounts(leads.map((lead) => cityOf(`${lead.propertyAddress || ""} ${lead.searchLabel || ""}`)));
  const sources = topCounts(leads.map((lead) => lead.source || "unknown"));
  const byWeek = new Map<string, number>();
  for (const lead of leads) {
    const when = new Date(lead.createdAt);
    const label = Number.isNaN(when.getTime()) ? "Unknown" : when.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    byWeek.set(label, (byWeek.get(label) || 0) + 1);
  }
  const trends = [...byWeek.entries()].slice(-8);
  const maxTrend = Math.max(1, ...trends.map(([, count]) => count));
  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center gap-3 border border-[#e5e5e5] bg-white px-3 py-2 text-[13px]">
        <span className="font-semibold">{header}</span>
        <button type="button" className="ml-auto bg-[#1c93b5] px-2 py-1 text-white" onClick={() => window.location.reload()}>Refresh</button>
      </div>
      <section className="mt-4 border border-[#e5e5e5] bg-white p-4">
        <h2 className="mb-3 font-bold">Lead Trends</h2>
        {trends.length ? (
          <div className="flex h-32 items-end gap-2">
            {trends.map(([label, count]) => (
              <div key={label} className="flex flex-1 flex-col items-center justify-end">
                <div className="w-full bg-[#1c93b5]" style={{ height: `${(count / maxTrend) * 100}%` }} title={`${count}`} />
                <span className="mt-1 text-[10px] text-[#666]">{label}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-[13px] text-[#888]">No leads yet.</p>}
      </section>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <RankList title="Top 10 Lead Cities" rows={cities} />
        <RankList title="Top 10 Lead Sources" rows={sources} />
      </div>
    </div>
  );
}

function cityOf(value: string) {
  const hit = MARKET_AREAS.find((name) => value.toLowerCase().includes(name.toLowerCase()));
  if (hit) return hit;
  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  const city = parts.find((part) => /vancouver|burnaby|surrey|richmond|coquitlam|delta|langley|new westminster|north van|west van|maple ridge|port moody|port coquitlam/i.test(part));
  return city || "Unknown";
}

function topCounts(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value || "Unknown";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
}

function RankList({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <section className="border border-[#e5e5e5] bg-white p-4">
      <h2 className="mb-2 font-bold">{title}</h2>
      {rows.length ? (
        <ol className="text-[13px]">
          {rows.map(([label, count]) => (
            <li key={label} className="flex justify-between border-b border-[#eee] py-1"><span>{label}</span><span>{count}</span></li>
          ))}
        </ol>
      ) : <p className="text-[13px] text-[#888]">No leads yet.</p>}
    </section>
  );
}

export function ReportsView() {
  const { leads } = useLeads();
  const { state } = useCinc();
  const stats = [
    ["Website leads", leads.length],
    ["Calls logged", state.calls.length],
    ["Deals", state.deals.length],
    ["Templates", state.templates.length],
  ];
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2">
      {stats.map(([label, value]) => (
        <article key={label} className="bg-white p-4">
          <p className="text-[12px] uppercase text-[#888]">{label}</p>
          <p className="text-[28px] text-[#1c93b5]">{value}</p>
        </article>
      ))}
    </div>
  );
}
