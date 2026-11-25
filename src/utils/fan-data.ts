import { bisector } from "d3-array";
import { parseIsoDate } from "./calendar.js";
import type { FanChartProjectionPoint } from "./percentiles.js";

/** One observed (real, past) value in a `fan-chart`/`fan-table` series. */
export interface FanChartPoint {
  /** ISO date (`"YYYY-MM-DD"` or any `Date`-parseable string). */
  date: string;
  value: number;
}

/** One series in a `fan-chart`/`fan-table`: observed history and/or a projected percentile fan. */
export interface FanChartSeries {
  /** Stable identifier, used by `visible` and the legend. */
  id: string;
  /** Legend, column, and tooltip label. */
  label: string;
  /** Any CSS color. Defaults to the next theme color (primary, warning, danger, info, success). */
  color?: string;
  /** Observed values, drawn as a solid line. */
  actual?: FanChartPoint[];
  /** Projected values, drawn as percentile bands around a dashed median. */
  projection?: FanChartProjectionPoint[];
  /**
   * Individual simulated runs drawn as thin lines over the fan; each holds one
   * value per `projection` point, in the same order (see `samplePaths()`).
   */
  samples?: number[][];
}

/** A horizontal target line, e.g. a savings goal. */
export interface FanChartGoal {
  value: number;
  /** Line label, shown before the formatted value. Defaults to "Goal". */
  label?: string;
}

/** A labelled vertical marker, e.g. a retirement or house-purchase date. */
export interface FanChartEvent {
  /** ISO date (`"YYYY-MM-DD"` or any `Date`-parseable string). */
  date: string;
  label: string;
}

// Primary, warning, and danger stay distinct in every shipped theme (blueprint
// shares primary/info, the developer themes share primary/success).
export const FAN_COLORS = [
  "var(--ui-primary, #4f46e5)",
  "var(--ui-warning, #d97706)",
  "var(--ui-danger, #dc2626)",
  "var(--ui-info, #0ea5e9)",
  "var(--ui-success, #16a34a)",
];

export interface Sample {
  t: number;
  v: number;
}

export interface ProjectionSample {
  t: number;
  values: number[];
  goal?: number;
}

/** A series with parsed, sorted, validated points; projections start at the last observed value. */
export interface PreparedSeries {
  source: FanChartSeries;
  color: string;
  actual: Sample[];
  projection: ProjectionSample[];
  samples: Sample[][];
}

/** A series' value at one date. */
export interface FanValue {
  value: number;
  /** Projected percentile pairs, outermost first; empty for observed values. */
  bands: [number, number][];
  /** Share of runs at or above the goal, when the projection provides it. */
  goal: number | null;
  observed: boolean;
}

const byTime = bisector<{ t: number }, number>((p) => p.t);

/** Parses an ISO date (date-only strings as local midnight) to epoch milliseconds; NaN when invalid. */
export function toTime(date: string): number {
  return (parseIsoDate(date) ?? new Date(date)).getTime();
}

/** Returns the bracketing samples and interpolation weight at `t`, or null when `t` is outside the samples. */
export function bracket<T extends { t: number }>(points: T[], t: number): [T, T, number] | null {
  if (points.length === 0 || t < points[0].t || t > points[points.length - 1].t) return null;
  const i = byTime.left(points, t);
  const hi = points[i];
  if (hi.t === t || i === 0) return [hi, hi, 0];
  const lo = points[i - 1];
  return [lo, hi, (t - lo.t) / (hi.t - lo.t)];
}

export function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}

export function sameMonth(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth();
}

/** Median of one projection point, or the midpoint of the two middle values for an even percentile count. */
export function center(values: number[]): number {
  const n = values.length;
  const mid = Math.floor(n / 2);
  return n % 2 === 1 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

/**
 * Parses, validates, and sorts series for rendering. Projection points whose
 * `values` don't match `percentiles` are dropped, and each projection (and its
 * samples) is anchored at the last observed value so past and future connect.
 */
export function prepareSeries(
  series: FanChartSeries[],
  percentiles: number[],
  goal: number | undefined,
): PreparedSeries[] {
  const width = percentiles.length;
  return series.map((source, index) => {
    const actual = (source.actual ?? [])
      .map((p) => ({ t: toTime(p.date), v: p.value }))
      .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
      .sort((a, b) => a.t - b.t);
    const entries = (source.projection ?? [])
      .map((p, i) => ({ t: toTime(p.date), values: p.values, goal: p.goalProbability, i }))
      .filter((p) => Number.isFinite(p.t) && p.values.length === width && p.values.every(Number.isFinite))
      .sort((a, b) => a.t - b.t);
    const projection: ProjectionSample[] = entries.map(({ t, values, goal }) => ({ t, values, goal }));
    const samples = (source.samples ?? []).map((run) =>
      entries.map((e) => ({ t: e.t, v: run[e.i] })).filter((p) => Number.isFinite(p.v)),
    );
    const last = actual[actual.length - 1];
    if (last && projection.length > 0 && projection[0].t > last.t) {
      const reached = projection[0].goal !== undefined && goal !== undefined ? Number(last.v >= goal) : undefined;
      projection.unshift({ t: last.t, values: percentiles.map(() => last.v), goal: reached });
      for (const run of samples) if (run.length > 0) run.unshift({ t: last.t, v: last.v });
    }
    return { source, color: source.color ?? FAN_COLORS[index % FAN_COLORS.length], actual, projection, samples };
  });
}

/** IDs of the series to show: `visible` filtered to known IDs, or all when that leaves none. */
export function visibleIds(series: PreparedSeries[], visible: string[] | null): Set<string> {
  const ids = series.map((s) => s.source.id);
  const shown = visible === null ? ids : ids.filter((id) => visible.includes(id));
  return new Set(shown.length > 0 ? shown : ids);
}

/**
 * Interpolates a series at `t`: the observed value when `t` is within its
 * history, otherwise the projected median, bands, and goal share. Returns null
 * when `t` is outside the series.
 */
export function valueAt(series: PreparedSeries, t: number, withGoal: boolean): FanValue | null {
  const seen = bracket(series.actual, t);
  if (seen) {
    const [a, b, k] = seen;
    return { value: lerp(a.v, b.v, k), bands: [], goal: null, observed: true };
  }
  const projected = bracket(series.projection, t);
  if (!projected) return null;
  const [a, b, k] = projected;
  const n = a.values.length;
  if (n === 0) return null;
  const values = a.values.map((v, i) => lerp(v, b.values[i], k));
  const bands = Array.from({ length: Math.floor(n / 2) }, (_, i): [number, number] => [values[i], values[n - 1 - i]]);
  const goal = withGoal && a.goal !== undefined && b.goal !== undefined ? lerp(a.goal, b.goal, k) : null;
  return { value: center(values), bands, goal, observed: false };
}

/** Names the outer range and inner bands, e.g. ["P10–P90", "P25–P75"]. */
export function bandNames(percentiles: number[]): string[] {
  const n = percentiles.length;
  return Array.from({ length: Math.floor(n / 2) }, (_, i) => `P${percentiles[i]}–P${percentiles[n - 1 - i]}`);
}

/** Cached `Intl` currency and date formatting; invalid locales or currencies fall back to en-US / USD. */
export class FanFormatter {
  private readonly cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();

  /** Formats `value` as `currency` in `locale`, compact (`$1.2M`, 3 significant digits) or whole units. */
  money(value: number, locale: string, currency: string, compact: boolean): string {
    const key = `n|${locale}|${currency}|${compact}`;
    let format = this.cache.get(key) as Intl.NumberFormat | undefined;
    if (!format) {
      const options: Intl.NumberFormatOptions = compact
        ? { style: "currency", currency, notation: "compact", maximumSignificantDigits: 3 }
        : { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 };
      try {
        format = new Intl.NumberFormat(locale, options);
      } catch {
        format = new Intl.NumberFormat("en-US", { ...options, currency: "USD" });
      }
      this.cache.set(key, format);
    }
    return format.format(value);
  }

  /** Formats epoch milliseconds `t` in `locale`. */
  date(t: number, locale: string, options: Intl.DateTimeFormatOptions): string {
    const key = `d|${locale}|${JSON.stringify(options)}`;
    let format = this.cache.get(key) as Intl.DateTimeFormat | undefined;
    if (!format) {
      try {
        format = new Intl.DateTimeFormat(locale, options);
      } catch {
        format = new Intl.DateTimeFormat("en-US", options);
      }
      this.cache.set(key, format);
    }
    return format.format(t);
  }
}
