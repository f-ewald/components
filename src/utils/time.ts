/**
 * Parses a timestamp from either SQLite's `datetime('now')` (a space-separated
 * UTC string with no zone marker, e.g. "2026-07-15 10:23:00") or a standard
 * ISO 8601 string. JS's `Date` parser treats the space-separated form as
 * local time, so it's coerced to `T...Z` first to anchor it to UTC.
 */
export function parseTimestamp(s: string): Date {
  const iso = s.includes(" ") && !s.includes("T") ? `${s.replace(" ", "T")}Z` : s;
  return new Date(iso);
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
];

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

/** Formats `date` relative to `now` (e.g. "3 hours ago", "in 2 days"). */
export function formatRelativeTime(date: Date, now: number = Date.now()): string {
  const diffSeconds = (date.getTime() - now) / 1000;
  const absSeconds = Math.abs(diffSeconds);
  if (absSeconds < 60) return "just now";
  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (absSeconds >= secondsInUnit) {
      return relativeFormatter.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }
  return relativeFormatter.format(Math.round(diffSeconds / 60), "minute");
}
