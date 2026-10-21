"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShareListing({
  title,
  className,
  variant = "button",
}: {
  title: string;
  className?: string;
  variant?: "button" | "icon";
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared">("idle");

  function flash(next: "copied" | "shared") {
    setStatus(next);
    window.setTimeout(() => setStatus("idle"), 2200);
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      flash("copied");
      return true;
    } catch {
      try {
        const input = document.createElement("input");
        input.value = url;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        flash("copied");
        return true;
      } catch {
        return false;
      }
    }
  }

  async function share() {
    const url = window.location.href;
    const preferNativeShare =
      typeof navigator.share === "function" &&
      window.matchMedia("(pointer: coarse)").matches;

    if (preferNativeShare) {
      try {
        await navigator.share({ title, url, text: title });
        flash("shared");
        return;
      } catch {
        /* user cancelled or share failed — fall through to copy */
      }
    }

    await copyLink(url);
  }

  const label =
    status === "copied"
      ? "Link copied"
      : status === "shared"
        ? "Shared"
        : "Share listing";

  return (
    <button
      type="button"
      onClick={share}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors",
        variant === "button" &&
          "h-10 w-full rounded-sm border border-[var(--border-soft)] bg-white px-4 text-[var(--cedar-deep)] hover:bg-[var(--fog)]",
        variant === "button" &&
          status !== "idle" &&
          "border-[var(--cedar)] text-[var(--cedar)]",
        variant === "icon" &&
          "h-9 gap-1.5 px-2 text-white hover:bg-white/10 hover:text-white",
        className
      )}
    >
      {status === "idle" ? (
        <Share2 className="size-4" />
      ) : (
        <Check className="size-4" />
      )}
      {variant === "button" ? (
        label
      ) : status === "idle" ? (
        <span className="hidden sm:inline">Share</span>
      ) : (
        <span className="hidden sm:inline">{label}</span>
      )}
    </button>
  );
}
