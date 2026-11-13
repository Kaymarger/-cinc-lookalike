import assert from "node:assert/strict";
import test from "node:test";
import { OFFICE_LISTS, applyOfficeList, defaultListQuery, parseListQuery, serializeListQuery, checklistFor, type ListQuery } from "./office-list.ts";

type Row = {
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
};

function row(patch: Partial<Row>): Row {
  return {
    name: "Ada",
    email: "ada@example.com",
    type: "Buyer",
    status: "New",
    agent: "Casey",
    city: "Vancouver",
    price: 100,
    when: 1,
    count: 1,
    recent: 1,
    stage: "Showing",
    channel: "email",
    due: "Today",
    title: "Note",
    ...patch,
  };
}

const sample: Row[] = [
  row({ name: "Ada", status: "New", type: "Buyer", agent: "Casey", city: "Vancouver", price: 200, when: 2, count: 5, recent: 20, stage: "Showing", channel: "email", due: "Today", title: "A" }),
  row({ name: "Bea", status: "Contacted", type: "Seller", agent: "Kayla", city: "Burnaby", price: 50, when: 1, count: 1, recent: 5, stage: "Offer", channel: "text", due: "Tomorrow", title: "B" }),
  row({ name: "Cal", status: "New", type: "Buyer", agent: "Kayla", city: "Vancouver", price: 900, when: 3, count: 9, recent: 50, stage: "Showing", channel: "email", due: "Next", title: "C" }),
];

for (const spec of Object.values(OFFICE_LISTS)) {
  test(`${spec.id} sorts every column both ways`, () => {
    for (const column of spec.columns) {
      for (const dir of ["asc", "desc"] as const) {
        const query = { ...defaultListQuery(column.id, []), dir, pageSize: 25 };
        const result = applyOfficeList(sample, spec, query);
        const values = result.rows.map((item) => column.value(item));
        const sorted = [...values].sort((a, b) => typeof a === "number" && typeof b === "number" ? (a - b) * (dir === "asc" ? 1 : -1) : String(a).localeCompare(String(b)) * (dir === "asc" ? 1 : -1));
        assert.deepEqual(values, sorted, `${spec.id} ${column.id} ${dir}`);
      }
      if (column.count) {
        const query = { ...defaultListQuery(column.id, []), mode: "count" as const };
        const values = applyOfficeList(sample, spec, query).rows.map((item) => column.count!(item));
        assert.deepEqual(values, [...values].sort((a, b) => a - b));
      }
      if (column.recent) {
        const query = { ...defaultListQuery(column.id, []), mode: "recent" as const, dir: "desc" as const };
        const values = applyOfficeList(sample, spec, query).rows.map((item) => column.recent!(item));
        assert.deepEqual(values, [...values].sort((a, b) => b - a));
      }
    }
  });

  test(`${spec.id} filters combine with search and page size`, () => {
    const ada = sample[0];
    const filters: Record<string, string> = {};
    for (const filter of spec.filters) {
      const value = ["New", "Buyer", "Casey", "Vancouver", "email", "Showing", "Today"].find((item) => filter.match(ada, item));
      if (value) filters[filter.id] = value;
    }
    const query: ListQuery = { ...defaultListQuery(spec.columns[0].id, []), q: "ada", filters, pageSize: 1 };
    const result = applyOfficeList(sample, spec, query);
    assert.ok(result.rows.length <= 1);
    if (result.rows[0]) assert.match(spec.search(result.rows[0]).toLowerCase(), /ada/);
    for (const filter of spec.filters) {
      if (!filters[filter.id]) continue;
      for (const row of result.rows) assert.equal(filter.match(row, filters[filter.id]), true);
    }
    const empty = applyOfficeList(sample, spec, { ...defaultListQuery(spec.columns[0].id, []), q: "no-such-lead" });
    assert.equal(empty.empty, true);
    assert.equal(empty.rows.length, 0);
  });

  test(`${spec.id} query round-trips through the URL`, () => {
    const query = { ...defaultListQuery(spec.columns[0].id, [spec.columns[0].id]), q: "ada", dir: "desc" as const, mode: "count" as const, page: 2, pageSize: 10, view: "Mine", filters: { agent: "Casey" } };
    const again = parseListQuery(serializeListQuery(query), defaultListQuery("other", []));
    assert.equal(again.q, "ada");
    assert.equal(again.dir, "desc");
    assert.equal(again.mode, "count");
    assert.equal(again.page, 2);
    assert.equal(again.pageSize, 10);
    assert.equal(again.view, "Mine");
    assert.equal(again.filters.agent, "Casey");
    assert.deepEqual(again.columns, [spec.columns[0].id]);
    assert.ok(checklistFor(spec).length > spec.columns.length);
  });
}
