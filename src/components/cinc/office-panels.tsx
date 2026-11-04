"use client";

import { useEffect, useState } from "react";
import { loadOfficePrefs, saveOfficePrefs } from "./office-prefs";
import { Btn, inputCls } from "./ui";

const LAYOUTS = ["Default", "Lucid", "Spring", "Circles", "Split", "Photo"] as const;

export function ThemeLayoutPicker() {
  const [layout, setLayout] = useState<(typeof LAYOUTS)[number]>("Default");
  const [note, setNote] = useState("");
  useEffect(() => {
    void loadOfficePrefs().then((prefs) => {
      const saved = String(prefs.themeLayout || "Default");
      if (LAYOUTS.includes(saved as (typeof LAYOUTS)[number])) setLayout(saved as (typeof LAYOUTS)[number]);
    });
  }, []);
  return (
    <div className="border border-[#ddd] bg-white p-4">
      <h1 className="text-[18px] font-semibold">Choose Your Layout</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {LAYOUTS.map((name) => (
          <button
            key={name}
            type="button"
            className={`border p-4 text-left ${layout === name ? "border-[#1c93b5] bg-[#f3fafc]" : "border-[#ddd] bg-white"}`}
            onClick={() => setLayout(name)}
          >
            <span className="block text-[15px] font-semibold">{name}</span>
            <span className="mt-1 block text-[12px] text-[#666]">{layout === name ? "Selected" : "Select"}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 text-right">
        <Btn kind="blue" onClick={() => { void saveOfficePrefs({ themeLayout: layout }).then((error) => setNote(error || "Layout saved.")); }}>Update</Btn>
      </div>
      {note ? <p className="mt-2 text-[13px] text-[#1c93b5]">{note}</p> : null}
    </div>
  );
}

type SearchDefaults = {
  keyword: string;
  city: string;
  postal: string;
  beds: string;
  baths: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  layout: string;
  sortOverride: string;
};

const SEARCH_DEFAULTS: SearchDefaults = {
  keyword: "",
  city: "Vancouver",
  postal: "",
  beds: "Any",
  baths: "Any",
  minPrice: "",
  maxPrice: "",
  sortBy: "Newest",
  layout: "List",
  sortOverride: "None",
};

export function SearchSettingsPanel() {
  const [form, setForm] = useState<SearchDefaults>(SEARCH_DEFAULTS);
  const [note, setNote] = useState("");
  useEffect(() => {
    void loadOfficePrefs().then((prefs) => {
      const saved = prefs.searchSettings;
      if (saved && typeof saved === "object") setForm({ ...SEARCH_DEFAULTS, ...(saved as SearchDefaults) });
    });
  }, []);
  const set = (key: keyof SearchDefaults, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const origin = typeof window === "undefined" ? "https://vancouverpropertysearch.ca" : window.location.origin;
  return (
    <div className="space-y-4">
      <h1 className="text-[18px] font-semibold">Search Settings</h1>
      <section className="border border-[#ddd] bg-white p-4 text-[13px]">
        <h2 className="mb-2 font-bold">Search Widget</h2>
        <textarea readOnly className="h-20 w-full border border-[#ccc] p-2 font-mono text-[12px]" value={`<iframe src="${origin}/search" title="Search homes" style="width:100%;height:640px;border:0"></iframe>`} />
      </section>
      <section className="border border-[#ddd] bg-white p-4 text-[13px]">
        <h2 className="mb-2 font-bold">Home Value Widget</h2>
        <textarea readOnly className="h-20 w-full border border-[#ccc] p-2 font-mono text-[12px]" value={`<iframe src="${origin}/seller/homeestimate/homevaluation" title="Home value" style="width:100%;height:720px;border:0"></iframe>`} />
      </section>
      <section className="border border-[#ddd] bg-white p-4 text-[13px]">
        <h2 className="mb-3 font-bold">Default Settings</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {([
            ["Keyword", "keyword"],
            ["City", "city"],
            ["Postal Code", "postal"],
            ["Beds", "beds"],
            ["Baths", "baths"],
            ["Min Price", "minPrice"],
            ["Max Price", "maxPrice"],
          ] as const).map(([label, key]) => (
            <label key={key}>{label}<input className={inputCls} value={form[key]} onChange={(event) => set(key, event.target.value)} /></label>
          ))}
          <label>Sort By
            <select className={inputCls} value={form.sortBy} onChange={(event) => set("sortBy", event.target.value)}>
              {["Newest", "Price", "Beds"].map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </section>
      <section className="border border-[#ddd] bg-white p-4 text-[13px]">
        <h2 className="mb-3 font-bold">Quick Search Settings</h2>
        <label className="mb-2 block">Default Layout
          <select className={inputCls} value={form.layout} onChange={(event) => set("layout", event.target.value)}>
            <option>List</option>
            <option>Grid</option>
          </select>
        </label>
        <label className="block">Sort Order Override
          <select className={inputCls} value={form.sortOverride} onChange={(event) => set("sortOverride", event.target.value)}>
            <option>None</option>
            <option>Newest</option>
            <option>Price</option>
          </select>
        </label>
      </section>
      <div className="text-right"><Btn kind="blue" onClick={() => { void saveOfficePrefs({ searchSettings: form }).then((error) => setNote(error || "Search settings saved.")); }}>Update</Btn></div>
      {note ? <p className="text-[13px] text-[#1c93b5]">{note}</p> : null}
    </div>
  );
}

export function DialerSettingsPanel() {
  const [status, setStatus] = useState("Checking the dialer account…");
  const [number, setNumber] = useState("");
  const [agent, setAgent] = useState("Kayla Gerak");
  const [summary, setSummary] = useState(true);
  const [note, setNote] = useState("");
  useEffect(() => {
    void fetch("/api/office/send", { cache: "no-store" }).then(async (response) => {
      const data = (await response.json().catch(() => null)) as { channels?: { voice?: boolean; sms?: boolean }; fromNumber?: string | null } | null;
      const line = data?.fromNumber || "";
      setNumber(line);
      setStatus(data?.channels?.voice || data?.channels?.sms ? `Connected. Calls and texts use ${line || "the office line"}.` : "The dialer account is not connected.");
    }).catch(() => setStatus("The dialer account is not connected."));
    void loadOfficePrefs().then((prefs) => {
      const saved = prefs.dialerSettings as { agent?: string; summary?: boolean } | undefined;
      if (saved?.agent) setAgent(saved.agent);
      if (typeof saved?.summary === "boolean") setSummary(saved.summary);
    });
  }, []);
  return (
    <div className="border border-[#ddd] bg-white p-4 text-[13px]">
      <h1 className="mb-3 text-[18px] font-semibold">Dialer Settings</h1>
      <h2 className="font-bold">Dialer Account Settings</h2>
      <p className="mt-2">{status}</p>
      <h2 className="mt-4 font-bold">Phone number assignment</h2>
      <p className="mt-1">Twilio number: {number || "not connected"}</p>
      <label className="mt-2 block">Assign this number to
        <select className={`${inputCls} mt-1 max-w-sm`} value={agent} onChange={(event) => setAgent(event.target.value)}>
          {["Kayla Gerak", "Casey Archibald", "Anastasiia Borovyk", "Kevin Barrett"].map((name) => <option key={name}>{name}</option>)}
        </select>
      </label>
      <label className="mt-3 block"><input type="checkbox" checked={summary} onChange={(event) => setSummary(event.target.checked)} /> Email the daily call summary</label>
      <div className="mt-3 text-right"><Btn kind="blue" onClick={() => { void saveOfficePrefs({ dialerSettings: { agent, summary, number } }).then((error) => setNote(error || "Dialer settings saved.")); }}>Update</Btn></div>
      {note ? <p className="mt-2 text-[#1c93b5]">{note}</p> : null}
    </div>
  );
}

type FieldDef = { id: string; name: string; type: string };

export function CustomFieldsPanel() {
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("Text");
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState("");
  useEffect(() => {
    void loadOfficePrefs().then((prefs) => {
      if (Array.isArray(prefs.customFieldDefs)) setFields(prefs.customFieldDefs as FieldDef[]);
    });
  }, []);
  function persist(next: FieldDef[], message: string) {
    setFields(next);
    void saveOfficePrefs({ customFieldDefs: next }).then((error) => setNote(error || message));
  }
  return (
    <div className="border border-[#ddd] bg-white p-4 text-[13px]">
      <h1 className="text-[18px] font-semibold">Custom Fields</h1>
      <p className="mt-2 max-w-2xl text-[#444]">Manage custom fields that are not available by default. Fields you add here show on a lead&apos;s Info tab.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input className={`${inputCls} max-w-xs`} placeholder="Field name" value={name} onChange={(event) => setName(event.target.value)} />
        <select className={`${inputCls} max-w-[140px]`} value={type} onChange={(event) => setType(event.target.value)}>
          <option>Text</option>
          <option>Number</option>
          <option>Date</option>
        </select>
        <Btn kind="teal" onClick={() => {
          const label = name.trim();
          if (!label) return;
          if (editing) {
            persist(fields.map((field) => field.id === editing ? { ...field, name: label, type } : field), "Custom field updated.");
            setEditing(null);
          } else {
            persist([...fields, { id: `cf-${Date.now()}`, name: label, type }], "Custom field created.");
          }
          setName("");
          setType("Text");
        }}>{editing ? "Save field" : "Create field"}</Btn>
      </div>
      <ul className="mt-4">
        {fields.map((field) => (
          <li key={field.id} className="flex items-center justify-between border-t border-[#eee] py-2">
            <span>{field.name} <span className="text-[#888]">({field.type})</span></span>
            <span className="flex gap-3">
              <button type="button" className="text-[#1c93b5]" onClick={() => { setEditing(field.id); setName(field.name); setType(field.type); }}>Edit</button>
              <button type="button" className="text-[#d9363e]" onClick={() => persist(fields.filter((item) => item.id !== field.id), "Custom field deleted.")}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
      {!fields.length ? <p className="mt-3 text-[#888]">No custom fields yet.</p> : null}
      {note ? <p className="mt-2 text-[#1c93b5]">{note}</p> : null}
    </div>
  );
}

export function BillingPlaceholder() {
  return (
    <div className="border border-[#ddd] bg-white p-6">
      <h1 className="text-[18px] font-semibold">Billing & Invoices</h1>
      <p className="mt-3 text-[13px] text-[#555]">Invoices for this office will show here. There are no invoices to display yet.</p>
    </div>
  );
}

const PAGE_COPY: Record<string, { title: string; headline: string; body: string }> = {
  home: {
    title: "Home",
    headline: "Greater Vancouver Area Home Search",
    body: "Search Greater Vancouver homes, save searches, and ask the office a question from the home page.",
  },
  about: {
    title: "About",
    headline: "About Archibald Real Estate Group",
    body: "Archibald Real Estate Group helps people buy and sell homes across Greater Vancouver.",
  },
  branded: {
    title: "Branded Site",
    headline: "Branded Site",
    body: "The branded site uses the office name, phone, and logo on every public page.",
  },
  "branded-about": {
    title: "Branded About",
    headline: "Branded About",
    body: "The branded about page introduces the agents and the office.",
  },
  custom: {
    title: "Add Custom Page",
    headline: "Custom page",
    body: "Add a page that is not one of the standard home or about pages.",
  },
};

export function PageEditor({ page }: { page: string }) {
  const copy = PAGE_COPY[page] ?? PAGE_COPY.home;
  const [headline, setHeadline] = useState(copy.headline);
  const [body, setBody] = useState(copy.body);
  const [note, setNote] = useState("");
  useEffect(() => {
    const fallback = PAGE_COPY[page] ?? PAGE_COPY.home;
    setHeadline(fallback.headline);
    setBody(fallback.body);
    void loadOfficePrefs().then((prefs) => {
      const pages = prefs.pages as Record<string, { headline?: string; body?: string }> | undefined;
      const saved = pages?.[page];
      if (saved?.headline) setHeadline(saved.headline);
      if (saved?.body) setBody(saved.body);
    });
  }, [page]);
  return (
    <div className="p-4">
      <h1 className="text-[18px] font-semibold">Page Editor · {copy.title}</h1>
      <p className="mt-2 text-[13px] text-[#555]">This page is {copy.title}. Its headline and body are separate from the other editor pages.</p>
      <label className="mt-4 block text-[13px]">Headline
        <input className="mt-1 h-8 w-full max-w-lg border border-[#ccc] px-2" value={headline} onChange={(event) => setHeadline(event.target.value)} />
      </label>
      <label className="mt-3 block text-[13px]">Body
        <textarea className="mt-1 h-28 w-full max-w-lg border border-[#ccc] p-2" value={body} onChange={(event) => setBody(event.target.value)} />
      </label>
      <div className="mt-3"><Btn kind="blue" onClick={() => {
        void loadOfficePrefs().then((prefs) => {
          const pages = { ...((prefs.pages as object) || {}), [page]: { headline, body } };
          return saveOfficePrefs({ pages });
        }).then((error) => setNote(error || "Page saved."));
      }}>Update</Btn></div>
      {note ? <p className="mt-2 text-[13px] text-[#1c93b5]">{note}</p> : null}
    </div>
  );
}
