import assert from "node:assert/strict";
import test from "node:test";
import { upcomingWeekendDates, weekendOpenHouseLabel } from "./weekend-open-house";

test("Tuesday points at the coming Saturday and Sunday", () => {
  const dates = upcomingWeekendDates(new Date("2026-11-10T20:00:00Z"));
  assert.deepEqual(dates, ["2026-11-14", "2026-11-15"]);
});

test("a feed open house on that Saturday is labeled and others are not", () => {
  const now = new Date("2026-11-10T20:00:00Z");
  assert.equal(
    weekendOpenHouseLabel([{ date: "2026-11-14", start: "13:00", end: "15:00" }], now),
    "Open house Sat, 11/14 · 1:00 PM–3:00 PM"
  );
  assert.equal(weekendOpenHouseLabel([{ date: "2026-11-18", start: "13:00", end: "15:00" }], now), null);
  assert.equal(weekendOpenHouseLabel([], now), null);
});
