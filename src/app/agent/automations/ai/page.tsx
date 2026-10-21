"use client";

import { useState } from "react";

export default function CincAiPage() {
  const [asked, setAsked] = useState(false);
  return (
    <div className="mx-auto max-w-[720px] p-8 text-center">
      <p className="text-[12px] font-semibold tracking-[2px] text-[#00aeb6] uppercase">CINC AI</p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[#1a2b3c]">
        Draft follow-ups from lead activity
      </h2>
      <p className="mt-3 text-[14px] leading-relaxed text-[#5a6f82]">
        This demo keeps AI on the device. Nothing is sent to a model and no messages go out.
      </p>
      <button
        type="button"
        onClick={() => setAsked(true)}
        className="mt-6 rounded bg-[#00aeb6] px-5 py-2 text-[13px] font-semibold text-white"
      >
        Get CINC AI
      </button>
      {asked && (
        <p className="mt-4 rounded border border-[#dbe4eb] bg-white px-4 py-3 text-[13px] text-[#1a2b3c]">
          Request saved. A sample seat is marked interested for Casey Archibald. No charge.
        </p>
      )}
    </div>
  );
}
