import type { StatusPillColor } from "../status-pill.js";
import type { CalendarEntry } from "../calendar-entry.js";

/** Plain data extracted from a `calendar-entry` element's properties. */
export interface CalendarEntryData {
  start: string;
  end: string;
  label: string;
  details?: string[];
  footer?: string;
  location?: string;
  color: StatusPillColor;
  href?: string;
}

/** A `CalendarEntryData` with its date strings resolved to local `Date`s. */
export interface ResolvedCalendarEntry extends CalendarEntryData {
  startDate: Date;
  endDate: Date;
}

/** A `ResolvedCalendarEntry` assigned a stacking column by `assignLanes`. */
export interface LanedEntry extends ResolvedCalendarEntry {
  lane: number;
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATETIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** Attributes whose mutations can change a rendered calendar entry. */
export const CALENDAR_ENTRY_ATTRIBUTES = ["start", "end", "label", "color", "href", "slot"];

/** Number of days in `month` (1-12) of `year`, leap years included. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Parses `"YYYY-MM-DD"` as a local-midnight `Date`. Returns `null` for
 * anything that doesn't match or doesn't round-trip (e.g. "2026-02-30") —
 * deliberately never uses `new Date(iso)`/`.toISOString()`, both of which
 * are UTC-based and would silently shift the date in negative-UTC-offset
 * timezones.
 */
export function parseIsoDate(iso: string): Date | null {
  const match = ISO_DATE_PATTERN.exec(iso);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

/** Formats a `Date`'s local year/month/day as `"YYYY-MM-DD"`. */
export function toIsoDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const monthNameFormatter = new Intl.DateTimeFormat(undefined, { month: "long" });

/** Locale-aware full month name for `month` (1-12). */
export function monthName(month: number): string {
  return monthNameFormatter.format(new Date(2000, month - 1, 1));
}

/** Sunday-first weekday abbreviations, indexed by `Date.getDay()` (0 = Sunday). */
export const WEEKDAY_ABBR: readonly string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Whether `date` falls on a Saturday or Sunday, per JS's `Date.getDay()`
 * convention (Sunday = 0 .. Saturday = 6) — note this differs from Python's
 * `calendar` module (Monday = 0), which the original reference
 * implementation this component's layout is based on used.
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** Reads normalized plain-text content from direct children assigned to a named slot. */
function slottedText(el: CalendarEntry, slotName: string): string[] {
  return Array.from(el.querySelectorAll<HTMLElement>(`:scope > [slot="${slotName}"]`))
    .map((node) => (node.textContent ?? "").replace(/\s+/g, " ").trim());
}

/** Reads a `calendar-entry` element's properties and named text slots into plain data. */
export function readCalendarEntryElement(el: CalendarEntry): CalendarEntryData {
  const title = slottedText(el, "title").find((line) => line.length > 0);
  const footer = slottedText(el, "footer").find((line) => line.length > 0);
  const location = slottedText(el, "location").find((line) => line.length > 0);
  return {
    start: el.start,
    end: el.end,
    label: title ?? el.label,
    details: slottedText(el, "detail"),
    footer,
    location,
    color: el.color,
    href: el.href,
  };
}

/**
 * Resolves a `CalendarEntryData`'s date strings to `Date`s. Returns `null`
 * when `start` is missing or unparseable — such entries are dropped
 * silently rather than thrown, since this reads declarative markup a
 * consumer authored, not validated user input. A blank `end` defaults to
 * `start` (single-day entry); an `end` before `start` is clamped up to
 * `start` rather than treated as an error.
 */
export function resolveEntry(data: CalendarEntryData): ResolvedCalendarEntry | null {
  const startDate = parseIsoDate(data.start);
  if (!startDate) return null;

  const endDate = parseIsoDate(data.end) ?? startDate;
  return {
    ...data,
    details: data.details ?? [],
    startDate,
    endDate: endDate < startDate ? startDate : endDate,
  };
}

/** Whether `entry`'s inclusive date range intersects the inclusive `[rangeStart, rangeEnd]` range. */
export function overlapsRange(entry: ResolvedCalendarEntry, rangeStart: Date, rangeEnd: Date): boolean {
  return entry.startDate <= rangeEnd && entry.endDate >= rangeStart;
}

/**
 * Assigns each entry a 0-based stacking lane via greedy interval
 * partitioning ("meeting rooms II"): entries are sorted by start date, then
 * each is placed in the lowest-numbered lane whose current occupant ends
 * strictly before the entry starts. Because entry ranges are
 * inclusive-inclusive, an entry ending on day X and one starting on day X
 * both occupy day X and must not share a lane — hence the strict `<`.
 *
 * Lane assignment is meant to be computed independently per `calendar-month`
 * (from only the entries overlapping that month); an entry spanning a month
 * boundary may therefore land in a different lane in adjacent months. This
 * is an accepted v1 limitation, not a bug.
 */
export function assignLanes(entries: ResolvedCalendarEntry[]): {
  entries: LanedEntry[];
  laneCount: number;
} {
  const sorted = entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const startDiff = a.entry.startDate.getTime() - b.entry.startDate.getTime();
      if (startDiff !== 0) return startDiff;
      const endDiff = a.entry.endDate.getTime() - b.entry.endDate.getTime();
      if (endDiff !== 0) return endDiff;
      return a.index - b.index;
    });

  const laneEnds: Date[] = [];
  const laned: LanedEntry[] = [];
  for (const { entry } of sorted) {
    let lane = laneEnds.findIndex((end) => end < entry.startDate);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(entry.endDate);
    } else {
      laneEnds[lane] = entry.endDate;
    }
    laned.push({ ...entry, lane });
  }

  return { entries: laned, laneCount: laneEnds.length };
}

/** Adds `days` (negative to subtract) to `date`, returning a new local `Date`. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** The Sunday (local midnight) of the week containing `date`, per `WEEKDAY_ABBR`'s Sunday-first convention. */
export function startOfWeek(date: Date): Date {
  return addDays(date, -date.getDay());
}

/** Minutes elapsed since local midnight on `date`'s day, for hour-grid vertical positioning. */
export function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Whether `iso` carries a time-of-day component (`"YYYY-MM-DDTHH:MM"`) rather than being date-only. */
export function hasTimeComponent(iso: string): boolean {
  return ISO_DATETIME_PATTERN.test(iso);
}

/**
 * Parses `"YYYY-MM-DDTHH:MM"` as a local `Date`, falling back to
 * `parseIsoDate` (local midnight) for a plain `"YYYY-MM-DD"` string. Returns
 * `null` for anything else, including a datetime whose components don't
 * round-trip (e.g. an invalid hour).
 */
export function parseIsoDateTime(iso: string): Date | null {
  const match = ISO_DATETIME_PATTERN.exec(iso);
  if (!match) return parseIsoDate(iso);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(match[4]);
  const minutes = Number(match[5]);
  const date = new Date(year, month - 1, day, hours, minutes);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes
  ) {
    return null;
  }
  return date;
}

/**
 * A `CalendarEntryData` resolved for hour-grid (`calendar-day`/`calendar-week`)
 * rendering. Reuses the `startDate`/`endDate` field names from
 * `ResolvedCalendarEntry` so it stays structurally compatible with
 * `assignLanes`/`overlapsRange` — both operate purely on those two `Date`
 * fields via `.getTime()`, which already generalizes correctly to sub-day
 * time granularity and multi-day ranges with no changes needed.
 */
export interface ResolvedTimedEntry extends CalendarEntryData {
  startDate: Date;
  endDate: Date;
  /** True when neither `start` nor `end` carries a time-of-day component. */
  allDay: boolean;
}

/**
 * Resolves a `CalendarEntryData`'s date/datetime strings for hour-grid
 * rendering. Returns `null` when `start` is missing or unparseable. A blank
 * `end` defaults to `start`; when `start` has a time but `end` doesn't (or is
 * blank), `end` defaults to one hour after `start` rather than clamping to
 * `start`'s instant, so a timed entry with no explicit end still renders as
 * a visible block. `allDay` is true only when neither endpoint carries a
 * time-of-day component — this is a separate, additive resolution path from
 * `resolveEntry`/`ResolvedCalendarEntry`, which stay date-only and are used
 * unchanged by `calendar-month`/`calendar-year`.
 */
export function resolveTimedEntry(data: CalendarEntryData): ResolvedTimedEntry | null {
  const startDate = parseIsoDateTime(data.start);
  if (!startDate) return null;

  const startHasTime = hasTimeComponent(data.start);
  const endHasTime = hasTimeComponent(data.end);
  const allDay = !startHasTime && !endHasTime;

  let endDate = data.end ? parseIsoDateTime(data.end) : null;
  if (!endDate) {
    endDate = startHasTime ? new Date(startDate.getTime() + 60 * 60 * 1000) : startDate;
  }

  return {
    ...data,
    details: data.details ?? [],
    startDate,
    endDate: endDate < startDate ? startDate : endDate,
    allDay,
  };
}
