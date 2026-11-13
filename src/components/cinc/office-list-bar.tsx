"use client";

import { useEffect, useState } from "react";
import { hashPath, hashSearch, moveColumn, parseListQuery, serializeListQuery, type ListQuery, type SavedView, type SortMode } from "@/lib/office-list";

export function useOfficeList(listId: string, sort: string, columns: string[]) {
  const fallback = (): ListQuery => ({ q: "", sort, dir: "asc", mode: "value", filters: {}, page: 1, pageSize: 25, columns, view: "" });
  const read = () => parseListQuery(typeof window === "undefined" ? "" : hashSearch(window.location.hash), fallback());
  const [query, setQuery] = useState<ListQuery>(fallback);
  const [views, setViews] = useState<SavedView[]>([]);
  useEffect(() => {
    setQuery(read());
    try {
      const saved = JSON.parse(localStorage.getItem(`gvhs-office-views:${listId}`) || "[]") as SavedView[];
      if (Array.isArray(saved)) setViews(saved);
    } catch {
      setViews([]);
    }
    const sync = () => setQuery(read());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [listId]);

  function write(next: ListQuery) {
    const path = hashPath(window.location.hash || `#${listId}`);
    const qs = serializeListQuery(next);
    const hash = `#${path}${qs ? `?${qs}` : ""}`;
    if (window.location.hash !== hash) window.location.hash = hash;
    setQuery(next);
  }

  function update(patch: Partial<ListQuery>) {
    const next = { ...query, ...patch, page: patch.page ?? (patch.q != null || patch.filters || patch.pageSize ? 1 : query.page) };
    write(next);
  }

  function toggleSort(id: string, mode: ListQuery["mode"] = "value") {
    if (query.sort === id && query.mode === mode) update({ sort: id, mode, dir: query.dir === "asc" ? "desc" : "asc" });
    else update({ sort: id, mode, dir: "asc" });
  }

  function saveView(name: string) {
    const next = [...views.filter((item) => item.name !== name), { name, query }];
    setViews(next);
    localStorage.setItem(`gvhs-office-views:${listId}`, JSON.stringify(next));
    update({ view: name });
  }

  return { query, update, toggleSort, views, saveView };
}

export function OfficeListBar({
  query,
  update,
  views,
  saveView,
  filters,
  columns,
  total,
  emptyLabel,
  sortColumns,
  toggleSort,
  onSelectPage,
}: {
  query: ListQuery;
  update: (patch: Partial<ListQuery>) => void;
  views: SavedView[];
  saveView: (name: string) => void;
  filters: { id: string; label: string; options: string[] }[];
  columns: { id: string; label: string }[];
  total: number;
  emptyLabel: string;
  sortColumns?: { id: string; label: string; count?: boolean; recent?: boolean }[];
  toggleSort?: (id: string, mode?: SortMode) => void;
  onSelectPage?: () => void;
}) {
  const pages = Math.max(1, Math.ceil(total / query.pageSize));
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded border border-[#e5e5e5] bg-white px-3 py-2 text-[13px]">
      <input
        aria-label="Search this list"
        value={query.q}
        placeholder="Search"
        className="h-8 w-40 border border-[#ccc] px-2"
        onChange={(event) => update({ q: event.target.value })}
      />
      {filters.map((filter) => (
        <label key={filter.id} className="flex items-center gap-1">
          {filter.label}
          <select
            aria-label={filter.label}
            className="h-8 border border-[#ccc] bg-white px-1"
            value={query.filters[filter.id] || "All"}
            onChange={(event) => update({ filters: { ...query.filters, [filter.id]: event.target.value } })}
          >
            <option>All</option>
            {filter.options.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      ))}
      <label className="flex items-center gap-1">
        Columns
        <select
          aria-label="Show or hide a column"
          className="h-8 border border-[#ccc] bg-white px-1"
          value=""
          onChange={(event) => {
            const id = event.target.value;
            if (!id) return;
            const has = query.columns.includes(id);
            const columns = has ? query.columns.filter((item) => item !== id) : [...query.columns, id];
            update({ columns: columns.length ? columns : query.columns });
          }}
        >
          <option value="">Show or hide</option>
          {columns.map((column) => <option key={column.id} value={column.id}>{query.columns.includes(column.id) || !query.columns.length ? "Hide" : "Show"} {column.label}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-1">
        Order
        <select
          aria-label="Reorder a column"
          className="h-8 border border-[#ccc] bg-white px-1"
          value=""
          onChange={(event) => {
            const [id, direction] = event.target.value.split(":");
            if (!id || (direction !== "left" && direction !== "right")) return;
            const current = query.columns.length ? query.columns : columns.map((column) => column.id);
            update({ columns: moveColumn(current, id, direction === "left" ? -1 : 1) });
          }}
        >
          <option value="">Move column</option>
          {(query.columns.length ? query.columns : columns.map((column) => column.id)).map((id) => {
            const label = columns.find((column) => column.id === id)?.label || id;
            return [
              <option key={`${id}-left`} value={`${id}:left`}>{label} left</option>,
              <option key={`${id}-right`} value={`${id}:right`}>{label} right</option>,
            ];
          })}
        </select>
      </label>
      <select aria-label="Saved view" className="h-8 border border-[#ccc] bg-white px-1" value={query.view} onChange={(event) => {
        const saved = views.find((item) => item.name === event.target.value);
        if (saved) update(saved.query);
        else update({ view: "" });
      }}>
        <option value="">Saved views</option>
        {views.map((view) => <option key={view.name}>{view.name}</option>)}
      </select>
      <button type="button" className="h-8 border border-[#ccc] bg-white px-2" onClick={() => {
        const name = window.prompt("Name this view");
        if (name) saveView(name);
      }}>Save view</button>
      <span className="ml-auto">{total} {total === 1 ? "row" : "rows"}</span>
      <select aria-label="Page size" className="h-8 border border-[#ccc] bg-white px-1" value={query.pageSize} onChange={(event) => update({ pageSize: Number(event.target.value) })}>
        {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
      </select>
      <button type="button" className="px-1 disabled:opacity-30" disabled={query.page <= 1} onClick={() => update({ page: query.page - 1 })}>‹</button>
      <span>{query.page} / {pages}</span>
      <button type="button" className="px-1 disabled:opacity-30" disabled={query.page >= pages} onClick={() => update({ page: query.page + 1 })}>›</button>
      {onSelectPage ? <button type="button" className="h-8 border border-[#ccc] bg-white px-2" onClick={onSelectPage}>Select page</button> : null}
      {total === 0 ? <span className="basis-full text-[#888]">{emptyLabel}</span> : null}
      {sortColumns && toggleSort ? (
        <div className="flex basis-full flex-wrap gap-2 border-t border-[#eee] pt-2">
          {sortColumns.filter((column) => !query.columns.length || query.columns.includes(column.id)).map((column) => {
            const mark = (mode: SortMode) => query.sort === column.id && query.mode === mode ? (query.dir === "asc" ? " ↑" : " ↓") : "";
            return (
              <span key={column.id} className="inline-flex items-center gap-1">
                <button type="button" className="font-semibold text-[#1c93b5]" onClick={() => toggleSort(column.id, "value")}>{column.label}{mark("value")}</button>
                {column.count ? <button type="button" aria-label={`Sort ${column.label} by count`} className="text-[#666]" onClick={() => toggleSort(column.id, "count")}>count{mark("count")}</button> : null}
                {column.recent ? <button type="button" aria-label={`Sort ${column.label} by recency`} className="text-[#666]" onClick={() => toggleSort(column.id, "recent")}>recent{mark("recent")}</button> : null}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
