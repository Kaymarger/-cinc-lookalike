import type { Metadata } from "next";
import { AgentAlias } from "@/components/cinc/agent-alias";

export const metadata: Metadata = {
  title: {
    default: "CINC Agent",
    template: "%s · CINC Agent",
  },
  description:
    "CINC agent CRM demo. The /agent paths open the same screens as /dashboard/spa.",
};

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <AgentAlias>{children}</AgentAlias>;
}
