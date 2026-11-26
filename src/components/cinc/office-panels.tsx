"use client";

import { useEffect, useState } from "react";
import { useChrome } from "./chrome-context";
import { loadOfficePrefs, readLocalPrefs, saveOfficePrefs, writeLocalPrefs } from "./office-prefs";
import { Btn, inputCls } from "./ui";

const LAYOUTS = ["Default", "Lucid", "Spring", "Circles", "Split", "Photo", "Video", "Castle", "Castle Light", "Castle Dark"] as const;

const PALETTES = ["Tetra", "Marlin", "Monarch", "Lagoon", "Harbor", "Dune", "Iris", "Pebble", "Fern", "Copper", "Glacier", "Ink", "Castle", "Sand"];
const FONTS = ["Lato", "Roboto", "Work Sans", "Merriweather", "Source Sans"];

export function ThemeLayoutPicker() {
  const [layout, setLayout] = useState<(typeof LAYOUTS)[number]>("Default");
  const [palette, setPalette] = useState("Tetra");
  const [font, setFont] = useState("Lato");
  const [note, setNote] = useState("");
  useEffect(() => {
    void loadOfficePrefs().then((prefs) => {
      const saved = String(prefs.themeLayout || "Default");
      if (LAYOUTS.includes(saved as (typeof LAYOUTS)[number])) setLayout(saved as (typeof LAYOUTS)[number]);
      if (typeof prefs.themePalette === "string" && PALETTES.includes(prefs.themePalette)) setPalette(prefs.themePalette);
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
  city: "",
  postal: "",
  beds: "",
  baths: "",
  minPrice: "",
  maxPrice: "",
  sortBy: "Latest",
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
      <section className="rounded border border-[#e5e5e5] border-t-4 border-t-[#c8c8c8] bg-white p-4 text-[13px] shadow-sm">
        <h2 className="mb-2 font-bold">Search Widget</h2>
        <textarea readOnly className="h-20 w-full border border-[#ccc] p-2 font-mono text-[12px]" value={`<iframe src="${origin}/search" title="Search homes" style="width:100%;height:640px;border:0"></iframe>`} />
      </section>
      <section className="rounded border border-[#e5e5e5] border-t-4 border-t-[#c8c8c8] bg-white p-4 text-[13px] shadow-sm">
        <h2 className="mb-2 font-bold">Home Value Widget</h2>
        <textarea readOnly className="h-20 w-full border border-[#ccc] p-2 font-mono text-[12px]" value={`<iframe src="${origin}/seller/homeestimate/homevaluation" title="Home value" style="width:100%;height:720px;border:0"></iframe>`} />
      </section>
      <section className="rounded border border-[#e5e5e5] border-t-4 border-t-[#c8c8c8] bg-white p-4 text-[13px] shadow-sm">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Default Settings</h2><Btn kind="blue" onClick={() => { void saveOfficePrefs({ searchSettings: form }).then((error) => setNote(error || "Default search settings saved.")); }}>Update</Btn></div>
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
              {["None", "Highest Price (highestprice)", "Lowest Price (lowestprice)", "Latest Listings (latest)", "Baths (baths)", "Beds (beds)", "Year Built (newest)"].map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </section>
      <section className="rounded border border-[#e5e5e5] border-t-4 border-t-[#c8c8c8] bg-white p-4 text-[13px] shadow-sm">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Quick Search Settings</h2><Btn kind="blue" onClick={() => { void saveOfficePrefs({ searchSettings: form }).then((error) => setNote(error || "Quick search settings saved.")); }}>Update</Btn></div>
        <label className="mb-2 block">Default Layout
          <select className={inputCls} value={form.layout} onChange={(event) => set("layout", event.target.value)}>
            <option>List</option>
            <option>Grid</option>
          </select>
        </label>
        <label className="block">Sort Order Override
          <select className={inputCls} value={form.sortOverride} onChange={(event) => set("sortOverride", event.target.value)}>
            {["None", "Highest Price (highestprice)", "Lowest Price (lowestprice)", "Latest Listings (latest)", "Baths (baths)", "Beds (beds)", "Year Built (newest)"].map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </section>
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
      <div className="mt-2 border border-[#e5e5e5] bg-[#f7f7f7] p-3">
        <p className="text-[12px] uppercase text-[#888]">Dialer plan</p>
        <p className="text-[22px] font-semibold">$75 for 3 dialers</p>
        <p className="text-[13px] text-[#555]">{lines.length} dialer{lines.length === 1 ? "" : "s"} in use</p>
      </div>
      <p className="mt-2">{status}</p>
      <p className="mt-2 text-[13px]">Dialer Account Status: {status.startsWith("Connected") ? "ACTIVE" : "NOT CONNECTED"}</p>
      <button type="button" className="mt-2 border border-[#1c93b5] px-3 py-1 text-[#1c93b5]" onClick={() => setNote("A number request was saved for the office.")}>Request a number</button>
      <h2 className="mt-4 font-bold">Dialer Recording Settings</h2>
      <label className="mt-2 block"><input type="checkbox" defaultChecked /> Site-wide call recording</label>
      <label className="mt-1 block"><input type="checkbox" defaultChecked /> Play “Call is being recorded”</label>
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

const CANONICAL_FIELDS: FieldDef[] = [
  { id: "birthdate", name: "Birthdate", type: "Date" },
  { id: "birthday", name: "Birthday", type: "Date" },
  { id: "main-birth", name: "Main Contact Birth Date", type: "Date" },
  { id: "move-in", name: "Move In Date", type: "Date" },
  { id: "spouse-birth", name: "SpousePartner Birth Date", type: "Date" },
];

export function CustomFieldsPanel() {
  const [fields, setFields] = useState<FieldDef[]>(CANONICAL_FIELDS);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState("");
  useEffect(() => {
    void loadOfficePrefs().then((prefs) => {
      if (Array.isArray(prefs.customFieldDefs)) {
        const saved = (prefs.customFieldDefs as FieldDef[]).filter((field) => field.id !== "language" && field.id !== "referral");
        const names = new Set(saved.map((field) => field.name));
        setFields([...CANONICAL_FIELDS.filter((field) => !names.has(field.name)), ...saved]);
      }
    });
  }, []);
  function persist(next: FieldDef[], message: string) {
    setFields(next);
    void saveOfficePrefs({ customFieldDefs: next }).then((error) => setNote(error || message));
  }
  return (
    <div className="border border-[#ddd] bg-white p-4 text-[13px]">
      <h1 className="text-[18px] font-semibold">Custom Fields</h1>
      <p className="mt-2 max-w-2xl text-[#444]">This site is not designed or intended to collect sensitive confidential customer information. Edits to these fields happen on the lead details page.</p>
      <h2 className="mt-4 text-[16px] font-semibold">Add a New Field</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <input className={`${inputCls} max-w-xs`} placeholder="New Field Name" value={name} onChange={(event) => setName(event.target.value)} />
        <select className={`${inputCls} max-w-[180px]`} value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">(Select Field Type)</option>
          <option>Text</option>
          <option>Number</option>
          <option>Date</option>
          <option>True/False</option>
        </select>
        <Btn kind="teal" onClick={() => {
          const label = name.trim();
          if (!label || !type) return;
          if (editing) {
            persist(fields.map((field) => field.id === editing ? { ...field, name: label, type } : field), "Custom field updated.");
            setEditing(null);
          } else {
            persist([...fields, { id: `cf-${Date.now()}`, name: label, type }], "Custom field created.");
          }
          setName("");
          setType("");
        }}>{editing ? "Save field" : "Add Field"}</Btn>
      </div>
      <h2 className="mt-4 text-[15px] font-semibold">Active Fields</h2>
      <ul className="mt-2">
        {fields.map((field) => (
          <li key={field.id} className="flex items-center justify-between gap-2 border-t border-[#eee] py-2">
            <input className={`${inputCls} max-w-[220px]`} value={field.name} onChange={(event) => setFields((current) => current.map((item) => item.id === field.id ? { ...item, name: event.target.value } : item))} onBlur={() => persist(fields, "Custom field updated.")} />
            <select className={`${inputCls} max-w-[140px]`} value={field.type} onChange={(event) => setFields((current) => current.map((item) => item.id === field.id ? { ...item, type: event.target.value } : item))}><option>Text</option><option>Number</option><option>Date</option><option>True/False</option></select>
            <button type="button" className="text-[#d9363e]" onClick={() => persist(fields.filter((item) => item.id !== field.id), "Custom field deleted.")}>Delete</button>
          </li>
        ))}
      </ul>
      {!fields.length ? <p className="mt-3 text-[#888]">No active fields yet.</p> : null}
      {note ? <p className="mt-2 text-[#1c93b5]">{note}</p> : null}
    </div>
  );
}

export function BillingPlaceholder() {
  const [tab, setTab] = useState<"Invoices" | "Billing Details">("Invoices");
  return (
    <div className="border border-[#ddd] bg-white p-6">
      <h1 className="text-[18px] font-semibold">Billing & Invoices</h1>
      <div className="mt-3 flex gap-4 border-b border-[#e5e5e5] text-[14px]">
        {(["Invoices", "Billing Details"] as const).map((label) => (
          <button key={label} type="button" className={tab === label ? "border-b-2 border-[#1c93b5] pb-2 font-semibold text-[#1c93b5]" : "pb-2 text-[#666]"} onClick={() => setTab(label)}>{label}</button>
        ))}
      </div>
      {tab === "Invoices" ? (
        <table className="mt-4 w-full text-left text-[13px]">
          <thead><tr>{["DATE", "EMAILED TO", "TOTAL", "PAID"].map((column) => <th key={column} className="border-b border-[#eee] py-2">{column}</th>)}</tr></thead>
          <tbody><tr><td className="py-4 text-[#888]" colSpan={4}>There are no invoices to display yet.</td></tr></tbody>
        </table>
      ) : <p className="mt-4 text-[13px] text-[#555]">Billing details for this office will show here.</p>}
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

type EditorSection = { id: string; name: string; show: boolean; body: string; agents: string[] };

function starterSections(page: string): EditorSection[] {
  if (page === "about" || page === "branded-about") {
    return [{ id: "about", name: "About", show: true, body: "Casey Archibald and Archibald Real Estate Group help people buy and sell across Greater Vancouver.", agents: [] }];
  }
  if (page === "home") {
    return [
      { id: "featured", name: "Featured Listings", show: true, body: "Show the featured listing previews on the home page.", agents: [] },
      { id: "guides", name: "Neighborhood Guides", show: true, body: "Kitsilano, Yaletown, Coal Harbour, Mount Pleasant", agents: [] },
    ];
  }
  return [{ id: "main", name: "Content", show: true, body: "", agents: [] }];
}

export function PageEditor({ page }: { page: string }) {
  const chrome = useChrome();
  const title = PAGE_TITLES[page] ?? "Edit Home Page";
  const [permalink, setPermalink] = useState(page === "home" ? "/" : `/${page}`);
  const [metaOpen, setMetaOpen] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [sections, setSections] = useState<EditorSection[]>(() => starterSections(page));
  const [note, setNote] = useState("");
  const [liveCards, setLiveCards] = useState<{ id: string; address: string; price: number; beds: number; baths: number; image: string }[]>([]);
  const [cardsReady, setCardsReady] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [addingArea, setAddingArea] = useState(false);
  const [areaName, setAreaName] = useState("");
  useEffect(() => {
    void fetch("/api/listings?preview=1", { cache: "no-store" }).then(async (response) => {
      const data = (await response.json().catch(() => null)) as { properties?: { id: string; address: string; price: number; beds: number; baths: number; image: string }[] } | null;
      setLiveCards((data?.properties ?? []).filter((card) => card.address && !/sample|placeholder|preview of a public/i.test(card.address)));
    }).catch(() => setLiveCards([])).finally(() => setCardsReady(true));
  }, []);
  useEffect(() => {
    let cancelled = false;
    void loadOfficePrefs().then((prefs) => {
      if (cancelled) return;
      const pages = prefs.pages as Record<string, { permalink?: string; metaTitle?: string; metaDescription?: string; sections?: EditorSection[] }> | undefined;
      const saved = pages?.[page];
      if (!saved) {
        setPermalink(page === "home" ? "/" : `/${page}`);
        setSections(starterSections(page));
        setMetaTitle("");
        setMetaDescription("");
        return;
      }
      if (saved.permalink) setPermalink(saved.permalink);
      if (saved.metaTitle) setMetaTitle(saved.metaTitle);
      if (saved.metaDescription) setMetaDescription(saved.metaDescription);
      if (saved.sections?.length) setSections(saved.sections.map((section) => ({ ...section, body: section.body || "", agents: section.agents || [] })));
    });
    return () => {
      cancelled = true;
    };
  }, [page]);
  function savePage() {
    const local = readLocalPrefs();
    const previous = local.pages && typeof local.pages === "object" ? local.pages as Record<string, unknown> : {};
    const pages = { ...previous, [page]: { permalink, metaTitle, metaDescription, sections } };
    writeLocalPrefs({ ...local, pages });
    chrome.toast("Page saved.");
    setNote("Page saved.");
    void saveOfficePrefs({ pages }).then((error) => {
      if (error) {
        chrome.toast(error);
        setNote(error);
      }
    });
    void fetch("/api/site/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pages }) });
  }
  return (
    <div className="p-4 text-[13px]">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-semibold">{title}</h1>
        <Btn kind="blue" onClick={savePage}>Save Page</Btn>
      </div>
      <label className="mt-4 block max-w-lg text-[13px]">Permalink
        <input className="mt-1 h-8 w-full border border-[#d5e8ee] px-2 font-semibold text-[#1c93b5]" value={permalink} onChange={(event) => setPermalink(event.target.value)} />
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
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{section.name}</h2>
              <button type="button" className="text-[#d9363e]" onClick={() => setSections((current) => current.filter((item) => item.id !== section.id))}>Remove</button>
            </div>
            <label className="mt-2 block"><input type="checkbox" checked={section.show} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, show: event.target.checked } : item))} /> Show this section on the public page</label>
            {section.name === "Featured Listings" ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {liveCards.map((card) => (
                  <div key={card.id} className="border border-[#e5e5e5] bg-white">
                    {card.image ? <img src={card.image} alt="" className="h-28 w-full object-cover" /> : <div className="grid h-28 place-items-center bg-[#f4f7f8] text-[12px] text-[#888]">No photo</div>}
                    <div className="p-2">
                      <p className="font-semibold text-[#243238]">{card.address}</p>
                      <p className="text-[12px] text-[#666]">{card.price ? `$${Number(card.price).toLocaleString("en-CA")}` : "Price on request"} | {card.beds} bd | {card.baths} ba</p>
                    </div>
                  </div>
                ))}
                {cardsReady && !liveCards.length ? (
                  <div className="col-span-full grid h-36 place-items-center border border-dashed border-[#c8c8c8] bg-[#fafafa] text-center">
                    <div>
                      <p className="font-semibold text-[#243238]">No listings in the feed</p>
                      <p className="mt-1 text-[12px] text-[#777]">Featured cards show here when the CREA feed has active homes.</p>
                    </div>
                  </div>
                ) : null}
                {!cardsReady ? <p className="col-span-full text-[12px] text-[#888]">Loading listings from the feed…</p> : null}
              </div>
            ) : null}
            {section.name === "Neighborhood Guides" ? (
              <div className="mt-2">
                <ul className="list-disc pl-5 text-[13px]">{section.body.split(",").map((item) => item.trim()).filter(Boolean).map((item) => <li key={item}>{item}</li>)}</ul>
                {addingArea ? (
                  <div className="mt-2 flex gap-2">
                    <input className="h-8 flex-1 border border-[#ccc] px-2" value={areaName} onChange={(event) => setAreaName(event.target.value)} />
                    <button type="button" className="bg-[#1c93b5] px-3 text-white" onClick={() => {
                      const name = areaName.trim();
                      if (!name) return;
                      setSections((current) => current.map((item) => item.id === section.id ? { ...item, body: [...item.body.split(",").map((part) => part.trim()).filter(Boolean), name].join(", ") } : item));
                      setAreaName("");
                      setAddingArea(false);
                    }}>Add</button>
                  </div>
                ) : (
                  <button type="button" className="mt-2 grid h-16 w-full place-items-center border border-dashed border-[#c8c8c8] text-[13px] text-[#1c93b5]" onClick={() => setAddingArea(true)}>+ Add Neighborhood</button>
                )}
              </div>
            ) : null}
            <label className="mt-2 block">Section copy
              <textarea className="mt-1 h-16 w-full border border-[#ccc] p-2" value={section.body} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, body: event.target.value } : item))} />
            </label>
          </section>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <div className="flex items-center gap-2">
          <input className="h-8 w-48 border border-[#ccc] px-2" value={sectionName} onChange={(event) => setSectionName(event.target.value)} placeholder="New section" />
          <button type="button" className="border border-[#1c93b5] px-3 py-1 text-[#1c93b5]" onClick={() => {
            const name = sectionName.trim();
            if (!name) return;
            setSections((current) => [...current, { id: `sec-${Date.now()}`, name, show: true, body: "", agents: [] }]);
            setSectionName("");
          }}>+ Add Section</button>
        </div>
        <Btn kind="blue" onClick={savePage}>Save Page</Btn>
      </div>
      {note ? <p className="mt-2 text-[#1c93b5]">{note}</p> : null}
    </div>
  );
}
