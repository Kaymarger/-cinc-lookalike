"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  CircleHelp,
  ListTodo,
  MoreVertical,
} from "lucide-react";
import { CRM_AGENT, CRM_TODAY_FEED } from "@/lib/cinc-crm";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "contact", label: "Contact Requested", badge: "99+" },
  { id: "prospecting", label: "Prospecting" },
  { id: "lead-rem", label: "Lead Reminders" },
  { id: "deal-rem", label: "Deal Reminders" },
  { id: "trending", label: "Trending Leads" },
] as const;

export default function AgentLaunchpadPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("contact");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
      <h2 className="text-[22px] font-semibold text-[#1a2b3c]">
        Welcome back, {CRM_AGENT.name}.
      </h2>
      <p className="mt-1 text-[13px] text-[#5a6f82]">
        {today}. You have{" "}
        <button type="button" className="font-medium text-[#00aeb6] hover:underline">
          0 appointments
        </button>{" "}
        scheduled today.
      </p>

      <section className="mt-5 overflow-hidden rounded-lg border border-[#dbe4eb] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#e8eef3] px-4 py-3">
          <ListTodo className="h-4 w-4 text-[#5a6f82]" />
          <h3 className="text-[15px] font-semibold text-[#1a2b3c]">Today</h3>
        </div>

        <div className="flex gap-0 overflow-x-auto border-b border-[#e8eef3] px-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative shrink-0 px-3 py-3 text-[13px] whitespace-nowrap",
                tab === t.id
                  ? "font-semibold text-[#1a2b3c]"
                  : "text-[#5a6f82] hover:text-[#1a2b3c]"
              )}
            >
              {t.label}
              {"badge" in t && t.badge && (
                <span className="ml-1.5 inline-flex min-w-[22px] items-center justify-center rounded-full bg-[#e74c3c] px-1.5 text-[10px] font-bold text-white">
                  {t.badge}
                </span>
              )}
              {tab === t.id && (
                <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-[#00aeb6]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 border-b border-[#e8eef3] bg-[#fafcfd] px-4 py-2.5">
          <select className="rounded border border-[#dbe4eb] bg-white px-2 py-1.5 text-[12px] text-[#3d5164]">
            <option>Type: All</option>
            <option>Property Inquiry</option>
            <option>Showing Request</option>
          </select>
          <select className="rounded border border-[#dbe4eb] bg-white px-2 py-1.5 text-[12px] text-[#3d5164]">
            <option>Status: Awaiting Response</option>
            <option>Responded</option>
            <option>All</option>
          </select>
        </div>

        <ul className="divide-y divide-[#e8eef3]">
          {CRM_TODAY_FEED.map((item) => (
            <li key={item.id} className="px-4 py-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f4fb] text-[#3498d8]">
                  {item.kind.includes("Showing") ? (
                    <CalendarDays className="h-4 w-4" />
                  ) : (
                    <CircleHelp className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/agent/leads/${item.id}`}
                        className="text-[14px] font-medium text-[#3498d8] hover:underline"
                      >
                        {item.name}
                      </Link>
                      {item.verified && (
                        <span className="ml-1.5 inline-block h-3.5 w-3.5 rounded-full bg-[#3498d8] text-center text-[9px] leading-[14px] text-white">
                          ✓
                        </span>
                      )}
                      <p className="mt-0.5 text-[12px] text-[#8a9bab]">
                        {item.at}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded p-1 text-[#8a9bab] hover:bg-[#eef3f7]"
                      aria-label="More"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 rounded border border-[#e8eef3] bg-[#f7fafc] p-3">
                    <p className="text-[13px] font-semibold text-[#1a2b3c]">
                      {item.kind}
                    </p>
                    <p className="mt-1 text-[13px] text-[#5a6f82]">
                      {item.message}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-[#dbe4eb]">
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="64px"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/agent/leads/${item.id}`}
                          className="block truncate text-[13px] text-[#3498d8] hover:underline"
                        >
                          {item.address}
                        </Link>
                        <p className="text-[13px] font-semibold text-[#1a2b3c]">
                          {item.price}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
