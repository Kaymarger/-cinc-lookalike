"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ChromeApi = {
  leadSearch: string;
  setLeadSearch: (value: string) => void;
  searchOpen: boolean;
  setSearchOpen: (value: boolean) => void;
  rail: boolean;
  setRail: (value: boolean) => void;
  toast: (message: string) => void;
  openModal: (node: ReactNode) => void;
  closeModal: () => void;
};

export const ChromeContext = createContext<ChromeApi | null>(null);

export function useChrome() {
  const ctx = useContext(ChromeContext);
  if (!ctx) throw new Error("useChrome must be used within the CINC shell");
  return ctx;
}
