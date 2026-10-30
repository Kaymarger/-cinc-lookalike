"use client";

import { useEffect, useState } from "react";
import { PLACEHOLDER_VENDOR_TYPES } from "@/lib/placeholders";
import { useChrome } from "./chrome-context";

type Vendor = { id: string; name: string; type: string; preferred: boolean; phone: string; notes: string };

const blank = (): Vendor => ({ id: "", name: "", type: PLACEHOLDER_VENDOR_TYPES[0], preferred: false, phone: "", notes: "" });

export function ContactsView({ mode }: { mode: "vendors" | "people" }) {
  const chrome = useChrome();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filter, setFilter] = useState("Show All");
  const [type, setType] = useState("");
  const [draft, setDraft] = useState<Vendor | null>(null);
  useEffect(() => {
    if (mode !== "vendors") return;
    void fetch("/api/office/vendors", { cache: "no-store" }).then(async (response) => {
      const data = (await response.json().catch(() => null)) as { vendors?: Vendor[] } | null;
      setVendors(data?.vendors ?? []);
    });
  }, [mode]);
  if (mode === "people") {
    return (
      <div className="p-6">
        <h1 className="text-[18px] font-semibold">Contact List</h1>
        <p className="mt-4 text-[13px] font-bold">ALL CONTACTS 0</p>
        <p className="mt-2 text-[13px] text-[#666]">No contacts found. Contacts are created via the Listings Dashboard.</p>
      </div>
    );
  }
  const shown = vendors.filter((vendor) => (filter !== "Preferred" || vendor.preferred) && (!type || vendor.type === type));
  async function save(vendor: Vendor) {
    const response = await fetch(vendor.id ? `/api/office/vendors/${vendor.id}` : "/api/office/vendors", {
      method: vendor.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vendor),
    });
    const data = (await response.json().catch(() => null)) as { vendor?: Vendor; message?: string } | null;
    if (!response.ok || !data?.vendor) {
      chrome.toast(data?.message || "Could not save that vendor.");
      return;
    }
    const saved = data.vendor;
    setVendors((current) => current.some((item) => item.id === saved.id) ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved]);
    setDraft(null);
    chrome.toast("Vendor saved.");
  }
  async function remove(id: string) {
    const response = await fetch(`/api/office/vendors/${id}`, { method: "DELETE" });
    if (!response.ok) {
      chrome.toast("Could not delete that vendor.");
      return;
    }
    setVendors((current) => current.filter((item) => item.id !== id));
  }
  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap gap-2 text-[12px]">
        {["Show All", "Preferred"].map((item) => (
          <button key={item} type="button" className={`border px-2 py-1 ${filter === item ? "border-[#1c93b5] text-[#1c93b5]" : "border-[#ccc] bg-white"}`} onClick={() => setFilter(item)}>{item}{item === "Preferred" ? " ★" : ""}</button>
        ))}
        <label className="flex items-center gap-1">Vendor Type
          <select className="border border-[#ccc] bg-white px-2 py-1" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">All</option>
            {PLACEHOLDER_VENDOR_TYPES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <h1 className="mb-3 text-[16px] font-bold">ALL VENDORS</h1>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="grid h-28 w-40 place-items-center border border-dashed border-[#1c93b5] text-[13px] text-[#1c93b5]" onClick={() => setDraft(blank())}>+<br />ADD VENDOR</button>
        {shown.map((vendor) => (
          <article key={vendor.id} className="h-36 w-44 border border-[#e5e5e5] bg-white p-2 text-[13px]">
            <p className="font-semibold">{vendor.name}</p>
            <p className="text-[12px] text-[#666]">{vendor.type}</p>
            <button type="button" className="mt-1 text-[#1c93b5]" onClick={() => void save({ ...vendor, preferred: !vendor.preferred })}>{vendor.preferred ? "★ Preferred" : "Mark preferred"}</button>
            <div className="mt-1 flex gap-2">
              <button type="button" className="text-[#1c93b5]" onClick={() => setDraft(vendor)}>Edit</button>
              <button type="button" className="text-[#d9363e]" onClick={() => void remove(vendor.id)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
      {draft ? (
        <form className="mt-4 max-w-md border border-[#1c93b5] bg-white p-3 text-[13px]" onSubmit={(event) => { event.preventDefault(); void save(draft); }}>
          <p className="mb-2 font-semibold">{draft.id ? "Edit vendor" : "Add vendor"}</p>
          <label className="mb-2 block">Name <input className="mt-1 h-8 w-full border border-[#ccc] px-2" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
          <label className="mb-2 block">Vendor Type
            <select className="mt-1 h-8 w-full border border-[#ccc] px-2" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>
              {PLACEHOLDER_VENDOR_TYPES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="mb-2 block">Phone <input className="mt-1 h-8 w-full border border-[#ccc] px-2" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} /></label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDraft(null)}>Cancel</button>
            <button type="submit" className="bg-[#1c93b5] px-3 py-1 text-white">Save</button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
