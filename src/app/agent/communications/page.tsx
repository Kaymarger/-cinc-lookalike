"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Mail,
  MessageSquare,
  RefreshCw,
  Smartphone,
  Trash2,
} from "lucide-react";
import { CRM_MESSAGES } from "@/lib/cinc-crm";
import { cn } from "@/lib/utils";

export default function CommunicationsPage() {
  const [selected, setSelected] = useState<string | null>(CRM_MESSAGES[0]?.id);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const active = useMemo(
    () => CRM_MESSAGES.find((m) => m.id === selected) ?? CRM_MESSAGES[0],
    [selected]
  );

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-[480px] flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#dbe4eb] bg-white px-3 py-2.5 sm:px-4">
        <input type="checkbox" className="rounded border-[#b8c5d0]" />
        <button type="button" className="rounded p-1.5 text-[#8a9bab] hover:bg-[#eef3f7]">
          <Mail className="h-4 w-4" />
        </button>
        <button type="button" className="rounded p-1.5 text-[#8a9bab] hover:bg-[#eef3f7]">
          <Smartphone className="h-4 w-4" />
        </button>
        <button type="button" className="rounded p-1.5 text-[#8a9bab] hover:bg-[#eef3f7]">
          <Trash2 className="h-4 w-4" />
        </button>
        <button type="button" className="rounded p-1.5 text-[#8a9bab] hover:bg-[#eef3f7]">
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded border border-[#dbe4eb] px-2 py-1 text-[12px] text-[#5a6f82]"
        >
          <Filter className="h-3.5 w-3.5" /> Filters
        </button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded bg-[#00aeb6] px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            New Email
          </button>
          <button
            type="button"
            className="rounded border border-[#00aeb6] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#00aeb6]"
          >
            New Text
          </button>
          <span className="text-[12px] text-[#5a6f82]">
            1 – {CRM_MESSAGES.length} of 9,320
          </span>
          <button type="button" className="rounded p-1 text-[#8a9bab]">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" className="rounded p-1 text-[#8a9bab]">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <ul className="w-full overflow-y-auto border-r border-[#dbe4eb] bg-[#f7fafc] md:w-[420px] lg:w-[480px]">
          {CRM_MESSAGES.map((msg) => {
            const isActive = msg.id === active?.id;
            return (
              <li key={msg.id}>
                <button
                  type="button"
                  onClick={() => setSelected(msg.id)}
                  className={cn(
                    "flex w-full items-start gap-2 border-b border-[#e8eef3] px-3 py-3 text-left",
                    isActive ? "bg-white" : "hover:bg-white/80",
                    msg.unread && "font-semibold"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(checked[msg.id])}
                    onChange={(e) => {
                      e.stopPropagation();
                      setChecked((c) => ({ ...c, [msg.id]: e.target.checked }));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 rounded border-[#b8c5d0]"
                  />
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#27ae60]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] text-[#1a2b3c]">
                        {msg.sender}
                      </span>
                      <span className="shrink-0 text-[11px] font-normal text-[#8a9bab]">
                        {msg.time}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[12px] font-normal text-[#5a6f82]">
                      {msg.preview}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="hidden min-w-0 flex-1 flex-col bg-white md:flex">
          {active ? (
            <>
              <div className="border-b border-[#e8eef3] px-5 py-4">
                <p className="text-[15px] font-semibold text-[#1a2b3c]">
                  {active.sender}
                </p>
                <p className="mt-1 text-[12px] text-[#8a9bab]">{active.time}</p>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5 text-[13px] leading-relaxed text-[#3d5164]">
                <p>{active.preview}</p>
                <p className="mt-4 text-[#8a9bab]">
                  This is a demo inbox message. Real SMS/email threads would
                  appear here in production CINC.
                </p>
              </div>
              <div className="border-t border-[#e8eef3] px-5 py-3">
                <textarea
                  rows={3}
                  placeholder="Reply…"
                  className="w-full rounded border border-[#dbe4eb] px-3 py-2 text-[13px] outline-none focus:border-[#00aeb6]"
                />
                <button
                  type="button"
                  className="mt-2 rounded bg-[#00aeb6] px-3 py-1.5 text-[12px] font-semibold text-white"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[13px] text-[#8a9bab]">
              Select a message
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
