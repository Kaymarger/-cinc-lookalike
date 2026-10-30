"use client";

import { useEffect, useState } from "react";
import { LABEL_GROUPS } from "@/lib/cinc-options";
import type { OfficeSettings } from "@/lib/office-settings";
import { useChrome } from "./chrome-context";
import { inputCls, ModalFrame } from "./ui";

type LabelRow = { category: string; name: string };

function fallback(): LabelRow[] {
  return LABEL_GROUPS.flatMap((group) => group.labels.map((name) => ({ category: group.name, name })));
}

export function LabelManager({ onClose, onChange }: { onClose: () => void; onChange: (rows: LabelRow[]) => void }) {
  const chrome = useChrome();
  const [settings, setSettings] = useState<OfficeSettings | null>(null);
  const [rows, setRows] = useState<LabelRow[]>(fallback());
  const [group, setGroup] = useState(rows[0]?.category ?? "Miscellaneous");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  useEffect(() => {
    void fetch("/api/office/settings", { cache: "no-store" }).then(async (response) => {
      const data = (await response.json().catch(() => null)) as { settings?: OfficeSettings } | null;
      const stored = data?.settings?.labelCatalog ?? [];
      setSettings(data?.settings ?? null);
      if (stored.length) {
        setRows(stored);
        setGroup(stored[0].category);
      }
    });
  }, []);
  async function persist(next: LabelRow[], message: string) {
    if (!settings) { chrome.toast("Settings are still loading."); return; }
    const response = await fetch("/api/office/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, labelCatalog: next }),
    });
    if (!response.ok) { chrome.toast("Could not save labels."); return; }
    setRows(next);
    setSettings({ ...settings, labelCatalog: next });
    onChange(next);
    chrome.toast(message);
  }
  const groups = [...new Set(rows.map((row) => row.category))];
  const visible = rows.filter((row) => row.category === group && row.name.toLowerCase().includes(query.toLowerCase()));
  const targets = groups.filter((item) => item !== group);
  return (
    <ModalFrame title="Manage Labels" onClose={onClose} wide>
      <div className="grid grid-cols-[200px_1fr] gap-3 text-[13px]">
        <div>
          <p className="font-bold">Groups</p>
          {groups.map((item) => (
            <div key={item} className={`mt-1 flex items-center gap-1 px-2 py-1 ${group === item ? "bg-[#1c93b5] text-white" : ""}`}>
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => { setGroup(item); setPicked([]); }}>{item}</button>
              {group === item ? (
                <>
                  <button type="button" title="Rename group" onClick={() => { const name = window.prompt("Group name", item); if (!name || name === item) return; void persist(rows.map((row) => row.category === item ? { ...row, category: name } : row), "Group renamed."); setGroup(name); }}>✎</button>
                  <button type="button" title="Delete group" onClick={() => void persist(rows.filter((row) => row.category !== item), "Group deleted.")}>🗑</button>
                </>
              ) : null}
            </div>
          ))}
        </div>
        <div>
          <div className="mb-2 flex gap-2">
            <input className={inputCls} placeholder="Search labels" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className={inputCls} disabled={!picked.length} defaultValue="" onChange={(event) => {
              const target = event.target.value;
              if (!target) return;
              void persist(rows.map((row) => row.category === group && picked.includes(row.name) ? { ...row, category: target } : row), "Labels moved.");
              setPicked([]);
              event.target.value = "";
            }}>
              <option value="">Move selected ▾</option>
              {targets.map((item) => <option key={item}>{item}</option>)}
            </select>
            <button type="button" className="shrink-0 bg-[#1c93b5] px-2 py-1 text-white" onClick={() => {
              const name = window.prompt("New label name");
              if (!name?.trim()) return;
              void persist([...rows, { category: group, name: name.trim() }], "Label created.");
            }}>+ New</button>
          </div>
          <div className="grid max-h-64 grid-cols-3 gap-2 overflow-auto">
            {visible.map((row) => (
              <button key={row.name} type="button" className={`border px-2 py-2 text-left text-[12px] ${picked.includes(row.name) ? "border-[#1c93b5] bg-[#e7f4f8]" : "border-[#eee]"}`} onClick={() => setPicked((current) => current.includes(row.name) ? current.filter((item) => item !== row.name) : [...current, row.name])}>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#1c93b5]" />{row.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalFrame>
  );
}

export function useLabelCatalog() {
  const [rows, setRows] = useState<LabelRow[]>(fallback());
  useEffect(() => {
    void fetch("/api/office/settings", { cache: "no-store" }).then(async (response) => {
      const data = (await response.json().catch(() => null)) as { settings?: { labelCatalog?: LabelRow[] } } | null;
      if (data?.settings?.labelCatalog?.length) setRows(data.settings.labelCatalog);
    });
  }, []);
  return { rows, setRows };
}
