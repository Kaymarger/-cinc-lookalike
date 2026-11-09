"use client";

import { useEffect, useState } from "react";
import { loadOfficePrefs, saveOfficePrefs } from "./office-prefs";
import { Btn, inputCls } from "./ui";

const LAYOUTS = ["Default", "Lucid", "Spring", "Circles", "Split", "Photo"] as const;

const PALETTES = ["Ocean", "Cedar", "Slate", "Sand"];
const FONTS = ["Lato", "Roboto", "Work Sans"];

export function ThemeLayoutPicker() {
  const [layout, setLayout] = useState<(typeof LAYOUTS)[number]>("Default");
  const [palette, setPalette] = useState("Ocean");
  const [font, setFont] = useState("Lato");
  const [note, setNote] = useState("");
  useEffect(() => {
    void loadOfficePrefs().then((prefs) => {
      const saved = String(prefs.themeLayout || "Default");
      if (LAYOUTS.includes(saved as (typeof LAYOUTS)[number])) setLayout(saved as (typeof LAYOUTS)[number]);
      if (typeof prefs.themePalette === "string") setPalette(prefs.themePalette);
      if (typeof prefs.themeFont === "string") setFont(prefs.themeFont);
    });
  }, []);
  return (
    <div className="space-y-4 border border-[#ddd] bg-white p-4">
      <h1 className="text-[18px] font-semibold">Choose Your Layout</h1>
      <div className="grid gap-3 sm:grid-cols-3">
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
      <section>
        <h2 className="mb-2 font-semibold">Color Palettes</h2>
        <div className="flex flex-wrap gap-2">
          {PALETTES.map((name) => (
            <button key={name} type="button" className={`border px-3 py-2 text-[13px] ${palette === name ? "border-[#1c93b5] bg-[#f3fafc]" : "border-[#ddd]"}`} onClick={() => setPalette(name)}>{name}</button>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-2 font-semibold">Font Packs</h2>
        <div className="flex flex-wrap gap-2">
          {FONTS.map((name) => (
            <button key={name} type="button" className={`border px-3 py-2 text-[13px] ${font === name ? "border-[#1c93b5] bg-[#f3fafc]" : "border-[#ddd]"}`} onClick={() => setFont(name)}>{name}</button>
          ))}
        </div>
      </section>
      <div className="text-right">
        <Btn kind="blue" onClick={() => { void saveOfficePrefs({ themeLayout: layout, themePalette: palette, themeFont: font }).then((error) => setNote(error || "Theme saved.")); }}>Update</Btn>
      </div>
      {note ? <p className="text-[13px] text-[#1c93b5]">{note}</p> : null}
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
  const [lines, setLines] = useState<{ id: string; agent: string; number: string }[]>([{ id: "office", agent: "Casey Archibald", number: "778-200-5837" }]);
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
      if (Array.isArray((saved as { lines?: unknown }).lines)) setLines((saved as { lines: { id: string; agent: string; number: string }[] }).lines);
    });
  }, []);
  return (
    <div className="border border-[#ddd] bg-white p-4 text-[13px]">
      <h1 className="mb-3 text-[18px] font-semibold">Dialer Settings</h1>
      <h2 className="font-bold">Dialer Account Settings</h2>
      <p className="mt-2">{status}</p>
      <h2 className="mt-4 font-bold">Phone number assignment</h2>
      <p className="mt-1">Twilio number: {number || "not connected"}</p>
      <h2 className="mt-4 font-bold">Agent dialer lines</h2>
      <table className="mt-2 w-full text-left text-[13px]">
        <thead><tr><th className="py-1">Agent</th><th>Phone number</th><th /></tr></thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-t border-[#eee]">
              <td className="py-1">{line.agent}</td>
              <td>{line.number}</td>
              <td><button type="button" className="text-[#d9363e]" onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex flex-wrap gap-2">
        <select className={inputCls + " max-w-[180px]"} value={agent} onChange={(event) => setAgent(event.target.value)}>
          {["Kayla Gerak", "Casey Archibald", "Anastasiia Borovyk", "Kevin Barrett"].map((name) => <option key={name}>{name}</option>)}
        </select>
        <button type="button" className="bg-[#1c93b5] px-3 py-1 text-white" onClick={() => setLines((current) => [...current, { id: `line-${Date.now()}`, agent, number: number || "778-200-5837" }])}>Add</button>
      </div>
      <label className="mt-3 block"><input type="checkbox" checked={summary} onChange={(event) => setSummary(event.target.checked)} /> Email the daily call summary</label>
      <div className="mt-3 text-right"><Btn kind="blue" onClick={() => { void saveOfficePrefs({ dialerSettings: { agent, summary, number, lines } }).then((error) => setNote(error || "Dialer settings saved.")); }}>Update</Btn></div>
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
      else setFields([
        { id: "birthdate", name: "Birthdate", type: "Date" },
        { id: "language", name: "Preferred language", type: "Text" },
        { id: "referral", name: "Referral source", type: "Text" },
      ]);
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
      <h2 className="mt-4 text-[15px] font-semibold">Active Fields</h2>
      <ul className="mt-2">
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
      {!fields.length ? <p className="mt-3 text-[#888]">No active fields yet.</p> : null}
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

const PAGE_TITLES: Record<string, string> = {
  home: "Edit Home Page",
  about: "Edit About Page",
  branded: "Edit Branded Site Page",
  "branded-about": "Edit Branded About Page",
  custom: "Edit Custom Page",
};

type EditorSection = { id: string; name: string; show: boolean; agents: string[] };

function starterSections(page: string): EditorSection[] {
  if (page === "about" || page === "branded-about") {
    return [
      { id: "about", name: "About", show: true, agents: [] },
      { id: "agents", name: "Featured Agents", show: true, agents: ["Casey Archibald"] },
    ];
  }
  if (page === "home") {
    return [
      { id: "featured", name: "Featured Listings", show: true, agents: [] },
      { id: "guides", name: "Neighborhood Guides", show: true, agents: [] },
    ];
  }
  return [{ id: "main", name: "Content", show: true, agents: [] }];
}

export function PageEditor({ page }: { page: string }) {
  const title = PAGE_TITLES[page] ?? "Edit Home Page";
  const [permalink, setPermalink] = useState(page === "home" ? "/" : `/${page}`);
  const [metaOpen, setMetaOpen] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [sections, setSections] = useState<EditorSection[]>(() => starterSections(page));
  const [note, setNote] = useState("");
  useEffect(() => {
    setPermalink(page === "home" ? "/" : `/${page}`);
    setSections(starterSections(page));
    setMetaTitle("");
    setMetaDescription("");
    void loadOfficePrefs().then((prefs) => {
      const pages = prefs.pages as Record<string, { permalink?: string; metaTitle?: string; metaDescription?: string; sections?: EditorSection[] }> | undefined;
      const saved = pages?.[page];
      if (!saved) return;
      if (saved.permalink) setPermalink(saved.permalink);
      if (saved.metaTitle) setMetaTitle(saved.metaTitle);
      if (saved.metaDescription) setMetaDescription(saved.metaDescription);
      if (saved.sections?.length) {
        const names = new Set(saved.sections.map((section) => section.name));
        setSections([...saved.sections, ...starterSections(page).filter((section) => !names.has(section.name))]);
      }
    });
  }, [page]);
  return (
    <div className="p-4 text-[13px]">
      <h1 className="text-[18px] font-semibold">{title}</h1>
      <label className="mt-4 block max-w-lg">Permalink
        <input className="mt-1 h-8 w-full border border-[#ccc] px-2" value={permalink} onChange={(event) => setPermalink(event.target.value)} />
      </label>
      <button type="button" className="mt-3 text-[#1c93b5]" onClick={() => setMetaOpen((value) => !value)}>Custom Meta Values</button>
      {metaOpen ? (
        <div className="mt-2 max-w-lg space-y-2 border border-[#e5e5e5] p-3">
          <label className="block">Title<input className="mt-1 h-8 w-full border border-[#ccc] px-2" value={metaTitle} onChange={(event) => setMetaTitle(event.target.value)} /></label>
          <label className="block">Description<textarea className="mt-1 h-20 w-full border border-[#ccc] p-2" value={metaDescription} onChange={(event) => setMetaDescription(event.target.value)} /></label>
        </div>
      ) : null}
      <div className="mt-4 space-y-3">
        {sections.map((section) => (
          <section key={section.id} className="border border-[#e5e5e5] bg-white p-3">
            <h2 className="font-semibold">{section.name}</h2>
            {section.name === "About" || section.name === "Featured Agents" ? (
              <div className="mt-2">
                <p className="font-semibold">Featured Agents</p>
                <label className="mt-2 block"><input type="checkbox" checked={section.show} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, show: event.target.checked } : item))} /> Show Section</label>
                <ul className="mt-2">{section.agents.map((agent) => <li key={agent}>{agent}</li>)}</ul>
                <button type="button" className="mt-2 text-[#1c93b5]" onClick={() => {
                  const name = window.prompt("Agent name");
                  if (!name) return;
                  setSections((current) => current.map((item) => item.id === section.id ? { ...item, agents: [...item.agents, name] } : item));
                }}>Add Agent</button>
              </div>
            ) : <p className="mt-2 text-[#666]">This section is on {title.replace("Edit ", "").replace(" Page", "")}.</p>}
          </section>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" className="border border-[#1c93b5] px-3 py-1 text-[#1c93b5]" onClick={() => {
          const name = window.prompt("Section name", "New section");
          if (!name) return;
          setSections((current) => [...current, { id: `sec-${Date.now()}`, name, show: true, agents: [] }]);
        }}>Add Section</button>
        <Btn kind="blue" onClick={() => {
          void loadOfficePrefs().then((prefs) => {
            const pages = { ...((prefs.pages as object) || {}), [page]: { permalink, metaTitle, metaDescription, sections } };
            return saveOfficePrefs({ pages });
          }).then((error) => setNote(error || "Page saved."));
        }}>Save Page</Btn>
      </div>
      {note ? <p className="mt-2 text-[#1c93b5]">{note}</p> : null}
    </div>
  );
}
