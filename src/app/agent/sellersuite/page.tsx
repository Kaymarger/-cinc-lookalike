"use client";

import { useState } from "react";
import Link from "next/link";

export default function SellerSuitePage() {
  const [sites, setSites] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-[640px] rounded border border-[#dbe4eb] bg-white p-6 text-center">
        <h2 className="text-[18px] text-[#1a2b3c]">Seller Suite</h2>
        <p className="mt-2 text-[13px] text-[#5a6f82]">
          You do not have permission to edit Seller Suite pages in this sample workspace.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/agent/landing" className="rounded border border-[#00aeb6] px-3 py-1.5 text-[12px] font-semibold text-[#00aeb6]">
            View All Sites
          </Link>
          <button type="button" onClick={() => setOpen(true)} className="rounded bg-[#00aeb6] px-3 py-1.5 text-[12px] font-semibold text-white">
            Add New Sites
          </button>
        </div>
      </div>
      {open && (
        <form
          className="mx-auto mt-4 flex max-w-[640px] gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            setSites((prev) => [name.trim(), ...prev]);
            setName("");
          }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Site name" className="h-9 flex-1 rounded border border-[#dbe4eb] px-2 text-[13px]" />
          <button type="submit" className="h-9 rounded bg-[#102236] px-3 text-[12px] text-white">Save</button>
        </form>
      )}
      <ul className="mx-auto mt-4 max-w-[640px] text-[13px] text-[#1a2b3c]">
        {sites.map((site) => (
          <li key={site} className="border-b border-[#e8eef3] py-2">{site}</li>
        ))}
      </ul>
    </div>
  );
}
