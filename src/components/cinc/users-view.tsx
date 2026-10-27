"use client";

import { useEffect, useState } from "react";
import { roleLabel, type OfficeRole } from "@/lib/office-access";
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

const blank = (): Draft => ({
  firstName: "",
  lastName: "",
  email: "",
  cell: "",
  role: "agent",
  password: "",
  active: true,
});

export function UsersView() {
  const office = useOfficeSession();
  const [users, setUsers] = useState<OfficeProfile[]>([]);
  const [editing, setEditing] = useState<OfficeProfile | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank());
  const [message, setMessage] = useState<string | null>(null);

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
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    if (!response.ok) {
      setMessage(data?.message || "Could not save that user.");
      return;
    }
    setCreating(false);
    setEditing(null);
    setMessage(editing ? "User saved." : "User added. Share the email and password with them.");
    office.refresh();
    await load();
  }

  const dbOff = office.ready && office.database && !office.database.connected;

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-[20px] font-semibold text-[#243238]">Users</h1>
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
      <div className="overflow-auto border border-[#e5e5e5] bg-white">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#f6f6f6] text-[11px] tracking-wide text-[#666] uppercase">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Cell</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-[#eee]">
                <td className="px-3 py-2">{user.name}</td>
                <td className="px-3 py-2">{user.email}</td>
                <td className="px-3 py-2">{user.roleLabel || roleLabel(user.role)}</td>
                <td className="px-3 py-2">{user.cell || "—"}</td>
                <td className="px-3 py-2">{user.active ? "Active" : "Inactive"}</td>
                <td className="px-3 py-2 text-right">
                  {office.canManageUsers ? (
                    <button type="button" className="text-[#1c93b5]" onClick={() => startEdit(user)}>
                      Edit
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {!users.length ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[#888]">
                  {dbOff ? "Users appear here after the database is connected." : "No users yet."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
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
                required={!editing}
                placeholder={editing ? "Leave blank to keep" : "At least 8 characters"}
                value={draft.password}
                onChange={(event) => setDraft({ ...draft, password: event.target.value })}
              />
            </Field>
          </div>
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
    </div>
  );
}
