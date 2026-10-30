"use client";

import { useEffect, useState } from "react";
import { roleLabel, type OfficeRole } from "@/lib/office-access";
import { RoutingPanel } from "./routing-panel";
import { useOfficeSession, type OfficeProfile } from "./office-session";
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
  const [draft, setDraft] = useState<Draft>(blank());
  const [message, setMessage] = useState<string | null>(null);
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

  async function become(user: OfficeProfile) {
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
    // Full load so the become cookie is applied before the lead list renders.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/agent/leads";
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
          <h1 className="text-[18px] font-semibold text-[#243238]">Manage Agents</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
            <button type="button" className="border border-[#ccc] bg-white px-2 py-1" onClick={() => setPondOnly((value) => !value)}>Show Only Pond Accounts</button>
            <button type="button" className="border border-[#ccc] bg-white px-2 py-1" onClick={() => setShowDisabled((value) => !value)}>Show Disabled Agents</button>
            <button type="button" className="bg-[#1c93b5] px-2 py-1 text-white" onClick={startCreate}>+ Add Pond</button>
            <button type="button" className="bg-[#1c93b5] px-2 py-1 text-white" onClick={startCreate}>+ Add Agent</button>
          </div>
        </div>
        {office.canManageUsers ? (
          <button type="button" className="h-[26px] bg-[#1c93b5] px-3 text-[12px] text-white" onClick={startCreate}>
            Add User
          </button>
        ) : null}
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
              <article key={user.id} className="border border-[#e5e5e5] bg-white p-3 text-[13px]">
                <p className="font-semibold">{user.name}</p>
                <p className="text-[#666]">{user.email}</p>
                <p>{user.roleLabel || roleLabel(user.role)}{user.active ? "" : " · Disabled"}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {office.canManageUsers ? <button type="button" className="border border-[#ccc] px-2 py-1" onClick={() => startEdit(user)}>Edit Permissions</button> : null}
                  {office.canBecome && user.id !== office.user?.id && user.active ? <button type="button" className="border border-[#d9363e] px-2 py-1 text-[#d9363e]" onClick={() => void become(user)}>Become User</button> : null}
                  {office.canManageUsers && user.active && user.role !== "admin" ? <button type="button" className="border border-[#ccc] px-2 py-1" onClick={() => { void fetch(`/api/office/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: false }) }).then(() => load()); }}>Disable</button> : null}
                  {office.canManageUsers ? <button type="button" className="text-[#1c93b5]" onClick={() => void makeLink(user, "reset")}>Reset link</button> : null}
                </div>
              </article>
            ))}
      </div>
      {creating || editing ? (
        <form
          className="mt-4 max-w-xl border border-[#1c93b5] bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <h2 className="mb-3 text-[16px] font-semibold">{editing ? "Edit user" : "Add user"}</h2>
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
