"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useSavedHomes } from "@/lib/saved-homes";
import { cn } from "@/lib/utils";

export function SavedHomesLink({ className }: { className?: string }) {
  const { ready, ids } = useSavedHomes();
  const count = ready ? ids.length : 0;

  return (
    <Link
      href="/saved"
      className={cn(
        "relative inline-flex items-center gap-1.5 px-1 py-2 text-[13px] font-medium uppercase tracking-[0.04em] text-[#333] hover:text-[var(--cedar)]",
        className
      )}
      aria-label={count ? `Saved homes, ${count}` : "Saved homes"}
    >
      <Heart
        className={cn(
          "size-4 text-[var(--cedar)]",
          count > 0 && "fill-[var(--cedar)]"
        )}
        strokeWidth={1.75}
      />
      <span className="hidden sm:inline">Saved</span>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[var(--cedar)] text-[0.65rem] font-semibold text-white sm:static sm:ml-0.5 sm:size-auto sm:rounded-full sm:px-1.5 sm:py-0.5">
          {count}
        </span>
      )}
    </Link>
  );
}
