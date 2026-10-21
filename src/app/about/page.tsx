import type { Metadata } from "next";
import { AgentProfile } from "@/components/agent-profile";
import { SITE } from "@/lib/site";
import { CamelotPageHeader } from "@/components/camelot-page-header";

export const metadata: Metadata = {
  title: "About",
  description:
    `${SITE.company}: ${SITE.agent}. ${SITE.phoneDisplay}. Find your Vancouver home today.`,
};

export default function AboutPage() {
  return (
    <div className="bg-white">
      <CamelotPageHeader />
      <AgentProfile />
    </div>
  );
}
