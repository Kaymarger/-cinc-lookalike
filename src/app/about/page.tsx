import type { Metadata } from "next";
import { AgentProfile } from "@/components/agent-profile";
import { CamelotPageHeader } from "@/components/camelot-page-header";

export const metadata: Metadata = {
  title: "About",
  description:
    "Archibald Real Estate Group: Casey Archibald. 604-555-0100. Find your Vancouver home today.",
};

export default function AboutPage() {
  return (
    <div className="bg-white">
      <CamelotPageHeader />
      <AgentProfile />
    </div>
  );
}
