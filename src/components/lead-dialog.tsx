"use client";

import { useId, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useLeads, type LeadSource } from "@/lib/leads";
import { cn } from "@/lib/utils";

export function LeadDialog({
  triggerLabel = "Request a showing",
  propertyAddress,
  propertyId,
  source,
  variant = "default",
  className,
}: {
  triggerLabel?: string;
  propertyAddress?: string;
  propertyId?: string;
  source?: LeadSource;
  variant?: "default" | "outline" | "secondary";
  className?: string;
}) {
  const panelId = useId().replace(/:/g, "");
  const { add } = useLeads();
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");

  const resolvedSource: LeadSource =
    source ??
    (triggerLabel.toLowerCase().includes("question")
      ? "ask_question"
      : triggerLabel.toLowerCase().includes("register")
        ? "photo_gate"
        : triggerLabel.toLowerCase().includes("showing")
          ? "showing_request"
          : "registration");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const fullName = String(data.get("name") || "").trim();
    add({
      name: fullName,
      email: String(data.get("email") || ""),
      phone: String(data.get("phone") || ""),
      smsOptIn: data.get("optIn") === "on",
      source: resolvedSource,
      propertyAddress,
      propertyId,
    });
    setName(fullName);
    setSent(true);
  }

  function resetAndClose(el: HTMLElement | null) {
    el?.hidePopover?.();
    setSent(false);
    setName("");
  }

  return (
    <div className={cn("w-full", className?.includes("!w-auto") && "w-auto")}>
      <button
        type="button"
        popoverTarget={panelId}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors",
          variant === "outline"
            ? "border border-[var(--border-soft)] bg-white text-[var(--cedar-deep)] hover:bg-[var(--fog)]"
            : "bg-[var(--cedar)] text-white hover:brightness-95",
          className
        )}
      >
        {triggerLabel}
      </button>

      <div
        id={panelId}
        popover="auto"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-white p-0 text-[var(--ink)] shadow-xl backdrop:bg-black/45 open:flex"
      >
        <div className="relative w-full p-5 sm:p-6">
          <button
            type="button"
            className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-md text-[var(--ink-muted)] hover:bg-black/5"
            aria-label="Close"
            onClick={(e) =>
              resetAndClose(
                (e.currentTarget.getRootNode() as Document | ShadowRoot).getElementById?.(
                  panelId
                ) ?? document.getElementById(panelId)
              )
            }
          >
            <X className="size-4" />
          </button>

          {sent ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="size-12 text-[var(--cedar)]" />
              <h2 className="font-[family-name:var(--font-display)] text-2xl">
                You&apos;re all set
              </h2>
              <p className="text-base text-[var(--ink-muted)]">
                Thanks{name ? `, ${name.split(" ")[0]}` : ""}. An agent from
                Archibald Real Estate Group will follow up shortly
                {propertyAddress ? ` about ${propertyAddress}` : ""}.
              </p>
              <p className="text-xs text-[var(--ink-muted)]">
                Lead added to the{" "}
                <a href="/agent/leads" className="text-[var(--cedar)] underline">
                  agent inbox
                </a>
                .
              </p>
              <button
                type="button"
                className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-[var(--cedar)] px-4 text-sm font-medium text-white hover:brightness-95"
                onClick={() => resetAndClose(document.getElementById(panelId))}
              >
                Continue browsing
              </button>
            </div>
          ) : (
            <>
              <h2 className="pr-8 font-[family-name:var(--font-display)] text-2xl">
                {resolvedSource === "showing_request"
                  ? "Request a showing"
                  : resolvedSource === "ask_question"
                    ? "Ask about this home"
                    : resolvedSource === "photo_gate"
                      ? "Continue viewing photos"
                      : triggerLabel}
              </h2>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">
                {resolvedSource === "showing_request"
                  ? "Leave your details and Casey will confirm a time"
                  : resolvedSource === "ask_question"
                    ? "Send your question — Casey usually replies the same day"
                    : resolvedSource === "photo_gate"
                      ? "Optional: leave your email to keep browsing, or skip below"
                      : "Share your contact info and we’ll follow up"}
                {propertyAddress ? ` about ${propertyAddress}` : ""}.
              </p>
              <form onSubmit={onSubmit} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor={`${panelId}-name`} className="text-sm font-medium">
                    Full name
                  </label>
                  <input
                    id={`${panelId}-name`}
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Your name"
                    className="h-11 w-full rounded-xl border border-[var(--border-soft)] px-3 text-[16px] outline-none focus:border-[var(--cedar)] focus:ring-2 focus:ring-[var(--cedar)]/25 sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={`${panelId}-email`} className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    id={`${panelId}-email`}
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@email.com"
                    className="h-11 w-full rounded-xl border border-[var(--border-soft)] px-3 text-[16px] outline-none focus:border-[var(--cedar)] focus:ring-2 focus:ring-[var(--cedar)]/25 sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={`${panelId}-phone`} className="text-sm font-medium">
                    Phone
                  </label>
                  <input
                    id={`${panelId}-phone`}
                    name="phone"
                    type="tel"
                    required={resolvedSource !== "photo_gate"}
                    autoComplete="tel"
                    placeholder="(604) 363-7858"
                    className="h-11 w-full rounded-xl border border-[var(--border-soft)] px-3 text-[16px] outline-none focus:border-[var(--cedar)] focus:ring-2 focus:ring-[var(--cedar)]/25 sm:text-sm"
                  />
                </div>
                <label className="flex items-start gap-3 text-sm text-[var(--ink-muted)]">
                  <input
                    type="checkbox"
                    name="optIn"
                    defaultChecked
                    className="mt-1 size-4 accent-[var(--cedar)]"
                  />
                  <span>
                    Text me listing alerts and showing updates by text or email.
                  </span>
                </label>
                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[var(--cedar)] px-4 text-sm font-semibold text-white hover:brightness-95"
                >
                  {resolvedSource === "showing_request"
                    ? "Request showing"
                    : resolvedSource === "ask_question"
                      ? "Send question"
                      : "Continue"}
                </button>
                <p className="text-center text-xs text-[var(--ink-muted)]">
                  Demo — your note is saved for the agent workspace on this device.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
