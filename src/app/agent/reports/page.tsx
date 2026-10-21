"use client";

import Link from "next/link";
import {
  LEAD_SOURCE_LABEL,
  LEAD_STATUS_LABEL,
  LEAD_STATUSES,
  LEAD_SOURCES,
  useLeads,
} from "@/lib/leads";
import { useAgentTasks } from "@/lib/agent-tasks";
import { properties } from "@/lib/properties";

export default function AgentReportsPage() {
  const { ready, leads } = useLeads();
  const { ready: tasksReady, openTasks, overdue } = useAgentTasks();

  const byStatus = LEAD_STATUSES.map((s) => ({
    label: LEAD_STATUS_LABEL[s],
    count: ready ? leads.filter((l) => l.status === s).length : 0,
  }));

  const bySource = LEAD_SOURCES.map((s) => ({
    label: LEAD_SOURCE_LABEL[s],
    count: ready ? leads.filter((l) => l.source === s).length : 0,
  })).filter((r) => r.count > 0);

  const withListing = ready
    ? leads.filter((l) => Boolean(l.propertyId)).length
    : 0;

  return (
    <div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cedar)]">
          Insights
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--cedar-deep)]">
          Reports
        </h1>
        <p className="mt-1 text-sm text-[#666]">
          Snapshot of pipeline volume from this demo CRM.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-[#dbe3e8] bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[#888]">
            Total leads
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--cedar-deep)]">
            {ready ? leads.length : "—"}
          </p>
        </div>
        <div className="border border-[#dbe3e8] bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[#888]">
            Listing-tied
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--cedar-deep)]">
            {ready ? withListing : "—"}
          </p>
        </div>
        <div className="border border-[#dbe3e8] bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[#888]">
            Open tasks
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--cedar-deep)]">
            {tasksReady ? openTasks.length : "—"}
          </p>
        </div>
        <div className="border border-[#dbe3e8] bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[#888]">
            Sample listings
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--cedar-deep)]">
            {properties.length}
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="border border-[#dbe3e8] bg-white p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--cedar-deep)]">
            By status
          </h2>
          <ul className="mt-4 space-y-2">
            {byStatus.map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between text-sm"
              >
                <Link
                  href={`/agent/leads?status=${LEAD_STATUSES.find(
                    (s) => LEAD_STATUS_LABEL[s] === row.label
                  )}`}
                  className="text-[#333] hover:text-[var(--cedar)]"
                >
                  {row.label}
                </Link>
                <span className="font-semibold text-[var(--cedar)]">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-[#dbe3e8] bg-white p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--cedar-deep)]">
            By source
          </h2>
          {bySource.length === 0 ? (
            <p className="mt-4 text-sm text-[#888]">No source data yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {bySource.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-[#333]">{row.label}</span>
                  <span className="font-semibold text-[var(--cedar)]">
                    {row.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {tasksReady && overdue.length > 0 && (
            <p className="mt-6 text-sm text-red-600">
              {overdue.length} overdue task
              {overdue.length === 1 ? "" : "s"} —{" "}
              <Link href="/agent/tasks" className="underline">
                review
              </Link>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
