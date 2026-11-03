"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AgentAlias } from "@/components/cinc/agent-alias";

const OWN_SCREEN = new Set([
  "/agent/login",
  "/agent/forgot",
  "/agent/reset",
  "/agent/settings/team",
  "/agent/settings/routing",
  "/agent/settings/phone",
  "/agent/settings/email",
  "/agent/settings/website",
  "/agent/settings/idx",
  "/agent/settings/sources",
  "/agent/settings/tags",
  "/agent/settings/fields",
  "/agent/settings/billing",
  "/agent/automations/lists",
  "/agent/automations/alerts",
  "/agent/automations/assign",
  "/agent/automations/templates",
]);

export function AgentGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (OWN_SCREEN.has(pathname)) return children;
  return <AgentAlias>{children}</AgentAlias>;
}
