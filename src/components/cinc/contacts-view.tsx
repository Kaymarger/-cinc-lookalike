"use client";

import { useState } from "react";
import { useChrome } from "./chrome-context";

type Vendor = { id: string; name: string; preferred: boolean };

export function ContactsView({ mode }: { mode: "vendors" | "people" }) {
  const chrome = useChrome();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filter, setFilter] = useState("Show All");
  if (mode === "people") {
    return (
      <div className="p-6">
        <h1 className="text-[18px] font-semibold">Contact List</h1>
        <p className="mt-4 text-[13px] font-bold">ALL CONTACTS 0</p>
        <p className="mt-2 text-[13px] text-[#666]">No contacts found. Contacts are created via the Listings Dashboard.</p>
      </div>
    );
  }
  const shown = vendors.filter((vendor) => filter !== "Preferred" || vendor.preferred);
  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap gap-2 text-[12px]">
        {["Show All", "Preferred", "Vendor Type"].map((item) => (
          <button key={item} type="button" className={`border px-2 py-1 ${filter === item ? "border-[#1c93b5] text-[#1c93b5]" : "border-[#ccc] bg-white"}`} onClick={() => setFilter(item)}>{item}{item === "Preferred" ? " ★" : ""}</button>
        ))}
      </div>
      <h1 className="mb-3 text-[16px] font-bold">ALL VENDORS</h1>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="grid h-28 w-40 place-items-center border border-dashed border-[#1c93b5] text-[13px] text-[#1c93b5]" onClick={() => {
          const name = window.prompt("Vendor name");
          if (!name) return;
          setVendors((current) => [...current, { id: `v-${Date.now()}`, name, preferred: false }]);
          chrome.toast("Vendor added.");
        }}>+<br />ADD VENDOR</button>
        {shown.map((vendor) => (
          <article key={vendor.id} className="h-28 w-40 border border-[#e5e5e5] bg-white p-2 text-[13px]">
            <p className="font-semibold">{vendor.name}</p>
            <button type="button" className="mt-2 text-[#1c93b5]" onClick={() => setVendors((current) => current.map((item) => item.id === vendor.id ? { ...item, preferred: !item.preferred } : item))}>{vendor.preferred ? "★ Preferred" : "Mark preferred"}</button>
          </article>
        ))}
      </div>
    </div>
  );
}
