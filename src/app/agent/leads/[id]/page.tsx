"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Mail, MessageSquare, Phone, PhoneCall, Star } from "lucide-react";
import { CRM_LEADS, getCrmLead, type CrmPipeline } from "@/lib/cinc-crm";
import { useCrmOverlay } from "@/lib/crm-overlay";
import {
  LEAD_SOURCE_LABEL,
  useLeads,
  type Lead,
  type LeadActivity,
  type LeadStatus,
} from "@/lib/leads";
import { cn } from "@/lib/utils";

const TABS = [
  "Activity",
  "Info",
  "Reminders+Plans",
  "Appointments",
  "Conversations",
  "AutoTracks",
] as const;

const PIPELINES: CrmPipeline[] = [
  "New",
  "Attempted",
  "Contacted",
  "Showing",
  "Nurture",
  "Closed",
];

const PLANS = [
  "New buyer intro",
  "Listing alert drip",
  "Nurture — 30 day",
  "Post-showing follow up",
];

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

type TimelineItem = {
  id: string;
  at: string;
  kind: string;
  title: string;
  body?: string;
  actor?: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LeadDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const leadsApi = useLeads();
  const overlay = useCrmOverlay();
  const site = leadsApi.getById(id);
  const crm = getCrmLead(id);

  if (!leadsApi.ready || !overlay.ready) {
    return <p className="p-6 text-sm text-[#5a6f82]">Loading lead…</p>;
  }
  if (!site && !crm) {
    return (
      <div className="p-8">
        <p className="text-sm text-[#5a6f82]">That lead is not on this device.</p>
        <Link href="/agent/leads" className="mt-3 inline-block text-sm text-[#3498d8]">
          Back to leads
        </Link>
      </div>
    );
  }

  return site ? (
    <SiteLead lead={site} />
  ) : (
    <CrmLead id={id} />
  );
}

function SiteLead({ lead }: { lead: Lead }) {
  const { leads, appendActivity, appendNote, updateStatus, addTask, toggleTask, setScore, setActionPlan } =
    useLeads();
  const pipeline = STATUS_TO_PIPELINE[lead.status];
  const calls = lead.activity.filter((item) => item.kind === "call").length;
  const texts = lead.activity.filter((item) => item.kind === "text").length;
  const emails = lead.activity.filter((item) => item.kind === "email").length;

  function log(kind: "call" | "text" | "email", body: string) {
    const title = kind === "call" ? "Call logged" : kind === "text" ? "Text sent" : "Email sent";
    appendActivity(lead.id, { kind, title, body });
    if (lead.status === "new") updateStatus(lead.id, "contacted");
  }

  return (
    <DetailFrame
      peers={leads.map((item) => ({
        id: item.id,
        name: item.name,
        phone: item.phone,
        email: item.email,
        rating: (item.score ?? 60) / 20,
        type: "Buyer",
      }))}
      activeId={lead.id}
      name={lead.name}
      phone={lead.phone}
      email={lead.email}
      initials={initials(lead.name)}
      pipeline={pipeline}
      onPipeline={(next) => updateStatus(lead.id, PIPELINE_TO_STATUS[next])}
      lastTouch={formatWhen(lead.updatedAt)}
      calls={calls}
      texts={texts}
      emails={emails}
      registered={`${formatWhen(lead.createdAt)} · ${lead.source === "registration" ? "IDX Registration" : LEAD_SOURCE_LABEL[lead.source]}`}
      activity={lead.activity.map(toTimeline)}
      onNote={(text) => appendNote(lead.id, text)}
      onLog={log}
      info={[
        ["Source", lead.source === "registration" ? "IDX Registration" : LEAD_SOURCE_LABEL[lead.source]],
        ["Score", String(lead.score ?? 0)],
        ["Saved searches", lead.savedSearches.join(", ") || "None yet"],
        ["Viewed properties", lead.viewedProperties.join(", ") || "None yet"],
        ["Property", lead.propertyAddress || "—"],
        ["Notes", lead.notes || "—"],
      ]}
      tasks={lead.tasks}
      onAddTask={(title, due) => addTask(lead.id, title, due)}
      onToggleTask={(taskId) => toggleTask(lead.id, taskId)}
      plan={lead.actionPlan || ""}
      onPlan={(plan) => setActionPlan(lead.id, plan)}
      score={lead.score ?? 0}
      onScore={(score) => setScore(lead.id, score)}
      savedSearches={lead.savedSearches}
      viewed={lead.viewedProperties}
    />
  );
}

function CrmLead({ id }: { id: string }) {
  const base = getCrmLead(id)!;
  const overlay = useCrmOverlay();
  const { leads } = useLeads();
  const pipeline = overlay.pipeline[id] ?? base.pipeline;
  const extra = overlay.activity[id] ?? [];
  const activity = [...extra, ...base.activity];
  const tasks = overlay.tasks[id] ?? [];
  const calls = activity.filter((item) => item.kind === "call").length;
  const texts = activity.filter((item) => item.kind === "text").length;
  const emails = activity.filter((item) => item.kind === "email").length;

  const peers = useMemo(
    () => [
      ...leads.map((item) => ({
        id: item.id,
        name: item.name,
        phone: item.phone,
        email: item.email,
        rating: (item.score ?? 60) / 20,
        type: "Buyer",
      })),
      ...CRM_LEADS.filter((item) => !overlay.hidden.includes(item.id)).map((item) => ({
        id: item.id,
        name: item.name,
        phone: item.phone,
        email: item.email,
        rating: item.rating,
        type: item.type,
      })),
    ],
    [leads, overlay.hidden]
  );

  return (
    <DetailFrame
      peers={peers}
      activeId={id}
      name={base.name}
      phone={base.phone}
      email={base.email}
      initials={base.initials}
      pipeline={pipeline}
      onPipeline={(next) => {
        overlay.setPipeline(id, next);
        overlay.appendActivity(id, { kind: "system", title: `Pipeline set to ${next}` });
      }}
      lastTouch={extra[0]?.title || base.lastTouch}
      calls={calls}
      texts={texts}
      emails={emails}
      registered={`${base.registeredAgo} ago from ${base.source}`}
      activity={activity.map((item) => ({
        id: item.id,
        at: item.at,
        kind: item.kind,
        title: item.title,
        body: item.body,
        actor: item.actor,
      }))}
      onNote={(text) =>
        overlay.appendActivity(id, { kind: "note", title: "Note added", body: text })
      }
      onLog={(kind, body) =>
        overlay.appendActivity(id, {
          kind,
          title: kind === "call" ? "Call logged" : kind === "text" ? "Text sent" : "Email sent",
          body,
        })
      }
      info={[
        ["Price / City", `${base.price} · ${base.city}`],
        ["Timeframe", base.timeframe],
        ["Source", base.source],
        ["Assigned", base.assignedTo],
        ["Score", base.rating.toFixed(1)],
      ]}
      tasks={tasks}
      onAddTask={(title, due) => overlay.addTask(id, title, due)}
      onToggleTask={(taskId) => overlay.toggleTask(id, taskId)}
      plan={overlay.plans[id] || ""}
      onPlan={(plan) => overlay.setPlan(id, plan)}
      score={Math.round(base.rating * 20)}
      savedSearches={[`${base.city} · ${base.price}`]}
      viewed={base.propertySnippet ? [base.propertySnippet.address] : []}
    />
  );
}

function toTimeline(item: LeadActivity): TimelineItem {
  return {
    id: item.id,
    at: formatWhen(item.at),
    kind: item.kind,
    title: item.title,
    body: item.body,
    actor: "Casey Archibald",
  };
}

function DetailFrame({
  peers,
  activeId,
  name,
  phone,
  email,
  initials: mark,
  pipeline,
  onPipeline,
  lastTouch,
  calls,
  texts,
  emails,
  registered,
  activity,
  onNote,
  onLog,
  info,
  tasks,
  onAddTask,
  onToggleTask,
  plan,
  onPlan,
  score,
  onScore,
  savedSearches,
  viewed,
}: {
  peers: { id: string; name: string; phone: string; email: string; rating: number; type: string }[];
  activeId: string;
  name: string;
  phone: string;
  email: string;
  initials: string;
  pipeline: CrmPipeline;
  onPipeline: (pipeline: CrmPipeline) => void;
  lastTouch: string;
  calls: number;
  texts: number;
  emails: number;
  registered: string;
  activity: TimelineItem[];
  onNote: (text: string) => void;
  onLog: (kind: "call" | "text" | "email", body: string) => void;
  info: [string, string][];
  tasks: { id: string; title: string; due: string; done: boolean }[];
  onAddTask: (title: string, due: string) => void;
  onToggleTask: (taskId: string) => void;
  plan: string;
  onPlan: (plan: string) => void;
  score: number;
  onScore?: (score: number) => void;
  savedSearches: string[];
  viewed: string[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Activity");
  const [note, setNote] = useState("");
  const [composer, setComposer] = useState<null | "call" | "text" | "email">(null);
  const [draft, setDraft] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [type, setType] = useState("Buyer");

  const conversations = activity.filter((item) =>
    item.kind === "call" || item.kind === "text" || item.kind === "email"
  );

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-[520px] overflow-hidden bg-[#eef3f7]">
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[#dbe4eb] bg-white xl:flex">
        <div className="border-b border-[#e8eef3] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#8a9bab]">
          Leads
        </div>
        <ul className="flex-1 overflow-y-auto">
          {peers.map((item) => (
            <li key={item.id}>
              <Link
                href={`/agent/leads/${item.id}`}
                className={cn(
                  "block border-b border-[#f0f4f8] px-3 py-2.5 text-[12px]",
                  item.id === activeId ? "bg-[#e3f2fd]" : "hover:bg-[#f7fbfd]"
                )}
              >
                <p className="font-medium text-[#3498d8]">{item.name}</p>
                <p className="text-[#5a6f82]">{item.phone || "—"}</p>
                <p className="truncate text-[#8a9bab]">{item.email}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Star className="h-3 w-3 fill-[#f1c40f] text-[#f1c40f]" />
                  <span className="text-[#5a6f82]">{item.rating.toFixed(1)}</span>
                  <span className="rounded bg-[#e3f2fd] px-1 py-0.5 text-[10px] font-semibold text-[#1565c0]">
                    {item.type}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <section className="w-full max-w-[300px] shrink-0 overflow-y-auto border-r border-[#dbe4eb] bg-white sm:w-[280px]">
        <div className="border-b border-[#e8eef3] px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dce4ec] text-[14px] font-semibold text-[#3d5164]">
              {mark}
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-[#1a2b3c]">{name}</p>
              <a href={`tel:${phone}`} className="block text-[12px] text-[#3498d8] hover:underline">
                {phone || "No phone"}
              </a>
              <a href={`mailto:${email}`} className="block truncate text-[12px] text-[#3498d8] hover:underline">
                {email}
              </a>
            </div>
          </div>
        </div>
        <div className="space-y-4 px-4 py-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase text-[#8a9bab]">Lead type</p>
            <div className="flex flex-wrap gap-3">
              {["Buyer", "Seller", "Partial", "Recruit"].map((item) => (
                <label key={item} className="flex items-center gap-1.5 text-[12px] text-[#3d5164]">
                  <input
                    type="radio"
                    name="leadType"
                    checked={type === item}
                    onChange={() => setType(item)}
                    className="accent-[#00aeb6]"
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase text-[#8a9bab]">Status</p>
            <select
              value={pipeline}
              onChange={(e) => onPipeline(e.target.value as CrmPipeline)}
              className="w-full rounded border border-[#27ae60] bg-[#eafaf1] px-3 py-2 text-[13px] font-semibold text-[#1e8449]"
            >
              {PIPELINES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase text-[#8a9bab]">Lead score</p>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 rounded bg-[#e8eef3]">
                <div className="h-2 rounded bg-[#00aeb6]" style={{ width: `${score}%` }} />
              </div>
              <span className="text-[12px] font-semibold text-[#1a2b3c]">{score}</span>
            </div>
            {onScore && (
              <div className="mt-2 flex gap-2">
                <button type="button" className="text-[11px] text-[#3498d8]" onClick={() => onScore(score - 5)}>
                  −5
                </button>
                <button type="button" className="text-[11px] text-[#3498d8]" onClick={() => onScore(score + 5)}>
                  +5
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
            <Stat label="Last touch" value={lastTouch} />
            <Stat label="Calls" value={String(calls)} />
            <Stat label="Texts" value={String(texts)} />
            <Stat label="Emails" value={String(emails)} />
          </div>
          <p className="text-[11px] leading-relaxed text-[#8a9bab]">Registered {registered}</p>
        </div>
      </section>

      <div className="hidden w-[72px] shrink-0 flex-col items-center gap-3 bg-[#00aeb6] py-4 text-white sm:flex">
        {(
          [
            ["call", Phone, "Call"],
            ["call", PhoneCall, "Dialer"],
            ["text", MessageSquare, "Text"],
            ["email", Mail, "Email"],
          ] as const
        ).map(([kind, Icon, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setComposer(kind);
              setDraft("");
              setTab("Conversations");
            }}
            className="flex w-full flex-col items-center gap-1 px-1 py-2 text-[10px] font-medium hover:bg-white/10"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#00aeb6]">
              <Icon className="h-4 w-4" />
            </span>
            {label}
          </button>
        ))}
        <Link href="/agent/dialer" className="mt-auto text-[10px] underline">
          Open dialer
        </Link>
      </div>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-[#dbe4eb] bg-white px-3 py-2 sm:px-4">
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && note.trim()) {
                  onNote(note.trim());
                  setNote("");
                }
              }}
              placeholder="Add a note…"
              className="min-w-0 flex-1 rounded border border-[#dbe4eb] px-3 py-2 text-[13px] outline-none focus:border-[#00aeb6]"
            />
            <button
              type="button"
              onClick={() => {
                if (!note.trim()) return;
                onNote(note.trim());
                setNote("");
              }}
              className="shrink-0 rounded bg-[#00aeb6] px-3 py-2 text-[12px] font-semibold text-white"
            >
              Add
            </button>
          </div>
          {composer && (
            <div className="mt-2 rounded border border-[#dbe4eb] bg-[#f7fbfd] p-2">
              <p className="text-[11px] font-semibold uppercase text-[#5a6f82]">Log {composer}</p>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded border border-[#dbe4eb] px-2 py-1 text-[12px]"
                placeholder={`What happened on this ${composer}?`}
              />
              <button
                type="button"
                className="mt-1 rounded bg-[#102236] px-3 py-1 text-[12px] text-white"
                onClick={() => {
                  onLog(composer, draft.trim() || `${composer} with ${name}`);
                  setComposer(null);
                  setDraft("");
                  setTab("Activity");
                }}
              >
                Save {composer}
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-0 overflow-x-auto border-b border-[#dbe4eb] bg-white px-2">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                "relative shrink-0 px-3 py-3 text-[12px] whitespace-nowrap sm:text-[13px]",
                tab === item ? "font-semibold text-[#1a2b3c]" : "text-[#5a6f82]"
              )}
            >
              {item}
              {tab === item && (
                <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-[#00aeb6]" />
              )}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {tab === "Activity" && <Timeline items={activity} />}
          {tab === "Conversations" && <Timeline items={conversations} empty="No calls, texts, or emails yet." />}
          {tab === "Info" && (
            <div className="space-y-3">
              <div className="rounded-lg border border-[#dbe4eb] bg-white p-4 text-[13px] text-[#3d5164]">
                {info.map(([label, value]) => (
                  <p key={label} className="mt-2 first:mt-0">
                    <span className="text-[#8a9bab]">{label}:</span> {value}
                  </p>
                ))}
              </div>
              <Panel title="Saved searches">
                {savedSearches.length === 0 ? "None yet." : savedSearches.join(" · ")}
              </Panel>
              <Panel title="Viewed properties">
                {viewed.length === 0 ? "None yet." : viewed.join(" · ")}
              </Panel>
            </div>
          )}
          {(tab === "Reminders+Plans" || tab === "Appointments") && (
            <div className="space-y-3">
              <form
                className="flex flex-wrap gap-2 rounded-lg border border-[#dbe4eb] bg-white p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!taskTitle.trim()) return;
                  onAddTask(taskTitle.trim(), taskDue || "Today");
                  setTaskTitle("");
                  setTaskDue("");
                }}
              >
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder={tab === "Appointments" ? "Appointment" : "Task"}
                  className="h-8 min-w-[160px] flex-1 rounded border border-[#dbe4eb] px-2 text-[12px]"
                />
                <input
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  placeholder="Due"
                  className="h-8 w-32 rounded border border-[#dbe4eb] px-2 text-[12px]"
                />
                <button type="submit" className="h-8 rounded bg-[#00aeb6] px-3 text-[12px] font-semibold text-white">
                  Add
                </button>
              </form>
              <ul className="space-y-2">
                {tasks.length === 0 && (
                  <li className="text-[13px] text-[#8a9bab]">No tasks yet.</li>
                )}
                {tasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-2 rounded border border-[#dbe4eb] bg-white px-3 py-2 text-[13px]">
                    <input type="checkbox" checked={task.done} onChange={() => onToggleTask(task.id)} />
                    <span className={task.done ? "text-[#8a9bab] line-through" : "text-[#1a2b3c]"}>
                      {task.title}
                    </span>
                    <span className="ml-auto text-[11px] text-[#8a9bab]">{task.due}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === "AutoTracks" && (
            <div className="rounded-lg border border-[#dbe4eb] bg-white p-4">
              <p className="text-[12px] font-semibold uppercase text-[#8a9bab]">Action plan</p>
              <div className="mt-2 space-y-2">
                {PLANS.map((item) => (
                  <label key={item} className="flex items-center gap-2 text-[13px] text-[#1a2b3c]">
                    <input
                      type="radio"
                      name="plan"
                      checked={plan === item}
                      onChange={() => onPlan(item)}
                      className="accent-[#00aeb6]"
                    />
                    {item}
                  </label>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-[#5a6f82]">
                {plan ? `Enrolled in ${plan}. Saved on this device.` : "Pick a plan to enroll this lead."}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#e8eef3] px-2 py-2">
      <p className="truncate font-semibold text-[#1a2b3c]">{value}</p>
      <p className="text-[#8a9bab]">{label}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: string }) {
  return (
    <div className="rounded-lg border border-[#dbe4eb] bg-white p-4 text-[13px] text-[#3d5164]">
      <p className="text-[11px] font-semibold uppercase text-[#8a9bab]">{title}</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}

function Timeline({ items, empty = "No activity yet." }: { items: TimelineItem[]; empty?: string }) {
  if (items.length === 0) {
    return <p className="text-[13px] text-[#8a9bab]">{empty}</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-lg border border-[#dbe4eb] bg-white p-3 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-semibold text-[#1a2b3c]">{item.title}</p>
            <p className="shrink-0 text-[11px] text-[#8a9bab]">{item.at}</p>
          </div>
          <span className="mt-2 inline-block rounded bg-[#eef3f7] px-2 py-0.5 text-[11px] text-[#5a6f82]">
            {item.kind}
          </span>
          {item.body && <p className="mt-2 text-[13px] text-[#3d5164]">{item.body}</p>}
          {item.actor && <p className="mt-2 text-[11px] text-[#8a9bab]">— {item.actor}</p>}
        </li>
      ))}
    </ul>
  );
}
