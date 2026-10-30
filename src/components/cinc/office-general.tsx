"use client";

import { useEffect, useState } from "react";
import { EMPTY_SETTINGS, type OfficeSettings } from "@/lib/office-settings";
import { PLACEHOLDER_LEAD_SOURCES } from "@/lib/placeholders";
import { useChrome } from "./chrome-context";
import { Btn, Field, inputCls } from "./ui";

export function OfficeGeneralSettings() {
  const chrome = useChrome();
  const [form, setForm] = useState<OfficeSettings>(EMPTY_SETTINGS);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void fetch("/api/office/settings", { cache: "no-store" }).then(async (response) => {
      const data = (await response.json().catch(() => null)) as { settings?: OfficeSettings } | null;
      if (data?.settings) setForm(data.settings);
      setReady(true);
    });
  }, []);
  function set<K extends keyof OfficeSettings>(key: K, value: OfficeSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  async function save() {
    const response = await fetch("/api/office/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    chrome.toast(response.ok ? "General settings saved." : data?.message || "Could not save settings.");
  }
  if (!ready) return <p className="p-4 text-[13px] text-[#666]">Loading office settings…</p>;
  return (
    <div className="space-y-4">
      <section className="border border-[#ddd] bg-white p-4 text-[13px]">
        <h2 className="mb-2 text-[16px] font-bold">Seller</h2>
        <label className="mb-2 block"><input type="checkbox" checked={form.sellerEnabled} onChange={(event) => set("sellerEnabled", event.target.checked)} /> Accept seller leads</label>
        <Field label="Seller label"><input className={inputCls} value={form.sellerLabel} onChange={(event) => set("sellerLabel", event.target.value)} /></Field>
        <div className="text-right"><Btn kind="blue" onClick={() => void save()}>Update</Btn></div>
      </section>
      <section className="border border-[#ddd] bg-white p-4 text-[13px]">
        <h2 className="mb-2 text-[16px] font-bold">CRM Connect</h2>
        <label className="mb-2 block"><input type="checkbox" checked={form.crmConnectEnabled} onChange={(event) => set("crmConnectEnabled", event.target.checked)} /> CRM Connect enabled</label>
        <Field label="Webhook URL"><input className={inputCls} placeholder="https://" value={form.crmConnectUrl} onChange={(event) => set("crmConnectUrl", event.target.value)} /></Field>
        <div className="text-right"><Btn kind="blue" onClick={() => void save()}>Update</Btn></div>
      </section>
      <section className="border border-[#ddd] bg-white p-4 text-[13px]">
        <h2 className="mb-2 text-[16px] font-bold">Website</h2>
        <Field label="Site name"><input className={inputCls} value={form.websiteName} onChange={(event) => set("websiteName", event.target.value)} /></Field>
        <label className="mb-2 block"><input type="checkbox" checked={form.websiteIdx} onChange={(event) => set("websiteIdx", event.target.checked)} /> IDX search on</label>
        <div className="text-right"><Btn kind="blue" onClick={() => void save()}>Update</Btn></div>
      </section>
      <section className="border border-[#ddd] bg-white p-4 text-[13px]">
        <h2 className="mb-2 text-[16px] font-bold">Auto-Apply Label</h2>
        <label className="mb-2 block"><input type="checkbox" checked={form.autoLabelEnabled} onChange={(event) => set("autoLabelEnabled", event.target.checked)} /> Apply a label to new leads</label>
        <Field label="Label"><input className={inputCls} value={form.autoLabel} onChange={(event) => set("autoLabel", event.target.value)} /></Field>
        <h2 className="mb-2 text-[16px] font-bold">Auto-Saved Searches</h2>
        <label className="mb-2 block"><input type="checkbox" checked={form.autoSearchEnabled} onChange={(event) => set("autoSearchEnabled", event.target.checked)} /> Create a saved search for new leads</label>
        <Field label="Frequency"><input className={inputCls} value={form.autoSearchFrequency} onChange={(event) => set("autoSearchFrequency", event.target.value)} /></Field>
        <h2 className="mb-2 text-[16px] font-bold">Welcome Email</h2>
        <label className="mb-2 block"><input type="checkbox" checked={form.welcomeEnabled} onChange={(event) => set("welcomeEnabled", event.target.checked)} /> Send a welcome email</label>
        <Field label="Subject"><input className={inputCls} value={form.welcomeSubject} onChange={(event) => set("welcomeSubject", event.target.value)} /></Field>
        <textarea className="mb-2 h-20 w-full border border-[#ccc] p-2" value={form.welcomeBody} onChange={(event) => set("welcomeBody", event.target.value)} />
        <p className="mb-2 text-[12px] text-[#888]">Lead source placeholders: {PLACEHOLDER_LEAD_SOURCES.join(", ")}</p>
        <div className="text-right"><Btn kind="blue" onClick={() => void save()}>Update</Btn></div>
      </section>
    </div>
  );
}
