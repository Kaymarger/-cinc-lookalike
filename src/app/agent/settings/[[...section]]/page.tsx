"use client";

import { useParams } from "next/navigation";
import { SettingsScreen, type SettingsKey } from "@/components/agent/settings-screen";

const KEYS = new Set<SettingsKey>([
  "profile",
  "team",
  "routing",
  "notifications",
  "phone",
  "email",
  "website",
  "idx",
  "integrations",
  "sources",
  "tags",
  "fields",
  "billing",
]);

export default function AgentSettingsRoute() {
  const params = useParams<{ section?: string[] }>();
  const slug = params.section?.[0] ?? "profile";
  const section = (KEYS.has(slug as SettingsKey) ? slug : "profile") as SettingsKey;
  return <SettingsScreen section={section} />;
}
