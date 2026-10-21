"use client";

import { Columns2 } from "lucide-react";
import { useCompare } from "@/lib/compare";
import { cn } from "@/lib/utils";

export function CompareToggle({
  propertyId,
  className,
}: {
  propertyId: string;
  className?: string;
}) {
  const { ready, isCompared, toggle, max } = useCompare();
  const active = ready && isCompared(propertyId);

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const result = toggle(propertyId);
        if (!result.ok && result.reason) {
          window.alert(result.reason);
        }
      }}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-sm border px-2.5 text-xs font-medium transition-colors",
        active
          ? "border-[var(--cedar)] bg-[#edf5fd] text-[var(--cedar-deep)]"
          : "border-border bg-white text-[var(--ink-muted)] hover:border-[var(--cedar)] hover:text-[var(--cedar)]",
        className
      )}
      title={active ? "Remove from compare" : `Add to compare (max ${max})`}
    >
      <Columns2 className="size-3.5" />
      {active ? "Comparing" : "Compare"}
    </button>
  );
}
