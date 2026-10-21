"use client";

import Link from "next/link";
import { useState } from "react";
import {
  newId,
  useWorkspace,
  type Billing,
  type FieldItem,
  type IdxRule,
  type Integration,
  type LeadSourceItem,
  type PhoneLine,
  type Profile,
  type RouteRule,
  type Signature,
  type SiteSetting,
  type TagItem,
  type TeamUser,
} from "@/lib/agent-workspace";
import { cn } from "@/lib/utils";

export const SETTINGS_NAV = [
  { href: "/agent/settings", key: "profile", label: "Profile" },
  { href: "/agent/settings/team", key: "team", label: "Team and users" },
  { href: "/agent/settings/routing", key: "routing", label: "Lead routing" },
  { href: "/agent/settings/notifications", key: "notifications", label: "Notifications" },
  { href: "/agent/settings/phone", key: "phone", label: "Phone and texting" },
  { href: "/agent/settings/email", key: "email", label: "Email and signatures" },
  { href: "/agent/settings/website", key: "website", label: "Website settings" },
  { href: "/agent/settings/idx", key: "idx", label: "IDX and listing alerts" },
  { href: "/agent/settings/integrations", key: "integrations", label: "Integrations" },
  { href: "/agent/settings/sources", key: "sources", label: "Lead sources" },
  { href: "/agent/settings/tags", key: "tags", label: "Tags" },
  { href: "/agent/settings/fields", key: "fields", label: "Custom fields" },
  { href: "/agent/settings/billing", key: "billing", label: "Billing" },
] as const;

export type SettingsKey = (typeof SETTINGS_NAV)[number]["key"];

const input =
  "h-10 w-full border border-[#dbe4eb] px-3 text-sm outline-none focus:border-[#00aeb6]";

function Shell({
  current,
  children,
}: {
  current: SettingsKey;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <nav className="h-fit border border-[#dbe4eb] bg-white p-2">
        {SETTINGS_NAV.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "block px-3 py-2 text-[13px]",
              item.key === current
                ? "bg-[#e8f8f8] font-semibold text-[#00aeb6]"
                : "text-[#3d5164] hover:bg-[#f4f7fa]"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border border-[#dbe4eb] bg-white p-5">{children}</div>
    </div>
  );
}

function SaveButton({ label = "Save" }: { label?: string }) {
  return (
    <button type="submit" className="h-10 bg-[#00aeb6] px-4 text-sm font-semibold text-white">
      {label}
    </button>
  );
}

export function SettingsScreen({ section }: { section: SettingsKey }) {
  const ws = useWorkspace();
  const { data } = ws;
  if (!ws.ready) {
    return <p className="px-6 py-8 text-sm text-[#8a9bab]">Loading settings…</p>;
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6">
      <h1 className="text-2xl text-[#1a2b3c]">Settings</h1>
      <p className="mt-1 text-sm text-[#8a9bab]">
        Saved in this browser. Sample data only — nothing is billed or texted.
      </p>
      <div className="mt-4">
        <Shell current={section}>
          {section === "profile" && <ProfileForm initial={data.profile} onSave={ws.saveProfile} />}
          {section === "billing" && <BillingForm initial={data.billing} onSave={ws.saveBilling} />}
          {section === "notifications" && (
            <ul className="space-y-3">
              {data.notifications.map((n) => (
                <li key={n.id} className="flex flex-wrap items-center gap-4 border border-[#e8eef3] px-3 py-3">
                  <span className="min-w-40 font-medium">{n.event}</span>
                  <label className="text-sm">
                    <input
                      type="checkbox"
                      checked={n.email}
                      onChange={(e) => ws.setNotify(n.id, "email", e.target.checked)}
                      className="mr-1"
                    />
                    Email
                  </label>
                  <label className="text-sm">
                    <input
                      type="checkbox"
                      checked={n.sms}
                      onChange={(e) => ws.setNotify(n.id, "sms", e.target.checked)}
                      className="mr-1"
                    />
                    Text
                  </label>
                </li>
              ))}
            </ul>
          )}
          {section === "team" && (
            <RecordList
              rows={data.team}
              render={(row) => `${row.name} · ${row.role} · ${row.email}`}
              active={(row) => row.active}
              onToggle={(id) => ws.toggle("team", id)}
              onDelete={(id) => ws.remove("team", id)}
              onEdit={(row) => <TeamForm initial={row} onSave={(item) => ws.upsert("team", item)} />}
              blank={() => ({ id: newId(), name: "", email: "", role: "Agent", active: true })}
            />
          )}
          {section === "routing" && (
            <RecordList
              rows={data.routing}
              render={(row) => `${row.name} · ${row.source} → ${row.assignTo}`}
              active={(row) => row.active}
              onToggle={(id) => ws.toggle("routing", id)}
              onDelete={(id) => ws.remove("routing", id)}
              onEdit={(row) => <RouteForm initial={row} onSave={(item) => ws.upsert("routing", item)} />}
              blank={() => ({ id: newId(), name: "", source: "Website", assignTo: "Casey Archibald", active: true })}
            />
          )}
          {section === "phone" && (
            <RecordList
              rows={data.phones}
              render={(row) => `${row.label} · ${row.number} · ${row.kind}`}
              active={(row) => row.active}
              onToggle={(id) => ws.toggle("phones", id)}
              onDelete={(id) => ws.remove("phones", id)}
              onEdit={(row) => <PhoneForm initial={row} onSave={(item) => ws.upsert("phones", item)} />}
              blank={(): PhoneLine => ({ id: newId(), label: "", number: "", kind: "text", active: true })}
            />
          )}
          {section === "email" && (
            <RecordList
              rows={data.signatures}
              render={(row) => `${row.name}${row.isDefault ? " (default)" : ""}`}
              onDelete={(id) => ws.remove("signatures", id)}
              extra={(row) => (
                <button type="button" className="text-sm text-[#00aeb6]" onClick={() => ws.setDefaultSignature(row.id)}>
                  Make default
                </button>
              )}
              onEdit={(row) => <SignatureForm initial={row} onSave={(item) => ws.upsert("signatures", item)} />}
              blank={() => ({ id: newId(), name: "", body: "", isDefault: false })}
            />
          )}
          {section === "website" && (
            <RecordList
              rows={data.website}
              render={(row) => `${row.label}: ${row.value}`}
              onDelete={(id) => ws.remove("website", id)}
              onEdit={(row) => <WebsiteForm initial={row} onSave={(item) => ws.upsert("website", item)} />}
              blank={() => ({ id: newId(), label: "", value: "" })}
            />
          )}
          {section === "idx" && (
            <RecordList
              rows={data.idx}
              render={(row) => `${row.name} · ${row.criteria} · ${row.cadence}`}
              active={(row) => row.active}
              onToggle={(id) => ws.toggle("idx", id)}
              onDelete={(id) => ws.remove("idx", id)}
              onEdit={(row) => <IdxForm initial={row} onSave={(item) => ws.upsert("idx", item)} />}
              blank={() => ({ id: newId(), name: "", criteria: "", cadence: "Daily", active: true })}
            />
          )}
          {section === "integrations" && (
            <RecordList
              rows={data.integrations}
              render={(row) => `${row.name} · ${row.connected ? "Connected" : "Off"}`}
              active={(row) => row.connected}
              onToggle={(id) => ws.toggle("integrations", id)}
              onDelete={(id) => ws.remove("integrations", id)}
              onEdit={(row) => <IntegrationForm initial={row} onSave={(item) => ws.upsert("integrations", item)} />}
              blank={() => ({ id: newId(), name: "", connected: false, notes: "" })}
              toggleLabel="Connect"
            />
          )}
          {section === "sources" && (
            <RecordList
              rows={data.sources}
              render={(row) => row.name}
              active={(row) => row.active}
              onToggle={(id) => ws.toggle("sources", id)}
              onDelete={(id) => ws.remove("sources", id)}
              onEdit={(row) => <SourceForm initial={row} onSave={(item) => ws.upsert("sources", item)} />}
              blank={() => ({ id: newId(), name: "", active: true })}
            />
          )}
          {section === "tags" && (
            <RecordList
              rows={data.tags}
              render={(row) => row.name}
              onDelete={(id) => ws.remove("tags", id)}
              onEdit={(row) => <TagForm initial={row} onSave={(item) => ws.upsert("tags", item)} />}
              blank={() => ({ id: newId(), name: "", color: "#1976d2" })}
            />
          )}
          {section === "fields" && (
            <RecordList
              rows={data.fields}
              render={(row) => `${row.name} · ${row.fieldType}${row.required ? " · required" : ""}`}
              onDelete={(id) => ws.remove("fields", id)}
              onEdit={(row) => <FieldForm initial={row} onSave={(item) => ws.upsert("fields", item)} />}
              blank={() => ({ id: newId(), name: "", fieldType: "Text", required: false })}
            />
          )}
        </Shell>
      </div>
    </div>
  );
}

function ProfileForm({ initial, onSave }: { initial: Profile; onSave: (p: Profile) => void }) {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);
  return (
    <form
      className="max-w-lg space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
        setSaved(true);
      }}
    >
      {(["name", "email", "phone", "title"] as const).map((key) => (
        <label key={key} className="block text-sm capitalize">
          {key}
          <input className={`${input} mt-1`} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
        </label>
      ))}
      <label className="block text-sm">
        Bio
        <textarea className="mt-1 w-full border border-[#dbe4eb] px-3 py-2 text-sm" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      </label>
      <SaveButton label={saved ? "Saved" : "Save profile"} />
    </form>
  );
}

function BillingForm({ initial, onSave }: { initial: Billing; onSave: (b: Billing) => void }) {
  const [form, setForm] = useState(initial);
  return (
    <form
      className="max-w-lg space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <p className="text-sm text-[#8a9bab]">Placeholder only. No payment is processed.</p>
      {(["plan", "seats", "card", "status"] as const).map((key) => (
        <label key={key} className="block text-sm capitalize">
          {key}
          <input className={`${input} mt-1`} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
        </label>
      ))}
      <SaveButton label="Save billing placeholder" />
    </form>
  );
}

function RecordList<T extends { id: string }>({
  rows,
  render,
  active,
  onToggle,
  onDelete,
  onEdit,
  blank,
  extra,
  toggleLabel = "On",
}: {
  rows: T[];
  render: (row: T) => string;
  active?: (row: T) => boolean;
  onToggle?: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (row: T) => React.ReactNode;
  blank: () => T;
  extra?: (row: T) => React.ReactNode;
  toggleLabel?: string;
}) {
  const [draft, setDraft] = useState<T | null>(null);
  return (
    <div>
      <button type="button" className="mb-4 h-9 bg-[#00aeb6] px-3 text-sm font-semibold text-white" onClick={() => setDraft(blank())}>
        Add
      </button>
      {draft && (
        <div key={draft.id} className="mb-4 border border-dashed border-[#b0bec5] p-3">
          {onEdit(draft)}
          <button type="button" className="mt-2 text-sm text-[#8a9bab]" onClick={() => setDraft(null)}>
            Close editor
          </button>
        </div>
      )}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center gap-3 border border-[#e8eef3] px-3 py-2 text-sm">
            <span className="min-w-0 flex-1">{render(row)}</span>
            {extra?.(row)}
            {onToggle && active && (
              <button type="button" className="text-[#00aeb6]" onClick={() => onToggle(row.id)}>
                {active(row) ? toggleLabel : "Off"}
              </button>
            )}
            <button type="button" className="text-[#1976d2]" onClick={() => setDraft(row)}>
              Edit
            </button>
            <button type="button" className="text-[#e53935]" onClick={() => onDelete(row.id)}>
              Delete
            </button>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-[#8a9bab]">Nothing here yet.</li>}
      </ul>
    </div>
  );
}

function TeamForm({ initial, onSave }: { initial: TeamUser; onSave: (item: TeamUser) => void }) {
  const [form, setForm] = useState(initial);
  return (
    <form className="grid gap-2 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <input className={input} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input className={input} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <input className={input} placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
      <SaveButton label="Save user" />
    </form>
  );
}

function RouteForm({ initial, onSave }: { initial: RouteRule; onSave: (item: RouteRule) => void }) {
  const [form, setForm] = useState(initial);
  return (
    <form className="grid gap-2 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <input className={input} placeholder="Rule name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input className={input} placeholder="Lead source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
      <input className={input} placeholder="Assign to" value={form.assignTo} onChange={(e) => setForm({ ...form, assignTo: e.target.value })} />
      <SaveButton label="Save rule" />
    </form>
  );
}

function PhoneForm({ initial, onSave }: { initial: PhoneLine; onSave: (item: PhoneLine) => void }) {
  const [form, setForm] = useState(initial);
  return (
    <form className="grid gap-2 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <input className={input} placeholder="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
      <input className={input} placeholder="Number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
      <select className={input} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as PhoneLine["kind"] })}>
        <option value="voice">Voice</option>
        <option value="text">Text</option>
      </select>
      <SaveButton label="Save number" />
    </form>
  );
}

function SignatureForm({ initial, onSave }: { initial: Signature; onSave: (item: Signature) => void }) {
  const [form, setForm] = useState(initial);
  return (
    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <input className={input} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <textarea className="w-full border border-[#dbe4eb] px-3 py-2 text-sm" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
      <SaveButton label="Save signature" />
    </form>
  );
}

function WebsiteForm({ initial, onSave }: { initial: SiteSetting; onSave: (item: SiteSetting) => void }) {
  const [form, setForm] = useState(initial);
  return (
    <form className="grid gap-2 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <input className={input} placeholder="Setting" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
      <input className={input} placeholder="Value" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
      <SaveButton label="Save setting" />
    </form>
  );
}

function IdxForm({ initial, onSave }: { initial: IdxRule; onSave: (item: IdxRule) => void }) {
  const [form, setForm] = useState(initial);
  return (
    <form className="grid gap-2 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <input className={input} placeholder="Alert name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input className={input} placeholder="Criteria" value={form.criteria} onChange={(e) => setForm({ ...form, criteria: e.target.value })} />
      <select className={input} value={form.cadence} onChange={(e) => setForm({ ...form, cadence: e.target.value })}>
        <option>Instant</option>
        <option>Daily</option>
        <option>Weekly</option>
      </select>
      <SaveButton label="Save alert" />
    </form>
  );
}

function IntegrationForm({ initial, onSave }: { initial: Integration; onSave: (item: Integration) => void }) {
  const [form, setForm] = useState(initial);
  return (
    <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <input className={input} placeholder="Integration" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input className={input} placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      <SaveButton label="Save integration" />
    </form>
  );
}

function SourceForm({ initial, onSave }: { initial: LeadSourceItem; onSave: (item: LeadSourceItem) => void }) {
  const [form, setForm] = useState(initial);
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <input className={input} placeholder="Source name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <SaveButton label="Save source" />
    </form>
  );
}

function TagForm({ initial, onSave }: { initial: TagItem; onSave: (item: TagItem) => void }) {
  const [form, setForm] = useState(initial);
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <input className={input} placeholder="Tag" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input className="h-10 w-16 border border-[#dbe4eb]" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} aria-label="Tag color" />
      <SaveButton label="Save tag" />
    </form>
  );
}

function FieldForm({ initial, onSave }: { initial: FieldItem; onSave: (item: FieldItem) => void }) {
  const [form, setForm] = useState(initial);
  return (
    <form className="grid gap-2 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <input className={input} placeholder="Field name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <select className={input} value={form.fieldType} onChange={(e) => setForm({ ...form, fieldType: e.target.value })}>
        <option>Text</option>
        <option>Number</option>
        <option>Yes/No</option>
        <option>Date</option>
      </select>
      <label className="text-sm">
        <input type="checkbox" checked={form.required} onChange={(e) => setForm({ ...form, required: e.target.checked })} className="mr-2" />
        Required
      </label>
      <SaveButton label="Save field" />
    </form>
  );
}
