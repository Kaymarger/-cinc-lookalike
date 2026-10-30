"use client";

import { useEffect, useState } from "react";
import { roleLabel, type OfficeRole } from "@/lib/office-access";
import type { OfficeProfile } from "./office-session";
import { Btn } from "./ui";

const ROUTABLE: OfficeRole[] = ["admin", "broker", "agent", "isa"];

type Mode = "default" | "fixed" | "round_robin";

export function RoutingPanel({ users }: { users: (OfficeProfile & { routingHidden?: boolean })[] }) {
  const eligible = users.filter((user) => user.active && ROUTABLE.includes(user.role) && !user.routingHidden);
  const [mode, setMode] = useState<Mode>("default");
  const [fixedUserId, setFixedUserId] = useState("");
  const [poolIds, setPoolIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/office/routing", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as {
          routing?: { mode: Mode; fixedUserId: string | null; poolIds: string[] };
        } | null;
        if (cancelled || !response.ok || !data?.routing) return;
        setMode(data.routing.mode);
        setFixedUserId(data.routing.fixedUserId || "");
        setPoolIds(data.routing.poolIds);
        setLoaded(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(id: string) {
    setPoolIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function save() {
    setMessage(null);
    const response = await fetch("/api/office/routing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        fixedUserId: fixedUserId || null,
        poolIds,
      }),
    });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    setMessage(data?.message || (response.ok ? "Lead routing saved. New registrations use it." : "Could not save lead routing."));
  }

  return (
    <section className="mb-4 border border-[#e5e5e5] bg-white p-4">
      <h2 className="text-[16px] font-semibold text-[#243238]">New lead assignment</h2>
      <p className="mt-1 text-[13px] text-[#666]">
        Choose who receives people who register on the public site. Sample rows already in the CRM stay where they are.
      </p>
      <div className="mt-3 space-y-2 text-[13px]">
        <label className="flex items-start gap-2">
          <input type="radio" name="routing" checked={mode === "default"} onChange={() => setMode("default")} />
          <span>Office default. New leads go to the alert name, or Casey Archibald.</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="radio" name="routing" checked={mode === "fixed"} onChange={() => setMode("fixed")} />
          <span>Assign every new lead to one person.</span>
        </label>
        {mode === "fixed" ? (
          <select
            className="ml-6 h-8 border border-[#ccc] bg-white px-2"
            value={fixedUserId}
            onChange={(event) => setFixedUserId(event.target.value)}
          >
            <option value="">Choose a person</option>
            {eligible.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({roleLabel(user.role)})
              </option>
            ))}
          </select>
        ) : null}
        <label className="flex items-start gap-2">
          <input type="radio" name="routing" checked={mode === "round_robin"} onChange={() => setMode("round_robin")} />
          <span>Round robin across the people checked below.</span>
        </label>
        {mode === "round_robin" ? (
          <div className="ml-6 space-y-1">
            {eligible.map((user) => (
              <label key={user.id} className="flex items-center gap-2">
                <input type="checkbox" checked={poolIds.includes(user.id)} onChange={() => toggle(user.id)} />
                {user.name} ({roleLabel(user.role)})
              </label>
            ))}
            {!eligible.length ? <p className="text-[#888]">Add an active agent before using round robin.</p> : null}
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Btn kind="teal" onClick={() => void save()}>Save routing</Btn>
        {message ? <p className="text-[13px] text-[#1c93b5]">{message}</p> : null}
        {!loaded ? <p className="text-[12px] text-[#888]">Loading the current rule…</p> : null}
      </div>
    </section>
  );
}
