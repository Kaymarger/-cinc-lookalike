"use client";

import { useMemo, useState } from "react";
import { Pause, Zap } from "lucide-react";
import { CRM_AUTOTRACKS } from "@/lib/cinc-crm";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "General",
  "Buyer",
  "Listing",
  "Nurture",
  "Past Client",
  "My AutoTracks",
] as const;

export default function AutomationsPage() {
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]>("General");

  const stats = useMemo(() => {
    const total = CRM_AUTOTRACKS.length;
    const active = CRM_AUTOTRACKS.filter((a) => a.status === "active").length;
    const paused = total - active;
    return { total, active, paused };
  }, []);

  const filtered = CRM_AUTOTRACKS.filter((a) => a.category === category);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-6 rounded-lg border border-[#dbe4eb] bg-white px-5 py-4 shadow-sm">
        <div>
          <p className="text-[22px] font-semibold text-[#1a2b3c]">
            {stats.total}
          </p>
          <p className="text-[12px] text-[#8a9bab]">Total</p>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#f1c40f]" />
          <div>
            <p className="text-[22px] font-semibold text-[#1a2b3c]">
              {stats.active}
            </p>
            <p className="text-[12px] text-[#8a9bab]">Active</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Pause className="h-4 w-4 text-[#8a9bab]" />
          <div>
            <p className="text-[22px] font-semibold text-[#1a2b3c]">
              {stats.paused}
            </p>
            <p className="text-[12px] text-[#8a9bab]">Paused</p>
          </div>
        </div>
        <button
          type="button"
          className="ml-auto rounded bg-[#00aeb6] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#009a9c]"
        >
          + Start/Edit an AutoTrack
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "rounded border px-3 py-2 text-[12px] font-medium",
              category === c
                ? "border-[#00aeb6] bg-white text-[#00aeb6] shadow-sm"
                : "border-[#dbe4eb] bg-white text-[#5a6f82] hover:border-[#b0bec5]"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-[#dbe4eb] bg-white p-5 shadow-sm">
        <div className="relative flex items-center justify-between gap-2 overflow-x-auto pb-2">
          <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-[#e8eef3]" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <span
              key={i}
              className={cn(
                "relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                i === 0
                  ? "border-[#3498d8] bg-[#3498d8] text-white"
                  : i === 1
                    ? "border-[#00aeb6] bg-[#00aeb6] text-white"
                    : i <= 3
                      ? "border-[#27ae60] bg-[#27ae60] text-white"
                      : "border-[#cfd8dc] bg-[#eceff1] text-[#90a4ae]"
              )}
            >
              {i === 1 ? <Zap className="h-4 w-4" /> : i + 1}
            </span>
          ))}
        </div>
        <div className="mt-6 rounded border border-dashed border-[#b0bec5] py-6 text-center">
          <button
            type="button"
            className="text-[13px] font-semibold tracking-wide text-[#00aeb6] hover:underline"
          >
            START/EDIT AN AUTOTRACK
          </button>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {filtered.map((track) => (
          <li
            key={track.id}
            className="flex items-center justify-between rounded-lg border border-[#dbe4eb] bg-white px-4 py-3 text-[13px]"
          >
            <div>
              <p className="font-medium text-[#1a2b3c]">{track.name}</p>
              <p className="text-[11px] text-[#8a9bab]">{track.category}</p>
            </div>
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[11px] font-semibold uppercase",
                track.status === "active"
                  ? "bg-[#e8f8f8] text-[#00aeb6]"
                  : "bg-[#f0f3f6] text-[#8a9bab]"
              )}
            >
              {track.status}
            </span>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="rounded-lg border border-dashed border-[#dbe4eb] bg-white px-4 py-8 text-center text-[13px] text-[#8a9bab]">
            No AutoTracks in this category.
          </li>
        )}
      </ul>
    </div>
  );
}
