import type { StatusPillColor } from "../status-pill.js";
import type { CalendarEntry } from "../calendar-entry.js";

/** Plain data extracted from a `calendar-entry` element's properties. */
export interface CalendarEntryData {
  start: string;
  end: string;
  label: string;
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

/** Reads a `calendar-entry` element's properties into a plain data object. */
export function readCalendarEntryElement(el: CalendarEntry): CalendarEntryData {
  return {
    start: el.start,
    end: el.end,
    label: el.label,
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
