"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pause, Zap } from "lucide-react";
import {
  newId,
  useWorkspace,
  type ActionPlan,
  type AssignRule,
  type ListingAlertRule,
  type MessageTemplate,
  type PlanStep,
  type SmartList,
  type StepKind,
  type Trigger,
} from "@/lib/agent-workspace";
import { cn } from "@/lib/utils";

export const AUTO_NAV = [
  { href: "/agent/automations", key: "plans", label: "Action plans" },
  { href: "/agent/automations/templates", key: "templates", label: "Templates" },
  { href: "/agent/automations/lists", key: "lists", label: "Smart lists" },
  { href: "/agent/automations/alerts", key: "alerts", label: "Listing alerts" },
  { href: "/agent/automations/assign", key: "assign", label: "Auto-assign" },
  { href: "/agent/automations/behavioral", key: "behavioral", label: "Behavioral messaging" },
  { href: "/agent/automations/ai", key: "ai", label: "CINC AI" },
] as const;

export type AutoKey = (typeof AUTO_NAV)[number]["key"];

const TRIGGERS: { value: Trigger; label: string }[] = [
  { value: "new-lead", label: "New lead" },
  { value: "status-change", label: "Status change" },
  { value: "tag-added", label: "Tag added" },
  { value: "inactivity", label: "Inactivity" },
];

const input =
  "h-10 w-full border border-[#dbe4eb] px-3 text-sm outline-none focus:border-[#00aeb6]";

export function AutomationsScreen({ view }: { view: AutoKey }) {
  const ws = useWorkspace();
  const stats = useMemo(() => {
    const total = ws.data.plans.length;
    const active = ws.data.plans.filter((p) => p.active).length;
    return { total, active, paused: total - active };
  }, [ws.data.plans]);

  if (!ws.ready) {
    return <p className="px-6 py-8 text-sm text-[#8a9bab]">Loading automations…</p>;
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-6 rounded-lg border border-[#dbe4eb] bg-white px-5 py-4 shadow-sm">
        <Stat n={stats.total} label="Total" />
        <Stat n={stats.active} label="Active" icon={<Zap className="h-4 w-4 text-[#f1c40f]" />} />
        <Stat n={stats.paused} label="Paused" icon={<Pause className="h-4 w-4 text-[#8a9bab]" />} />
        <Link
          href="/agent/automations"
          className="ml-auto rounded bg-[#00aeb6] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#009a9c]"
        >
          + Start/Edit an AutoTrack
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {AUTO_NAV.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "rounded border px-3 py-2 text-[12px] font-medium",
              view === item.key
                ? "border-[#00aeb6] bg-white text-[#00aeb6]"
                : "border-[#dbe4eb] bg-white text-[#5a6f82]"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-[#dbe4eb] bg-white p-5">
        {view === "plans" && <Plans />}
        {view === "templates" && <Templates />}
        {view === "lists" && <Lists />}
        {view === "alerts" && <Alerts />}
        {view === "assign" && <Assign />}
        {view === "behavioral" && <Behavioral />}
        {view === "ai" && <AiNotes />}
      </div>
    </div>
  );
}

function Stat({ n, label, icon }: { n: number; label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-[22px] font-semibold text-[#1a2b3c]">{n}</p>
        <p className="text-[12px] text-[#8a9bab]">{label}</p>
      </div>
    </div>
  );
}

function Plans() {
  const { data, upsert, remove, toggle } = useWorkspace();
  const [draft, setDraft] = useState<ActionPlan | null>(null);
  const [category, setCategory] = useState("All");
  const categories = ["All", ...new Set(data.plans.map((p) => p.category))];
  const rows = data.plans.filter((p) => category === "All" || p.category === category);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "rounded border px-3 py-1 text-xs",
              category === c ? "border-[#00aeb6] text-[#00aeb6]" : "border-[#dbe4eb] text-[#5a6f82]"
            )}
          >
            {c}
          </button>
        ))}
        <button
          type="button"
          className="ml-auto rounded bg-[#00aeb6] px-3 py-1 text-xs font-semibold text-white"
          onClick={() =>
            setDraft({
              id: newId(),
              name: "",
              category: "My AutoTracks",
              active: true,
              trigger: "new-lead",
              steps: [],
            })
          }
        >
          New action plan
        </button>
      </div>
      {draft && (
        <PlanEditor
          key={draft.id}
          plan={draft}
          onClose={() => setDraft(null)}
          onSave={(plan) => {
            upsert("plans", plan);
            setDraft(null);
          }}
        />
      )}
      <ul className="space-y-2">
        {rows.map((plan) => (
          <li key={plan.id} className="flex flex-wrap items-center gap-3 border border-[#e8eef3] px-3 py-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[#1a2b3c]">{plan.name}</p>
              <p className="text-xs text-[#8a9bab]">
                {plan.category} · {TRIGGERS.find((t) => t.value === plan.trigger)?.label} · {plan.steps.length} steps
              </p>
            </div>
            <button type="button" className="text-[#00aeb6]" onClick={() => toggle("plans", plan.id)}>
              {plan.active ? "Active" : "Paused"}
            </button>
            <button type="button" className="text-[#1976d2]" onClick={() => setDraft(plan)}>
              Edit
            </button>
            <button type="button" className="text-[#e53935]" onClick={() => remove("plans", plan.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanEditor({
  plan,
  onSave,
  onClose,
}: {
  plan: ActionPlan;
  onSave: (plan: ActionPlan) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(plan);

  function addStep(kind: StepKind) {
    const step: PlanStep = {
      id: newId(),
      kind,
      title: kind === "wait" ? "Wait" : `New ${kind}`,
      body: "",
      waitDays: kind === "wait" ? 1 : 0,
    };
    setForm({ ...form, steps: [...form.steps, step] });
  }

  return (
    <form
      className="mb-5 space-y-3 border border-dashed border-[#b0bec5] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <input className={input} required placeholder="Plan name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={input} placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <select className={input} value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value as Trigger })}>
          {TRIGGERS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["email", "text", "task", "wait"] as StepKind[]).map((kind) => (
          <button key={kind} type="button" className="border border-[#dbe4eb] px-3 py-1 text-xs uppercase" onClick={() => addStep(kind)}>
            Add {kind}
          </button>
        ))}
      </div>
      <ol className="space-y-2">
        {form.steps.map((step, index) => (
          <li key={step.id} className="grid gap-2 border border-[#e8eef3] p-2 sm:grid-cols-[120px_1fr_80px_auto]">
            <span className="text-xs font-semibold uppercase">{step.kind}</span>
            <input
              className={input}
              value={step.title}
              aria-label="Step title"
              onChange={(e) => {
                const steps = form.steps.slice();
                steps[index] = { ...step, title: e.target.value };
                setForm({ ...form, steps });
              }}
            />
            {step.kind === "wait" ? (
              <input
                className={input}
                type="number"
                min={0}
                aria-label="Wait days"
                value={step.waitDays}
                onChange={(e) => {
                  const steps = form.steps.slice();
                  steps[index] = { ...step, waitDays: Number(e.target.value) };
                  setForm({ ...form, steps });
                }}
              />
            ) : (
              <input
                className={input}
                placeholder="Message or task"
                aria-label="Step body"
                value={step.body}
                onChange={(e) => {
                  const steps = form.steps.slice();
                  steps[index] = { ...step, body: e.target.value };
                  setForm({ ...form, steps });
                }}
              />
            )}
            <button
              type="button"
              className="text-sm text-[#e53935]"
              onClick={() => setForm({ ...form, steps: form.steps.filter((s) => s.id !== step.id) })}
            >
              Remove
            </button>
          </li>
        ))}
      </ol>
      <div className="flex gap-2">
        <button type="submit" className="h-10 bg-[#00aeb6] px-4 text-sm font-semibold text-white">Save plan</button>
        <button type="button" className="h-10 border px-4 text-sm" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

function Templates() {
  const { data, upsert, remove } = useWorkspace();
  const [draft, setDraft] = useState<MessageTemplate | null>(null);
  return (
    <SimpleRecords
      addLabel="New template"
      onAdd={() => setDraft({ id: newId(), channel: "email", name: "", subject: "", body: "" })}
      editor={
        draft && (
          <TemplateForm
            key={draft.id}
            initial={draft}
            onSave={(item) => {
              upsert("templates", item);
              setDraft(null);
            }}
          />
        )
      }
      rows={data.templates.map((row) => ({
        id: row.id,
        title: `${row.channel}: ${row.name}`,
        detail: row.subject || row.body,
        onEdit: () => setDraft(row),
        onDelete: () => remove("templates", row.id),
      }))}
    />
  );
}

function TemplateForm({ initial, onSave }: { initial: MessageTemplate; onSave: (item: MessageTemplate) => void }) {
  const [form, setForm] = useState(initial);
  return (
    <form className="mb-4 grid gap-2 border border-dashed p-3" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <select className={input} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as MessageTemplate["channel"] })}>
        <option value="email">Email</option>
        <option value="text">Text</option>
      </select>
      <input className={input} required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className={input} placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
      <textarea className="w-full border border-[#dbe4eb] px-3 py-2 text-sm" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
      <button type="submit" className="h-10 bg-[#00aeb6] text-sm font-semibold text-white">Save template</button>
    </form>
  );
}

function Lists() {
  const { data, upsert, remove, toggle } = useWorkspace();
  const [draft, setDraft] = useState<SmartList | null>(null);
  return (
    <SimpleRecords
      addLabel="New smart list"
      onAdd={() => setDraft({ id: newId(), name: "", rule: "", active: true })}
      editor={draft && <NamedRuleForm key={draft.id} name={draft.name} rule={draft.rule} saveLabel="Save list" onSave={(name, rule) => { upsert("lists", { ...draft, name, rule }); setDraft(null); }} />}
      rows={data.lists.map((row) => ({
        id: row.id,
        title: row.name,
        detail: row.rule,
        status: row.active ? "On" : "Off",
        onToggle: () => toggle("lists", row.id),
        onEdit: () => setDraft(row),
        onDelete: () => remove("lists", row.id),
      }))}
    />
  );
}

function Alerts() {
  const { data, upsert, remove, toggle } = useWorkspace();
  const [draft, setDraft] = useState<ListingAlertRule | null>(null);
  return (
    <div>
      <button type="button" className="mb-3 bg-[#00aeb6] px-3 py-2 text-xs font-semibold text-white" onClick={() => setDraft({ id: newId(), name: "", area: "", minPrice: "", maxPrice: "", active: true })}>
        New listing alert
      </button>
      {draft && (
        <AlertForm
          key={draft.id}
          initial={draft}
          onSave={(item) => {
            upsert("alerts", item);
            setDraft(null);
          }}
        />
      )}
      <Rows
        rows={data.alerts.map((row) => ({
          id: row.id,
          title: row.name,
          detail: `${row.area} · $${row.minPrice}–$${row.maxPrice}`,
          status: row.active ? "On" : "Off",
          onToggle: () => toggle("alerts", row.id),
          onEdit: () => setDraft(row),
          onDelete: () => remove("alerts", row.id),
        }))}
      />
    </div>
  );
}

function AlertForm({ initial, onSave }: { initial: ListingAlertRule; onSave: (item: ListingAlertRule) => void }) {
  const [form, setForm] = useState(initial);
  return (
    <form className="mb-4 grid gap-2 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <input className={input} required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className={input} placeholder="Area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
      <input className={input} placeholder="Min price" value={form.minPrice} onChange={(e) => setForm({ ...form, minPrice: e.target.value })} />
      <input className={input} placeholder="Max price" value={form.maxPrice} onChange={(e) => setForm({ ...form, maxPrice: e.target.value })} />
      <button type="submit" className="h-10 bg-[#00aeb6] text-sm font-semibold text-white">Save alert</button>
    </form>
  );
}

function Assign() {
  const { data, upsert, remove, toggle } = useWorkspace();
  const [draft, setDraft] = useState<AssignRule | null>(null);
  return (
    <div>
      <button type="button" className="mb-3 bg-[#00aeb6] px-3 py-2 text-xs font-semibold text-white" onClick={() => setDraft({ id: newId(), name: "", when: "new-lead", assignTo: "Casey Archibald", active: true })}>
        New auto-assign rule
      </button>
      {draft && (
        <form
          key={draft.id}
          className="mb-4 grid gap-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            upsert("assign", draft);
            setDraft(null);
          }}
        >
          <input className={input} required placeholder="Rule name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <select className={input} value={draft.when} onChange={(e) => setDraft({ ...draft, when: e.target.value as Trigger })}>
            {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input className={input} placeholder="Assign to" value={draft.assignTo} onChange={(e) => setDraft({ ...draft, assignTo: e.target.value })} />
          <button type="submit" className="h-10 bg-[#00aeb6] text-sm font-semibold text-white">Save rule</button>
        </form>
      )}
      <Rows
        rows={data.assign.map((row) => ({
          id: row.id,
          title: row.name,
          detail: `${TRIGGERS.find((t) => t.value === row.when)?.label} → ${row.assignTo}`,
          status: row.active ? "On" : "Off",
          onToggle: () => toggle("assign", row.id),
          onEdit: () => setDraft(row),
          onDelete: () => remove("assign", row.id),
        }))}
      />
    </div>
  );
}

function Behavioral() {
  const { data, upsert, toggle } = useWorkspace();
  const behavioral = data.plans.filter((p) => p.trigger !== "new-lead");
  return (
    <div>
      <p className="mb-3 text-sm text-[#5a6f82]">
        Behavioral messages run when a lead changes status, gains a tag, or goes quiet.
      </p>
      <button
        type="button"
        className="mb-3 bg-[#00aeb6] px-3 py-2 text-xs font-semibold text-white"
        onClick={() =>
          upsert("plans", {
            id: newId(),
            name: "Behavioral follow-up",
            category: "Nurture",
            active: true,
            trigger: "inactivity",
            steps: [{ id: newId(), kind: "text", title: "Nudge", body: "Still interested?", waitDays: 0 }],
          })
        }
      >
        Add inactivity text
      </button>
      <ul className="space-y-2">
        {(behavioral.length ? behavioral : data.plans.slice(0, 3)).map((plan) => (
          <li key={plan.id} className="flex items-center justify-between border border-[#e8eef3] px-3 py-2 text-sm">
            <span>{plan.name} · {TRIGGERS.find((t) => t.value === plan.trigger)?.label}</span>
            <button type="button" className="text-[#00aeb6]" onClick={() => toggle("plans", plan.id)}>
              {plan.active ? "On" : "Off"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AiNotes() {
  const { data, upsert, remove } = useWorkspace();
  const ai = data.templates.filter((t) => t.name.toLowerCase().includes("ai") || t.subject === "AI");
  return (
    <div>
      <p className="mb-3 text-sm text-[#5a6f82]">
        Demo AI prompts stored locally. They do not call a model.
      </p>
      <button
        type="button"
        className="mb-3 bg-[#00aeb6] px-3 py-2 text-xs font-semibold text-white"
        onClick={() =>
          upsert("templates", {
            id: newId(),
            channel: "email",
            name: "AI reply draft",
            subject: "AI",
            body: "Draft a friendly reply about a Greater Vancouver listing.",
          })
        }
      >
        Add AI prompt
      </button>
      <ul className="space-y-2">
        {(ai.length ? ai : data.templates).map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-3 border border-[#e8eef3] px-3 py-2 text-sm">
            <span>{row.name}</span>
            <button type="button" className="text-[#e53935]" onClick={() => remove("templates", row.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NamedRuleForm({
  name,
  rule,
  saveLabel,
  onSave,
}: {
  name: string;
  rule: string;
  saveLabel: string;
  onSave: (name: string, rule: string) => void;
}) {
  const [n, setN] = useState(name);
  const [r, setR] = useState(rule);
  return (
    <form className="mb-4 grid gap-2" onSubmit={(e) => { e.preventDefault(); onSave(n, r); }}>
      <input className={input} required placeholder="Name" value={n} onChange={(e) => setN(e.target.value)} />
      <input className={input} placeholder="Rule" value={r} onChange={(e) => setR(e.target.value)} />
      <button type="submit" className="h-10 bg-[#00aeb6] text-sm font-semibold text-white">{saveLabel}</button>
    </form>
  );
}

function SimpleRecords({
  addLabel,
  onAdd,
  editor,
  rows,
}: {
  addLabel: string;
  onAdd: () => void;
  editor: React.ReactNode;
  rows: Row[];
}) {
  return (
    <div>
      <button type="button" className="mb-3 bg-[#00aeb6] px-3 py-2 text-xs font-semibold text-white" onClick={onAdd}>
        {addLabel}
      </button>
      {editor}
      <Rows rows={rows} />
    </div>
  );
}

type Row = {
  id: string;
  title: string;
  detail?: string;
  status?: string;
  onToggle?: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function Rows({ rows }: { rows: Row[] }) {
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-wrap items-center gap-3 border border-[#e8eef3] px-3 py-2 text-sm">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{row.title}</p>
            {row.detail && <p className="text-xs text-[#8a9bab]">{row.detail}</p>}
          </div>
          {row.onToggle && (
            <button type="button" className="text-[#00aeb6]" onClick={row.onToggle}>{row.status}</button>
          )}
          <button type="button" className="text-[#1976d2]" onClick={row.onEdit}>Edit</button>
          <button type="button" className="text-[#e53935]" onClick={row.onDelete}>Delete</button>
        </li>
      ))}
      {rows.length === 0 && <li className="text-sm text-[#8a9bab]">Nothing saved yet.</li>}
    </ul>
  );
}
