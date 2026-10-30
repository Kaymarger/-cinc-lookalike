"use client";

import { useEffect, useState } from "react";
import { LABEL_GROUPS } from "@/lib/cinc-options";
import type { OfficeSettings } from "@/lib/office-settings";
import { useChrome } from "./chrome-context";
import { Btn, inputCls, ModalFrame } from "./ui";

type LabelRow = { category: string; name: string };

function fallback(): LabelRow[] {
  return LABEL_GROUPS.flatMap((group) => group.labels.map((name) => ({ category: group.name, name })));
}

export function LabelManager({ onClose, onChange }: { onClose: () => void; onChange: (rows: LabelRow[]) => void }) {
  const chrome = useChrome();
  const [settings, setSettings] = useState<OfficeSettings | null>(null);
  const [rows, setRows] = useState<LabelRow[]>([]);
  const [category, setCategory] = useState("Custom");
  const [name, setName] = useState("");
  useEffect(() => {
    void fetch("/api/office/settings", { cache: "no-store" }).then(async (response) => {
      const data = (await response.json().catch(() => null)) as { settings?: OfficeSettings } | null;
      const stored = data?.settings?.labelCatalog ?? [];
      setSettings(data?.settings ?? null);
      setRows(stored.length ? stored : fallback());
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
  const categories = [...new Set(rows.map((row) => row.category))];
  return (
    <ModalFrame title="Manage Labels" onClose={onClose} wide>
      <form className="mb-3 flex flex-wrap gap-2 text-[13px]" onSubmit={(event) => {
        event.preventDefault();
        const label = name.trim();
        if (!label) return;
        void persist([...rows, { category: category.trim() || "Custom", name: label }], "Label created.");
        setName("");
      }}>
        <input className={inputCls} placeholder="Category" value={category} onChange={(event) => setCategory(event.target.value)} />
        <input className={inputCls} placeholder="Label name" value={name} onChange={(event) => setName(event.target.value)} />
        <Btn kind="teal" type="submit">Create</Btn>
      </form>
      <div className="max-h-72 overflow-auto text-[13px]">
        {rows.map((row, index) => (
          <div key={`${row.category}-${row.name}-${index}`} className="mb-1 flex items-center gap-2">
            <input className={inputCls} value={row.category} onChange={(event) => setRows((current) => current.map((item, i) => i === index ? { ...item, category: event.target.value } : item))} />
            <input className={inputCls} value={row.name} onChange={(event) => setRows((current) => current.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} />
            <button type="button" className="text-[#1c93b5]" onClick={() => void persist(rows.map((item, i) => i === index ? row : item), "Label renamed.")}>Save</button>
            <button type="button" className="text-[#d9363e]" onClick={() => void persist(rows.filter((_, i) => i !== index), "Label deleted.")}>Delete</button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-[#888]">Categories: {categories.join(", ") || "None"}</p>
      <div className="mt-3 text-right"><Btn onClick={onClose}>Close</Btn></div>
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
