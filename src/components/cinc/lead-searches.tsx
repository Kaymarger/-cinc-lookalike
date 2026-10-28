"use client";

import { useEffect, useState } from "react";
import { CITIES } from "@/lib/properties";
import {
  ALERT_FREQUENCIES,
  SEARCH_GARAGES,
  SEARCH_PROPERTY_TYPES,
  SEARCH_STATUSES,
  savedSearchSummary,
  type AlertFrequency,
  type LeadSavedSearch,
} from "@/lib/office-access";
import { useChrome } from "./chrome-context";
import { Btn, Field, inputCls, ModalFrame } from "./ui";

type Draft = {
  name: string;
  city: string;
  county: string;
  minPrice: string;
  maxPrice: string;
  beds: string;
  baths: string;
  propertyType: string;
  sqftMin: string;
  sqftMax: string;
  yearMin: string;
  yearMax: string;
  status: string;
  garage: string;
  keywords: string;
  frequency: AlertFrequency;
};

function emptyDraft(): Draft {
  return {
    name: "", city: "", county: "", minPrice: "", maxPrice: "", beds: "", baths: "", propertyType: "",
    sqftMin: "", sqftMax: "", yearMin: "", yearMax: "", status: "Any", garage: "Any", keywords: "", frequency: "Daily",
  };
}

function fromSearch(search: LeadSavedSearch): Draft {
  const criteria = search.criteria;
  return {
    name: search.name,
    city: search.city,
    county: criteria?.county || "",
    minPrice: search.minPrice == null ? "" : String(search.minPrice),
    maxPrice: search.maxPrice == null ? "" : String(search.maxPrice),
    beds: search.beds == null ? "" : String(search.beds),
    baths: search.baths == null ? "" : String(search.baths),
    propertyType: search.propertyType,
    sqftMin: criteria?.sqftMin == null ? "" : String(criteria.sqftMin),
    sqftMax: criteria?.sqftMax == null ? "" : String(criteria.sqftMax),
    yearMin: criteria?.yearMin == null ? "" : String(criteria.yearMin),
    yearMax: criteria?.yearMax == null ? "" : String(criteria.yearMax),
    status: criteria?.status || "Any",
    garage: criteria?.garage || "Any",
    keywords: criteria?.keywords || "",
    frequency: search.frequency,
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
        title={initial ? "Edit saved search" : "Saved Search"}
        onClose={chrome.closeModal}
        onSave={async (draft) => {
          const payload = { ...draft, leadEmail };
          const response = initial
            ? await fetch(`/api/leads/${encodeURIComponent(leadId)}/searches/${encodeURIComponent(initial.id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              })
            : await fetch(`/api/leads/${encodeURIComponent(leadId)}/searches`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
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

  async function remove(search: LeadSavedSearch) {
    const response = await fetch(
      `/api/leads/${encodeURIComponent(leadId)}/searches/${encodeURIComponent(search.id)}`,
      { method: "DELETE" }
    );
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      chrome.toast(data?.message || "Could not delete that search.");
      return;
    }
    chrome.toast("Saved search deleted.");
    await load();
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
            <div className="mt-1 flex gap-2">
              <button type="button" className="text-[#1c93b5]" onClick={() => openForm(search)}>Edit</button>
              <button type="button" className="text-[#d9363e]" onClick={() => void remove(search)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchModal({
  initial,
  title,
  onClose,
  onSave,
}: {
  initial: Draft;
  title: string;
  onClose: () => void;
  onSave: (draft: Draft) => Promise<void>;
}) {
  const [draft, setDraft] = useState(initial);
  const set = (key: keyof Draft, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  return (
    <ModalFrame title={title} onClose={onClose}>
      <Field label="Name">
        <input className={inputCls} value={draft.name} onChange={(event) => set("name", event.target.value)} />
      </Field>
      <Field label="Area / city">
        <select className={inputCls} value={draft.city} onChange={(event) => set("city", event.target.value)}>
          <option value="">Any</option>
          {CITIES.map((city) => (
            <option key={city}>{city}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Min price">
          <input className={inputCls} inputMode="numeric" value={draft.minPrice} onChange={(event) => set("minPrice", event.target.value)} />
        </Field>
        <Field label="Max price">
          <input className={inputCls} inputMode="numeric" value={draft.maxPrice} onChange={(event) => set("maxPrice", event.target.value)} />
        </Field>
        <Field label="Beds">
          <select className={inputCls} value={draft.beds} onChange={(event) => set("beds", event.target.value)}>
            <option value="">Any</option>
            {["0", "1", "2", "3", "4", "5"].map((n) => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>
        </Field>
        <Field label="Baths">
          <select className={inputCls} value={draft.baths} onChange={(event) => set("baths", event.target.value)}>
            <option value="">Any</option>
            {["1", "2", "3", "4"].map((n) => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="County">
        <input className={inputCls} value={draft.county} onChange={(event) => set("county", event.target.value)} />
      </Field>
      <Field label="Property type">
        <select className={inputCls} value={draft.propertyType} onChange={(event) => set("propertyType", event.target.value)}>
          <option value="">Any</option>
          {SEARCH_PROPERTY_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Min sqft"><input className={inputCls} inputMode="numeric" value={draft.sqftMin} onChange={(event) => set("sqftMin", event.target.value)} /></Field>
        <Field label="Max sqft"><input className={inputCls} inputMode="numeric" value={draft.sqftMax} onChange={(event) => set("sqftMax", event.target.value)} /></Field>
        <Field label="Year built from"><input className={inputCls} inputMode="numeric" value={draft.yearMin} onChange={(event) => set("yearMin", event.target.value)} /></Field>
        <Field label="Year built to"><input className={inputCls} inputMode="numeric" value={draft.yearMax} onChange={(event) => set("yearMax", event.target.value)} /></Field>
      </div>
      <Field label="Status">
        <select className={inputCls} value={draft.status} onChange={(event) => set("status", event.target.value)}>
          {SEARCH_STATUSES.map((status) => <option key={status}>{status}</option>)}
        </select>
      </Field>
      <Field label="Garage">
        <select className={inputCls} value={draft.garage} onChange={(event) => set("garage", event.target.value)}>
          {SEARCH_GARAGES.map((garage) => <option key={garage}>{garage}</option>)}
        </select>
      </Field>
      <Field label="Keywords">
        <input className={inputCls} value={draft.keywords} onChange={(event) => set("keywords", event.target.value)} />
      </Field>
      <Field label="Email alert frequency">
        <select className={inputCls} value={draft.frequency} onChange={(event) => set("frequency", event.target.value)}>
          {ALERT_FREQUENCIES.map((frequency) => (
            <option key={frequency}>{frequency}</option>
          ))}
        </select>
      </Field>
      <div className="mt-3 flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind="teal" onClick={() => void onSave(draft)}>Save</Btn>
      </div>
    </ModalFrame>
  );
}
