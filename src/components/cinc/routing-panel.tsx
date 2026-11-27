"use client";

import { useEffect, useState } from "react";
import { isQaTestAgent } from "@/lib/lead-routing-pick";
import { roleLabel, type OfficeRole } from "@/lib/office-access";
import { useOfficeSession, type OfficeProfile } from "./office-session";
import { loadOfficePrefs, saveOfficePrefs } from "./office-prefs";
import { Btn, inputCls } from "./ui";

const ROUTABLE: OfficeRole[] = ["admin", "broker", "agent", "isa"];

type Mode = "default" | "fixed" | "round_robin" | "source";

export function RoutingPanel({ users }: { users: (OfficeProfile & { routingHidden?: boolean })[] }) {
  const office = useOfficeSession();
  const roster: (OfficeProfile & { routingHidden?: boolean })[] = (users.length ? users : office.user ? [{ ...office.user }] : []).filter((user) => user.active && !isQaTestAgent(user));
  const eligible = roster.filter((user) => user.active && ROUTABLE.includes(user.role) && !user.routingHidden);
  const [mode, setMode] = useState<Mode>("default");
  const [fixedUserId, setFixedUserId] = useState("");
  const [poolIds, setPoolIds] = useState<string[]>([]);
  const [sources, setSources] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"Basic" | "Advanced" | "Routing Overview">("Basic");
  const [weights, setWeights] = useState<Record<string, { weight: string; min: string; max: string; status?: string; reassign?: string; auto?: string; include?: string; exclude?: string }>>({});

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
        void loadOfficePrefs().then((prefs) => {
          const saved = prefs.routingWeights;
          if (saved && typeof saved === "object") setWeights(saved as Record<string, { weight: string; min: string; max: string }>);
        });
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
        poolIds: mode === "source" ? [...new Set(Object.values(sources).filter(Boolean))] : poolIds,
      }),
    });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    setMessage(data?.message || (response.ok ? "Lead routing saved. New registrations use it." : "Could not save lead routing."));
  }

  async function updateTable() {
    await save();
    const error = await saveOfficePrefs({ routingWeights: weights });
    if (!error) setMessage("Lead routing updated.");
  }

  return (
    <section className="mb-4 border border-[#e5e5e5] bg-white p-4">
      <div className="mb-3 flex gap-4 border-b border-[#e5e5e5] text-[14px]">
        {(["Basic", "Advanced", "Routing Overview"] as const).map((label) => (
          <button key={label} type="button" className={tab === label ? "border-b-2 border-[#1c93b5] pb-2 font-semibold text-[#1c93b5]" : "pb-2 text-[#666]"} onClick={() => setTab(label)}>{label}</button>
        ))}
      </div>
      {tab === "Basic" || tab === "Routing Overview" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <table className="w-full text-left text-[12px]">
            <thead><tr>{["AGENT", "STATUS", "WEIGHT", "MIN PRICE", "MAX PRICE"].map((column) => <th key={column} className="border-b border-[#eee] py-2">{column}</th>)}</tr></thead>
            <tbody>
              {(roster.length ? roster : []).map((user) => {
                const row = weights[user.id] || { weight: "17", min: "0", max: "999999999" };
                const setRow = (key: "weight" | "min" | "max", value: string) => setWeights((current) => ({ ...current, [user.id]: { ...row, [key]: value } }));
                return (
                  <tr key={user.id} className="border-b border-[#f3f3f3]">
                    <td className="py-2">{user.name}</td>
                    <td>
                      <select className={inputCls} defaultValue={user.active ? "Yes" : "No"} aria-label={`${user.name} status`}>
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    </td>
                    <td><input className={inputCls} value={row.weight} onChange={(event) => setRow("weight", event.target.value)} /></td>
                    <td><input className={inputCls} value={row.min} onChange={(event) => setRow("min", event.target.value)} /></td>
                    <td><input className={inputCls} value={row.max} onChange={(event) => setRow("max", event.target.value)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div>
            <h3 className="text-[13px] font-semibold">Loan Officers</h3>
            <p className="text-[12px] text-[#888]">{roster.filter((user) => user.role === "lender").map((user) => user.name).join(", ") || "No loan officers on this office."}</p>
            <h3 className="mt-3 text-[13px] font-semibold">Listing Agents</h3>
            <p className="text-[12px] text-[#888]">{roster.filter((user) => user.role === "agent" || user.role === "broker").map((user) => user.name).join(", ") || "No listing agents on this office."}</p>
            <div className="mt-3"><Btn kind="teal" onClick={() => void updateTable()}>Update</Btn></div>
          </div>
        </div>
      ) : null}
      {tab !== "Routing Overview" ? <div className="mt-3 space-y-2 text-[13px]">
        {tab === "Basic" ? (
        <>
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
        </>
        ) : null}
        {tab === "Advanced" ? (
        <>
        <div className="mb-3 flex flex-wrap gap-3 text-[13px]">
          <label>Routing Overflow <select className={inputCls} defaultValue="Office default"><option>Office default</option><option>Hold</option></select></label>
          <label>Sink or Swim <select className={inputCls} defaultValue="Off"><option>Off</option><option>On</option></select></label>
          <label className="flex items-center gap-1"><input type="checkbox" /> Normalized Sources</label>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[980px] text-left text-[12px]">
            <thead><tr>{["AGENT", "STATUS", "REASSIGN", "AUTO-REASSIGN", "WEIGHT", "LEAD CAP", "MIN", "MAX", "INCLUDED", "EXCLUDED"].map((column) => <th key={column} className="border-b px-2 py-2 whitespace-nowrap">{column}</th>)}</tr></thead>
            <tbody>
              {roster.map((user) => {
                const row = weights[user.id] || { weight: "17", min: "0", max: "999999999", status: "Yes", reassign: "No", auto: "No", include: "", exclude: "" };
                const setRow = (key: "weight" | "min" | "max" | "status" | "reassign" | "auto" | "include" | "exclude", value: string) => setWeights((current) => ({ ...current, [user.id]: { ...row, [key]: value } }));
                const pill = (key: "status" | "reassign" | "auto", fallback: string) => {
                  const on = (row[key] || fallback) === "Yes";
                  return (
                    <button type="button" className={`h-6 rounded-full px-2 text-[11px] font-semibold text-white ${on ? "bg-[#2e9e5b]" : "bg-[#b0b0b0]"}`} onClick={() => setRow(key, on ? "No" : "Yes")}>{on ? "Yes" : "No"}</button>
                  );
                };
                return (
                  <tr key={user.id} className="border-b border-[#f3f3f3]">
                    <td className="px-2 py-2 whitespace-nowrap">{user.name}</td>
                    <td>{pill("status", "Yes")}</td>
                    <td>{pill("reassign", "No")}</td>
                    <td>{pill("auto", "No")}</td>
                    <td><input className={inputCls} value={row.weight} onChange={(event) => setRow("weight", event.target.value)} /></td>
                    <td><input className={inputCls} defaultValue="0" /></td>
                    <td><input className={inputCls} value={row.min} onChange={(event) => setRow("min", event.target.value)} /></td>
                    <td><input className={inputCls} value={row.max} onChange={(event) => setRow("max", event.target.value)} /></td>
                    <td>
                      <select className={inputCls} value={row.include || ""} onChange={(event) => setRow("include", event.target.value)}>
                        <option value="">Included sources</option>
                        <option>Website</option><option>Phone</option><option>Partner</option><option>Open house</option>
                      </select>
                    </td>
                    <td>
                      <select className={inputCls} value={row.exclude || ""} onChange={(event) => setRow("exclude", event.target.value)}>
                        <option value="">Excluded sources</option>
                        <option>Website</option><option>Phone</option><option>Partner</option><option>Open house</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <label className="mt-3 flex items-start gap-2">
          <input type="radio" name="routing" checked={mode === "source"} onChange={() => setMode("source")} />
          <span>Route by lead source. Website, phone, and partner leads can go to different agents.</span>
        </label>
        {mode === "source" ? (
          <div className="ml-6 space-y-1">
            {["Website", "Phone", "Partner", "Open house"].map((source) => (
              <label key={source} className="flex items-center gap-2">
                <span className="w-28">{source}</span>
                <select className="h-8 border border-[#ccc] bg-white px-2" value={sources[source] || ""} onChange={(event) => setSources((current) => ({ ...current, [source]: event.target.value }))}>
                  <option value="">Office default</option>
                  {eligible.map((user) => <option key={`${source}-${user.id}`} value={user.id}>{user.name}</option>)}
                </select>
              </label>
            ))}
          </div>
        ) : null}
        </>
        ) : null}
        {tab === "Basic" ? (
        <>
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
        </>
        ) : null}
      </div> : null}
      {message ? <p className="mt-3 text-[13px] text-[#1c93b5]">{message}</p> : null}
      {tab !== "Routing Overview" ? (
        <div className="mt-3 flex items-center gap-3">
          <Btn kind="teal" onClick={() => void save()}>Update</Btn>
          {!loaded ? <p className="text-[12px] text-[#888]">Loading the current rule…</p> : null}
        </div>
      ) : null}
    </section>
  );
}
