import { redirect } from "next/navigation";

/** Live site maps /agents-style entry to About. */
export default function AgentsRedirectPage() {
  redirect("/about");
}
