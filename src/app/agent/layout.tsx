import type { Metadata } from "next";
import { AgentGate } from "@/components/agent-gate";
import { AgentWorkspaceProvider } from "@/lib/agent-workspace";

export const metadata: Metadata = {
  title: {
    default: "CINC Agent",
    template: "%s · CINC Agent",
  },
  description:
    "CINC agent CRM demo. The /agent paths open the same screens as /dashboard/spa.",
};

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AgentWorkspaceProvider>
      <AgentGate>{children}</AgentGate>
    </AgentWorkspaceProvider>
  );
}
