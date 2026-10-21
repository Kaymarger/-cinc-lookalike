import type { Metadata } from "next";
import { AgentShell } from "@/components/agent-shell";
import { AgentTasksProvider } from "@/lib/agent-tasks";
import { AgentWorkspaceProvider } from "@/lib/agent-workspace";

export const metadata: Metadata = {
  title: {
    default: "CINC Agent",
    template: "%s · CINC Agent",
  },
  description:
    "CINC-style agent back office demo — Launchpad, Leads, Deals, Communications, Automations, and Properties.",
};

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AgentTasksProvider>
      <AgentWorkspaceProvider>
        <AgentShell>{children}</AgentShell>
      </AgentWorkspaceProvider>
    </AgentTasksProvider>
  );
}
