"use client";

import Link from "next/link";
import LeadDetailPage from "../../[id]/page";
import LeadsPage from "../../page";

export default function LeadDetailOverlayPage() {
  return (
    <div className="relative min-h-[calc(100vh-3rem)]">
      <LeadsPage />
      <div className="absolute inset-y-0 right-0 left-0 z-20 bg-[#102236]/20 sm:left-[280px]">
        <div className="flex h-full min-w-0 flex-col overflow-auto bg-[#eef3f7] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#dbe4eb] bg-white px-3 py-2">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a9bab]">Lead detail</p>
            <Link href="/agent/leads" className="text-[13px] text-[#3498d8]">
              Close
            </Link>
          </div>
          <LeadDetailPage />
        </div>
      </div>
    </div>
  );
}
