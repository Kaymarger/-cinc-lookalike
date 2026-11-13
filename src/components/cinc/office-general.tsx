"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AUTO_LABELS, CLOCK_HOURS, REASSIGN_DAYS, REASSIGN_HOURS, REASSIGN_MINUTES } from "@/lib/cinc-lists";
import { EMPTY_SETTINGS, type OfficeSettings } from "@/lib/office-settings";
import { useChrome } from "./chrome-context";
import { Btn, Field, inputCls } from "./ui";

const TABS: [string, keyof OfficeSettings][] = [
  ["Show Home tab", "showHome"],
  ["Search tab", "showSearch"],
  ["Map Search tab", "showMap"],
  ["Featured tab", "showFeatured"],
  ["About tab", "showAbout"],
  ["Contact tab", "showContact"],
  ["Blog tab", "showBlog"],
  ["Seller tab", "showSeller"],
  ["Home Value tab", "showHomeValue"],
  ["Logo in header", "logoHeader"],
  ["Logo in footer", "logoFooter"],
  ["Co-brand", "cobrand"],
];

export function OfficeGeneralSettings() {
  const chrome = useChrome();
  const [form, setForm] = useState<OfficeSettings>(EMPTY_SETTINGS);
  const [ready, setReady] = useState(false);
  const [seo, setSeo] = useState(false);
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
    chrome.toast(response.ok ? "Settings updated." : data?.message || "Could not save settings.");
  }
  if (!ready) return <p className="p-4 text-[13px] text-[#666]">Loading office settings…</p>;
  const amounts = form.reassignUnit === "minute(s)" ? REASSIGN_MINUTES : form.reassignUnit === "day(s)" ? REASSIGN_DAYS : REASSIGN_HOURS;
  return (
        <div className="space-y-4 pt-2">
      <Box title="Seller">
        <Field label="Auto-Apply Label">
          <select className={inputCls} value={form.sellerLabel} onChange={(event) => set("sellerLabel", event.target.value)}>{AUTO_LABELS.map((item) => <option key={item}>{item}</option>)}</select>
        </Field>
        <Field label="Auto-Saved Searches">
          <select className={inputCls} value={form.sellerSearches} onChange={(event) => set("sellerSearches", event.target.value as OfficeSettings["sellerSearches"])}><option>Enabled</option><option>Disabled</option></select>
        </Field>
        <Save onClick={() => void save()} />
      </Box>
      <Box title="CRM Connect">
        <Field label="Auto-Apply Label">
          <select className={inputCls} value={form.crmLabel} onChange={(event) => set("crmLabel", event.target.value)}>{AUTO_LABELS.map((item) => <option key={item}>{item}</option>)}</select>
        </Field>
        <Field label="Welcome Email">
          <select className={inputCls} value={form.crmWelcome} onChange={(event) => set("crmWelcome", event.target.value as OfficeSettings["crmWelcome"])}><option>Enabled</option><option>Disabled</option></select>
        </Field>
        <Save onClick={() => void save()} />
      </Box>
      <Box title="Website" onUpdate={() => void save()}>
        <label className="mb-3 grid grid-cols-[180px_1fr] items-center gap-3">
          <span className="text-right">Home Banner Text</span>
          <input className={inputCls} value={form.homeBanner} onChange={(event) => set("homeBanner", event.target.value)} />
        </label>
        <div className="mb-3 grid grid-cols-[180px_1fr] gap-3">
          <span className="pt-2 text-right">Cover image</span>
          <div>
            <div className="mb-2 flex h-[140px] items-center justify-center rounded border border-[#ddd] bg-[#f3f3f3] text-[#888]">Cover preview · 1200×600</div>
            <div className="flex gap-2">
              <button type="button" className="h-[30px] rounded border border-[#329bb9] px-3 text-[#329bb9]" onClick={() => chrome.toast("Cover image is stored with the site files once a file is chosen.")}>Edit Image</button>
              <button type="button" className="h-[30px] rounded border border-[#ccc] px-3" onClick={() => chrome.toast("Cover image removed.")}>Remove Image</button>
            </div>
          </div>
          <span className="pt-2 text-right">Video</span>
          <button type="button" className="flex h-36 items-center justify-center rounded border border-dashed border-[#bbb] bg-[#fafafa] text-[#666]" onClick={() => chrome.toast("Home cover video can be linked from the site host. Nothing was uploaded.")}>Wide video region</button>
          <span className="pt-1 text-right">Visibility</span>
          <div className="flex flex-col gap-2">
            {TABS.map(([label, key]) => (
              <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form[key])} onChange={(event) => set(key, event.target.checked as never)} /> {label}</label>
            ))}
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.softenCover} onChange={(event) => set("softenCover", event.target.checked)} /> Apply softening effect to home cover image</label>
          </div>
        </div>
        <Field label="HomeValueTagLine"><input className={inputCls} value={form.homeValueTagLine} onChange={(event) => set("homeValueTagLine", event.target.value)} /></Field>
        <Field label="HomeSearch_URL"><input className={inputCls} value={form.homeSearchUrl} onChange={(event) => set("homeSearchUrl", event.target.value)} /></Field>
      </Box>
      <Box title="Social Media" onUpdate={() => void save()}>
        {([
          ["Facebook Page", "facebook"],
          ["Google+ Page", "googlePage"],
          ["Pinterest Page", "pinterest"],
          ["Twitter Profile", "twitter"],
          ["Instagram Profile", "instagram"],
          ["Youtube Profile", "youtube"],
          ["LinkedIn Profile", "linkedin"],
          ["Google Place", "googlePlace"],
        ] as const).map(([label, key]) => (
          <Field key={key} label={label}><input className={inputCls} value={form[key]} onChange={(event) => set(key, event.target.value)} /></Field>
        ))}
      </Box>
      <Box title="Property Alerts" onUpdate={() => void save()}>
        <Field label="Custom Body Text"><textarea className="h-20 w-full border border-[#ccc] p-2" value={form.propertyAlertBody} onChange={(event) => set("propertyAlertBody", event.target.value)} /></Field>
        <Save onClick={() => void save()} />
      </Box>
      <Box title="Mailer Campaigns">
        <label className="mb-2 block"><input type="checkbox" checked={form.mailerCampaigns} onChange={(event) => set("mailerCampaigns", event.target.checked)} /> Enable mailer campaigns - Corefact</label>
        <Save onClick={() => void save()} />
      </Box>
      <Box title="Routing Settings">
        <Field label="Auto-Reassign Leads">
          <select className={inputCls} value={form.reassignEnabled} onChange={(event) => set("reassignEnabled", event.target.value as OfficeSettings["reassignEnabled"])}><option>Enabled</option><option>Disabled</option></select>
        </Field>
        <div className="mb-2 flex gap-2">
          <select className={inputCls} value={form.reassignAmount} onChange={(event) => set("reassignAmount", event.target.value)}>{amounts.map((item) => <option key={item}>{item}</option>)}</select>
          <select className={inputCls} value={form.reassignUnit} onChange={(event) => set("reassignUnit", event.target.value as OfficeSettings["reassignUnit"])}><option>minute(s)</option><option>hour(s)</option><option>day(s)</option></select>
        </div>
        <Field label="Auto-Reassign Timeframe start">
          <select className={inputCls} value={form.reassignFrom} onChange={(event) => set("reassignFrom", event.target.value)}>{CLOCK_HOURS.map((item) => <option key={item}>{item}</option>)}</select>
        </Field>
        <Field label="To">
          <select className={inputCls} value={form.reassignTo} onChange={(event) => set("reassignTo", event.target.value)}>{CLOCK_HOURS.filter((item) => item !== "12:00 AM (Midnight)").map((item) => <option key={item}>{item}</option>)}</select>
        </Field>
        <Save onClick={() => void save()} />
      </Box>
      <Box title="AI & SEO">
        <button type="button" className="bg-[#1c93b5] px-3 py-1 text-[12px] text-white" onClick={() => setSeo((value) => !value)}>Open AI & SEO Settings</button>
        {seo ? (
          <textarea className="mt-2 h-20 w-full border border-[#ccc] p-2" placeholder="AI and SEO notes" value={form.aiSeoNotes} onChange={(event) => set("aiSeoNotes", event.target.value)} />
        ) : null}
        <Save onClick={() => void save()} />
      </Box>
    </div>
  );
}

function Box({ title, onUpdate, children }: { title: string; onUpdate?: () => void; children: ReactNode }) {
  return (
    <section className="rounded border border-[#e5e5e5] border-t-4 border-t-[#c8c8c8] bg-white text-[14px] shadow-sm">
      <header className="flex items-center justify-between border-b border-[#eee] px-4 py-3">
        <h2 className="text-[18px] font-light text-[#329bb9]">{title}</h2>
        {onUpdate ? <Btn kind="blue" onClick={onUpdate}>Update</Btn> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
function Save({ onClick }: { onClick: () => void }) {
  return <div className="text-right"><Btn kind="blue" onClick={onClick}>Update</Btn></div>;
}
