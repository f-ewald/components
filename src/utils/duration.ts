export type DurationFormat = "seconds" | "compact";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Formats a millisecond duration for display.
 *
 * `"seconds"` renders a whole-second count with a pluralized unit word (e.g.
 * "1 second", "12 seconds"). `"compact"` renders the shortest sensible
 * `Xh Ym Zs` form, dropping leading-zero units (`"12s"`, `"3m 12s"`,
 * `"1h 03m 12s"`) — minutes/seconds are zero-padded only once a larger unit
 * is present.
 */
export function formatDuration(ms: number, format: DurationFormat): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  if (format === "seconds") {
    return totalSeconds === 1 ? "1 second" : `${totalSeconds} seconds`;
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${pad2(minutes)}m ${pad2(seconds)}s`;
  if (minutes > 0) return `${minutes}m ${pad2(seconds)}s`;
  return `${seconds}s`;
}

/**
 * Formats a duration in seconds as a transport-bar clock label:
 * `M:SS` (e.g. `"3:45"`), or `H:MM:SS` once an hour is reached (e.g.
 * `"1:02:03"`). `NaN`/negative/non-finite input (e.g. a not-yet-loaded
 * media duration) renders as `"-:--"` rather than `"0:00"`, so a player can
 * distinguish "no reading yet" from an actual zero-length duration.
 */
export function formatClockDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "-:--";
  const whole = Math.floor(totalSeconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = whole % 60;
  if (hours > 0) return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
  return `${minutes}:${pad2(seconds)}`;
}
