"use client";

import { useEffect, useState } from "react";
import {
  CINC_PROPERTY_TYPES,
  DAYS_ON_SITE,
  ENGAGEMENTS,
  FIREPLACES,
  HOME_STYLES,
  LISTING_STATUSES,
  OWNERSHIP_TYPES,
  SEARCH_TAGS,
  SPACE_OPTIONS,
  STORIES_EXACT,
  STORIES_MIN,
} from "@/lib/cinc-options";
import { savedSearchSummary, type AlertFrequency, type LeadSavedSearch } from "@/lib/office-access";
import { useChrome } from "./chrome-context";
import { Btn, Field, inputCls, ModalFrame } from "./ui";

type Draft = {
  name: string;
  frequency: AlertFrequency;
  city: string;
  location: string;
  beds: string;
  baths: string;
  minPrice: string;
  maxPrice: string;
  propertyType: string;
  taxMin: string;
  taxMax: string;
  minAcreage: string;
  maxAcreage: string;
  minLotSqft: string;
  maxLotSqft: string;
  status: string;
  daysOnSite: string;
  garage: string;
  parking: string;
  carport: string;
  yearMin: string;
  yearMax: string;
  storiesMin: string;
  storiesExact: string;
  fireplaces: string;
  style: string;
  sqftMin: string;
  sqftMax: string;
  ownership: string;
  tags: string[];
};

function emptyDraft(): Draft {
  return {
    name: "",
    frequency: "Daily (Best for default search)",
    city: "",
    location: "",
    beds: "",
    baths: "",
    minPrice: "",
    maxPrice: "",
    propertyType: "",
    taxMin: "",
    taxMax: "",
    minAcreage: "",
    maxAcreage: "",
    minLotSqft: "",
    maxLotSqft: "",
    status: "",
    daysOnSite: "Any",
    garage: "Any",
    parking: "Any",
    carport: "Any",
    yearMin: "",
    yearMax: "",
    storiesMin: "Any",
    storiesExact: "Any",
    fireplaces: "Any",
    style: "",
    sqftMin: "",
    sqftMax: "",
    ownership: "",
    tags: [],
  };
}

function fromSearch(search: LeadSavedSearch): Draft {
  const criteria = search.criteria;
  const blank = emptyDraft();
  return {
    ...blank,
    name: search.name,
    frequency: search.frequency,
    city: search.city,
    location: criteria?.location || "",
    beds: search.beds == null ? "" : String(search.beds),
    baths: search.baths == null ? "" : String(search.baths),
    minPrice: search.minPrice == null ? "" : String(search.minPrice),
    maxPrice: search.maxPrice == null ? "" : String(search.maxPrice),
    propertyType: search.propertyType,
    taxMin: criteria?.taxMin == null ? "" : String(criteria.taxMin),
    taxMax: criteria?.taxMax == null ? "" : String(criteria.taxMax),
    minAcreage: criteria?.minAcreage || "",
    maxAcreage: criteria?.maxAcreage || "",
    minLotSqft: criteria?.minLotSqft || "",
    maxLotSqft: criteria?.maxLotSqft || "",
    status: criteria?.status || "",
    daysOnSite: criteria?.daysOnSite || "Any",
    garage: criteria?.garage || "Any",
    parking: criteria?.parking || "Any",
    carport: criteria?.carport || "Any",
    yearMin: criteria?.yearMin == null ? "" : String(criteria.yearMin),
    yearMax: criteria?.yearMax == null ? "" : String(criteria.yearMax),
    storiesMin: criteria?.storiesMin || "Any",
    storiesExact: criteria?.storiesExact || "Any",
    fireplaces: criteria?.fireplaces || "Any",
    style: criteria?.style || "",
    sqftMin: criteria?.sqftMin == null ? "" : String(criteria.sqftMin),
    sqftMax: criteria?.sqftMax == null ? "" : String(criteria.sqftMax),
    ownership: criteria?.ownership || "",
    tags: criteria?.tags || [],
  };
}

export function LeadSearches({ leadId, leadEmail }: { leadId: string; leadEmail: string }) {
  const chrome = useChrome();
  const [searches, setSearches] = useState<LeadSavedSearch[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    const response = await fetch(`/api/leads/${encodeURIComponent(leadId)}/searches`, { cache: "no-store" });
    const data = (await response.json().catch(() => null)) as { searches?: LeadSavedSearch[]; message?: string } | null;
    if (!response.ok) {
      setNotice(data?.message || "Saved searches need a connected database.");
      setSearches([]);
      return;
    }
    setNotice(null);
    setSearches(data?.searches ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/leads/${encodeURIComponent(leadId)}/searches`, { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as { searches?: LeadSavedSearch[]; message?: string } | null;
        if (cancelled) return;
        if (!response.ok) setNotice(data?.message || "Saved searches need a connected database.");
        else {
          setNotice(null);
          setSearches(data?.searches ?? []);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  function openForm(initial?: LeadSavedSearch) {
    chrome.openModal(
      <SearchModal
        initial={initial ? fromSearch(initial) : emptyDraft()}
        editing={Boolean(initial)}
        onClose={chrome.closeModal}
        onDelete={
          initial
            ? async () => {
                const response = await fetch(`/api/leads/${encodeURIComponent(leadId)}/searches/${encodeURIComponent(initial.id)}`, { method: "DELETE" });
                if (!response.ok) {
                  chrome.toast("Could not delete that search.");
                  return;
                }
                chrome.closeModal();
                chrome.toast("Saved search deleted.");
                await load();
              }
            : undefined
        }
        onSave={async (draft) => {
          const response = initial
            ? await fetch(`/api/leads/${encodeURIComponent(leadId)}/searches/${encodeURIComponent(initial.id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...draft, leadEmail }),
              })
            : await fetch(`/api/leads/${encodeURIComponent(leadId)}/searches`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...draft, leadEmail }),
              });
          const data = (await response.json().catch(() => null)) as { message?: string } | null;
          if (!response.ok) {
            chrome.toast(data?.message || "Could not save that search.");
            return;
          }
          chrome.closeModal();
          chrome.toast(initial ? "Saved search updated." : "Saved search created.");
          await load();
        }}
      />
    );
  }

  return (
    <div className="mt-2 text-left">
      <button type="button" className="text-[12px] text-[#1c93b5]" onClick={() => openForm()}>
        🔍 + Saved Search
      </button>
      {notice ? <p className="mt-1 text-[11px] text-[#8a5a00]">{notice}</p> : null}
      <ul className="mt-1 space-y-1">
        {searches.map((search) => (
          <li key={search.id} className="border border-[#e5e5e5] bg-[#f7fbfc] px-2 py-1 text-[11px]">
            <p className="font-semibold text-[#243238]">{search.name}</p>
            <p className="text-[#666]">{savedSearchSummary(search)}</p>
            <button type="button" className="text-[#1c93b5]" onClick={() => openForm(search)}>Edit</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchModal({
  initial,
  editing,
  onClose,
  onSave,
  onDelete,
}: {
  initial: Draft;
  editing: boolean;
  onClose: () => void;
  onSave: (draft: Draft) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [draft, setDraft] = useState(initial);
  const [tab, setTab] = useState<"filters" | "results">("filters");
  const [styleQuery, setStyleQuery] = useState("");
  const set = (key: keyof Draft, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const chips = [
    draft.city && `City: ${draft.city}`,
    draft.beds && `Beds: ${draft.beds}+`,
    draft.baths && `Min Baths: ${draft.baths}+`,
    draft.minPrice && `Min Price: ${draft.minPrice}`,
    draft.maxPrice && `Max Price: ${draft.maxPrice}`,
    draft.propertyType && `Property Type: ${draft.propertyType}`,
  ].filter(Boolean) as string[];
  const styles = HOME_STYLES.filter((style) => style.toLowerCase().includes(styleQuery.toLowerCase())).slice(0, 8);
  return (
    <ModalFrame title="Search Filters" onClose={onClose} wide>
      <div className="mb-3 flex gap-4 border-b border-[#ddd] text-[13px]">
        <button type="button" className={tab === "filters" ? "border-b-2 border-[#1c93b5] pb-1 font-semibold" : "pb-1"} onClick={() => setTab("filters")}>Search Filters</button>
        <button type="button" className={tab === "results" ? "border-b-2 border-[#1c93b5] pb-1 font-semibold" : "pb-1"} onClick={() => setTab("results")}>Search Results</button>
        <span className="ml-auto text-[#888]">(0) Search Total</span>
      </div>
      {tab === "results" ? (
        <p className="text-[13px] text-[#666]">No listings are matched in this demo. Filters are saved for the lead.</p>
      ) : (
        <div className="max-h-[60vh] space-y-3 overflow-auto pr-1 text-[13px]">
          <Field label="Search Name"><input className={inputCls} value={draft.name} onChange={(event) => set("name", event.target.value)} /></Field>
          <Field label="Engagement">
            <select className={inputCls} value={draft.frequency} onChange={(event) => set("frequency", event.target.value)}>
              {ENGAGEMENTS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Location + Keyword Search">
            <input className={inputCls} value={draft.location} placeholder="City, area, or keyword" onChange={(event) => set("location", event.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-1">
            {chips.map((chip) => <span key={chip} className="bg-[#e7f4f8] px-2 py-0.5 text-[11px]">{chip}</span>)}
          </div>
          <h3 className="font-bold">GENERAL</h3>
          <p className="font-semibold">Basic Settings</p>
          <label className="block">Beds {draft.beds || "Any"}<input type="range" min="0" max="5" value={draft.beds || "0"} onChange={(event) => set("beds", event.target.value === "0" ? "" : event.target.value)} /></label>
          <label className="block">Full Baths {draft.baths || "Any"}<input type="range" min="0" max="5" value={draft.baths || "0"} onChange={(event) => set("baths", event.target.value === "0" ? "" : event.target.value)} /></label>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Min Price"><input className={inputCls} value={draft.minPrice} onChange={(event) => set("minPrice", event.target.value)} /></Field>
            <Field label="Max Price"><input className={inputCls} value={draft.maxPrice} onChange={(event) => set("maxPrice", event.target.value)} /></Field>
            <Field label="Property Type">
              <select className={inputCls} value={draft.propertyType} onChange={(event) => set("propertyType", event.target.value)}>
                <option value="">Any</option>
                {CINC_PROPERTY_TYPES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Tax Amount Min"><input className={inputCls} value={draft.taxMin} onChange={(event) => set("taxMin", event.target.value)} /></Field>
            <Field label="Tax Amount Max"><input className={inputCls} value={draft.taxMax} onChange={(event) => set("taxMax", event.target.value)} /></Field>
          </div>
          <p className="font-semibold">Lot Settings</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Min Acreage"><input className={inputCls} value={draft.minAcreage} onChange={(event) => set("minAcreage", event.target.value)} /></Field>
            <Field label="Max Acreage"><input className={inputCls} value={draft.maxAcreage} onChange={(event) => set("maxAcreage", event.target.value)} /></Field>
            <Field label="Min Lot Sqft"><input className={inputCls} value={draft.minLotSqft} onChange={(event) => set("minLotSqft", event.target.value)} /></Field>
            <Field label="Max Lot Sqft"><input className={inputCls} value={draft.maxLotSqft} onChange={(event) => set("maxLotSqft", event.target.value)} /></Field>
          </div>
          <p className="font-semibold">Other Settings</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Status">
              <select className={inputCls} value={draft.status} onChange={(event) => set("status", event.target.value)}>
                <option value="">Any</option>
                {LISTING_STATUSES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Days on Site">
              <select className={inputCls} value={draft.daysOnSite} onChange={(event) => set("daysOnSite", event.target.value)}>
                {DAYS_ON_SITE.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
          </div>
          <h3 className="font-bold">BUILDING</h3>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["Garage Spaces", "garage", SPACE_OPTIONS],
              ["Parking Spaces", "parking", SPACE_OPTIONS],
              ["Carport Spaces", "carport", SPACE_OPTIONS],
              ["Stories", "storiesMin", STORIES_MIN],
              ["Stories", "storiesExact", STORIES_EXACT],
              ["Fireplaces", "fireplaces", FIREPLACES],
            ] as const).map(([label, key, options]) => (
              <Field key={key} label={label}>
                <select className={inputCls} value={draft[key]} onChange={(event) => set(key, event.target.value)}>
                  {options.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
            ))}
            <Field label="Min Year Built"><input className={inputCls} value={draft.yearMin} onChange={(event) => set("yearMin", event.target.value)} /></Field>
            <Field label="Max Year Built"><input className={inputCls} value={draft.yearMax} onChange={(event) => set("yearMax", event.target.value)} /></Field>
            <Field label="Min Sq Ft"><input className={inputCls} value={draft.sqftMin} onChange={(event) => set("sqftMin", event.target.value)} /></Field>
            <Field label="Max Sq Ft"><input className={inputCls} value={draft.sqftMax} onChange={(event) => set("sqftMax", event.target.value)} /></Field>
          </div>
          <Field label="Style">
            <input className={inputCls} value={styleQuery || draft.style} placeholder="Type to search styles" onChange={(event) => { setStyleQuery(event.target.value); set("style", event.target.value); }} />
            {styleQuery ? (
              <div className="max-h-28 overflow-auto border border-[#ddd] bg-white">
                {styles.map((style) => (
                  <button key={style} type="button" className="block w-full px-2 py-1 text-left hover:bg-[#f3fafc]" onClick={() => { set("style", style); setStyleQuery(""); }}>{style}</button>
                ))}
              </div>
            ) : null}
          </Field>
          <h3 className="font-bold">OTHER</h3>
          <Field label="Ownership Type">
            <select className={inputCls} value={draft.ownership} onChange={(event) => set("ownership", event.target.value)}>
              <option value="">Any</option>
              {OWNERSHIP_TYPES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <h3 className="font-bold">TAGS</h3>
          <div className="grid grid-cols-2 gap-1">
            {SEARCH_TAGS.map((tag) => (
              <label key={tag} className="flex items-center gap-1 text-[12px]">
                <input
                  type="checkbox"
                  checked={draft.tags.includes(tag)}
                  onChange={() => setDraft((current) => ({ ...current, tags: current.tags.includes(tag) ? current.tags.filter((item) => item !== tag) : [...current.tags, tag] }))}
                />
                {tag}
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Btn onClick={() => setDraft(emptyDraft())}>Create New</Btn>
        <Btn onClick={() => { void navigator.clipboard?.writeText(window.location.href); }}>Generate Link</Btn>
        <Btn onClick={() => setDraft(initial)}>Reset Original</Btn>
        <Btn onClick={() => setDraft(emptyDraft())}>Clear All</Btn>
        {editing && onDelete ? <Btn kind="danger" onClick={() => void onDelete()}>DELETE</Btn> : null}
        <Btn kind="teal" onClick={() => void onSave(draft)}>SAVE</Btn>
      </div>
    </ModalFrame>
  );
}
