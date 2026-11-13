export type SortDir = "asc" | "desc";
export type SortMode = "value" | "count" | "recent";

export type ListQuery = {
  q: string;
  sort: string;
  dir: SortDir;
  mode: SortMode;
  filters: Record<string, string>;
  page: number;
  pageSize: number;
  columns: string[];
  view: string;
};

export type ColumnSpec<T> = {
  id: string;
  label: string;
  value: (row: T) => string | number;
  count?: (row: T) => number;
  recent?: (row: T) => number;
};

export type FilterSpec<T> = {
  id: string;
  label: string;
  match: (row: T, value: string) => boolean;
};

export type ListSpec<T> = {
  id: string;
  search: (row: T) => string;
  columns: ColumnSpec<T>[];
  filters: FilterSpec<T>[];
};

export type SavedView = { name: string; query: ListQuery };

export function defaultListQuery(sort: string, columns: string[], pageSize = 25): ListQuery {
  return { q: "", sort, dir: "asc", mode: "value", filters: {}, page: 1, pageSize, columns, view: "" };
}

function compare(left: string | number, right: string | number, dir: SortDir): number {
  const sign = dir === "asc" ? 1 : -1;
  if (typeof left === "number" && typeof right === "number") return (left - right) * sign;
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" }) * sign;
}

export function applyOfficeList<T>(rows: T[], spec: ListSpec<T>, query: ListQuery): { rows: T[]; total: number; pages: number; empty: boolean; columns: ColumnSpec<T>[] } {
  const q = query.q.trim().toLowerCase();
  let next = rows.filter((row) => {
    if (q && !spec.search(row).toLowerCase().includes(q)) return false;
    return spec.filters.every((filter) => {
      const value = query.filters[filter.id];
      if (!value || value === "All" || value === "Any") return true;
      return filter.match(row, value);
    });
  });
  const column = spec.columns.find((item) => item.id === query.sort) ?? spec.columns[0];
  if (column) {
    const pick = query.mode === "count" && column.count
      ? column.count
      : query.mode === "recent" && column.recent
        ? column.recent
        : column.value;
    next = [...next].sort((a, b) => compare(pick(a), pick(b), query.dir));
  }
  const total = next.length;
  const pageSize = Math.max(1, query.pageSize || 25);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, query.page || 1), pages);
  const start = (page - 1) * pageSize;
  const order = query.columns.length ? query.columns : spec.columns.map((item) => item.id);
  const columns = order.flatMap((id) => {
    const column = spec.columns.find((item) => item.id === id);
    return column ? [column] : [];
  });
  return {
    rows: next.slice(start, start + pageSize),
    total,
    pages,
    empty: total === 0,
    columns,
  };
}

export function moveColumn(columns: string[], id: string, direction: -1 | 1): string[] {
  const index = columns.indexOf(id);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= columns.length) return columns;
  const copy = [...columns];
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy;
}

export function serializeListQuery(query: ListQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.sort) params.set("sort", query.sort);
  if (query.dir !== "asc") params.set("dir", query.dir);
  if (query.mode !== "value") params.set("mode", query.mode);
  if (query.page > 1) params.set("page", String(query.page));
  if (query.pageSize !== 25) params.set("size", String(query.pageSize));
  if (query.view) params.set("view", query.view);
  if (query.columns.length) params.set("cols", query.columns.join(","));
  for (const [key, value] of Object.entries(query.filters)) {
    if (value && value !== "All" && value !== "Any") params.set(`f.${key}`, value);
  }
  return params.toString();
}

export function parseListQuery(search: string, fallback: ListQuery): ListQuery {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const filters: Record<string, string> = {};
  params.forEach((value, key) => {
    if (key.startsWith("f.")) filters[key.slice(2)] = value;
  });
  const dir = params.get("dir") === "desc" ? "desc" : "asc";
  const mode = params.get("mode") === "count" || params.get("mode") === "recent" ? params.get("mode") as SortMode : "value";
  const page = Number(params.get("page") || fallback.page);
  const pageSize = Number(params.get("size") || fallback.pageSize);
  const columns = params.get("cols")?.split(",").filter(Boolean) ?? fallback.columns;
  return {
    q: params.get("q") ?? "",
    sort: params.get("sort") || fallback.sort,
    dir,
    mode,
    filters,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : fallback.pageSize,
    columns,
    view: params.get("view") ?? "",
  };
}

export function hashPath(hash: string): string {
  return hash.replace(/^#/, "").split("?")[0];
}

export function hashSearch(hash: string): string {
  const index = hash.indexOf("?");
  return index === -1 ? "" : hash.slice(index + 1);
}

export type OfficeRow = {
  name: string;
  email: string;
  type: string;
  status: string;
  agent: string;
  city: string;
  price: number;
  when: number;
  count: number;
  recent: number;
  stage: string;
  channel: string;
  due: string;
  title: string;
  key?: string;
};

const text = (row: OfficeRow) => `${row.name} ${row.email} ${row.title} ${row.city} ${row.agent}`;

function columns(extra: ColumnSpec<OfficeRow>[]): ColumnSpec<OfficeRow>[] {
  return extra;
}

export const OFFICE_LISTS: Record<string, ListSpec<OfficeRow>> = {
  leads: {
    id: "leads",
    search: text,
    columns: columns([
      { id: "name", label: "Name", value: (row) => row.name },
      { id: "pipeline", label: "Pipeline", value: (row) => row.status },
      { id: "registered", label: "Registered", value: (row) => row.when, recent: (row) => row.recent },
      { id: "city", label: "Price/City", value: (row) => row.city },
      { id: "timeframe", label: "Timeframe", value: (row) => row.due },
      { id: "login", label: "Last Login", value: (row) => row.when, count: (row) => row.count, recent: (row) => row.recent },
      { id: "touch", label: "Last Touch", value: (row) => row.when, count: (row) => row.count, recent: (row) => row.recent },
      { id: "reminder", label: "Next Reminder", value: (row) => row.due, count: (row) => row.count, recent: (row) => row.recent },
      { id: "activity", label: "Activity", value: (row) => row.count },
      { id: "assigned", label: "Assigned To", value: (row) => row.agent },
    ]),
    filters: [
      { id: "pipeline", label: "Pipeline", match: (row, value) => row.status === value },
      { id: "type", label: "Type", match: (row, value) => row.type === value },
      { id: "agent", label: "Agent", match: (row, value) => row.agent === value },
    ],
  },
  launchpad: {
    id: "launchpad",
    search: text,
    columns: columns([
      { id: "name", label: "Name", value: (row) => row.name },
      { id: "type", label: "Type", value: (row) => row.type },
      { id: "status", label: "Status", value: (row) => row.status },
      { id: "agent", label: "Agent", value: (row) => row.agent },
      { id: "when", label: "When", value: (row) => row.when, recent: (row) => row.recent },
    ]),
    filters: [
      { id: "type", label: "Type", match: (row, value) => row.type === value },
      { id: "status", label: "Status", match: (row, value) => row.status === value },
      { id: "agent", label: "Agent", match: (row, value) => row.agent === value },
    ],
  },
  deals: {
    id: "deals",
    search: text,
    columns: columns([
      { id: "client", label: "Client", value: (row) => row.name },
      { id: "stage", label: "Stage", value: (row) => row.stage },
      { id: "price", label: "Price", value: (row) => row.price },
      { id: "agent", label: "Agent", value: (row) => row.agent },
      { id: "created", label: "Created", value: (row) => row.when, recent: (row) => row.recent },
    ]),
    filters: [
      { id: "status", label: "Status", match: (row, value) => row.status === value },
      { id: "stage", label: "Stage", match: (row, value) => row.stage === value },
      { id: "agent", label: "Agent", match: (row, value) => row.agent === value },
    ],
  },
  communications: {
    id: "communications",
    search: text,
    columns: columns([
      { id: "from", label: "From", value: (row) => row.name },
      { id: "subject", label: "Subject", value: (row) => row.title },
      { id: "channel", label: "Channel", value: (row) => row.channel },
      { id: "when", label: "When", value: (row) => row.when, recent: (row) => row.recent },
    ]),
    filters: [
      { id: "channel", label: "Channel", match: (row, value) => row.channel === value },
      { id: "status", label: "Read", match: (row, value) => row.status === value },
    ],
  },
  tasks: {
    id: "tasks",
    search: text,
    columns: columns([
      { id: "title", label: "Title", value: (row) => row.title },
      { id: "due", label: "Due", value: (row) => row.due, count: (row) => row.count, recent: (row) => row.recent },
      { id: "status", label: "Status", value: (row) => row.status },
      { id: "agent", label: "Agent", value: (row) => row.agent },
    ]),
    filters: [
      { id: "status", label: "Status", match: (row, value) => row.status === value },
      { id: "agent", label: "Agent", match: (row, value) => row.agent === value },
    ],
  },
  calendar: {
    id: "calendar",
    search: text,
    columns: columns([
      { id: "title", label: "Title", value: (row) => row.title },
      { id: "when", label: "When", value: (row) => row.when, recent: (row) => row.recent },
      { id: "agent", label: "Agent", value: (row) => row.agent },
    ]),
    filters: [
      { id: "agent", label: "Agent", match: (row, value) => row.agent === value },
    ],
  },
  agents: {
    id: "agents",
    search: text,
    columns: columns([
      { id: "name", label: "Name", value: (row) => row.name },
      { id: "email", label: "Email", value: (row) => row.email },
      { id: "role", label: "Role", value: (row) => row.type },
      { id: "status", label: "Status", value: (row) => row.status },
    ]),
    filters: [
      { id: "role", label: "Role", match: (row, value) => row.type === value },
      { id: "status", label: "Status", match: (row, value) => row.status === value },
    ],
  },
  automations: {
    id: "automations",
    search: text,
    columns: columns([
      { id: "name", label: "Name", value: (row) => row.name },
      { id: "category", label: "Category", value: (row) => row.type },
      { id: "status", label: "Status", value: (row) => row.status },
      { id: "steps", label: "Steps", value: (row) => row.count },
    ]),
    filters: [
      { id: "category", label: "Category", match: (row, value) => row.type === value },
      { id: "status", label: "Status", match: (row, value) => row.status === value },
    ],
  },
  listings: {
    id: "listings",
    search: text,
    columns: columns([
      { id: "address", label: "Address", value: (row) => row.title },
      { id: "price", label: "Price", value: (row) => row.price },
      { id: "city", label: "City", value: (row) => row.city },
      { id: "status", label: "Status", value: (row) => row.status },
      { id: "agent", label: "Agent", value: (row) => row.agent },
    ]),
    filters: [
      { id: "status", label: "Status", match: (row, value) => row.status === value },
      { id: "city", label: "City", match: (row, value) => row.city === value },
      { id: "agent", label: "Agent", match: (row, value) => row.agent === value },
    ],
  },
  reports: {
    id: "reports",
    search: text,
    columns: columns([
      { id: "label", label: "Report", value: (row) => row.title },
      { id: "count", label: "Count", value: (row) => row.count },
      { id: "agent", label: "Agent", value: (row) => row.agent },
    ]),
    filters: [
      { id: "agent", label: "Agent", match: (row, value) => row.agent === value },
    ],
  },
};

export function sortColumnProps(spec: ListSpec<OfficeRow>) {
  return spec.columns.map((column) => ({ id: column.id, label: column.label, count: Boolean(column.count), recent: Boolean(column.recent) }));
}

export function checklistFor(spec: ListSpec<OfficeRow>): string[] {
  const lines = [`${spec.id}`];
  for (const column of spec.columns) {
    lines.push(`${spec.id} sort ${column.label} asc`);
    lines.push(`${spec.id} sort ${column.label} desc`);
    if (column.count) lines.push(`${spec.id} sort ${column.label} by count`);
    if (column.recent) lines.push(`${spec.id} sort ${column.label} by recency`);
  }
  for (const filter of spec.filters) lines.push(`${spec.id} filter ${filter.label}`);
  lines.push(`${spec.id} search`, `${spec.id} filters combine`, `${spec.id} page size`, `${spec.id} empty`);
  return lines;
}
