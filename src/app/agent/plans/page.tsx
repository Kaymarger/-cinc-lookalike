"use client";

import { useState } from "react";
import Link from "next/link";

export default function PlansPage() {
  const [plan, setPlan] = useState("CINC Agent");
  return (
    <div className="mx-auto max-w-[640px] p-6">
      <h2 className="text-[18px] text-[#1a2b3c]">Plans</h2>
      <p className="mt-2 text-[13px] text-[#5a6f82]">Sample plan for this demo. Billing is not charged.</p>
      <div className="mt-4 rounded border border-[#dbe4eb] bg-white p-4">
        <p className="text-[13px] text-[#8a9bab]">Current plan</p>
        <p className="text-[20px] text-[#1a2b3c]">{plan}</p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setPlan("CINC Agent")} className="rounded border border-[#dbe4eb] px-3 py-1.5 text-[12px]">CINC Agent</button>
          <button type="button" onClick={() => setPlan("CINC Team")} className="rounded border border-[#dbe4eb] px-3 py-1.5 text-[12px]">CINC Team</button>
        </div>
      </div>
      <Link href="/agent/settings/profile" className="mt-4 inline-block text-[13px] text-[#3498d8]">Profile & Settings</Link>
    </div>
  );
}
