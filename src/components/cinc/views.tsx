"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CRM_AGENT, CRM_AUTOTRACKS, CRM_OPEN_HOUSES, CRM_PROPERTIES, CRM_TODAY_FEED } from "@/lib/cinc-crm";
import { useLeads } from "@/lib/leads";
import { useChrome } from "./chrome-context";
import { useOfficeSession } from "./office-session";
import { href } from "./route";
import { INTEGRATIONS, NOTIFY_GROUPS, nowLabel, uid, useCinc, type Deal, type DealStage, type Mail, type Template } from "./store";
import { Btn, checkCls, EmptyArt, Field, inputCls, Menu, ModalFrame, useComposer } from "./ui";

const AGENT_NUMBER = "4829103344556677";
const MDID = "4f8c2a91b7e64d0c9a13e5b27864c0d1";

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
  const [tab, setTab] = useState("Contact Requested");
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
    <div className="p-4">
      <h1 className="text-[15px] font-bold text-[#243238]">Welcome back, {CRM_AGENT.greetingName}.</h1>
      <p className="mt-1 text-[13px] text-[#555]">
        {dateLine} {ordinal(today.getDate())}. You have{" "}
        <a href={href.calendar} className="font-semibold text-[#1c93b5]">{state.appointments.length} appointments</a> scheduled today.
      </p>
      <section className="mt-4 border border-[#e5e5e5] bg-white shadow-sm">
        <header className="flex items-center gap-2 border-b border-[#eee] px-4 py-2 text-[12px] font-bold">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 4h10M3 8h10M3 12h7" /></svg>
          Today
        </header>
        <div className="flex flex-wrap gap-1 border-b border-[#e5e5e5] px-3">
          {tabs.map(([label, count]) => (
            <button key={label} type="button" className={`px-3 py-2 text-[13px] ${tab === label ? "border-b-2 border-[#1c93b5] font-semibold text-[#1c93b5]" : "text-[#666]"}`} onClick={() => setTab(label)}>
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
                  label={<span className="inline-flex h-[22px] w-[130px] items-center justify-between border border-[#ccc] bg-white px-2">Type: <b>{types[0]}</b> ▾</span>}
                  items={["All", "AI Ready", "Cash Offer Inquiry", "Etta Message", "HomePulse Inquiry", "Property Inquiry", "Showing Request", "Clear"].map((label) => ({
                    label,
                    onClick: () => setTypes(label === "Clear" || label === "All" ? ["All"] : types.includes("All") ? [label] : types.includes(label) ? types.filter((item) => item !== label) : [...types, label]),
                  }))}
                />
                <Menu
                  label={<span className="inline-flex h-[22px] w-[180px] items-center justify-between border border-[#ccc] bg-white px-2">Status: <b>{statuses[0]}</b> ▾</span>}
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
              {visible.length > shownRequests.length ? <p className="text-center text-[12px] text-[#888]">Showing {shownRequests.length} of {visible.length} sample requests.</p> : null}
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
          {tab === "Deal Reminders" ? <p className="text-[13px] text-[#888]">No deal reminders. <a className="text-[#1c93b5]" href={href.dealsPurchases}>Open deals</a></p> : null}
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
  const [customDays, setCustomDays] = useState(2);
  const [sortKey, setSortKey] = useState<"agent" | "login" | "calls" | "vm">("agent");
  const [dir, setDir] = useState<1 | -1>(1);
  const rows = [...CALL_ROWS].sort((a, b) => {
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
  const deals = state.deals
    .filter((deal) => deal.board === board && (status === "All" || deal.status === status))
    .filter((deal) => created === "Anytime" || Date.now() - deal.createdAt < (created === "Last 7 Days" ? 7 : 30) * 86400000)
    .sort((a, b) => sort === "Price" ? a.price.localeCompare(b.price) : b.createdAt - a.createdAt);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f5f5f5] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-5 text-[15px] font-semibold">
          <a href={href.dealsPurchases} className={board === "purchases" ? "border-b-[3px] border-[#1c93b5] pb-1 text-[#1c93b5]" : "pb-1 text-[#666]"}>Purchases</a>
          <a href={href.dealsListings} className={board === "listings" ? "border-b-[3px] border-[#1c93b5] pb-1 text-[#1c93b5]" : "pb-1 text-[#666]"}>Listings</a>
        </div>
        <div className="flex gap-2">
          <button type="button" className={toolBtn} onClick={() => chrome.openModal(<ModalFrame title="Advertise Listings" onClose={chrome.closeModal}><p className="text-[13px]">Listings would be sent to CINC advertising. Saving writes a copy in Sent. Nothing leaves this browser.</p><div className="mt-3 text-right"><Btn kind="teal" onClick={() => { update((current) => ({ ...current, mail: [queuedMail({ kind: "email", to: "advertising@example.com", subject: "Advertise listings", body: "Advertising request for the current deal board." }), ...current.mail] })); chrome.closeModal(); chrome.toast("Advertising request saved in Sent."); }}>OK</Btn></div></ModalFrame>)}>Advertise Listings</button>
          <button type="button" className="inline-flex h-[22px] items-center gap-1 rounded-[2px] bg-[#1c93b5] px-2 text-[12px] text-white" onClick={() => chrome.openModal(<DealModal board={board} onClose={chrome.closeModal} />)}>
            <span className="grid h-3.5 w-3.5 place-items-center rounded-full border border-white text-[11px] leading-none">+</span>
            Add Deal
          </button>
        </div>
      </div>
      <div className="mb-3 flex w-full items-center gap-2 text-[12px]">
        <Menu className="w-[130px]" label={<span className={`${toolBtn} w-[130px] justify-between`}>Status: <b>{status}</b> ▾</span>} items={["Active", "Archived", "All"].map((label) => ({ label, onClick: () => setStatus(label) }))} />
        <Menu className="w-[150px]" label={<span className={`${toolBtn} w-[150px] justify-between`}>Created: <b>{created}</b> ▾</span>} items={["Anytime", "Last 7 Days", "Last 30 Days"].map((label) => ({ label, onClick: () => setCreated(label) }))} />
        <Menu className="ml-auto" label={<span className={`${toolBtn} min-w-[180px] justify-between`}>↑↓ Sort By: <b>{sort}</b> ▾</span>} items={["Reminder Due Date", "Newest", "Price"].map((label) => ({ label, onClick: () => setSort(label) }))} />
      </div>
      <div className="relative grid min-h-0 flex-1 grid-cols-4 gap-3">
        {stages.map((stage) => {
          const cards = deals.filter((deal) => deal.stage === stage.id);
          return (
            <section key={stage.id} className="flex min-h-[420px] flex-col border border-[#e1e1e1] bg-[#f1f1f1]">
              <header className="bg-white px-2 py-2">
                <div className="text-[12px] font-bold tracking-wide text-black uppercase">
                  <span>{stage.label}</span>
                  <span className="ml-2">SHOWING {cards.length}</span>
                </div>
                <p className="text-[11px] text-[#777]">$-- | <span className="underline decoration-dotted">$-- Potential</span></p>
              </header>
              <div className="flex-1 p-2">
                {cards.map((deal) => (
                  <article key={deal.id} className="mb-2 bg-white p-2 shadow-sm">
                    <p className="text-[12px] font-semibold">{deal.client}</p>
                    <p className="text-[11px]">{deal.address}</p>
                    <p className="text-[11px] text-[#1c93b5]">{deal.price}</p>
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
          const deal: Deal = { id: uid("deal"), board, status: "Active", createdAt: Date.now(), ...form, client: form.client || "New client" };
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
  const [group, setGroup] = useState("ISA");
  const [picked, setPicked] = useState<string[]>([]);
  const [kindFilter, setKindFilter] = useState<"all" | "unread" | "email" | "text">("all");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"name" | "type" | "by">("name");
  const query = chrome.leadSearch;
  const messages = state.mail.filter((mail) => {
    if (mail.folder !== folder) return false;
    if (kindFilter === "unread" && !mail.unread) return false;
    if (kindFilter === "email" && mail.kind !== "email") return false;
    if (kindFilter === "text" && mail.kind !== "text") return false;
    return `${mail.subject} ${mail.body} ${mail.to} ${mail.from ?? ""}`.toLowerCase().includes(query.toLowerCase());
  });
  const pageSize = 25;
  const pages = Math.max(1, Math.ceil(messages.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = messages.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const opened = messages.find((mail) => mail.id === openId);

  function send(kind: "email" | "text", value: { to: string; subject?: string; body: string }, target: "sent" | "drafts") {
    update((current) => ({
      ...current,
      mail: [{ id: uid("mail"), folder: target, kind, to: value.to, subject: value.subject || kind, body: value.body, at: nowLabel() }, ...current.mail],
    }));
    chrome.toast(target === "sent" ? "Sent. It is in the Sent folder." : "Draft saved.");
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
              <span className="flex items-center gap-1 text-[13px] font-semibold"><span>📁</span> Groups</span>
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
                  <span>📁</span>
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
              }}>📁 Move Selected to Group</button>
              <button type="button" title="Copy" className={toolBtn} onClick={() => {
                if (!picked.length) { chrome.toast("Select at least one template."); return; }
                const chosen = state.templates.filter((item) => picked.includes(item.id));
                update((current) => ({ ...current, templates: [...current.templates, ...chosen.map((item) => ({ ...item, id: uid("tpl"), name: `${item.name} copy` }))] }));
                chrome.toast("Copied on this device.");
              }}>⧉</button>
              <button type="button" title="Share" className={toolBtn} onClick={() => { const link = `${window.location.origin}/dashboard/spa#inbox/templates`; navigator.clipboard?.writeText(link); chrome.toast("Share link copied."); }}>⤴</button>
              <button type="button" title="Trash" className="text-[#999]" onClick={() => { if (!picked.length) { chrome.toast("Select at least one template."); return; } update((current) => ({ ...current, templates: current.templates.filter((item) => !picked.includes(item.id)) })); setPicked([]); chrome.toast(`Deleted ${picked.length} template${picked.length === 1 ? "" : "s"}.`); }}>🗑</button>
            </div>
            <table className="w-full text-left text-[12px]">
              <thead className="text-[12px] font-bold text-black">
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
                    <td>Buyers & Sellers</td>
                    <td>{row.createdBy}</td>
                    <td>{row.edited}</td>
                    <td><button type="button" className="text-[#1c93b5]" onClick={() => chrome.openModal(<ModalFrame title={`${row.name} analytics`} onClose={chrome.closeModal}><p className="text-[13px]">Sends 0 · Opens 0 · Clicks 0. Sample template, nothing has been delivered.</p><div className="mt-3 text-right"><Btn kind="teal" onClick={chrome.closeModal}>Close</Btn></div></ModalFrame>)}>Analytics</button></td>
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
  const countLabel = messages.length ? `${safePage * pageSize + 1} - ${Math.min(messages.length, (safePage + 1) * pageSize)} of ${messages.length}` : "1 - 0 of 0";
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
        {folder !== "drafts" ? (
          <button type="button" title="Mark read" className={toolBtn} onClick={() => {
            if (needPick()) return;
            update((current) => ({ ...current, mail: current.mail.map((mail) => picked.includes(mail.id) ? { ...mail, unread: false } : mail) }));
            chrome.toast(`Marked ${picked.length} read.`);
            setPicked([]);
          }}>✉</button>
        ) : null}
        {folder === "inbox" ? (
          <button type="button" title="Mark unread" className={toolBtn} onClick={() => {
            if (needPick()) return;
            update((current) => ({ ...current, mail: current.mail.map((mail) => picked.includes(mail.id) ? { ...mail, unread: true } : mail) }));
            chrome.toast(`Marked ${picked.length} unread.`);
            setPicked([]);
          }}>●</button>
        ) : null}
        {folder === "trashed" ? (
          <button type="button" title="Restore" className={`${toolBtn} text-[#1c93b5]`} onClick={() => {
            if (needPick()) return;
            update((current) => ({ ...current, mail: current.mail.map((mail) => picked.includes(mail.id) ? { ...mail, folder: "inbox" } : mail) }));
            chrome.toast(`Restored ${picked.length}.`);
            setPicked([]);
          }}>↶</button>
        ) : (
          <button type="button" title="Trash" className={`${toolBtn} text-[#1c93b5]`} onClick={() => {
            if (needPick()) return;
            update((current) => ({ ...current, mail: current.mail.map((mail) => picked.includes(mail.id) ? { ...mail, folder: "trashed" } : mail) }));
            chrome.toast(`Moved ${picked.length} to trash.`);
            setPicked([]);
          }}>🗑</button>
        )}
        <button type="button" title="Refresh" className={`${toolBtn} text-[#1c93b5]`} onClick={() => { setPicked([]); setKindFilter("all"); setPage(0); setOpenId(null); chrome.toast("Mailbox refreshed."); }}>↻</button>
        {showFilters ? (
          <Menu
            label={<span className={`${toolBtn} text-[#1c93b5]`}>▾ Filters{kindFilter === "all" ? "" : `: ${kindFilter}`}</span>}
            items={[
              { label: "All messages", onClick: () => { setKindFilter("all"); setPage(0); } },
              { label: "Unread", onClick: () => { setKindFilter("unread"); setPage(0); } },
              { label: "Email", onClick: () => { setKindFilter("email"); setPage(0); } },
              { label: "Text", onClick: () => { setKindFilter("text"); setPage(0); } },
            ]}
          />
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
          </article>
        ) : (
          <div className="bg-white shadow-sm">
            {slice.map((mail) => (
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
            ))}
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
  const tracks = useMemo(() => {
    const overrides = new Map(state.tracks.map((track) => [track.id, track]));
    const base = CRM_AUTOTRACKS.filter((track) => !state.hiddenTracks.includes(track.id)).map((track) => overrides.get(track.id) ?? { ...track, trigger: "New lead" });
    const extra = state.tracks.filter((track) => !CRM_AUTOTRACKS.some((item) => item.id === track.id) && !state.hiddenTracks.includes(track.id));
    return [...extra, ...base];
  }, [state.hiddenTracks, state.tracks]);
  const trackQuery = chrome.leadSearch.trim().toLowerCase();
  const shown = tracks.filter((track) => track.category === cat && (!trackQuery || track.name.toLowerCase().includes(trackQuery)));
  const active = tracks.filter((track) => track.status === "active").length;
  const paused = tracks.filter((track) => track.status === "paused").length;
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {[
            [String(tracks.length), "Total"],
            [String(active), "Active"],
            [String(paused), "Paused"],
          ].map(([value, label]) => (
            <div key={label} className="min-w-[92px] border border-[#e5e5e5] bg-white px-3 py-2 text-center shadow-sm">
              <p className="text-[22px] leading-none font-bold text-[#1c93b5]">{value}</p>
              <p className="mt-1 text-[12px] text-[#666]">{label}</p>
            </div>
          ))}
        </div>
        <button type="button" className="h-8 bg-[#1c93b5] px-3 text-[13px] text-white" onClick={() => chrome.openModal(<TrackModal onClose={chrome.closeModal} onSaved={setCat} />)}>✚ Start/Edit an AutoTrack</button>
      </div>
      <div className="mb-3 flex flex-wrap gap-1">
        {["General", "Buyer", "Listing", "Nurture", "Past Client", "My AutoTracks"].map((label) => (
          <button key={label} type="button" className={`rounded border px-3 py-1 text-[12px] ${cat === label ? "border-[#1c93b5] bg-[#f3fbfd] font-semibold text-[#1c93b5]" : "border-[#ddd] bg-white text-[#555]"}`} onClick={() => setCat(label)}>{label}</button>
        ))}
      </div>
      <div className="border border-[#e5e5e5] bg-white shadow-sm">
        {shown.map((track) => {
          const seed = track.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
          const days = [7, 14, 21, 30, 45, 60][seed % 6];
          const stats = [
            ["Active", String((seed % 40) + 2)],
            ["%Open", `${(seed % 70) + 5}%`],
            ["%Click", `${(seed % 28) + 1}%`],
            ["Leads", String((seed % 80) + 3)],
            ["Completed", String((seed % 50) + 1)],
            ["Touches", String((seed % 12) + 3)],
            ["Steps", String((seed % 6) + 4)],
          ];
          return (
            <article key={track.id} className="border-t border-[#eee] px-4 py-4">
              <div className="mb-3 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <button type="button" className="text-[15px] font-semibold text-[#1c93b5]" onClick={() => chrome.openModal(<TrackModal initial={track} onClose={chrome.closeModal} onSaved={setCat} />)}>{track.name}</button>
                  <p className="text-[12px] text-[#666]">{days} days · Public · {CRM_AGENT.name} · {track.status}</p>
                </div>
                <Menu
                  label={<span className="px-2 text-[18px] leading-none text-[#666]">…</span>}
                  items={[
                    { label: track.status === "active" ? "Pause" : "Resume", onClick: () => {
                      const status = track.status === "active" ? "paused" : "active";
                      chrome.toast(status === "paused" ? `${track.name} paused.` : `${track.name} resumed.`);
                      update((current) => ({
                        ...current,
                        tracks: current.tracks.some((item) => item.id === track.id)
                          ? current.tracks.map((item) => item.id === track.id ? { ...item, status } : item)
                          : [...current.tracks, { id: track.id, name: track.name, category: track.category, status, trigger: track.trigger }],
                      }));
                    } },
                    { label: "Duplicate", onClick: () => update((current) => ({ ...current, tracks: [...current.tracks, { ...track, id: uid("track"), name: `${track.name} copy`, trigger: track.trigger }] })) },
                    { label: "Delete", danger: true, onClick: () => update((current) => ({ ...current, hiddenTracks: [...current.hiddenTracks, track.id], tracks: current.tracks.filter((item) => item.id !== track.id) })) },
                  ]}
                />
              </div>
              <div className="flex flex-wrap gap-4">
                {stats.map(([label, value]) => (
                  <div key={label} className="w-16 text-center">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border-[3px] border-[#1c93b5] text-[12px] font-bold text-[#243238]">{value}</div>
                    <p className="mt-1 text-[11px] text-[#666]">{label}</p>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
        {!shown.length ? <p className="px-4 py-8 text-center text-[13px] text-[#888]">No AutoTracks in this group.</p> : null}
      </div>
    </div>
  );
}

function TrackModal({ onClose, onSaved, initial }: { onClose: () => void; onSaved?: (category: string) => void; initial?: { id: string; name: string; category: string; status: "active" | "paused" | "draft"; trigger: string } }) {
  const { update } = useCinc();
  const chrome = useChrome();
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "General");
  const [trigger, setTrigger] = useState(initial?.trigger ?? "New lead");
  return (
    <ModalFrame title="Start an AutoTrack" onClose={onClose}>
      <Field label="Name"><input autoFocus className={inputCls} value={name} onChange={(event) => setName(event.target.value)} /></Field>
      <Field label="Category"><select className={inputCls} value={category} onChange={(event) => setCategory(event.target.value)}>{["General", "Buyer", "Listing", "Nurture", "Past Client", "My AutoTracks"].map((option) => <option key={option}>{option}</option>)}</select></Field>
      <Field label="Start trigger"><input className={inputCls} value={trigger} onChange={(event) => setTrigger(event.target.value)} /></Field>
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Cancel</Btn><Btn kind="teal" onClick={() => {
        const next = { id: initial?.id ?? uid("track"), name: name.trim() || "New AutoTrack", category, status: initial?.status ?? "active" as const, trigger: trigger.trim() || "New lead" };
        update((current) => ({
          ...current,
          tracks: current.tracks.some((item) => item.id === next.id)
            ? current.tracks.map((item) => item.id === next.id ? next : item)
            : [...current.tracks, next],
        }));
        onSaved?.(category);
        chrome.toast(`${next.name} is in ${category}.`);
        onClose();
      }}>Save</Btn></div>
    </ModalFrame>
  );
}

const BEHAVIORS: { group: string; items: string[] }[] = [
  {
    group: "General Behavior",
    items: [
      "Lead updated their phone number upon visit to the site.",
      "Lead updated their email address upon visit to the site.",
      "Lead submitted a Property Inquiry.",
      "Lead requested a showing.",
      "Lead viewed the same property 3 times within 5 days.",
      "Lead saved a search.",
      "Lead favorited a property.",
      "Lead opened an email after 30 days of inactivity.",
      "Lead clicked a listing link in an email.",
      "Lead returned to the site after 14 days away.",
      "Lead shared a listing with someone else.",
    ],
  },
  {
    group: "Pipeline Behavior",
    items: [
      "Lead moved to Attempted Contact.",
      "Lead moved to Contacted.",
      "Lead moved to Appointment Set.",
      "Lead became an Active Client.",
      "Lead moved to Appointment Met.",
      "Lead moved to Pending.",
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
        <p className="mb-2 text-[13px] text-[#444]">Automated Behavioral Messages are text + email communications sent to your leads when they take an action on your site.</p>
        <p className="mb-4 text-[13px] font-semibold text-[#333]">When a lead performs the action identified below, the matching message can send. We will only send one per day and only one of each type every two weeks.</p>
        {BEHAVIORS.map((group) => {
          const items = group.items.filter((item) => !query || item.toLowerCase().includes(query));
          if (!items.length) return null;
          return (
          <section key={group.group} className="mb-4">
            <div className="grid grid-cols-[1fr_90px_90px] bg-[#d7eef3] px-3 py-2 text-[13px] font-semibold">
              <span>{group.group} ⓘ</span><span>Text</span><span>Email</span>
            </div>
            {items.map((item) => {
              const on = Boolean(state.behavioral[item]);
              return (
                <div key={item} className="grid grid-cols-[1fr_90px_90px] items-center border-b border-[#eee] px-3 py-3">
                  <div className="flex items-center gap-3">
                    <button type="button" className={`inline-flex h-8 w-14 items-center justify-center rounded-full ${on ? "bg-[#1c93b5]" : "bg-[#cfcfcf]"}`} onClick={() => update((current) => ({ ...current, behavioral: { ...current.behavioral, [item]: !on } }))}>
                      <span className="grid h-5 w-5 place-items-center rounded-full border border-white text-[12px] text-white">{on ? "✓" : "✖"}</span>
                    </button>
                    <p className="text-[13px]">{item}</p>
                  </div>
                  <button type="button" aria-label="View text" className="grid h-8 w-8 place-items-center rounded-full bg-[#1c93b5] text-white" onClick={() => chrome.openModal(<ModalFrame title="Text preview" onClose={chrome.closeModal}><p className="text-[13px]">{item}</p><p className="mt-2 text-[13px] text-[#555]">Hi, this is Kayla with Archibald Real Estate Group. Reply STOP to opt out.</p><div className="mt-3 text-right"><Btn kind="teal" onClick={chrome.closeModal}>Close</Btn></div></ModalFrame>)}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.4"><path d="M1.5 8s2.5-4 6.5-4 6.5 4 6.5 4-2.5 4-6.5 4S1.5 8 1.5 8z" /><circle cx="8" cy="8" r="1.6" /></svg>
                  </button>
                  <button type="button" aria-label="View email" className="grid h-8 w-8 place-items-center rounded-full bg-[#1c93b5] text-white" onClick={() => chrome.openModal(<ModalFrame title="Email preview" onClose={chrome.closeModal}><p className="text-[13px] font-semibold">{item}</p><p className="mt-2 text-[13px] text-[#555]">Kayla Gerak · Archibald Real Estate Group · (604) 363-7858</p><div className="mt-3 text-right"><Btn kind="teal" onClick={chrome.closeModal}>Close</Btn></div></ModalFrame>)}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.4"><path d="M1.5 8s2.5-4 6.5-4 6.5 4 6.5 4-2.5 4-6.5 4S1.5 8 1.5 8z" /><circle cx="8" cy="8" r="1.6" /></svg>
                  </button>
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
    <div className="bg-white">
      <div className="flex items-center gap-2 px-6 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1c93b5] text-white">💬</span>
        <span className="text-[22px] font-semibold tracking-wide text-[#1c93b5]">CINC AI</span>
      </div>
      <div className="flex items-center justify-between bg-gradient-to-r from-[#1493b5] to-[#7dba4a] px-8 py-10 text-white">
        <div>
          <p className="max-w-xl text-[26px] leading-tight font-semibold">Adaptive conversations based on lead behavior captured within CINC CRM.</p>
        </div>
        <button type="button" className="bg-[#1c93b5] px-4 py-2 text-[14px] font-semibold" onClick={ask}>Get CINC AI</button>
      </div>
      <div className="grid gap-6 px-8 py-8 md:grid-cols-3">
        {cards.map(([title, body]) => (
          <article key={title}>
            <div className="mb-3 h-24 bg-gradient-to-br from-[#e7f6fb] to-[#eef8e8]" />
            <h3 className="font-bold">{title}</h3>
            <p className="mt-1 text-[13px] text-[#555]">{body}</p>
          </article>
        ))}
      </div>
      <div className="grid items-center gap-6 border-t border-[#eee] px-8 py-8 md:grid-cols-2">
        <div className="rounded-2xl border border-[#d7eef3] bg-[#f4fbfd] p-4 text-[13px]">
          <p className="mb-2 rounded-lg bg-white p-2 shadow-sm">Hi Kayla — Morgan viewed the same Kitsilano home three times.</p>
          <p className="ml-8 rounded-lg bg-[#1c93b5] p-2 text-white">Send the day-3 follow up and offer Saturday at 1.</p>
        </div>
        <div>
          <p className="text-[18px] font-semibold text-[#1c93b5]">CINC AI</p>
          <p className="mt-2 text-[13px] text-[#444]">It reads the lead timeline and suggests one next message.</p>
          <p className="mt-2 text-[13px] text-[#444]">Scripts stay inside this demo. Nothing is sent to a model.</p>
          <p className="mt-2 text-[13px] text-[#444]">Turn it on when you are ready and the team can review the copy first.</p>
          <button type="button" className="mt-4 bg-[#1c93b5] px-4 py-2 text-white" onClick={ask}>Get CINC AI</button>
        </div>
      </div>
    </div>
  );
}

export function PropertiesView({ sub }: { sub: "list" | "text" | "open" | "virtual" | "add" }) {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const composer = useComposer();
  const [mode, setMode] = useState<"mls" | "pocket">("mls");
  const [office, setOffice] = useState("My Office/Agents Listings");
  if (sub === "text") return <TextResponder />;
  if (sub === "add") return <AddPocket />;
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
    );
  }
  const query = chrome.leadSearch.trim().toLowerCase();
  const listings = (mode === "pocket"
    ? state.pocket.map((item) => ({ ...item, updated: "Just now", image: CRM_PROPERTIES[0].image }))
    : CRM_PROPERTIES.filter((item) => office === "My Office/Agents Listings" || Number(item.mls.slice(-1)) % 2 === 0)
  ).filter((item) => !query || `${item.address} ${item.mls} ${item.feature}`.toLowerCase().includes(query));
  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 bg-white p-3 shadow-sm">
        <button type="button" className="h-[22px] bg-[#1c93b5] px-3 text-[12px] text-white" onClick={() => setMode("mls")}>Show MLS Listings</button>
        <button type="button" className="h-[22px] bg-[#1c93b5] px-3 text-[12px] text-white" onClick={() => setMode("pocket")}>Show Pocket Listings</button>
        <Menu label={<span className={toolBtn}>{office} ▾</span>} items={["My Office/Agents Listings", "My Listings"].map((label) => ({ label, onClick: () => setOffice(label) }))} />
        <button type="button" className="ml-auto h-[22px] bg-[#1c93b5] px-3 text-[12px] text-white" onClick={() => { update((current) => ({ ...current, mail: [queuedMail({ kind: "email", to: "advertising@example.com", subject: "Advertise listings", body: `Advertising request for ${listings.length} listings.` }), ...current.mail] })); chrome.toast("Advertising request saved in Sent."); }}>Advertise Listings</button>
        {mode === "pocket" ? <a href={href.addProperty} className="text-[12px] text-[#1c93b5]">Add pocket listing</a> : null}
      </div>
      <div className="space-y-3">
        {listings.map((item) => (
          <article key={item.id} className="border border-[#e5e5e5] bg-white">
            <div className="relative grid grid-cols-4 bg-[#d7eef3] py-1 pr-8 text-center text-[12px] font-bold text-[#1c93b5]">
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
                  <button type="button" className="text-[#1c93b5]" onClick={() => composer.email("", (sent, value) => { update((current) => ({ ...current, mail: [{ id: uid("mail"), folder: sent ? "sent" as const : "drafts" as const, kind: "email" as const, to: value.to, subject: value.subject, body: value.body, at: nowLabel() }, ...current.mail] })); chrome.toast(sent ? "Message queued in Sent." : "Draft saved."); })}>Send Message</button>
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
              </div>
            </div>
          </article>
        ))}
        {!listings.length ? <p className="bg-white p-6 text-center text-[13px] text-[#888]">{mode === "pocket" ? "No pocket listings yet." : "No listings match."}</p> : null}
      </div>
    </div>
  );
}

function CampaignModal({ onClose }: { onClose: () => void }) {
  const { update } = useCinc();
  const chrome = useChrome();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  return (
    <ModalFrame title="New Campaign" onClose={onClose}>
      <Field label="Campaign"><input autoFocus className={inputCls} value={name} onChange={(event) => setName(event.target.value)} /></Field>
      <Field label="Text response"><textarea className="h-20 w-full border border-[#ccc] p-2 text-[13px]" value={message} onChange={(event) => setMessage(event.target.value)} /></Field>
      <div className="mt-3 flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind="teal" onClick={() => {
          if (!name.trim()) return;
          update((current) => ({ ...current, campaigns: [...current.campaigns, { id: uid("camp"), name, message, active: true, number: "(604) 363-7858", property: "Any", code: `TXT${current.campaigns.length + 10}` }] }));
          chrome.toast("Campaign saved on this device.");
          onClose();
        }}>Save</Btn>
      </div>
    </ModalFrame>
  );
}

function TextResponder() {
  const { state, update } = useCinc();
  const chrome = useChrome();
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center">
        <h2 className="flex-1 text-center text-[16px] font-bold">Your texting number: (604) 363-7858</h2>
        <a href={href.templates} className="mr-2 h-[22px] bg-[#1c93b5] px-3 text-[12px] leading-[22px] text-white">Templates</a>
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
  const [form, setForm] = useState({ address: "", price: "", beds: "3", baths: "2", sqft: "1400", status: "Active" });
  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="bg-white p-4">
        <Field label="Address"><input className={inputCls} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
        <Field label="Price"><input className={inputCls} value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Beds"><input className={inputCls} value={form.beds} onChange={(event) => setForm({ ...form, beds: event.target.value })} /></Field>
          <Field label="Baths"><input className={inputCls} value={form.baths} onChange={(event) => setForm({ ...form, baths: event.target.value })} /></Field>
          <Field label="Sqft"><input className={inputCls} value={form.sqft} onChange={(event) => setForm({ ...form, sqft: event.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <a href={href.properties} className="inline-flex h-6 items-center border border-[#ccc] px-2 text-[12px]">Cancel</a>
          <Btn kind="teal" onClick={() => {
            update((current) => ({ ...current, pocket: [...current.pocket, { id: uid("pocket"), address: form.address || "Pocket listing", mls: "POCKET", status: form.status, price: form.price || "—", beds: Number(form.beds) || 0, baths: Number(form.baths) || 0, sqft: Number(form.sqft) || 0, feature: "Pocket" }] }));
            chrome.toast("Pocket listing saved.");
            window.location.href = href.properties;
          }}>Save</Btn>
        </div>
      </div>
    </div>
  );
}

export function SellerView() {
  return (
    <div className="bg-[#f5f5f5] p-4">
      <p className="text-[13px] text-[#555]">You do not have permission to edit Seller Suite pages</p>
    </div>
  );
}

function pageStats(id: string) {
  let seed = 0;
  for (let index = 0; index < id.length; index += 1) seed += id.charCodeAt(index);
  return { leads: seed % 17, views: (seed * 3) % 90, conv: seed % 8 };
}

export function LandingView({ category }: { category: "all" | "buyers" | "sellers" | "contact" }) {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const [sort, setSort] = useState<"title" | "leads" | "views" | "conv">("title");
  const [dir, setDir] = useState<1 | -1>(1);
  useEffect(() => {
    if (window.location.hash.includes("add")) {
      const name = window.prompt("Landing page name");
      if (name) {
        const cat = category === "all" ? "buyers" : category;
        update((current) => ({ ...current, landingPages: [...current.landingPages, { id: uid("lp"), name, category: cat, url: `/info/${name.toLowerCase().replace(/\s+/g, "-")}`, active: false }] }));
        chrome.toast("Landing page created on this device.");
      }
      window.history.replaceState(null, "", "/dashboard/landing/#/");
    }
    // Prompt once when the add hash is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const query = chrome.leadSearch.trim().toLowerCase();
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
      <button type="button" className="mb-3 inline-flex h-[22px] items-center gap-1 bg-[#1c93b5] px-3 text-[12px] text-white" onClick={() => {
        const name = window.prompt("Landing page name");
        if (!name) return;
        const cat = category === "all" ? "buyers" : category;
        update((current) => ({ ...current, landingPages: [...current.landingPages, { id: uid("lp"), name, category: cat, url: `/info/${name.toLowerCase().replace(/\s+/g, "-")}`, active: false }] }));
        chrome.toast("Landing page created on this device.");
      }}>⊕ Add Landing Page</button>
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
              <button type="button" className="text-[12px] text-[#1c93b5]" onClick={() => {
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

export function SettingsView({ tab }: { tab: "profile" | "settings" | "integrations" | "notifications" | "customlinks" }) {
  const tabs = [
    ["profile", "Profile", href.profile],
    ["settings", "Settings", href.settings],
    ["integrations", "Integrations", href.integrations],
    ["notifications", "Notifications", href.notifications],
    ["customlinks", "Custom Links", href.customLinks],
  ] as const;
  return (
    <div className="p-4">
      <div className="mb-4 grid grid-cols-5 border border-[#ddd] bg-[#ececec] text-[11px] font-bold">
        {tabs.map(([id, label, link]) => (
          <a key={id} href={link} className={`border-r border-[#ddd] py-3 text-center last:border-r-0 ${tab === id ? "border-t-[3px] border-t-[#1c93b5] bg-white text-[#1c93b5]" : "text-[#555]"}`}>{label}</a>
        ))}
      </div>
      {tab === "profile" ? <ProfileTab /> : null}
      {tab === "settings" ? <SettingsTab /> : null}
      {tab === "integrations" ? <IntegrationsTab /> : null}
      {tab === "notifications" ? <NotificationsTab /> : null}
      {tab === "customlinks" ? <CustomLinksTab /> : null}
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
    chrome.toast(response.ok ? okMessage : data?.message || "Could not save your profile.");
    if (response.ok) office.refresh();
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
        <div className="mb-3 flex items-center justify-between text-[13px]"><span className="font-bold">Cell Phone</span><span>{profile.cell}</span></div>
        <div className="flex justify-end gap-2">
          <Btn kind="blue" onClick={() => { update((current) => ({ ...current, mail: [queuedMail({ kind: "email", to: profile.email, subject: "Password recovery", body: `Recovery link for ${profile.email}.` }), ...current.mail] })); chrome.toast(`Recovery email queued for ${profile.email}. It is in Sent.`); }}>Send Email Recovery Link</Btn>
          <Btn kind="blue" onClick={() => { update((current) => ({ ...current, mail: [queuedMail({ kind: "text", to: profile.cell, subject: "Recovery text", body: `Recovery code for ${profile.cell}.` }), ...current.mail] })); chrome.toast(`Recovery text queued for ${profile.cell}. It is in Sent.`); }}>Send Text Recovery Link</Btn>
        </div>
      </Card>
      <Card title="Site Subdomain">
        <label className="mb-1 block text-right text-[12px]">Subdomain</label>
        <input className={inputCls} value={profile.subdomain} onChange={(event) => set("subdomain", event.target.value)} />
        <p className="mt-1 text-[12px]">.greatervancouverhomesearch.com</p>
        <div className="mt-2 text-right"><Btn kind="blue" onClick={() => void persist("Subdomain saved.")}>Update</Btn></div>
      </Card>
      <Card title="Agent CINC Number">
        <p className="font-mono text-[12px]">{AGENT_NUMBER}</p>
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
      <div className="mt-4 text-right"><Btn kind="blue" onClick={() => chrome.toast("Settings updated on this device.")}>Update</Btn></div>
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
      <p className="mb-2 text-[13px] text-[#666]">Choose which pond agents get a copy of Kayla&apos;s alerts. Saved on this device.</p>
      {names.map((name) => {
        const on = Boolean(state.notifications[`pond:${name}`]?.cinc);
        return (
          <label key={name} className="flex items-center gap-2 py-1 text-[13px]">
            <input
              type="checkbox"
              checked={on}
              onChange={() => update((current) => ({
                ...current,
                notifications: { ...current.notifications, [`pond:${name}`]: { cinc: !on, email: false, text: true } },
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
  return (
    <div className="bg-white p-4">
      <h2 className="text-[13px] font-bold tracking-wide">MANAGE POND AGENT NOTIFICATIONS</h2>
      <div className="my-3 bg-[#eee] p-3">
        <button type="button" className="bg-[#1c93b5] px-3 py-1 text-[12px] text-white" onClick={() => chrome.openModal(<PondModal onClose={chrome.closeModal} />)}>Manage Notifications for Pond Agents</button>
      </div>
      {NOTIFY_GROUPS.map((group) => (
        <section key={group.title} className="mb-4">
          <h3 className="mb-2 text-[11px] font-bold tracking-wide uppercase">{group.title}</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {group.items.map((item) => {
              const pref = state.notifications[item.id] ?? { cinc: false, email: false, text: true };
              const emailLocked = item.id !== "Inquiry" && item.id !== "Existing Lead Home Value Request";
              const toggle = (key: "cinc" | "email" | "text") => update((current) => ({
                ...current,
                notifications: { ...current.notifications, [item.id]: { ...pref, [key]: !pref[key] } },
              }));
              return (
                <article key={item.id} className="relative bg-[#f3f3f3] p-3">
                  <button type="button" className="absolute top-2 right-2 bg-[#1c93b5] px-1 text-[10px] text-white" onClick={() => { update((current) => ({ ...current, mail: [queuedMail({ folder: "inbox", unread: true, kind: !emailLocked && pref.email ? "email" : "text", from: "System", to: CRM_AGENT.name, subject: `Test: ${item.id}`, body: `Test ${item.id} for ${CRM_AGENT.name}.` }), ...current.mail] })); chrome.toast(`Test ${item.id} is in the inbox.`); }}>TEST</button>
                  <p className="pr-10 text-[13px] font-bold">{item.id}</p>
                  <p className="mt-1 text-[12px] text-[#666]">{item.description}</p>
                  <div className="mt-2 flex gap-3 text-[11px]">
                    <label><input type="checkbox" checked={pref.cinc} onChange={() => toggle("cinc")} /> CINCAgent</label>
                    <label className={emailLocked ? "text-[#aaa]" : ""}><input type="checkbox" disabled={emailLocked} checked={emailLocked ? false : pref.email} onChange={() => toggle("email")} /> Email</label>
                    <label><input type="checkbox" checked={pref.text} onChange={() => toggle("text")} /> Text</label>
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
          <button type="button" className="h-[22px] bg-[#1c93b5] px-3 text-[12px] text-white" onClick={() => { if (label.trim()) { update((current) => ({ ...current, customLinks: [...current.customLinks, { id: uid("link"), label, url }] })); setLabel(""); setUrl(""); setCreating(false); } chrome.toast("Custom links saved."); }}>Save</button>
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
  const { update } = useCinc();
  const chrome = useChrome();
  const [index, setIndex] = useState(0);
  const people = [...leads.map((lead) => ({ id: lead.id, name: lead.name, phone: lead.phone })), ...[{ id: "crm-1", name: "Morgan Ellis", phone: "(604) 555-0188" }]];
  const current = people[index];
  return (
    <div className="mx-auto max-w-lg p-6">
      <div className="bg-white p-5 text-center">
        <p className="text-[12px] uppercase text-[#888]">Dialer</p>
        <p className="mt-2 text-[20px] font-semibold">{current?.name}</p>
        <p className="text-[#1c93b5]">{current?.phone}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Btn kind="teal" onClick={() => {
            if (!current) return;
            update((s) => ({ ...s, calls: [{ id: uid("call"), leadId: current.id, name: current.name, at: nowLabel(), kind: "call" }, ...s.calls] }));
            chrome.toast("Call logged.");
            setIndex((value) => (value + 1) % people.length);
          }}>Log call</Btn>
          <Btn onClick={() => {
            if (!current) return;
            update((s) => ({ ...s, calls: [{ id: uid("call"), leadId: current.id, name: current.name, at: nowLabel(), kind: "voicemail" }, ...s.calls] }));
            chrome.toast("Voicemail logged.");
          }}>Voicemail</Btn>
          <Btn onClick={() => setIndex((value) => (value + 1) % people.length)}>Skip</Btn>
        </div>
      </div>
    </div>
  );
}

export function CalendarView() {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const now = new Date();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return (
    <div className="p-4">
      <div className="grid grid-cols-7 gap-1 bg-white p-3">
        {Array.from({ length: days }, (_, index) => index + 1).map((day) => (
          <button key={day} type="button" className="h-16 border border-[#eee] text-left text-[12px] hover:bg-[#e7f5f8]" onClick={() => {
            const title = window.prompt(`Appointment on ${now.toLocaleString("en-US", { month: "long" })} ${day}`);
            if (!title) return;
            update((current) => ({ ...current, appointments: [...current.appointments, { id: uid("appt"), leadId: "", title, when: `${now.getMonth() + 1}/${day}` }] }));
            chrome.toast("Appointment added.");
          }}>
            {day}
            {state.appointments.filter((item) => item.when === `${now.getMonth() + 1}/${day}` || item.when.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`)).map((item) => <span key={item.id} className="block truncate text-[10px] text-[#1c93b5]">{item.title}</span>)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TasksView() {
  const { state, update } = useCinc();
  return (
    <div className="p-4">
      <div className="bg-white p-4">
        {state.reminders.map((item) => (
          <label key={item.id} className="flex items-center gap-2 border-b border-[#eee] py-2 text-[13px]">
            <input type="checkbox" checked={item.done} onChange={() => update((current) => ({ ...current, reminders: current.reminders.map((reminder) => reminder.id === item.id ? { ...reminder, done: !reminder.done } : reminder) }))} />
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
  const composer = useComposer();
  const { update } = useCinc();
  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="bg-white p-5">
        <h2 className="mb-2 text-[16px] font-semibold">Send a campaign</h2>
        <p className="mb-3 text-[13px] text-[#666]">Emails stay in the Sent folder. Nothing leaves this browser.</p>
        <Btn kind="teal" onClick={() => composer.email("", (sent, value) => { update((current) => ({ ...current, mail: [{ id: uid("mail"), folder: sent ? "sent" as const : "drafts" as const, kind: "email" as const, to: value.to, subject: value.subject, body: value.body, at: nowLabel() }, ...current.mail] })); chrome.toast(sent ? "Campaign saved in Sent." : "Campaign saved as a draft."); })}>New campaign email</Btn>
      </div>
    </div>
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
