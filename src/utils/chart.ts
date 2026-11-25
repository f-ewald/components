import { scaleLinear, scaleLog, scaleTime } from "d3-scale";
import { parseIsoDate } from "./calendar.js";

/** A position on a chart axis: a number, numeric string, ISO date string, or `Date`. */
export type ChartAxisValue = string | number | Date;

/** Supported axis scale types. */
export type ChartAxisType = "linear" | "log" | "time";

/** Supported sequential and diverging color schemes for heatmaps and continuous encodings. */
export type HeatmapColorScheme = "heat" | "blue" | "green" | "plasma" | "diverging";

/**
 * Attribute converter for `true`-by-default boolean properties: accepts both
 * JS `.prop=${false}` and HTML `prop="false"`, while omitted/bare/`"true"`
 * attributes stay `true`.
 */
export const defaultTrueBoolean = {
  fromAttribute: (value: string | null) => value !== "false",
  toAttribute: (value: boolean) => (value ? "" : "false"),
};

/** Unified numeric scale interface (epoch ms for time scales). */
export interface ChartScale {
  (value: number): number;
  invert(px: number): number;
  ticks(count: number): number[];
  domain: [number, number];
}

// Primary, warning, and danger stay distinct in every shipped theme.
export const CHART_COLORS = [
  "var(--ui-primary, #4f46e5)",
  "var(--ui-warning, #d97706)",
  "var(--ui-danger, #dc2626)",
  "var(--ui-info, #0ea5e9)",
  "var(--ui-success, #16a34a)",
];

const DAY_MS = 86_400_000;
const YEAR_MS = 365.25 * DAY_MS;

const COLOR_RAMPS: Record<HeatmapColorScheme, readonly string[]> = {
  heat: ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#f03b20", "#bd0026"],
  blue: ["#eff6ff", "#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8", "#1e3a8a"],
  green: ["#f0fdf4", "#bbf7d0", "#4ade80", "#16a34a", "#15803d", "#14532d"],
  plasma: ["#0d0887", "#6a00a8", "#b12a90", "#e16462", "#fca636", "#f0f921"],
  diverging: ["#1d4ed8", "#60a5fa", "#dbeafe", "#f8fafc", "#fecaca", "#f87171", "#b91c1c"],
};

/** Parses an axis value for `type` into a number (epoch ms for `"time"`); `NaN` when invalid or `<= 0` on `"log"`. */
export function parseAxisValue(value: ChartAxisValue, type: ChartAxisType): number {
  if (value instanceof Date) return value.getTime();
  if (type === "time") {
    if (typeof value === "number") return value;
    return (parseIsoDate(value) ?? new Date(value)).getTime();
  }
  const n = typeof value === "number" ? value : value.trim() === "" ? Number.NaN : Number(value);
  return type === "log" && !(n > 0) ? Number.NaN : n;
}

/**
 * Keeps 1/2/5 × 10ⁿ ticks of a log scale, or only powers of ten when there are
 * more than `limit`. A narrow range within about one decade keeps every
 * `limit`-th tick instead so at least a few ticks stay visible.
 */
export function logTicks(ticks: number[], limit = 8): number[] {
  const leading = (v: number) => v / 10 ** Math.floor(Math.log10(v) + 1e-9);
  const nice = ticks.filter((v) => [1, 2, 5].some((d) => Math.abs(leading(v) - d) < 1e-6));
  if (nice.length < 3) {
    const every = Math.ceil(ticks.length / Math.max(limit, 2));
    return ticks.filter((_, i) => i % every === 0);
  }
  return nice.length > limit ? nice.filter((v) => Math.abs(leading(v) - 1) < 1e-6) : nice;
}

/** Builds a linear, log, or time scale over `[lo, hi]` mapped onto `range`. */
export function buildAxisScale(
  type: ChartAxisType,
  lo: number,
  hi: number,
  range: [number, number],
  options: { reverse?: boolean; nice?: boolean } = {},
): ChartScale {
  const { reverse = false, nice = false } = options;
  let d0 = lo;
  let d1 = hi;
  if (!(d1 > d0)) {
    if (type === "time") d1 = d0 + DAY_MS;
    else if (type === "log") {
      d0 = d0 > 0 ? d0 / 2 : 0.1;
      d1 = d0 * 10;
    } else {
      d1 = d0 + 1;
    }
  }
  if (type === "time") {
    const scale = scaleTime<number, number>().domain([new Date(d0), new Date(d1)]);
    if (nice) scale.nice();
    const [nd0, nd1] = scale.domain().map((d) => d.getTime());
    scale.domain(reverse ? [new Date(nd1), new Date(nd0)] : [new Date(nd0), new Date(nd1)]).range(range);
    return Object.assign((v: number) => scale(v), {
      invert: (px: number) => scale.invert(px).getTime(),
      ticks: (count: number) => scale.ticks(count).map((d) => d.getTime()),
      domain: [nd0, nd1] as [number, number],
    });
  }
  if (type === "log") {
    const safeLo = d0 > 0 ? d0 : 1e-3;
    const safeHi = Math.max(d1, safeLo * 10);
    const scale = scaleLog().domain([safeLo, safeHi]);
    if (nice) scale.nice();
    const [nd0, nd1] = scale.domain();
    scale.domain(reverse ? [nd1, nd0] : [nd0, nd1]).range(range).clamp(true);
    return Object.assign((v: number) => scale(Math.max(v, nd0)), {
      invert: (px: number) => scale.invert(px),
      ticks: (count: number) => logTicks(scale.ticks(), Math.max(count, 2)),
      domain: [nd0, nd1] as [number, number],
    });
  }
  const scale = scaleLinear().domain([d0, d1]);
  if (nice) scale.nice();
  const [nd0, nd1] = scale.domain();
  scale.domain(reverse ? [nd1, nd0] : [nd0, nd1]).range(range);
  return Object.assign((v: number) => scale(v), {
    invert: (px: number) => scale.invert(px),
    ticks: (count: number) => scale.ticks(count),
    domain: [nd0, nd1] as [number, number],
  });
}

/** Chooses `Intl.DateTimeFormatOptions` suited to a time axis span. */
export function timeTickOptions(spanMs: number): Intl.DateTimeFormatOptions {
  if (spanMs >= 3 * YEAR_MS) return { year: "numeric" };
  if (spanMs >= YEAR_MS / 4) return { month: "short", year: "2-digit" };
  if (spanMs >= 2 * DAY_MS) return { month: "short", day: "numeric" };
  return { hour: "numeric", minute: "2-digit" };
}

/** Cached locale-aware number and date formatter with en-US fallback. */
export class ChartFormatter {
  private readonly cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();

  /** Formats a number compactly (`1.2K`, `0.45`) in `locale`. */
  number(value: number, locale: string): string {
    const key = `n|${locale}`;
    let format = this.cache.get(key) as Intl.NumberFormat | undefined;
    if (!format) {
      const options: Intl.NumberFormatOptions = { notation: "compact", maximumSignificantDigits: 3 };
      try {
        format = new Intl.NumberFormat(locale, options);
      } catch {
        format = new Intl.NumberFormat("en-US", options);
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

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, "");
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const byte = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${byte(r)}${byte(g)}${byte(b)}`;
}

/** Samples a built-in color ramp at normalized `t` in `[0, 1]`. */
export function sampleColorRamp(scheme: HeatmapColorScheme, t: number): string {
  const stops = COLOR_RAMPS[scheme] ?? COLOR_RAMPS.heat;
  const clamped = Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0));
  const pos = clamped * (stops.length - 1);
  const i = Math.min(Math.floor(pos), stops.length - 2);
  const frac = pos - i;
  const a = hexToRgb(stops[i])!;
  const b = hexToRgb(stops[i + 1])!;
  return rgbToHex(a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac, a[2] + (b[2] - a[2]) * frac);
}

/** Returns a CSS `linear-gradient(90deg, ...)` string matching `scheme`. */
export function rampCssGradient(scheme: HeatmapColorScheme): string {
  const stops = COLOR_RAMPS[scheme] ?? COLOR_RAMPS.heat;
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

/** Returns true when white text achieves higher WCAG contrast on `color` than dark slate (`#0f172a`). */
export function needsLightText(color: string): boolean {
  let rgb = hexToRgb(color);
  if (!rgb) {
    const match = color.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    if (!match) return false;
    rgb = [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  const linearize = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * linearize(rgb[0]) + 0.7152 * linearize(rgb[1]) + 0.0722 * linearize(rgb[2]);
  // Midpoint luminance between #ffffff (1.0) and #0f172a (~0.008) in WCAG contrast ratio space.
  return lum < 0.22;
}

/**
 * Computes the next `visible` ID list after a legend interaction:
 * plain click isolates `id` (or shows all again when it is already isolated);
 * `toggle` adds or removes `id`. Returns `null` when all items are visible.
 */
export function toggleLegendVisibility(
  allIds: string[],
  visible: string[] | null,
  id: string,
  toggle: boolean,
): string[] | null {
  const current = allIds.filter((i) => visible === null || visible.includes(i));
  const shown = current.length > 0 ? current : allIds;
  let next: string[] | null;
  if (toggle) {
    next = shown.includes(id)
      ? shown.filter((i) => i !== id)
      : allIds.filter((i) => i === id || shown.includes(i));
  } else {
    next = shown.length === 1 && shown[0] === id ? null : [id];
  }
  if (next !== null && (next.length === 0 || next.length === allIds.length)) return null;
  return next;
}

/** Resolves the active ID set: `visible` filtered to `allIds`, falling back to all when empty. */
export function resolveVisibleIds(allIds: string[], visible: string[] | null): Set<string> {
  const shown = visible === null ? allIds : allIds.filter((id) => visible.includes(id));
  return new Set(shown.length > 0 ? shown : allIds);
}
