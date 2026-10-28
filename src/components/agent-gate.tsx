"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AgentAlias } from "@/components/cinc/agent-alias";

export function AgentGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/agent/login" || pathname === "/agent/forgot" || pathname === "/agent/reset") {
    return children;
  }
  return <AgentAlias>{children}</AgentAlias>;
}
