"use client";

import { useState } from "react";
import Link from "next/link";

export default function AddPocketListingPage() {
  const [saved, setSaved] = useState("");

  return (
    <div className="mx-auto max-w-[640px] p-4">
      <h2 className="text-[18px] text-[#1a2b3c]">Add Pocket Listing</h2>
      <form
        className="mt-4 space-y-3 rounded border border-[#dbe4eb] bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const address = String(data.get("address") || "");
          const raw = localStorage.getItem("gvhs-pocket-listings");
          const list = raw ? (JSON.parse(raw) as string[]) : [];
          localStorage.setItem("gvhs-pocket-listings", JSON.stringify([address, ...list]));
          setSaved(`${address} saved on this device.`);
          e.currentTarget.reset();
        }}
      >
        <input name="address" required placeholder="Address" className="h-9 w-full rounded border border-[#dbe4eb] px-2 text-[13px]" />
        <input name="price" placeholder="Price" className="h-9 w-full rounded border border-[#dbe4eb] px-2 text-[13px]" />
        <button type="submit" className="h-9 rounded bg-[#00aeb6] px-4 text-[13px] font-semibold text-white">Save pocket listing</button>
      </form>
      {saved && <p className="mt-3 text-[13px] text-[#1e8449]">{saved}</p>}
      <Link href="/agent/properties" className="mt-4 inline-block text-[13px] text-[#3498d8]">Back to properties</Link>
    </div>
  );
}
