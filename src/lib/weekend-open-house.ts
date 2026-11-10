/** Dates use America/Vancouver. Open-house times come only from the feed. */

export type OpenHouseSlot = { date: string; start?: string; end?: string };

export function vancouverDateParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Vancouver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return { year: get("year"), month: get("month"), day: get("day"), weekday: get("weekday") };
}

function addDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Saturday and Sunday of the upcoming weekend in Vancouver. Sunday rolls to the next weekend. */
export function upcomingWeekendDates(now = new Date()): [string, string] {
  const { year, month, day, weekday } = vancouverDateParts(now);
  const today = `${year}-${month}-${day}`;
  const index: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const weekdayIndex = index[weekday] ?? 2;
  const untilSaturday = weekdayIndex === 0 ? 6 : (6 - weekdayIndex + 7) % 7;
  const saturday = addDays(today, untilSaturday);
  return [saturday, addDays(saturday, 1)];
}

export function weekendHeading(now = new Date()): string {
  const [saturday, sunday] = upcomingWeekendDates(now);
  const label = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-CA", {
      timeZone: "UTC",
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };
  return `${label(saturday)} and ${label(sunday)}`;
}

function clock(value?: string) {
  if (!value) return "";
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return value;
  const hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${suffix}`;
}

export function weekendOpenHouseLabel(slots: OpenHouseSlot[] | undefined, now = new Date()): string | null {
  if (!slots?.length) return null;
  const [saturday, sunday] = upcomingWeekendDates(now);
  const match = slots.find((slot) => slot.date === saturday || slot.date === sunday);
  if (!match?.date) return null;
  const day = match.date === saturday ? "Sat" : "Sun";
  const [, month, date] = match.date.split("-");
  const when = clock(match.start);
  const end = clock(match.end);
  const time = when && end ? `${when}–${end}` : when;
  return [`Open house ${day}, ${month}/${date}`, time].filter(Boolean).join(" · ");
}
