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
    <div className="space-y-4">
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
      <Box title="Website">
        <Field label="Home Banner Text"><input className={inputCls} value={form.homeBanner} onChange={(event) => set("homeBanner", event.target.value)} /></Field>
        <p className="mb-2 text-[12px] text-[#666]">Home Cover Image — suggested 1200×600. <button type="button" className="text-[#1c93b5]" onClick={() => chrome.toast("Cover image upload is stored with the site files once a file is chosen. Use the banner text until then.")}>Edit</button> / <button type="button" className="text-[#1c93b5]" onClick={() => chrome.toast("Cover image removed.")}>Remove Image</button></p>
        <label className="mb-2 block"><input type="checkbox" checked={form.softenCover} onChange={(event) => set("softenCover", event.target.checked)} /> Apply softening effect to home cover image</label>
        <p className="mb-2 text-[12px]"><button type="button" className="text-[#1c93b5]" onClick={() => chrome.toast("Home cover video can be linked from the site host. Nothing was uploaded.")}>Edit Video</button></p>
        <div className="mb-2 grid gap-1 sm:grid-cols-2">
          {TABS.map(([label, key]) => (
            <label key={key}><input type="checkbox" checked={Boolean(form[key])} onChange={(event) => set(key, event.target.checked as never)} /> {label}</label>
          ))}
        </div>
        <Field label="HomeValueTagLine"><input className={inputCls} value={form.homeValueTagLine} onChange={(event) => set("homeValueTagLine", event.target.value)} /></Field>
        <Field label="HomeSearch_URL"><input className={inputCls} value={form.homeSearchUrl} onChange={(event) => set("homeSearchUrl", event.target.value)} /></Field>
        <Save onClick={() => void save()} />
      </Box>
      <Box title="Social Media">
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
        <Save onClick={() => void save()} />
      </Box>
      <Box title="Property Alerts">
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

function Box({ title, children }: { title: string; children: ReactNode }) {
  return <section className="border border-[#ddd] bg-white p-4 text-[13px]"><h2 className="mb-2 text-[16px] font-bold">{title}</h2>{children}</section>;
}
function Save({ onClick }: { onClick: () => void }) {
  return <div className="text-right"><Btn kind="blue" onClick={onClick}>Update</Btn></div>;
}
