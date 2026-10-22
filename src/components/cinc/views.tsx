"use client";

import { useMemo, useState } from "react";
import { CRM_AGENT, CRM_AUTOTRACKS, CRM_PROPERTIES, CRM_TODAY_FEED } from "@/lib/cinc-crm";
import { useLeads } from "@/lib/leads";
import { useChrome } from "./chrome-context";
import { href } from "./route";
import { INTEGRATIONS, NOTIFY_GROUPS, nowLabel, uid, useCinc, type Deal, type DealStage } from "./store";
import { Btn, EmptyArt, Field, inputCls, Menu, ModalFrame, useComposer } from "./ui";

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

  return (
    <div className="p-5">
      <h1 className="text-[22px] font-bold text-[#243238]">Welcome back, {CRM_AGENT.name}.</h1>
      <p className="mt-1 text-[14px] text-[#555]">
        {dateLine} {ordinal(today.getDate())}. You have{" "}
        <a href={href.calendar} className="font-semibold text-[#1c93b5]">{state.appointments.length} appointments</a> scheduled today.
      </p>
      <section className="mt-4 bg-white shadow-sm">
        <header className="flex items-center gap-2 border-b border-[#eee] px-4 py-3 text-[14px] font-semibold">
          <span>☰</span> Today
        </header>
        <div className="flex flex-wrap gap-1 border-b border-[#eee] px-3">
          {tabs.map(([label, count]) => (
            <button key={label} type="button" className={`px-3 py-2 text-[13px] ${tab === label ? "border-b-2 border-[#1c93b5] text-[#1c93b5]" : "text-[#666]"}`} onClick={() => setTab(label)}>
              {label}
              {label === "Contact Requested" && count ? <span className="ml-1 rounded-full bg-[#d9363e] px-1.5 text-[10px] text-white">{count > 99 ? "99+" : count}</span> : null}
            </button>
          ))}
        </div>
        <div className="p-4">
          {tab === "Contact Requested" ? (
            <>
              <div className="mb-3 flex gap-3 text-[12px]">
                <Menu
                  label={<span className="border border-[#ccc] px-2 py-1">Type: {types.join(", ")} ▾</span>}
                  items={["All", "AI Ready", "Cash Offer Inquiry", "Etta Message", "HomePulse Inquiry", "Property Inquiry", "Showing Request", "Clear"].map((label) => ({
                    label,
                    onClick: () => setTypes(label === "Clear" || label === "All" ? ["All"] : types.includes("All") ? [label] : types.includes(label) ? types.filter((item) => item !== label) : [...types, label]),
                  }))}
                />
                <Menu
                  label={<span className="border border-[#ccc] px-2 py-1">Status: {statuses.join(", ")} ▾</span>}
                  items={["Awaiting Response", "Acted On", "Dismissed", "Clear"].map((label) => ({
                    label,
                    onClick: () => setStatuses(label === "Clear" ? ["Awaiting Response"] : statuses.includes(label) ? statuses.filter((item) => item !== label) : [...statuses, label]),
                  }))}
                />
              </div>
              {visible.length ? visible.map((item) => (
                <article key={item.id} className="mb-3 flex gap-3 border border-[#eee] p-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center bg-[#e7f5f8] text-[#1c93b5]">{item.kind === "Showing Request" ? "▦" : "?"}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <a className="font-semibold text-[#1c93b5]" href={href.lead(item.sourceId)}>{item.name}</a>
                      <span className="text-[11px] text-[#999]">{item.at}</span>
                      <span className="ml-auto">
                        <Menu
                          label={<span className="px-1">⋮</span>}
                          items={[
                            { label: "Mark Acted On", onClick: () => update((current) => ({ ...current, requests: { ...current.requests, [item.id]: "acted" } })) },
                            { label: "Dismiss", onClick: () => update((current) => ({ ...current, requests: { ...current.requests, [item.id]: "dismissed" } })) },
                          ]}
                        />
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold">{item.kind}</p>
                    <p className="bg-[#f6f6f6] px-2 py-1 text-[12px] text-[#666]">{item.message}</p>
                    <div className="mt-2 flex gap-2">
                      <img src={item.image} alt="" className="h-[72px] w-[100px] object-cover" />
                      <div>
                        <a className="text-[13px] text-[#1c93b5]" href="/search">{item.address}</a>
                        <p className="text-[12px]">{item.price}</p>
                      </div>
                    </div>
                  </div>
                </article>
              )) : <EmptyArt title="Congrats! All caught up on requests." body="Keep up the good work." />}
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
                <button type="button" className="grid h-7 w-7 place-items-center bg-[#1c93b5] text-white" onClick={() => chrome.toast("Prospecting list refreshed.")}>↻</button>
                <Menu label={<span className="bg-[#1c93b5] px-2 py-1 text-[12px] text-white">Actions ▾</span>} items={[{ label: "Start a dialer campaign", href: href.dialer }]} />
              </div>
              <p className="mb-2 text-[12px] text-[#888]">
                {prospect.startsWith("New") ? "Leads in the New Lead pipeline. Update pipeline after calling." : prospect.includes("P2") ? "Leads in Attempted Contact who registered last 14 days." : "Attempted Contact leads who were active within 30 days."}
              </p>
              <table className="w-full text-left text-[12px]">
                <thead className="text-[10px] uppercase text-[#888]"><tr><th>Lead Name</th><th>Pipeline</th><th>Call Info</th><th>Last Login</th></tr></thead>
                <tbody>
                  {leads.slice(0, 4).map((lead) => (
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
              {state.reminders.filter((item) => !item.done).map((item) => (
                <article key={item.id} className="mb-2 flex gap-2 border border-[#eee] p-3">
                  <button type="button" className="text-[#2e9e5b]" onClick={() => update((current) => ({ ...current, reminders: current.reminders.map((reminder) => reminder.id === item.id ? { ...reminder, done: true } : reminder) }))}>✓</button>
                  <div>
                    <a className="text-[#1c93b5]" href={href.lead(item.leadId)}>{item.title}</a>
                    <p className="text-[12px] text-[#d9363e]">Overdue: {item.due}</p>
                  </div>
                </article>
              ))}
              {!state.reminders.filter((item) => !item.done).length ? <p className="text-[13px] text-[#888]">No reminders for this range.</p> : null}
            </div>
          ) : null}
          {tab === "Deal Reminders" ? <p className="text-[13px] text-[#888]">No deal reminders. <a className="text-[#1c93b5]" href={href.dealsPurchases}>Open deals</a></p> : null}
          {tab === "Trending Leads" ? (
            <div>
              <div className="mb-3 flex gap-2 text-[12px]">
                <select className="h-7 border border-[#ccc]"><option>Type: All</option><option>Buyer</option><option>Seller</option></select>
                <button type="button" onClick={() => chrome.toast("All activity rows expanded.")}>Expand All ⇅</button>
                <select className="h-7 border border-[#ccc]"><option>Sort By: Last Call Least Recent</option><option>Sort By: Last Login</option></select>
              </div>
              {CRM_TODAY_FEED.slice(0, 3).map((item) => (
                <article key={item.id} className="mb-2 border border-[#eee] p-3">
                  <a className="font-semibold text-[#1c93b5]" href={href.lead(item.id)}>{item.name}</a>
                  <p className="text-[12px]">High Property Views</p>
                  <p className="text-[12px] text-[#888]">Last Call: —</p>
                  <button type="button" className="text-[12px] text-[#1c93b5]" onClick={() => chrome.toast("Additional activities are on the lead timeline.")}>View Additional Activities (2)</button>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export function CallSummaryView() {
  const { state } = useCinc();
  const [frame, setFrame] = useState("Last 7 Days");
  const calls = state.calls.filter((call) => call.kind === "call");
  const voicemails = state.calls.filter((call) => call.kind === "voicemail");
  return (
    <div className="p-4">
      <div className="bg-white p-4">
        <label className="text-[12px]">
          Timeframe{" "}
          <select className="ml-2 h-7 border border-[#ccc]" value={frame} onChange={(event) => setFrame(event.target.value)}>
            {["Last 7 Days", "Last 30 Days", "This Month", "Last Month", "Custom"].map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <table className="mt-4 w-full text-left text-[12px]">
          <thead className="text-[10px] uppercase text-[#888]"><tr><th>Agent</th><th>Last Login</th><th>Call Logs</th><th>Calls</th><th>Voicemails</th></tr></thead>
          <tbody>
            {calls.length || voicemails.length ? (
              <tr className="border-t border-[#eee]">
                <td className="py-2">{CRM_AGENT.name}</td>
                <td>Today</td>
                <td>{state.calls.length}</td>
                <td>{calls.length}</td>
                <td>{voicemails.length}</td>
              </tr>
            ) : (
              <tr><td colSpan={5} className="py-8 text-center text-[#888]">No call logs for this timeframe.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const STAGES: { id: DealStage; label: string }[] = [
  { id: "showing", label: "Showing" },
  { id: "offer", label: "Offer Made" },
  { id: "contract", label: "Under Contract" },
  { id: "closed", label: "Closed" },
];

export function DealsView({ board }: { board: "purchases" | "listings" }) {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const [status, setStatus] = useState("Active");
  const [created, setCreated] = useState("Anytime");
  const [sort, setSort] = useState("Reminder Due Date");
  const deals = state.deals
    .filter((deal) => deal.board === board && (status === "All" || deal.status === status))
    .filter((deal) => created === "Anytime" || Date.now() - deal.createdAt < (created === "Last 7 Days" ? 7 : 30) * 86400000)
    .sort((a, b) => sort === "Price" ? a.price.localeCompare(b.price) : b.createdAt - a.createdAt);

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-4 text-[14px]">
          <a href={href.dealsPurchases} className={board === "purchases" ? "border-b-2 border-[#1c93b5] text-[#1c93b5]" : "text-[#666]"}>Purchases</a>
          <a href={href.dealsListings} className={board === "listings" ? "border-b-2 border-[#1c93b5] text-[#1c93b5]" : "text-[#666]"}>Listings</a>
        </div>
        <div className="flex gap-2">
          <Btn onClick={() => chrome.openModal(<ModalFrame title="Advertise Listings" onClose={chrome.closeModal}><p className="text-[13px]">Listings would be sent to CINC advertising. This demo saved the request on this device.</p><div className="mt-3 text-right"><Btn kind="teal" onClick={chrome.closeModal}>OK</Btn></div></ModalFrame>)}>Advertise Listings</Btn>
          <Btn kind="teal" onClick={() => chrome.openModal(<DealModal board={board} onClose={chrome.closeModal} />)}>+ Add Deal</Btn>
        </div>
      </div>
      <div className="mb-3 flex gap-3 text-[12px]">
        <label>Status <select className="ml-1 h-7 border border-[#ccc]" value={status} onChange={(event) => setStatus(event.target.value)}><option>Active</option><option>Archived</option><option>All</option></select></label>
        <label>Created <select className="ml-1 h-7 border border-[#ccc]" value={created} onChange={(event) => setCreated(event.target.value)}><option>Anytime</option><option>Last 7 Days</option><option>Last 30 Days</option></select></label>
        <label>Sort By <select className="ml-1 h-7 border border-[#ccc]" value={sort} onChange={(event) => setSort(event.target.value)}><option>Reminder Due Date</option><option>Newest</option><option>Price</option></select></label>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {STAGES.map((stage) => {
          const cards = deals.filter((deal) => deal.stage === stage.id);
          const sum = cards.reduce((total, deal) => total + (Number(deal.potential.replace(/[^0-9.]/g, "")) || 0), 0);
          return (
            <section key={stage.id}>
              <h2 className="text-[11px] font-bold tracking-wide text-[#888] uppercase">{stage.label}</h2>
              <p className="text-[12px] text-[#666]">{cards.length}</p>
              <p className="mb-2 text-[12px] text-[#999]">{cards.length ? `$${sum.toLocaleString()}` : "$-- | $-- Potential"}</p>
              {cards.map((deal) => (
                <article key={deal.id} className="mb-2 bg-white p-3 shadow-sm">
                  <p className="font-semibold">{deal.client}</p>
                  <p className="text-[12px]">{deal.address}</p>
                  <p className="text-[12px] text-[#1c93b5]">{deal.price}</p>
                  <div className="mt-2 flex gap-2">
                    <select className="h-6 border border-[#ccc] text-[11px]" value={deal.stage} onChange={(event) => update((current) => ({ ...current, deals: current.deals.map((item) => item.id === deal.id ? { ...item, stage: event.target.value as DealStage } : item) }))}>
                      {STAGES.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                    </select>
                    <button type="button" className="text-[11px] text-[#d9363e]" onClick={() => update((current) => ({ ...current, deals: current.deals.filter((item) => item.id !== deal.id) }))}>Delete</button>
                  </div>
                </article>
              ))}
            </section>
          );
        })}
      </div>
      {!deals.length ? (
        <div className="mt-6 text-center">
          <p className="text-[16px] font-semibold">No Deals Found</p>
          <p className="text-[13px] text-[#888]">Adjusting your filters may help.</p>
        </div>
      ) : null}
    </div>
  );
}

function DealModal({ board, onClose }: { board: "purchases" | "listings"; onClose: () => void }) {
  const { update } = useCinc();
  const chrome = useChrome();
  const [form, setForm] = useState({ client: "", address: "", price: "", potential: "", stage: "showing" as DealStage });
  return (
    <ModalFrame title="Add Deal" onClose={onClose}>
      <Field label="Client"><input className={inputCls} value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })} /></Field>
      <Field label="Address"><input className={inputCls} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
      <Field label="Price"><input className={inputCls} value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></Field>
      <Field label="Potential"><input className={inputCls} value={form.potential} onChange={(event) => setForm({ ...form, potential: event.target.value })} /></Field>
      <Field label="Stage">
        <select className={inputCls} value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value as DealStage })}>
          {STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
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
  const [query, setQuery] = useState("");
  const messages = state.mail.filter((mail) => mail.folder === folder && `${mail.subject} ${mail.body} ${mail.to}`.toLowerCase().includes(query.toLowerCase()));

  function send(kind: "email" | "text", value: { to: string; subject?: string; body: string }, target: "sent" | "drafts") {
    update((current) => ({
      ...current,
      mail: [{ id: uid("mail"), folder: target, kind, to: value.to, subject: value.subject || kind, body: value.body, at: nowLabel() }, ...current.mail],
    }));
    chrome.toast(target === "sent" ? "Sent. It is in the Sent folder." : "Draft saved.");
  }

  if (folder === "templates") {
    const rows = state.templates.filter((item) => item.group === group);
    return (
      <div className="flex h-full min-h-0">
        <aside className="w-52 shrink-0 border-r border-[#eee] bg-white p-3">
          {state.groups.map((name) => (
            <button key={name} type="button" className={`mb-1 flex w-full items-center justify-between px-2 py-1 text-left text-[13px] ${group === name ? "bg-[#e7f5f8] text-[#1c93b5]" : ""}`} onClick={() => setGroup(name)}>
              {name}
              <span>{state.templates.filter((item) => item.group === name).length}</span>
            </button>
          ))}
          <Btn onClick={() => {
            const name = window.prompt("Group name");
            if (!name) return;
            update((current) => ({ ...current, groups: [...current.groups, name] }));
          }}>Add Group</Btn>
        </aside>
        <div className="min-w-0 flex-1 p-3">
          <div className="mb-2 flex gap-2">
            <Btn kind="teal" onClick={() => chrome.openModal(<TemplateModal group={group} onClose={chrome.closeModal} />)}>New Template</Btn>
            <Btn onClick={() => {
              const name = window.prompt("Move selected to group");
              if (!name) return;
              update((current) => ({
                ...current,
                groups: current.groups.includes(name) ? current.groups : [...current.groups, name],
                templates: current.templates.map((item) => picked.includes(item.id) ? { ...item, group: name } : item),
              }));
              setPicked([]);
            }}>Move Selected to Group</Btn>
          </div>
          <table className="w-full bg-white text-left text-[12px]">
            <thead className="text-[10px] uppercase text-[#888]"><tr><th></th><th>Name</th><th>Type</th><th>Created By</th><th>Last Edited</th><th>Analytics</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#eee]">
                  <td><input type="checkbox" checked={picked.includes(row.id)} onChange={(event) => setPicked(event.target.checked ? [...picked, row.id] : picked.filter((id) => id !== row.id))} /></td>
                  <td className="py-2">{row.name}</td>
                  <td>{row.type}</td>
                  <td>{row.createdBy}</td>
                  <td>{row.edited}</td>
                  <td><button type="button" className="text-[#1c93b5]" onClick={() => chrome.toast(`${row.name}: 0 sends in this demo.`)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#eee] bg-white px-3 py-2">
        <input type="checkbox" onChange={(event) => setPicked(event.target.checked ? messages.map((mail) => mail.id) : [])} />
        <Btn kind="teal" onClick={() => composer.email("", (sent, value) => send("email", value, sent ? "sent" : "drafts"))}>New Email</Btn>
        <Btn kind="teal" onClick={() => composer.text("", (value) => send("text", value, "sent"))}>New Text</Btn>
        <button type="button" title="Trash" onClick={() => update((current) => ({ ...current, mail: current.mail.map((mail) => picked.includes(mail.id) ? { ...mail, folder: "trashed" } : mail) }))}>🗑</button>
        <button type="button" className="grid h-6 w-6 place-items-center bg-[#1c93b5] text-white" onClick={() => chrome.toast("Inbox refreshed.")}>↻</button>
        <Menu label={<span className="border border-[#ccc] px-2 py-1 text-[12px]">Filters ▾</span>} items={[{ label: "Unread", onClick: () => chrome.toast("Showing every message in this folder. Unread items are marked in the list.") }, { label: "Email only", onClick: () => chrome.toast("Use the Type column mindset: emails and texts are both listed.") }]} />
        <span className="ml-auto text-[12px] text-[#666]">{messages.length ? `1 – ${messages.length} of ${messages.length}` : "0 of 0"}</span>
        <input className="h-6 w-36 border border-[#ccc] px-2 text-[12px]" placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {messages.length ? messages.map((mail) => (
          <article key={mail.id} className="flex gap-3 border-b border-[#eee] bg-white px-4 py-3">
            <input type="checkbox" checked={picked.includes(mail.id)} onChange={(event) => setPicked(event.target.checked ? [...picked, mail.id] : picked.filter((id) => id !== mail.id))} />
            <div className="min-w-0 flex-1">
              <p className={mail.unread ? "font-bold" : ""}>{mail.subject} <span className="text-[11px] text-[#999]">{mail.kind}</span></p>
              <p className="truncate text-[12px] text-[#666]">{mail.body}</p>
            </div>
            <span className="text-[11px] text-[#999]">{mail.at}</span>
          </article>
        )) : (
          <div className="p-6">
            <div className="mb-2 h-8 animate-pulse bg-[#eee]" />
            <div className="mb-2 h-8 animate-pulse bg-[#f3f3f3]" />
            <p className="py-8 text-center text-[13px] text-[#888]">0 of 0</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateModal({ group, onClose }: { group: string; onClose: () => void }) {
  const { update } = useCinc();
  const chrome = useChrome();
  const [name, setName] = useState("");
  const [type, setType] = useState<"Email" | "Text">("Email");
  const [body, setBody] = useState("");
  return (
    <ModalFrame title="New Template" onClose={onClose}>
      <Field label="Name"><input className={inputCls} value={name} onChange={(event) => setName(event.target.value)} /></Field>
      <Field label="Type"><select className={inputCls} value={type} onChange={(event) => setType(event.target.value as "Email" | "Text")}><option>Email</option><option>Text</option></select></Field>
      <textarea className="h-24 w-full border border-[#ccc] p-2 text-[13px]" value={body} onChange={(event) => setBody(event.target.value)} />
      <div className="mt-3 flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind="teal" onClick={() => {
          update((current) => ({ ...current, templates: [...current.templates, { id: uid("tpl"), group, name: name || "Untitled", type, createdBy: CRM_AGENT.name, edited: nowLabel(), body }] }));
          chrome.toast("Template saved.");
          onClose();
        }}>Save</Btn>
      </div>
    </ModalFrame>
  );
}

export function AutoTracksView() {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const [cat, setCat] = useState("All");
  const tracks = useMemo(() => {
    const overrides = new Map(state.tracks.map((track) => [track.id, track]));
    const base = CRM_AUTOTRACKS.filter((track) => !state.hiddenTracks.includes(track.id)).map((track) => overrides.get(track.id) ?? { ...track, trigger: "New lead" });
    const extra = state.tracks.filter((track) => !CRM_AUTOTRACKS.some((item) => item.id === track.id) && !state.hiddenTracks.includes(track.id));
    return [...extra, ...base];
  }, [state.hiddenTracks, state.tracks]);
  const shown = tracks.filter((track) => cat === "All" || cat === track.category || (cat === "My AutoTracks" && track.category === "My AutoTracks"));
  const active = tracks.filter((track) => track.status === "active").length;
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-6 text-[13px]">
        <span>Total {tracks.length}</span>
        <span>Active {active}</span>
        <span>Paused {tracks.length - active}</span>
        <Btn kind="teal" onClick={() => chrome.openModal(<TrackModal onClose={chrome.closeModal} />)}>+ Start/Edit an AutoTrack</Btn>
      </div>
      <div className="mb-3 flex flex-wrap gap-2 text-[13px]">
        {["All", "General", "Buyer", "Listing", "Nurture", "Past Client", "My AutoTracks"].map((label) => (
          <button key={label} type="button" className={`px-2 py-1 ${cat === label ? "border-b-2 border-[#1c93b5] text-[#1c93b5]" : ""}`} onClick={() => setCat(label)}>{label}</button>
        ))}
      </div>
      <table className="w-full bg-white text-left text-[13px]">
        <thead className="text-[10px] uppercase text-[#888]"><tr><th className="px-3 py-2">AutoTrack</th><th>Category</th><th>Actions</th></tr></thead>
        <tbody>
          {shown.map((track) => (
            <tr key={track.id} className="border-t border-[#eee]">
              <td className="px-3 py-2">{track.name}</td>
              <td>{track.category}</td>
              <td>
                <Menu
                  label={<span>…</span>}
                  items={[
                    { label: track.status === "active" ? "Pause" : "Resume", onClick: () => {
                      const status = track.status === "active" ? "paused" : "active";
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrackModal({ onClose }: { onClose: () => void }) {
  const { update } = useCinc();
  const chrome = useChrome();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [trigger, setTrigger] = useState("New lead");
  return (
    <ModalFrame title="Start an AutoTrack" onClose={onClose}>
      <Field label="Name"><input className={inputCls} value={name} onChange={(event) => setName(event.target.value)} /></Field>
      <Field label="Category"><select className={inputCls} value={category} onChange={(event) => setCategory(event.target.value)}>{["General", "Buyer", "Listing", "Nurture", "Past Client", "My AutoTracks"].map((option) => <option key={option}>{option}</option>)}</select></Field>
      <Field label="Start trigger"><input className={inputCls} value={trigger} onChange={(event) => setTrigger(event.target.value)} /></Field>
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Cancel</Btn><Btn kind="teal" onClick={() => { update((current) => ({ ...current, tracks: [...current.tracks, { id: uid("track"), name: name || "New AutoTrack", category, status: "active", trigger }] })); chrome.toast("AutoTrack started."); onClose(); }}>Save</Btn></div>
    </ModalFrame>
  );
}

export function BehavioralView() {
  const { state, update } = useCinc();
  const chrome = useChrome();
  return (
    <div className="p-4">
      <div className="bg-white p-4">
        <h2 className="mb-3 text-[16px]">Behavioral Messaging</h2>
        {Object.entries(state.behavioral).map(([name, on]) => (
          <div key={name} className="flex items-center justify-between border-t border-[#eee] py-3">
            <div>
              <p className="font-semibold">{name}</p>
              <p className="text-[12px] text-[#777]">Sends when a lead matches this behavior. Saved on this device.</p>
            </div>
            <button type="button" className={`h-6 w-12 rounded-full ${on ? "bg-[#1c93b5]" : "bg-[#ccc]"}`} onClick={() => update((current) => ({ ...current, behavioral: { ...current.behavioral, [name]: !on } }))}>
              <span className={`block h-5 w-5 rounded-full bg-white ${on ? "ml-6" : "ml-0.5"}`} />
            </button>
          </div>
        ))}
        <Btn onClick={() => chrome.toast("A sample behavioral email was queued.")}>Send preview</Btn>
      </div>
    </div>
  );
}

export function AiView() {
  const chrome = useChrome();
  return (
    <div className="p-6">
      <div className="mx-auto max-w-xl bg-white p-8 text-center">
        <p className="text-[12px] font-bold tracking-[0.2em] text-[#1c93b5]">CINC AI</p>
        <h2 className="mt-2 text-[22px] font-semibold">Get CINC AI</h2>
        <p className="mt-2 text-[14px] text-[#555]">Draft follow-ups, summarize lead activity, and suggest the next call. This demo does not call a live model.</p>
        <button type="button" className="mt-4 bg-[#1c93b5] px-4 py-2 text-white" onClick={() => chrome.openModal(<ModalFrame title="Get CINC AI" onClose={chrome.closeModal}><p className="text-[13px]">Request received for {CRM_AGENT.name}. A specialist would follow up. The request is saved on this device.</p><div className="mt-3 text-right"><Btn kind="teal" onClick={chrome.closeModal}>Close</Btn></div></ModalFrame>)}>Get CINC AI</button>
      </div>
    </div>
  );
}

export function PropertiesView({ sub }: { sub: "list" | "text" | "open" | "virtual" | "add" }) {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const composer = useComposer();
  const [status, setStatus] = useState("Active");
  const [sort, setSort] = useState("Updated");
  const [query, setQuery] = useState("");
  if (sub === "text") return <TextResponder />;
  if (sub === "add") return <AddPocket />;
  if (sub === "open" || sub === "virtual") {
    const rows = state.openHouses.filter((item) => Boolean(item.virtual) === (sub === "virtual"));
    return (
      <div className="p-4">
        <div className="mb-3 flex justify-end"><Btn kind="teal" onClick={() => {
          const address = window.prompt("Address");
          if (!address) return;
          update((current) => ({ ...current, openHouses: [...current.openHouses, { id: uid("oh"), address, when: "Saturday 1–3 PM", virtual: sub === "virtual" }] }));
        }}>Add {sub === "virtual" ? "Virtual" : ""} Open House</Btn></div>
        {rows.length ? rows.map((row) => (
          <article key={row.id} className="mb-2 flex items-center justify-between bg-white p-3">
            <div><p className="font-semibold">{row.address}</p><p className="text-[12px]">{row.when}</p></div>
            <button type="button" className="text-[#d9363e]" onClick={() => update((current) => ({ ...current, openHouses: current.openHouses.filter((item) => item.id !== row.id) }))}>Remove</button>
          </article>
        )) : (
          <div className="bg-white py-16 text-center">
            <p className="text-[15px]">You have no {sub === "virtual" ? "virtual " : ""}open houses... yet.</p>
            <p className="text-[13px] text-[#888]">Open houses you add will show up here.</p>
          </div>
        )}
      </div>
    );
  }
  const listings = [
    ...CRM_PROPERTIES.map((item) => ({ ...item, pocket: false })),
    ...state.pocket.map((item) => ({ ...item, updated: "Just now", image: CRM_PROPERTIES[0].image, pocket: true })),
  ].filter((item) => item.status === status || status === "All").filter((item) => item.address.toLowerCase().includes(query.toLowerCase()));
  const sorted = [...listings].sort((a, b) => sort === "Price" ? a.price.localeCompare(b.price) : a.address.localeCompare(b.address));
  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px]">
        <select className="h-7 border border-[#ccc]" value={status} onChange={(event) => setStatus(event.target.value)}><option>Active</option><option>Pending</option><option>All</option></select>
        <select className="h-7 border border-[#ccc]" value={sort} onChange={(event) => setSort(event.target.value)}><option>Updated</option><option>Price</option><option>Address</option></select>
        <input className="h-7 border border-[#ccc] px-2" placeholder="Search address" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Btn onClick={() => chrome.toast("Advertising request saved on this device.")}>Advertise</Btn>
        <a href={href.addProperty} className="bg-[#1c93b5] px-2 py-1 text-white">Add Pocket Listing</a>
        <a href={href.textResponder} className="text-[#1c93b5]">Text Responder</a>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {sorted.map((item) => (
          <article key={item.id} className="flex gap-3 bg-white p-3 shadow-sm">
            <img src={item.image} alt="" className="h-24 w-32 object-cover" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{item.address}</p>
              <p className="text-[12px] text-[#666]">{item.mls} · {item.status} · {item.feature}</p>
              <p className="text-[#1c93b5]">{item.price}</p>
              <p className="text-[12px]">{item.beds} bd · {item.baths} ba · {item.sqft} sf</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
                <label className="flex items-center gap-1"><input type="checkbox" checked={Boolean(state.buyerMatches[item.id])} onChange={() => update((current) => ({ ...current, buyerMatches: { ...current.buyerMatches, [item.id]: !current.buyerMatches[item.id] } }))} /> Buyer matches</label>
                <button type="button" className="text-[#1c93b5]" onClick={() => composer.email("", () => chrome.toast("Message queued in Sent."))}>Send Message</button>
                <a className="text-[#1c93b5]" href="/search">View on site</a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function TextResponder() {
  const { state, update } = useCinc();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  return (
    <div className="p-4">
      <div className="mb-3 bg-white p-3">
        <Field label="Campaign name"><input className={inputCls} value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Field label="Message"><textarea className="h-20 w-full border border-[#ccc] p-2 text-[13px]" value={message} onChange={(event) => setMessage(event.target.value)} /></Field>
        <Btn kind="teal" onClick={() => {
          if (!name.trim()) return;
          update((current) => ({ ...current, campaigns: [...current.campaigns, { id: uid("camp"), name, message, active: true }] }));
          setName("");
          setMessage("");
        }}>Save campaign</Btn>
      </div>
      {state.campaigns.map((item) => (
        <article key={item.id} className="mb-2 flex items-center justify-between bg-white p-3">
          <div>
            <p className="font-semibold">{item.name}</p>
            <p className="text-[12px] text-[#666]">{item.message}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="text-[#1c93b5]" onClick={() => update((current) => ({ ...current, campaigns: current.campaigns.map((camp) => camp.id === item.id ? { ...camp, active: !camp.active } : camp) }))}>{item.active ? "Pause" : "Resume"}</button>
            <button type="button" className="text-[#d9363e]" onClick={() => update((current) => ({ ...current, campaigns: current.campaigns.filter((camp) => camp.id !== item.id) }))}>Delete</button>
          </div>
        </article>
      ))}
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
  const { state, update } = useCinc();
  const [name, setName] = useState("");
  return (
    <div className="p-6">
      <div className="bg-white p-8 text-center">
        <p className="text-[15px]">You do not have permission to view Seller Suite sites on this demo login.</p>
        <a href={href.landing} className="mt-3 inline-block text-[#1c93b5]">View All Sites</a>
      </div>
      <div className="mx-auto mt-4 max-w-md bg-white p-4">
        <h2 className="mb-2 font-semibold">Add New Sites</h2>
        <Field label="Site name"><input className={inputCls} value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Btn kind="teal" onClick={() => { if (!name.trim()) return; update((current) => ({ ...current, sites: [...current.sites, { id: uid("site"), name }] })); setName(""); }}>Add</Btn>
        <ul className="mt-3 text-[13px]">{state.sites.map((site) => <li key={site.id}>{site.name}</li>)}</ul>
      </div>
    </div>
  );
}

export function LandingView({ category }: { category: "all" | "buyers" | "sellers" | "contact" }) {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const [name, setName] = useState("");
  const rows = state.landingPages.filter((page) => category === "all" || page.category === category);
  return (
    <div className="p-4">
      <div className="mb-3 flex gap-3 text-[13px]">
        {([["all", "All", href.landing], ["buyers", "Buyers", href.landingCat("buyers")], ["sellers", "Sellers", href.landingCat("sellers")], ["contact", "Contact", href.landingCat("contact")]] as const).map(([id, label, link]) => (
          <a key={id} href={link} className={category === id ? "border-b-2 border-[#1c93b5] text-[#1c93b5]" : "text-[#666]"}>{label}</a>
        ))}
        <span className="ml-auto flex gap-2">
          <input className="h-7 border border-[#ccc] px-2 text-[12px]" placeholder="Page name" value={name} onChange={(event) => setName(event.target.value)} />
          <Btn kind="teal" onClick={() => {
            if (!name.trim()) return;
            const cat = category === "all" ? "buyers" : category;
            update((current) => ({ ...current, landingPages: [...current.landingPages, { id: uid("lp"), name, category: cat, url: `/landing/${name.toLowerCase().replace(/\s+/g, "-")}`, active: true }] }));
            setName("");
            chrome.toast("Landing page created on this device.");
          }}>Create</Btn>
        </span>
      </div>
      <table className="w-full bg-white text-left text-[13px]">
        <thead className="text-[10px] uppercase text-[#888]"><tr><th className="px-3 py-2">Name</th><th>Category</th><th>URL</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((page) => (
            <tr key={page.id} className="border-t border-[#eee]">
              <td className="px-3 py-2">{page.name}</td>
              <td>{page.category}</td>
              <td><a className="text-[#1c93b5]" href={page.url.startsWith("/") ? page.url : href.landing}>{page.url}</a></td>
              <td><button type="button" className="text-[#1c93b5]" onClick={() => update((current) => ({ ...current, landingPages: current.landingPages.map((item) => item.id === page.id ? { ...item, active: !item.active } : item) }))}>{page.active ? "Active" : "Paused"}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
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
      <div className="mb-4 flex gap-4 border-b border-[#e5e5e5] text-[13px]">
        {tabs.map(([id, label, link]) => (
          <a key={id} href={link} className={`pb-2 ${tab === id ? "border-b-2 border-[#1c93b5] text-[#1c93b5]" : "text-[#666]"}`}>{label}</a>
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
  const profile = state.profile;
  const set = (key: keyof typeof profile, value: string) => update((current) => ({ ...current, profile: { ...current.profile, [key]: value } }));
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card title="Login Info">
        <Field label="Email"><input className={inputCls} value={profile.email} onChange={(event) => set("email", event.target.value)} /></Field>
        <Field label="Cell Phone"><input className={inputCls} value={profile.cell} onChange={(event) => set("cell", event.target.value)} /></Field>
        <div className="flex gap-2">
          <Btn kind="blue" onClick={() => chrome.toast(`Recovery email queued for ${profile.email}.`)}>Send Email Recovery Link</Btn>
          <Btn kind="blue" onClick={() => chrome.toast(`Recovery text queued for ${profile.cell}.`)}>Send Text Recovery Link</Btn>
        </div>
      </Card>
      <Card title="Site Subdomain">
        <div className="flex items-center gap-2">
          <input className={inputCls} value={profile.subdomain} onChange={(event) => set("subdomain", event.target.value)} />
          <span className="text-[12px] whitespace-nowrap">.greatervancouverhomesearch.com</span>
        </div>
        <div className="mt-2 text-right"><Btn kind="blue" onClick={() => chrome.toast("Subdomain saved on this device.")}>Update</Btn></div>
      </Card>
      <Card title="Agent CINC Number">
        <p className="text-[13px]">AGT-104482</p>
      </Card>
      <Card title="Agent Links & Social Media">
        {(["facebook", "google", "pinterest", "twitter", "instagram", "youtube", "linkedin"] as const).map((key) => (
          <Field key={key} label={key}><input className={inputCls} value={profile[key]} onChange={(event) => set(key, event.target.value)} /></Field>
        ))}
        <div className="text-right"><Btn kind="blue" onClick={() => chrome.toast("Social links saved.")}>Update</Btn></div>
      </Card>
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
        <Field label="Photo"><input type="file" onChange={(event) => set("photoName", event.target.files?.[0]?.name || "")} /></Field>
        <Field label="Biography"><textarea className="h-20 w-full border border-[#ccc] p-2 text-[13px]" value={profile.bio} onChange={(event) => set("bio", event.target.value)} /></Field>
        <div className="text-right"><Btn kind="blue" onClick={() => chrome.toast("Personal info saved.")}>Update</Btn></div>
      </Card>
      <Card title="Signature">
        <p className="mb-1 text-[12px] text-[#888]">Paragraph · 12pt</p>
        <textarea className="h-24 w-full border border-[#ccc] p-2 text-[13px]" value={profile.signature} onChange={(event) => set("signature", event.target.value)} />
        <div className="mt-2 text-right"><Btn kind="blue" onClick={() => chrome.toast("Signature saved.")}>Update</Btn></div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-[#e6e6e6] p-4">
      <h2 className="mb-3 text-center text-[18px] font-bold">{title}</h2>
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
    ["Property View Notes", "viewNotes", ["Off", "On"]],
  ];
  return (
    <div className="bg-white p-4">
      <div className="grid gap-8 md:grid-cols-2">
        <div>{left.map(([label, key, options]) => (
          <label key={key} className="mb-2 grid grid-cols-[1fr_180px] items-center gap-3 text-[13px]">
            <span className="text-right">{label}</span>
            <select className="h-[22px] border border-[#ccc]" value={form[key]} onChange={(event) => set(key, event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select>
          </label>
        ))}</div>
        <div>
          {right.map(([label, key, options]) => (
            <label key={key} className="mb-2 grid grid-cols-[1fr_180px] items-center gap-3 text-[13px]">
              <span className="text-right">{label}</span>
              <select className="h-[22px] border border-[#ccc]" value={form[key]} onChange={(event) => set(key, event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select>
            </label>
          ))}
          <label className="mb-2 grid grid-cols-[1fr_180px] items-center gap-3 text-[13px]">
            <span className="text-right">Property View Count</span>
            <input className="h-[22px] border border-[#ccc] px-1" value={form.viewCount} onChange={(event) => set("viewCount", event.target.value)} />
          </label>
          <p className="grid grid-cols-[1fr_180px] text-[13px]"><span className="text-right">Agent MDID</span><strong className="pl-3">AGT-104482</strong></p>
        </div>
      </div>
      <div className="mt-4 text-right"><Btn kind="blue" onClick={() => chrome.toast("Settings updated on this device.")}>Update</Btn></div>
    </div>
  );
}

function IntegrationsTab() {
  const { state, update } = useCinc();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div>
      {INTEGRATIONS.map((name) => (
        <section key={name} className="mb-2 border-t-4 border-[#ddd] bg-white">
          <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-left text-[#1c93b5]" onClick={() => setOpen(open === name ? null : name)}>
            {name} <span>{open === name ? "▾" : "›"}</span>
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

function NotificationsTab() {
  const { state, update } = useCinc();
  const chrome = useChrome();
  return (
    <div className="bg-white p-4">
      <h2 className="text-[13px] font-bold tracking-wide">MANAGE POND AGENT NOTIFICATIONS</h2>
      <p className="mb-3 text-[12px] text-[#1c93b5]">Manage Notifications for Pond Agents</p>
      {NOTIFY_GROUPS.map((group) => (
        <section key={group.title} className="mb-4">
          <h3 className="mb-2 text-[12px] font-bold text-[#888]">{group.title}</h3>
          {group.items.map((item) => {
            const pref = state.notifications[item.id] ?? { cinc: false, email: false, text: false };
            const toggle = (key: "cinc" | "email" | "text") => update((current) => ({
              ...current,
              notifications: { ...current.notifications, [item.id]: { ...pref, [key]: !pref[key] } },
            }));
            return (
              <div key={item.id} className="grid grid-cols-[1fr_auto] gap-2 border-t border-[#eee] py-2 text-[13px] sm:grid-cols-[180px_70px_1fr_repeat(3,70px)]">
                <span>{item.id}</span>
                <button type="button" className="text-[11px] text-[#1c93b5]" onClick={() => chrome.toast(`Test ${item.id} sent to ${CRM_AGENT.name}.`)}>TEST</button>
                <span className="text-[12px] text-[#777]">{item.description}</span>
                {(["cinc", "email", "text"] as const).map((key) => (
                  <label key={key} className="text-[11px] uppercase"><input type="checkbox" checked={pref[key]} onChange={() => toggle(key)} /> {key === "cinc" ? "CINCAgent" : key}</label>
                ))}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}

function CustomLinksTab() {
  const { state, update } = useCinc();
  const chrome = useChrome();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  return (
    <div className="bg-white p-4">
      <h2 className="mb-2 text-[14px]">For my subdomain:</h2>
      <div className="mb-3 flex flex-wrap gap-2">
        <input className="h-7 border border-[#ccc] px-2 text-[12px]" placeholder="Label" value={label} onChange={(event) => setLabel(event.target.value)} />
        <input className="h-7 border border-[#ccc] px-2 text-[12px]" placeholder="https://" value={url} onChange={(event) => setUrl(event.target.value)} />
        <Btn onClick={() => { if (!label.trim()) return; update((current) => ({ ...current, customLinks: [...current.customLinks, { id: uid("link"), label, url }] })); setLabel(""); setUrl(""); }}>Create</Btn>
        <Btn kind="teal" onClick={() => chrome.toast("Custom links saved.")}>Save</Btn>
      </div>
      {!state.customLinks.length ? <p className="text-[13px] text-[#888]">No custom links yet.</p> : (
        <ul>{state.customLinks.map((link) => (
          <li key={link.id} className="flex items-center justify-between border-t border-[#eee] py-2 text-[13px]">
            <span>{link.label} — {link.url}</span>
            <button type="button" className="text-[#d9363e]" onClick={() => update((current) => ({ ...current, customLinks: current.customLinks.filter((item) => item.id !== link.id) }))}>Delete</button>
          </li>
        ))}</ul>
      )}
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
          <p className="mt-1 text-[13px] text-[#666]">{id === "agent" ? "One agent seat for Casey Archibald." : "Shared inbox and pond routing for the team."}</p>
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
            {state.appointments.filter((item) => item.when.endsWith(`/${day}`) || item.when.includes(`/${day}`)).map((item) => <span key={item.id} className="block truncate text-[10px] text-[#1c93b5]">{item.title}</span>)}
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
  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="bg-white p-5">
        <h2 className="mb-2 text-[16px] font-semibold">Send a campaign</h2>
        <p className="mb-3 text-[13px] text-[#666]">Emails stay in the Sent folder. Nothing leaves this browser.</p>
        <Btn kind="teal" onClick={() => composer.email("", (sent) => chrome.toast(sent ? "Campaign saved in Sent." : "Campaign saved as a draft."))}>New campaign email</Btn>
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
