"use client";

import { useEffect, useState } from "react";
import { roleLabel, type OfficeRole } from "@/lib/office-access";
import { PERMISSION_COLUMNS, defaultPermissions, type OfficePermissions } from "@/lib/permission-options";
import { RoutingPanel } from "./routing-panel";
import { useOfficeSession, type OfficeProfile } from "./office-session";
import { href } from "./route";
import { Btn, Field, inputCls } from "./ui";

const ROLES: OfficeRole[] = ["admin", "broker", "agent", "isa", "lender"];

type Draft = {
  firstName: string;
  lastName: string;
  email: string;
  cell: string;
  role: OfficeRole;
  password: string;
  active: boolean;
};

type LinkBox = { title: string; url: string; emailed: boolean };

const blank = (): Draft => ({
  firstName: "",
  lastName: "",
  email: "",
  cell: "",
  role: "agent",
  password: "",
  active: true,
});

export function UsersView({ mode = "manage" }: { mode?: "manage" | "routing" }) {
  const office = useOfficeSession();
  const [users, setUsers] = useState<OfficeProfile[]>([]);
  const [editing, setEditing] = useState<OfficeProfile | null>(null);
  const [creating, setCreating] = useState(false);
  const [pond, setPond] = useState(false);
  const [pondName, setPondName] = useState("");
  const [pondEmail, setPondEmail] = useState("");
  const [draft, setDraft] = useState<Draft>(blank());
  const [message, setMessage] = useState<string | null>(null);
  const [permUser, setPermUser] = useState<OfficeProfile | null>(null);
  const [linkBox, setLinkBox] = useState<LinkBox | null>(null);
  const [pondOnly, setPondOnly] = useState(false);
  const [showDisabled, setShowDisabled] = useState(false);

  async function load() {
    const response = await fetch("/api/office/users", { cache: "no-store" });
    const data = (await response.json().catch(() => null)) as { users?: OfficeProfile[]; message?: string } | null;
    if (!response.ok) {
      setMessage(data?.message || "Users could not be loaded.");
      return;
    }
    setUsers(data?.users ?? []);
  }

  useEffect(() => {
    if (!office.ready || !office.user) return;
    let cancelled = false;
    fetch("/api/office/users", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as { users?: OfficeProfile[]; message?: string } | null;
        if (cancelled) return;
        if (!response.ok) setMessage(data?.message || "Users could not be loaded.");
        else setUsers(data?.users ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [office.ready, office.user]);

  function startCreate() {
    setEditing(null);
    setDraft(blank());
    setCreating(true);
    setMessage(null);
    setLinkBox(null);
  }

  function startEdit(user: OfficeProfile) {
    setCreating(false);
    setEditing(user);
    setDraft({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      cell: user.cell,
      role: user.role,
      password: "",
      active: user.active,
    });
    setMessage(null);
  }

  async function save() {
    if (!office.database?.connected) {
      setMessage(office.database?.message || "Connect a database before adding users.");
      return;
    }
    const payload = { ...draft, password: draft.password || undefined };
    const response = editing
      ? await fetch(`/api/office/users/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/office/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    const data = (await response.json().catch(() => null)) as {
      message?: string;
      inviteUrl?: string;
      emailed?: boolean;
    } | null;
    if (!response.ok) {
      setMessage(data?.message || "Could not save that user.");
      return;
    }
    setCreating(false);
    setEditing(null);
    if (!editing && data?.inviteUrl) {
      setLinkBox({
        title: "Invite link",
        url: data.inviteUrl,
        emailed: Boolean(data.emailed),
      });
      setMessage(data.emailed ? "User added. The invite was emailed and is below." : "User added. Copy the invite link and send it yourself.");
    } else {
      setMessage(editing ? "User saved." : "User added.");
    }
    office.refresh();
    await load();
  }

  async function makeLink(user: OfficeProfile, kind: "reset" | "invite") {
    setMessage(null);
    const response = await fetch(`/api/office/users/${user.id}/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    const data = (await response.json().catch(() => null)) as { url?: string; emailed?: boolean; message?: string } | null;
    if (!response.ok || !data?.url) {
      setMessage(data?.message || "Could not create that link.");
      return;
    }
    setLinkBox({
      title: kind === "reset" ? `Reset link for ${user.name}` : `Invite link for ${user.name}`,
      url: data.url,
      emailed: Boolean(data.emailed),
    });
    setMessage(data.message || "Link ready.");
  }

  async function become(user: OfficeProfile, dest: "leads" | "profile") {
    if (user.id === office.user?.id) {
      window.location.href = dest === "profile" ? href.profile : href.leads;
      return;
    }
    const response = await fetch("/api/office/become", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    if (!response.ok) {
      setMessage(data?.message || "Could not switch to that user.");
      return;
    }
    window.location.href = dest === "profile" ? href.profile : href.leads;
  }

  async function copyLink() {
    if (!linkBox) return;
    try {
      await navigator.clipboard.writeText(linkBox.url);
      setMessage("Link copied.");
    } catch {
      setMessage("Select the link and copy it.");
    }
  }

  const dbOff = office.ready && office.database && !office.database.connected;

  return (
    <div className="p-4">
      {mode === "routing" ? (
        <div>
          <h1 className="mb-3 text-[18px] font-semibold">Lead Routing</h1>
          {office.canManageUsers ? <RoutingPanel users={users} /> : <p className="text-[13px] text-[#666]">Only an admin or broker can change lead routing.</p>}
        </div>
      ) : null}
      {mode === "manage" ? (
      <>
      <div className="mb-3 flex items-center justify-between">
        <div>
      <h1 className="mb-1 text-[18px] font-semibold text-[#243238]">Manage Agents</h1>
      <p className="mb-2 text-[13px] text-[#666]">{users.filter((user) => (showDisabled || user.active) && (!pondOnly || user.role === "isa")).length} Total Agents</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
            <button type="button" className="border border-[#ccc] bg-white px-2 py-1" onClick={() => setPondOnly((value) => !value)}>Show Only Pond Accounts</button>
            <button type="button" className="border border-[#ccc] bg-white px-2 py-1" onClick={() => setShowDisabled((value) => !value)}>Show Disabled Agents</button>
            <button type="button" className="bg-[#1c93b5] px-2 py-1 text-white" onClick={() => { setPond(false); startCreate(); }}>Add Agent</button>
            <button type="button" className="bg-[#1c93b5] px-2 py-1 text-white" onClick={() => { setCreating(false); setEditing(null); setPond(true); setPondName(""); setPondEmail(""); }}>Add Pond</button>
          </div>
        </div>
      </div>
      {dbOff ? (
        <p className="mb-3 bg-[#fff6e5] px-3 py-2 text-[13px] text-[#8a5a00]">{office.database?.message}</p>
      ) : null}
      {!office.canManageUsers && office.user && office.user.role !== "admin" && office.user.role !== "broker" ? (
        <p className="mb-3 text-[13px] text-[#666]">Only an admin or broker can add users.</p>
      ) : null}
      {message ? <p className="mb-3 text-[13px] text-[#1c93b5]">{message}</p> : null}
      {linkBox ? (
        <div className="mb-3 border border-[#1c93b5] bg-[#f3fafc] p-3 text-[13px]">
          <p className="font-semibold text-[#243238]">{linkBox.title}</p>
          <p className="mt-1 text-[#555]">
            {linkBox.emailed
              ? "Resend sent this link. It is also here if you want to copy it."
              : "No email provider is configured. Copy this link and send it yourself. Add RESEND_API_KEY or SENDGRID_API_KEY later and new links will email automatically."}
          </p>
          <div className="mt-2 flex gap-2">
            <input readOnly className={`${inputCls} min-w-0 flex-1`} value={linkBox.url} onFocus={(event) => event.currentTarget.select()} />
            <Btn kind="teal" onClick={() => void copyLink()}>Copy</Btn>
          </div>
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
            {users.filter((user) => (showDisabled || user.active) && (!pondOnly || user.role === "isa")).map((user) => (
              <article key={user.id} className="relative border border-[#e5e5e5] bg-white p-3 text-[13px]">
                <div className="flex gap-2">
                  <div className="relative h-12 w-12 shrink-0">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-[#1c93b5] text-[14px] font-semibold text-white">{user.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</div>
                    <img alt="" className="absolute inset-0 h-12 w-12 rounded-full object-cover" src={`/api/office/users/${user.id}/photo`} onError={(event) => { event.currentTarget.style.display = "none"; }} />
                  </div>
                  <div>
                    <button type="button" className="font-semibold text-[#1c93b5]" onClick={() => office.canManageUsers ? startEdit(user) : void become(user, "leads")}>{user.name}</button>
                    <p className="text-[#666]">{user.email}</p>
                    <p className="italic">{user.role === "isa" ? "(Pond Account) Agent" : user.role === "broker" || user.role === "admin" ? "Broker" : "Agent"}{user.active ? "" : " · Disabled"}</p>
                    {user.role === "isa" ? <p className="text-[#243238]">Pond owner: {user.pondOwner || "Kayla Gerak"}</p> : null}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {office.canManageUsers ? <button type="button" className="border border-[#ccc] bg-white px-2 py-1" onClick={() => setPermUser(permUser?.id === user.id ? null : user)}>Edit Permissions</button> : null}
                  {permUser?.id === user.id ? <PermissionsPopover user={user} onClose={() => setPermUser(null)} onSaved={(text) => { setMessage(text); office.refresh(); }} /> : null}
                  {office.canBecome && user.active && user.role !== "isa" ? <button type="button" className="bg-[#1c93b5] px-2 py-1 text-white" onClick={() => void become(user, "leads")}>Become User</button> : null}
                  {user.role === "isa" && office.canManageUsers ? <button type="button" className="border border-[#1c93b5] px-2 py-1 text-[#1c93b5]" onClick={() => startEdit(user)}>Edit pond</button> : null}
                  {office.canManageUsers && user.active && user.id !== office.user?.id ? <button type="button" className="bg-[#d9363e] px-2 py-1 text-white" onClick={() => { void fetch(`/api/office/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: false }) }).then(() => load()); }}>Disable</button> : null}
                </div>
              </article>
            ))}
      </div>
      {pond ? (
        <form className="mb-4 max-w-xl border border-[#1c93b5] bg-white p-4" onSubmit={(event) => event.preventDefault()}>
          <h2 className="mb-3 text-[16px] font-semibold">Add Pond</h2>
          <Field label="Pond name"><input className={inputCls} value={pondName} onChange={(event) => setPondName(event.target.value)} /></Field>
          <Field label="Pond email"><input className={inputCls} value={pondEmail} onChange={(event) => setPondEmail(event.target.value)} placeholder="optional" /></Field>
          <p className="mb-3 text-[12px] text-[#666]">A pond is a shared lead account. Kayla Gerak owns the office pond. New ponds are also owned by Kayla, and they stay out of automatic routing.</p>
          <div className="flex justify-end gap-2">
            <Btn onClick={() => setPond(false)}>Cancel</Btn>
            <Btn kind="teal" onClick={() => {
              if (!pondName.trim()) { setMessage("Enter a pond name."); return; }
              const email = pondEmail.trim() || `${pondName.trim().toLowerCase().replace(/\s+/g, ".")}@pond.local`;
              void fetch("/api/office/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName: pondName.trim(), lastName: "Pond", email, role: "isa", active: true, pondOwner: "Kayla Gerak", routingHidden: true, title: "Pond" }) }).then(async (response) => {
                const data = (await response.json().catch(() => null)) as { message?: string } | null;
                setMessage(response.ok ? "Pond added." : data?.message || "Could not add that pond.");
                if (response.ok) { setPond(false); await load(); }
              });
            }}>Save pond</Btn>
          </div>
        </form>
      ) : null}
      {creating || editing ? (
        <form
          className="mt-4 max-w-xl border border-[#1c93b5] bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <h2 className="mb-3 text-[16px] font-semibold">{editing ? "Edit user" : "Add Agent"}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="First name">
              <input className={inputCls} value={draft.firstName} onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} />
            </Field>
            <Field label="Last name">
              <input className={inputCls} value={draft.lastName} onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} />
            </Field>
            <Field label="Email">
              <input className={inputCls} type="email" required value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
            </Field>
            <Field label="Cell phone">
              <input className={inputCls} value={draft.cell} onChange={(event) => setDraft({ ...draft, cell: event.target.value })} />
            </Field>
            <Field label="Role">
              <select className={inputCls} value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value as OfficeRole })}>
                {ROLES.map((role) => (
                  <option key={role} value={role}>{roleLabel(role)}</option>
                ))}
              </select>
            </Field>
            <Field label={editing ? "New password" : "Password"}>
              <input
                className={inputCls}
                type="text"
                autoComplete="new-password"
                placeholder={editing ? "Leave blank to keep" : "Blank sends an invite instead"}
                value={draft.password}
                onChange={(event) => setDraft({ ...draft, password: event.target.value })}
              />
            </Field>
          </div>
          {!editing ? (
            <p className="mt-2 text-[12px] text-[#666]">
              Leave the password blank and they set their own from the invite link. A password of at least 8 characters lets them sign in immediately, and an invite link is still created.
            </p>
          ) : null}
          <label className="mt-3 flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />
            Active
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <Btn onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Btn>
            <Btn kind="teal" onClick={() => void save()}>Save</Btn>
          </div>
        </form>
      ) : null}
      </>
      ) : null}
    </div>
  );
}

function PermissionsPopover({ user, onClose, onSaved }: { user: OfficeProfile; onClose: () => void; onSaved: (message: string) => void }) {
  const [flags, setFlags] = useState<OfficePermissions | null>(() => defaultPermissions(user.role));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void fetch(`/api/office/users/${user.id}/permissions`, { cache: "no-store" }).then(async (response) => {
      const data = (await response.json().catch(() => null)) as { permissions?: OfficePermissions; message?: string } | null;
      if (!response.ok || !data?.permissions) setError(data?.message || "Could not load permissions.");
      else setFlags(data.permissions);
    });
  }, [user.id]);
  async function save(close: boolean) {
    if (!flags) return;
    const response = await fetch(`/api/office/users/${user.id}/permissions`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permissions: flags }) });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    if (!response.ok) { setError(data?.message || "Could not save permissions."); return; }
    onSaved("Permissions saved.");
    if (close) onClose();
  }
  return (
    <div className="absolute top-full left-0 z-20 mt-1 w-[640px] max-w-[90vw] bg-[#2c2c2c] p-3 text-[12px] text-white shadow-xl">
      {error ? <p className="mb-2 text-[#ffb4b4]">{error}</p> : null}
      {flags ? (
        <div className="grid grid-cols-4 gap-3">
          {PERMISSION_COLUMNS.map((column) => (
            <div key={column.name}>
              <p className="mb-1 font-bold">{column.name}</p>
              {column.items.map(([key, label, tip]) => (
                <label key={key} title={tip} className="mb-1 flex items-start gap-1">
                  <input type="checkbox" checked={flags[key as keyof OfficePermissions]} onChange={(event) => setFlags({ ...flags, [key]: event.target.checked })} />
                  <span>{label}</span>
                </label>
              ))}
              {column.name === "User" ? (
                <button type="button" className="mt-2 bg-[#1c93b5] px-2 py-1 text-white" onClick={() => {
                  void fetch(`/api/office/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "isa" }) }).then(async (response) => {
                    const data = (await response.json().catch(() => null)) as { message?: string } | null;
                    if (!response.ok) { setError(data?.message || "Could not convert this user."); return; }
                    onSaved("Converted to a pond account.");
                  });
                }}>Convert to Pond</button>
              ) : null}
            </div>
          ))}
        </div>
      ) : <p>Loading permissions…</p>}
      <div className="mt-3 text-right"><button type="button" className="bg-white px-3 py-1 text-[#222]" onClick={() => void save(true)}>Done</button></div>
    </div>
  );
}
