"use client";

import { Heart } from "lucide-react";
import { useSavedHomes } from "@/lib/saved-homes";
import { cn } from "@/lib/utils";

export function SaveHomeButton({
  propertyId,
  variant = "overlay",
  className,
}: {
  propertyId: string;
  variant?: "overlay" | "button";
  className?: string;
}) {
  const { ready, isSaved, toggle } = useSavedHomes();
  const saved = ready && isSaved(propertyId);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved homes" : "Save this home"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(propertyId);
      }}
      className={cn(
        "inline-flex items-center justify-center transition-colors",
        variant === "overlay" &&
          "size-8 text-[var(--cedar)] hover:text-[var(--cedar-deep)]",
        variant === "button" &&
          "h-10 w-full gap-2 border border-[#ddd] bg-white px-4 text-sm font-medium text-[var(--cedar)] hover:bg-[#f7f7f7]",
        saved && "text-[var(--cedar)]",
        className
      )}
    >
      <Heart className={cn("size-5", saved && "fill-current")} strokeWidth={1.75} />
      {variant === "button" && (saved ? "Saved" : "Save this home")}
    </button>
  );
}
