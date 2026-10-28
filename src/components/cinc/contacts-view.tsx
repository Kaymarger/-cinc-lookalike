"use client";

import { useState } from "react";
import { useChrome } from "./chrome-context";
import { Btn, Field, inputCls, ModalFrame } from "./ui";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  company: string;
};

const TYPES = ["Sphere", "Vendor", "Past Client", "Agent", "Other"];

const SEED: Contact[] = [
  { id: "c1", name: "Morgan Ellis", email: "morgan.ellis@example.com", phone: "604-555-0142", type: "Sphere", company: "" },
  { id: "c2", name: "Harbor Staging", email: "hello@harborstaging.example", phone: "604-555-0177", type: "Vendor", company: "Harbor Staging" },
  { id: "c3", name: "Avery Quinn", email: "avery.quinn@example.com", phone: "604-555-0160", type: "Past Client", company: "" },
  { id: "c4", name: "Jordan Blake", email: "jordan.blake@example.com", phone: "604-555-0108", type: "Sphere", company: "" },
];

export function ContactsView() {
  const chrome = useChrome();
  const [rows, setRows] = useState<Contact[]>(SEED);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const shown = rows.filter((row) => (type === "All" || row.type === type) && `${row.name} ${row.email} ${row.company}`.toLowerCase().includes(query.toLowerCase()));

  function open(initial?: Contact) {
    chrome.openModal(
      <ContactForm
        initial={initial}
        onClose={chrome.closeModal}
        onSave={(contact) => {
          setRows((current) => initial ? current.map((row) => row.id === contact.id ? contact : row) : [contact, ...current]);
          chrome.closeModal();
          chrome.toast(initial ? "Contact updated." : "Contact added.");
        }}
      />
    );
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input className="h-8 border border-[#ccc] px-2 text-[13px]" placeholder="Search contacts" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select className="h-8 border border-[#ccc] bg-white px-2 text-[13px]" value={type} onChange={(event) => setType(event.target.value)}>
          <option>All</option>
          {TYPES.map((item) => <option key={item}>{item}</option>)}
        </select>
        <button type="button" className="ml-auto h-8 bg-[#1c93b5] px-3 text-[13px] text-white" onClick={() => open()}>Add Contact</button>
      </div>
      <div className="overflow-auto border border-[#e5e5e5] bg-white">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#f6f6f6] text-[11px] tracking-wide text-[#666] uppercase">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Company</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.id} className="border-t border-[#eee]">
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2">{row.email}</td>
                <td className="px-3 py-2">{row.phone}</td>
                <td className="px-3 py-2">{row.type}</td>
                <td className="px-3 py-2">{row.company || "—"}</td>
                <td className="px-3 py-2 text-right">
                  <button type="button" className="text-[#1c93b5]" onClick={() => open(row)}>Edit</button>
                  <button type="button" className="ml-2 text-[#d9363e]" onClick={() => { setRows((current) => current.filter((item) => item.id !== row.id)); chrome.toast("Contact removed."); }}>Delete</button>
                </td>
              </tr>
            ))}
            {!shown.length ? <tr><td colSpan={6} className="px-3 py-8 text-center text-[#888]">No contacts match.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContactForm({ initial, onClose, onSave }: { initial?: Contact; onClose: () => void; onSave: (contact: Contact) => void }) {
  const [form, setForm] = useState<Contact>(initial ?? { id: `c-${Date.now()}`, name: "", email: "", phone: "", type: "Sphere", company: "" });
  return (
    <ModalFrame title={initial ? "Edit contact" : "Add contact"} onClose={onClose}>
      <Field label="Name"><input className={inputCls} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
      <Field label="Email"><input className={inputCls} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
      <Field label="Phone"><input className={inputCls} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
      <Field label="Type">
        <select className={inputCls} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
          {TYPES.map((item) => <option key={item}>{item}</option>)}
        </select>
      </Field>
      <Field label="Company"><input className={inputCls} value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} /></Field>
      <div className="mt-3 flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind="teal" onClick={() => { if (form.name.trim()) onSave(form); }}>Save</Btn>
      </div>
    </ModalFrame>
  );
}
