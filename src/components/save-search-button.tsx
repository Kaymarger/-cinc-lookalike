"use client";

import { useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { useLeads } from "@/lib/leads";
import type { SearchFilters } from "@/lib/types";
import {
  labelFromFilters,
  useSavedSearches,
} from "@/lib/saved-searches";

export function SaveSearchButton({ filters }: { filters: SearchFilters }) {
  const { add } = useSavedSearches();
  const { add: addLead } = useLeads();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);
  const label = labelFromFilters(filters);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedName = name.trim() || trimmedEmail.split("@")[0];
    add({ label, filters, email: trimmedEmail });
    addLead({
      name: trimmedName,
      email: trimmedEmail,
      phone: "",
      smsOptIn: true,
      source: "search_alert",
      searchLabel: label,
    });
    setSent(true);
  }

  function close() {
    setOpen(false);
    setTimeout(() => {
      setSent(false);
      setEmail("");
      setName("");
    }, 200);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 border border-[var(--cedar)] bg-white px-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--cedar)] hover:bg-[#edf5fd]"
      >
        <Bell className="size-4" />
        Save Search
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-sm border border-border bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-search-title"
          >
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="size-12 text-[var(--cedar)]" />
                <h2
                  id="save-search-title"
                  className="font-[family-name:var(--font-display)] text-2xl text-[var(--cedar-deep)]"
                >
                  Alert saved
                </h2>
                <p className="text-sm text-[var(--ink-muted)]">
                  We&apos;ll pretend to email <strong>{email}</strong> when new
                  homes match <em>{label}</em>. Your agent also sees this in the{" "}
                  <a href="/agent/alerts" className="text-[var(--cedar)] underline">
                    alert inbox
                  </a>
                  .
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-2 inline-flex h-10 items-center rounded-sm bg-[var(--cedar)] px-4 text-sm font-medium text-white hover:brightness-95"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h2
                  id="save-search-title"
                  className="font-[family-name:var(--font-display)] text-2xl text-[var(--cedar-deep)]"
                >
                  Get listing alerts
                </h2>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                  Save <strong>{label}</strong> and get notified when matching
                  homes hit the market.
                </p>
                <form onSubmit={onSubmit} className="mt-5 space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="alert-name" className="text-sm font-medium">
                      Name
                    </label>
                    <input
                      id="alert-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="h-10 w-full rounded-sm border border-[var(--border-soft)] px-3 text-sm outline-none focus:border-[var(--cedar)] focus:ring-2 focus:ring-[var(--cedar)]/25"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="alert-email" className="text-sm font-medium">
                      Email
                    </label>
                    <input
                      id="alert-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="h-10 w-full rounded-sm border border-[var(--border-soft)] px-3 text-sm outline-none focus:border-[var(--cedar)] focus:ring-2 focus:ring-[var(--cedar)]/25"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex h-10 w-full items-center justify-center rounded-sm bg-[var(--cedar)] text-sm font-medium text-white hover:brightness-95"
                  >
                    Create alert
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="w-full text-sm text-[var(--ink-muted)] hover:text-[var(--cedar)]"
                  >
                    Cancel
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
