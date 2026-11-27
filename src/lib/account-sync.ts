"use client";

import type { NotebookNote, PropertyNote } from "@/lib/account-merge";
import type { SearchFilters } from "@/lib/types";

export type AccountSnapshot = {
  homes: string[];
  compare: string[];
  notebook: NotebookNote[];
  propertyNotes: PropertyNote[];
  searches: { id: string; name: string; email: string; createdAt: string; filters: SearchFilters }[];
};

export type AccountSession = { email: string; name: string };

export function readSession(): AccountSession | null {
  try {
    const raw = localStorage.getItem("gvhs-demo-user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: string; name?: string };
    const email = (parsed.email || "").trim().toLowerCase();
    if (!email) return null;
    return { email, name: parsed.name || "" };
  } catch {
    return null;
  }
}

export async function pushAccount(
  email: string,
  name: string,
  patch: Record<string, unknown>
): Promise<AccountSnapshot | null> {
  try {
    const response = await fetch("/api/account/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ email, name, ...patch }),
    });
    if (!response.ok) return null;
    return (await response.json()) as AccountSnapshot;
  } catch {
    return null;
  }
}

export async function loadAccount(email: string): Promise<AccountSnapshot | null> {
  try {
    const response = await fetch(`/api/account/sync?email=${encodeURIComponent(email)}`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as AccountSnapshot;
  } catch {
    return null;
  }
}
