import { redirect } from "next/navigation";

export default function LegacySearchSettings() {
  redirect("/dashboard/settings/search");
}
