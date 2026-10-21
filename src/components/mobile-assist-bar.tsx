"use client";

import { Phone } from "lucide-react";
import { useCompare } from "@/lib/compare";

export function MobileAssistBar() {
  const { ready, ids } = useCompare();
  if (!ready || ids.length > 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[65] border-t border-border bg-white/95 backdrop-blur-sm md:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Assistance
          </p>
          <p className="truncate text-sm font-medium text-[var(--ink)]">
            Casey Archibald · Archibald Real Estate
          </p>
        </div>
        <a
          href="tel:6045550100"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-sm bg-[var(--cedar)] px-3 text-sm font-medium text-white hover:brightness-95"
        >
          <Phone className="size-4" />
          604-555-0100
        </a>
      </div>
    </div>
  );
}
