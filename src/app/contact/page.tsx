import type { Metadata } from "next";
import { AgentProfile } from "@/components/agent-profile";
import { CamelotPageHeader } from "@/components/camelot-page-header";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Casey Archibald at Archibald Real Estate Group — Greater Vancouver Area Home Search.",
};

export default function ContactPage() {
  return (
    <div className="bg-white">
      <CamelotPageHeader />
      <AgentProfile />
    </div>
  );
}
