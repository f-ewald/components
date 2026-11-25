import { LitElement, css, html, nothing, svg } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { bisector, max, min } from "d3-array";
import { area, curveLinear, curveMonotoneX, line } from "d3-shape";
import { tokens } from "./tokens.js";
import {
  CHART_COLORS,
  ChartFormatter,
  buildAxisScale,
  defaultTrueBoolean,
  parseAxisValue,
  resolveVisibleIds,
  timeTickOptions,
  toggleLegendVisibility,
  type ChartAxisType,
  type ChartAxisValue,
  type ChartScale,
} from "./utils/chart.js";

/** One data point in a `line-chart` series. */
export interface LineChartPoint {
  /** X position: a number on `"linear"`/`"log"` axes, or a date on `"time"` axes. */
  x: ChartAxisValue;
  /** Y value. */
  y: number;
  /** Optional point label shown in the tooltip. */
  label?: string;
  /** Optional identifier returned in `line-point-select`. */
  id?: string;
}

/** One shaded confidence/percentile band slice along a `line-chart` series. */
export interface LineChartBandPoint {
  x: ChartAxisValue;
  low: number;
  high: number;
}

/** One series rendered by `line-chart`. */
export interface LineChartSeries {
  /** Stable identifier used by `visible` and the legend. */
  id: string;
  /** Legend and tooltip label. */
  label: string;
  /** Optional CSS color. Defaults to the next theme color. */
  color?: string;
  /** Draws the line dashed (e.g. a baseline or reference model). */
  dashed?: boolean;
  /** Draws point markers for this series even when `show-points` is false. */
  showPoints?: boolean;
  /** Ordered or unordered data points; sorted ascending by x during layout. */
  points: LineChartPoint[];
  /** Optional shaded range around the line (e.g. 10–90% confidence band). */
  band?: LineChartBandPoint[];
}

/** A horizontal, vertical, or diagonal (`y = x`) reference line on a `line-chart`. */
export type LineChartReference =
  | {
      axis: "x" | "y";
      value: ChartAxisValue;
      /** Optional label drawn beside the line. */
      label?: string;
      /** Dashed stroke (default true). */
      dashed?: boolean;
      /** Optional CSS stroke/label color. */
      color?: string;
    }
  | {
      axis: "diagonal";
      label?: string;
      dashed?: boolean;
      color?: string;
    };

/** One series value reported by `line-point-select`. */
export interface LineChartSelectedValue {
  seriesId: string;
  label: string;
  x: number;
  y: number;
  /** Original point when `x` matched an explicit data point. */
  point?: LineChartPoint;
}

interface PreparedPoint {
  x: number;
  y: number;
  rawX: ChartAxisValue;
  source: LineChartPoint;
}

interface PreparedBandPoint {
  x: number;
  low: number;
  high: number;
}

interface PreparedSeries {
  source: LineChartSeries;
  color: string;
  points: PreparedPoint[];
  band: PreparedBandPoint[];
}

interface Layout {
  width: number;
  height: number;
  top: number;
  left: number;
  plotW: number;
  bottom: number;
  x: ChartScale;
  y: ChartScale;
  xs: number[];
  step: number;
  visible: PreparedSeries[];
}

interface HoverRow {
  series: PreparedSeries;
  y: number;
  band?: [number, number];
  point?: LineChartPoint;
}

const MARGIN = { top: 18, right: 16, bottom: 28 };
const X_LABEL_PX = 18;
const Y_LABEL_PX = 16;
const TICK_FONT_PX = 11;
const TOOLTIP_W = 240;
const LONG_PRESS_MS = 500;
const DAY_MS = 86_400_000;

const byX = bisector<{ x: number }, number>((p) => p.x);

function interpolateY(points: PreparedPoint[], x: number): { y: number; point?: LineChartPoint } | null {
  if (points.length === 0 || x < points[0].x || x > points[points.length - 1].x) return null;
  const i = byX.left(points, x);
  const hi = points[i];
  if (hi.x === x) return { y: hi.y, point: hi.source };
  if (i === 0) return null;
  const lo = points[i - 1];
  const k = (x - lo.x) / (hi.x - lo.x);
  return { y: lo.y + (hi.y - lo.y) * k };
}

function interpolateBand(band: PreparedBandPoint[], x: number): [number, number] | undefined {
  if (band.length === 0 || x < band[0].x || x > band[band.length - 1].x) return undefined;
  const i = byX.left(band, x);
  const hi = band[i];
  if (hi.x === x || i === 0) return [hi.low, hi.high];
  const lo = band[i - 1];
  const k = (x - lo.x) / (hi.x - lo.x);
  return [lo.low + (hi.low - lo.low) * k, lo.high + (hi.high - lo.high) * k];
}

function inWindow<T extends { x: number }>(points: T[], [lo, hi]: [number, number]): T[] {
  const first = points.findIndex((p) => p.x >= lo);
  if (first === -1) return points.slice(-1);
  let last = first;
  while (last < points.length && points[last].x <= hi) last++;
  return points.slice(Math.max(first - 1, 0), last + 1);
}

/**
 * Multi-series line chart supporting linear, logarithmic, and time axes,
 * optional shaded bands, horizontal/vertical/diagonal reference lines, a
 * highlighted `selected-x` cursor, and clickable points.
 *
 * The interactive legend isolates a series on click (clicking it again shows
 * all) and toggles one on Ctrl/Cmd-click or a touch long press. Hover, tap, or
 * drag — or focus the plot and use `←`/`→`/`Home`/`End` — to inspect values;
 * click or press `Enter`/`Space` to emit `line-point-select`; `Escape` or a
 * tap outside dismisses the tooltip.
 *
 * @element line-chart
 * @fires line-point-select - User clicked a point/x position or pressed Enter/Space. `detail: { x: number, rawX: ChartAxisValue, points: LineChartSelectedValue[] }`.
 * @fires series-visibility-change - Legend changed visible series. `detail: { visible: string[] | null }` (null = all).
 */
@customElement("line-chart")
export class LineChart extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        width: 100%;
        color: var(--ui-text, #0f172a);
        font-family: var(
          --ui-font,
          ui-sans-serif,
          system-ui,
          sans-serif,
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji"
        );
      }
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        margin-bottom: 0.5rem;
      }
      .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        box-sizing: border-box;
        min-height: 2rem;
        padding: 0.25rem 0.5rem;
        border: none;
        border-radius: var(--ui-radius-sm, 0.25rem);
        background: none;
        color: var(--ui-text, #0f172a);
        font-family: var(
          --ui-font,
          ui-sans-serif,
          system-ui,
          sans-serif,
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji"
        );
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: var(--ui-line-height-tight, 1.25);
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        transition: background-color 150ms ease, color 150ms ease;
      }
      .legend-item.static {
        cursor: default;
      }
      .legend-item.static:hover {
        background: none;
      }
      .legend-item:hover {
        background: var(--ui-surface-muted, #f8fafc);
      }
      .legend-item:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .legend-item[aria-pressed="false"],
      .legend-item.dimmed {
        color: var(--ui-text-muted, #64748b);
      }
      .swatch {
        flex: none;
        width: 1rem;
        height: 2px;
        border-radius: var(--ui-radius-pill, 9999px);
        background: currentColor;
      }
      .swatch.dashed {
        background: repeating-linear-gradient(90deg, currentColor 0 5px, transparent 5px 9px);
      }
      .legend-item[aria-pressed="false"] .swatch,
      .legend-item.dimmed .swatch {
        opacity: 0.35;
      }
      .plot {
        position: relative;
        border-radius: var(--ui-radius-sm, 0.25rem);
        touch-action: pan-y;
      }
      .plot:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      svg {
        display: block;
        overflow: visible;
      }
      .axis-label {
        fill: var(--ui-text-muted, #64748b);
        font-variant-numeric: var(--ui-numeric, normal);
      }
      .axis-title {
        fill: var(--ui-text-muted, #64748b);
        font-weight: var(--ui-font-weight-medium, 500);
      }
      .grid-line {
        stroke: var(--ui-border, #e2e8f0);
      }
      .ref-line {
        stroke: var(--ui-text-muted, #64748b);
        stroke-opacity: 0.7;
      }
      .ref-label {
        fill: var(--ui-text-muted, #64748b);
        paint-order: stroke;
        stroke: var(--ui-surface, #ffffff);
        stroke-width: 3px;
        stroke-linejoin: round;
      }
      .selected-line {
        stroke: var(--ui-primary, #4f46e5);
      }
      .point {
        stroke: var(--ui-surface, #ffffff);
        cursor: pointer;
      }
      .point.static {
        cursor: default;
      }
      .crosshair {
        stroke: var(--ui-text-muted, #64748b);
      }
      .hover-dot {
        stroke: var(--ui-surface, #ffffff);
      }
      .message {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--ui-text-muted, #64748b);
        font-size: var(--ui-font-size-sm, 0.75rem);
      }
      .tooltip {
        position: absolute;
        top: 0;
        box-sizing: border-box;
        width: 15rem;
        padding: 0.5rem 0.75rem;
        border-radius: var(--ui-radius-sm, 0.25rem);
        background: var(--ui-tooltip, #0f172a);
        color: var(--ui-tooltip-text, #ffffff);
        font-size: var(--ui-font-size-xs, 0.6875rem);
        line-height: var(--ui-line-height-normal, 1.5);
        font-variant-numeric: var(--ui-numeric, normal);
        pointer-events: none;
      }
      .tooltip-head {
        font-weight: var(--ui-font-weight-semibold, 600);
      }
      .tooltip-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .tooltip-dot {
        flex: none;
        width: 0.5rem;
        height: 0.5rem;
        border-radius: var(--ui-radius-circle, 50%);
        background: currentColor;
      }
      .tooltip-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .tooltip-sub {
        margin-left: 1rem;
        opacity: 0.75;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      @media (forced-colors: active) {
        .legend-item:focus-visible,
        .plot:focus-visible {
          outline: 2px solid CanvasText;
        }
        .tooltip {
          border: 1px solid CanvasText;
        }
        .swatch,
        .tooltip-dot {
          forced-color-adjust: none;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .legend-item {
          transition: none;
        }
      }
    `,
  ];

  /** Series to draw. Assign a new array to redraw. */
  @property({ attribute: false }) series: LineChartSeries[] = [];
  /** X axis scale: numeric `"linear"` (default), `"log"`, or `"time"`. */
  @property({ attribute: "x-type" }) xType: ChartAxisType = "linear";
  /** Y axis scale: `"linear"` (default) or `"log"`. */
  @property({ attribute: "y-type" }) yType: "linear" | "log" = "linear";
  /** Optional x axis title drawn below tick labels. */
  @property({ attribute: "x-label" }) xLabel = "";
  /** Optional y axis title drawn along the left edge. */
  @property({ attribute: "y-label" }) yLabel = "";
  /** Fixed x axis range `[start, end]`; `null` fits the data. */
  @property({ attribute: false }) xDomain: [ChartAxisValue, ChartAxisValue] | null = null;
  /** Fixed y axis range `[min, max]`; `null` fits the visible data. */
  @property({ attribute: false }) yDomain: [number, number] | null = null;
  /** Runs the x axis right to left; keyboard arrows still move visually. */
  @property({ type: Boolean, reflect: true, attribute: "x-reverse" }) xReverse = false;
  /** Line interpolation: `"linear"` (default) or `"monotone"`. */
  @property() curve: "linear" | "monotone" = "linear";
  /** Draws markers on every point; series can also set `showPoints` individually. */
  @property({ type: Boolean, reflect: true, attribute: "show-points" }) showPoints = false;
  /** Optional vertical selection highlight at an x position. */
  @property({ attribute: "selected-x" }) selectedX: ChartAxisValue | null = null;
  /** Horizontal, vertical, or diagonal (`y = x`) reference lines. */
  @property({ attribute: false }) references: LineChartReference[] = [];
  /** Visible series IDs; `null` (default) shows all. Updated by the legend. */
  @property({ attribute: false }) visible: string[] | null = null;
  /** Plot height in CSS pixels, excluding the legend. */
  @property({ type: Number }) height = 300;
  /** BCP 47 locale for default number and date formatting. */
  @property() locale = "en-US";
  /** Custom formatter for x ticks, tooltip header, and summary. */
  @property({ attribute: false }) xFormat: ((x: number) => string) | null = null;
  /** Custom formatter for y ticks, tooltip values, and summary. */
  @property({ attribute: false }) yFormat: ((y: number) => string) | null = null;
  /** Enables clicking points and legend toggling (default `true`; accepts `interactive="false"`). */
  @property({ type: Boolean, converter: defaultTrueBoolean }) interactive = true;
  /** Shows the hover/tap/keyboard tooltip and crosshair (default `true`; accepts `tooltip="false"`). */
  @property({ type: Boolean, converter: defaultTrueBoolean }) tooltip = true;

  @state() private _width = 0;
  @state() private _hoverX: number | null = null;
  @state() private _announcement = "";

  private _ro: ResizeObserver | null = null;
  private _pressTimer: ReturnType<typeof setTimeout> | null = null;
  private _suppressClick = false;
  private _pinned = false;
  private _layout: Layout | null = null;
  private _formatter = new ChartFormatter();

  override connectedCallback() {
    super.connectedCallback();
    this._ro = new ResizeObserver((entries) => {
      const width = Math.floor(entries[0].contentRect.width);
      if (width !== this._width) this._width = width;
    });
    this._ro.observe(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._ro?.disconnect();
    this._ro = null;
    this._cancelPress();
    this._unpin();
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has("tooltip") && !this.tooltip) {
      this._hoverX = null;
      this._announcement = "";
      this._unpin();
    }
  }

  private _formatY(value: number): string {
    return this.yFormat ? this.yFormat(value) : this._formatter.number(value, this.locale);
  }

  private _formatX(x: number, span?: number, step = Infinity): string {
    if (this.xFormat) return this.xFormat(x);
    if (this.xType !== "time") return this._formatter.number(x, this.locale);
    if (span !== undefined) return this._formatter.date(x, this.locale, timeTickOptions(span));
    const options: Intl.DateTimeFormatOptions =
      step < 28 * DAY_MS ? { day: "numeric", month: "short", year: "numeric" } : { month: "short", year: "numeric" };
    return this._formatter.date(x, this.locale, options);
  }

  private _prepare(): PreparedSeries[] {
    return this.series.map((source, index) => {
      const points = source.points
        .map((p) => ({ x: parseAxisValue(p.x, this.xType), y: p.y, rawX: p.x, source: p }))
        .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && (this.yType !== "log" || p.y > 0))
        .sort((a, b) => a.x - b.x);
      const band = (source.band ?? [])
        .map((b) => ({ x: parseAxisValue(b.x, this.xType), low: b.low, high: b.high }))
        .filter(
          (b) =>
            Number.isFinite(b.x) &&
            Number.isFinite(b.low) &&
            Number.isFinite(b.high) &&
            (this.yType !== "log" || (b.low > 0 && b.high > 0)),
        )
        .sort((a, b) => a.x - b.x);
      return { source, color: source.color ?? CHART_COLORS[index % CHART_COLORS.length], points, band };
    });
  }

  private _xBounds(all: PreparedSeries[]): [number, number] | null {
    if (this.xDomain) {
      const parsed = this.xDomain.map((v) => parseAxisValue(v, this.xType));
      if (parsed.every(Number.isFinite) && parsed[0] !== parsed[1]) return [Math.min(...parsed), Math.max(...parsed)];
    }
    const xs = all.flatMap((s) => [...s.points.map((p) => p.x), ...s.band.map((b) => b.x)]);
    if (xs.length === 0) return null;
    return [min(xs)!, max(xs)!];
  }

  private _yBounds(visible: PreparedSeries[], xRange: [number, number]): [number, number] | null {
    if (this.yDomain && this.yDomain.every(Number.isFinite) && this.yDomain[0] !== this.yDomain[1]) {
      return [Math.min(...this.yDomain), Math.max(...this.yDomain)];
    }
    const ys = visible.flatMap((s) => [
      ...inWindow(s.points, xRange).map((p) => p.y),
      ...inWindow(s.band, xRange).flatMap((b) => [b.low, b.high]),
    ]);
    for (const ref of this.references) {
      if (ref.axis === "y") {
        const v = Number(ref.value);
        if (Number.isFinite(v) && (this.yType !== "log" || v > 0)) ys.push(v);
      }
    }
    if (ys.length === 0) return null;
    const lo = min(ys)!;
    const hi = max(ys)!;
    if (this.yType === "log") return [lo, hi];
    return [Math.min(lo, 0), hi];
  }

  private _computeLayout(all: PreparedSeries[]): Layout | null {
    if (this._width < 10) return null;
    const ids = resolveVisibleIds(
      all.map((s) => s.source.id),
      this.visible,
    );
    const visible = all.filter((s) => ids.has(s.source.id) && (s.points.length > 0 || s.band.length > 0));
    if (visible.length === 0) return null;

    const xBounds = this._xBounds(all);
    if (!xBounds) return null;
    const yBounds = this._yBounds(visible, xBounds);
    if (!yBounds) return null;

    const height = Math.max(this.height, 100);
    const top = MARGIN.top;
    const bottom = height - MARGIN.bottom - (this.xLabel ? X_LABEL_PX : 0);
    const y = buildAxisScale(this.yType, yBounds[0], yBounds[1], [bottom, top], { nice: this.yDomain === null });

    const yTickCount = Math.max(2, Math.floor((bottom - top) / 50));
    const longestY = max(y.ticks(yTickCount), (v) => this._formatY(v).length) ?? 4;
    const left = Math.min(Math.max(Math.ceil(longestY * TICK_FONT_PX * 0.65) + 12, 40), 120) + (this.yLabel ? Y_LABEL_PX : 0);
    const plotW = Math.max(this._width - left - MARGIN.right, 1);
    const x = buildAxisScale(this.xType, xBounds[0], xBounds[1], [left, left + plotW], { reverse: this.xReverse });

    const allX = new Set(visible.flatMap((s) => [...s.points.map((p) => p.x), ...s.band.map((b) => b.x)]));
    const xs = [...allX].filter((v) => v >= x.domain[0] && v <= x.domain[1]).sort((a, b) => a - b);
    const step = min(xs.slice(1).map((v, i) => v - xs[i])) ?? Infinity;
    return { width: this._width, height, top, left, plotW, bottom, x, y, xs, step, visible };
  }

  private _rowsAt(layout: Layout, x: number): HoverRow[] {
    return layout.visible.flatMap((series) => {
      const hit = interpolateY(series.points, x);
      if (!hit) return [];
      return [{ series, y: hit.y, point: hit.point, band: interpolateBand(series.band, x) }];
    });
  }

  private _nearestX(layout: Layout, x: number): number | null {
    const { xs } = layout;
    if (xs.length === 0) return null;
    const i = Math.min(Math.max(bisector((v: number) => v).center(xs, x), 0), xs.length - 1);
    return xs[i];
  }

  private _emitSelect(layout: Layout, x: number) {
    const rows = this._rowsAt(layout, x);
    if (rows.length === 0) return;
    const rawX = rows.find((r) => r.point)?.point?.x ?? (this.xType === "time" ? new Date(x) : x);
    const points: LineChartSelectedValue[] = rows.map((r) => ({
      seriesId: r.series.source.id,
      label: r.series.source.label,
      x,
      y: r.y,
      point: r.point,
    }));
    this.dispatchEvent(
      new CustomEvent("line-point-select", { detail: { x, rawX, points }, bubbles: true, composed: true }),
    );
  }

  private _hoverAt(event: PointerEvent) {
    if (!this.tooltip) return;
    const layout = this._layout;
    if (!layout) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const px = event.clientX - rect.left;
    if (px < layout.left || px > layout.left + layout.plotW) {
      if (event.pointerType === "mouse") this._hoverX = null;
      return;
    }
    this._hoverX = this._nearestX(layout, layout.x.invert(px));
  }

  private _onPlotPointerDown(event: PointerEvent) {
    if (!this.tooltip || event.pointerType === "mouse") return;
    this._hoverAt(event);
    if (this._pinned) return;
    this._pinned = true;
    document.addEventListener("pointerdown", this._onOutsidePointerDown, true);
  }

  private _onOutsidePointerDown = (event: PointerEvent) => {
    if (event.composedPath().includes(this)) return;
    this._unpin();
    this._hoverX = null;
  };

  private _unpin() {
    if (!this._pinned) return;
    this._pinned = false;
    document.removeEventListener("pointerdown", this._onOutsidePointerDown, true);
  }

  private _onPlotClick(event: MouseEvent) {
    if (!this.interactive) return;
    const layout = this._layout;
    if (!layout) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const px = event.clientX - rect.left;
    if (px < layout.left || px > layout.left + layout.plotW) return;
    const nearest = this._nearestX(layout, layout.x.invert(px));
    if (nearest !== null) this._emitSelect(layout, nearest);
  }

  private _onKeyDown(event: KeyboardEvent) {
    if (!this.tooltip) return;
    const layout = this._layout;
    if (!layout || layout.xs.length === 0) return;
    const { xs } = layout;
    if (event.key === "Escape") {
      if (this._hoverX === null) return;
      this._hoverX = null;
      this._announcement = "";
      this._unpin();
      event.preventDefault();
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && this._hoverX !== null) {
      if (!this.interactive) return;
      event.preventDefault();
      this._emitSelect(layout, this._hoverX);
      return;
    }
    const current = this._hoverX === null ? -1 : xs.indexOf(this._hoverX);
    const dir = this.xReverse ? -1 : 1;
    const start = this.xReverse ? xs.length - 1 : 0;
    let next: number;
    if (event.key === "ArrowRight") next = current >= 0 ? current + dir : start;
    else if (event.key === "ArrowLeft") next = current >= 0 ? current - dir : start;
    else if (event.key === "Home") next = this.xReverse ? xs.length - 1 : 0;
    else if (event.key === "End") next = this.xReverse ? 0 : xs.length - 1;
    else return;
    event.preventDefault();
    this._hoverX = xs[Math.min(Math.max(next, 0), xs.length - 1)];
    this._announcement = this._describe(layout, this._hoverX);
  }

  private _describe(layout: Layout, x: number): string {
    const rows = this._rowsAt(layout, x).map((r) => {
      const band = r.band ? ` (${this._formatY(r.band[0])} to ${this._formatY(r.band[1])})` : "";
      return `${r.series.source.label} ${this._formatY(r.y)}${band}`;
    });
    return `${this._formatX(x, undefined, layout.step)}: ${rows.join("; ")}`;
  }

  private _onLegendPointerDown(id: string, event: PointerEvent) {
    this._suppressClick = false;
    if (event.pointerType === "mouse") return;
    this._cancelPress();
    this._pressTimer = setTimeout(() => {
      this._pressTimer = null;
      this._suppressClick = true;
      this._toggleSeries(id, true);
    }, LONG_PRESS_MS);
  }

  private _cancelPress() {
    if (this._pressTimer !== null) clearTimeout(this._pressTimer);
    this._pressTimer = null;
  }

  private _onLegendClick(id: string, event: MouseEvent) {
    if (this._suppressClick) {
      this._suppressClick = false;
      return;
    }
    this._toggleSeries(id, event.ctrlKey || event.metaKey);
  }

  private _toggleSeries(id: string, toggle: boolean) {
    const allIds = this.series.map((s) => s.id);
    const next = toggleLegendVisibility(allIds, this.visible, id, toggle);
    this.visible = next;
    this.dispatchEvent(
      new CustomEvent("series-visibility-change", { detail: { visible: next }, bubbles: true, composed: true }),
    );
  }

  private _summary(layout: Layout): string {
    const parts = layout.visible.map((s) => {
      const first = s.points[0];
      const last = s.points[s.points.length - 1];
      if (!first || !last) return s.source.label;
      return `${s.source.label}: ${this._formatY(first.y)} to ${this._formatY(last.y)}`;
    });
    return `Line chart, ${layout.visible.length} series. ${parts.join(". ")}.`;
  }

  private _renderAxes(layout: Layout) {
    const { x, y, left, plotW, top, bottom, height } = layout;
    const yTicks = y.ticks(Math.max(2, Math.floor((bottom - top) / 50)));
    const xTicks = x.ticks(Math.max(2, Math.floor(plotW / 90)));
    const span = x.domain[1] - x.domain[0];
    return svg`
      ${yTicks.map(
        (v) => svg`
          <line class="grid-line" x1=${left} x2=${left + plotW} y1=${y(v)} y2=${y(v)} stroke-width="1" />
          <text class="axis-label y-tick" x=${left - 8} y=${y(v)} dy="0.32em" text-anchor="end"
            font-size=${TICK_FONT_PX}>${this._formatY(v)}</text>
        `,
      )}
      ${xTicks.map(
        (v) => svg`
          <text class="axis-label x-tick" x=${x(v)} y=${bottom + MARGIN.bottom - 8} text-anchor="middle"
            font-size=${TICK_FONT_PX}>${this._formatX(v, span)}</text>
        `,
      )}
      ${this.xLabel
        ? svg`<text class="axis-title x-title" x=${left + plotW / 2} y=${height - 4} text-anchor="middle"
            font-size=${TICK_FONT_PX}>${this.xLabel}</text>`
        : nothing}
      ${this.yLabel
        ? svg`<text class="axis-title y-title" transform="translate(12, ${(top + bottom) / 2}) rotate(-90)"
            text-anchor="middle" font-size=${TICK_FONT_PX}>${this.yLabel}</text>`
        : nothing}
    `;
  }

  private _renderReferences(layout: Layout) {
    const { x, y, left, plotW, top, bottom } = layout;
    const right = left + plotW;
    return this.references.map((ref, i) => {
      const dash = ref.dashed === false ? nothing : "5 4";
      const strokeStyle = ref.color ? `stroke: ${ref.color}` : "";
      const fillStyle = ref.color ? `fill: ${ref.color}` : "";
      if (ref.axis === "diagonal") {
        const lo = Math.max(x.domain[0], y.domain[0]);
        const hi = Math.min(x.domain[1], y.domain[1]);
        if (!(hi > lo)) return nothing;
        const labelY = Math.max(y(hi) - 6, top + 12);
        return svg`
          <line class="ref-line ref-diagonal" x1=${x(lo)} y1=${y(lo)} x2=${x(hi)} y2=${y(hi)}
            stroke-width="1.5" stroke-dasharray=${dash} style=${strokeStyle} />
          ${ref.label
            ? svg`<text class="ref-label" x=${x(hi) - 4} y=${labelY} text-anchor="end"
                font-size=${TICK_FONT_PX} style=${fillStyle}>${ref.label}</text>`
            : nothing}
        `;
      }
      if (ref.axis === "y") {
        const v = Number(ref.value);
        if (!Number.isFinite(v) || (this.yType === "log" && v <= 0)) return nothing;
        const py = y(v);
        if (py < top - 1 || py > bottom + 1) return nothing;
        const labelY = Math.max(py - 5, top + 12);
        return svg`
          <line class="ref-line ref-y" x1=${left} x2=${right} y1=${py} y2=${py}
            stroke-width="1.5" stroke-dasharray=${dash} style=${strokeStyle} />
          ${ref.label
            ? svg`<text class="ref-label" x=${right - 4} y=${labelY} text-anchor="end"
                font-size=${TICK_FONT_PX} style=${fillStyle}>${ref.label}</text>`
            : nothing}
        `;
      }
      const v = parseAxisValue(ref.value, this.xType);
      if (!Number.isFinite(v)) return nothing;
      const px = x(v);
      if (px < left - 1 || px > right + 1) return nothing;
      const anchor = px + 60 > right ? "end" : "start";
      const tx = anchor === "start" ? px + 4 : px - 4;
      const ty = top + 11 + (i % 3) * 13;
      return svg`
        <line class="ref-line ref-x" x1=${px} x2=${px} y1=${top} y2=${bottom}
          stroke-width="1.5" stroke-dasharray=${dash} style=${strokeStyle} />
        ${ref.label
          ? svg`<text class="ref-label" x=${tx} y=${ty} text-anchor=${anchor}
              font-size=${TICK_FONT_PX} style=${fillStyle}>${ref.label}</text>`
          : nothing}
      `;
    });
  }

  private _renderSelectedX(layout: Layout) {
    if (this.selectedX === null || this.selectedX === "") return nothing;
    const v = parseAxisValue(this.selectedX, this.xType);
    if (!Number.isFinite(v)) return nothing;
    const px = layout.x(v);
    if (px < layout.left - 1 || px > layout.left + layout.plotW + 1) return nothing;
    return svg`<line class="selected-line" x1=${px} x2=${px} y1=${layout.top} y2=${layout.bottom} stroke-width="1.5" />`;
  }

  private _renderSeries(layout: Layout) {
    const { x, y } = layout;
    const interp = this.curve === "monotone" ? curveMonotoneX : curveLinear;
    const bandShape = area<PreparedBandPoint>()
      .curve(interp)
      .x((p) => x(p.x))
      .y0((p) => y(p.low))
      .y1((p) => y(p.high));
    const lineShape = line<PreparedPoint>()
      .curve(interp)
      .x((p) => x(p.x))
      .y((p) => y(p.y));

    const bands = layout.visible
      .filter((s) => s.band.length > 1)
      .map(
        (s) => svg`<path class="band" data-series=${s.source.id} d=${bandShape(s.band) ?? ""}
          style="fill: ${s.color}; fill-opacity: 0.16" />`,
      );
    const lines = layout.visible.map((s) => {
      const drawPoints = s.source.showPoints ?? this.showPoints;
      return svg`
        ${s.points.length > 1
          ? svg`<path class="series-line" data-series=${s.source.id} d=${lineShape(s.points) ?? ""} fill="none"
              stroke-width="2" stroke-linejoin="round" stroke-linecap="round"
              stroke-dasharray=${s.source.dashed ? "5 4" : nothing}
              style="stroke: ${s.color}" />`
          : nothing}
        ${drawPoints || s.points.length === 1
          ? s.points.map(
              (p) => svg`<circle class="point ${this.interactive ? "" : "static"}" data-series=${s.source.id} cx=${x(p.x)} cy=${y(p.y)} r="3.5"
                stroke-width="1.5" style="fill: ${s.color}" />`,
            )
          : nothing}
      `;
    });
    return svg`${bands}${lines}`;
  }

  private _renderHover(layout: Layout) {
    if (!this.tooltip || this._hoverX === null || !layout.xs.includes(this._hoverX)) {
      return { marks: nothing, tip: nothing };
    }
    const x = this._hoverX;
    const px = layout.x(x);
    const rows = this._rowsAt(layout, x);
    const marks = svg`
      <line class="crosshair" x1=${px} x2=${px} y1=${layout.top} y2=${layout.bottom} stroke-width="1" />
      ${rows.map(
        (r) => svg`<circle class="hover-dot" cx=${px} cy=${layout.y(r.y)} r="4" stroke-width="2"
          style="fill: ${r.series.color}" />`,
      )}
    `;
    const flip = px + 12 + TOOLTIP_W > layout.width;
    const tipLeft = flip ? Math.max(px - 12 - TOOLTIP_W, 0) : px + 12;
    const tip = html`
      <div class="tooltip" style="left: ${tipLeft}px" aria-hidden="true">
        <div class="tooltip-head">${this._formatX(x, undefined, layout.step)}</div>
        ${rows.map(
          (r) => html`
            <div class="tooltip-row">
              <span class="tooltip-dot" style="color: ${r.series.color}"></span>
              <span class="tooltip-label">${r.series.source.label}</span>
              <span>${this._formatY(r.y)}</span>
            </div>
            ${r.band
              ? html`<div class="tooltip-sub">${this._formatY(r.band[0])} – ${this._formatY(r.band[1])}</div>`
              : nothing}
            ${r.point?.label ? html`<div class="tooltip-sub">${r.point.label}</div>` : nothing}
          `,
        )}
      </div>
    `;
    return { marks, tip };
  }

  private _renderLegend(all: PreparedSeries[], shown: Set<string>) {
    if (all.length < 2) return nothing;
    if (!this.interactive) {
      return html`<div class="legend" role="group" aria-label="Series">
        ${all.map(
          (s) => html`<span class="legend-item static ${shown.has(s.source.id) ? "" : "dimmed"}" data-series=${s.source.id}>
            <span class="swatch ${s.source.dashed ? "dashed" : ""}" style="color: ${s.color}"></span>
            <span>${s.source.label}</span>
          </span>`,
        )}
      </div>`;
    }
    return html`<div class="legend" role="group" aria-label="Series">
      ${all.map(
        (s) => html`<button
          type="button"
          class="legend-item"
          data-series=${s.source.id}
          aria-pressed=${shown.has(s.source.id) ? "true" : "false"}
          title="Click to show only this series; Ctrl/Cmd-click or long-press to toggle it"
          @click=${(event: MouseEvent) => this._onLegendClick(s.source.id, event)}
          @pointerdown=${(event: PointerEvent) => this._onLegendPointerDown(s.source.id, event)}
          @pointerup=${this._cancelPress}
          @pointercancel=${this._cancelPress}
          @pointerleave=${this._cancelPress}
          @contextmenu=${(event: Event) => {
            if (this._pressTimer !== null || this._suppressClick) event.preventDefault();
          }}
        >
          <span class="swatch ${s.source.dashed ? "dashed" : ""}" style="color: ${s.color}"></span>
          <span>${s.source.label}</span>
        </button>`,
      )}
    </div>`;
  }

  override render() {
    const all = this._prepare();
    const layout = this._computeLayout(all);
    this._layout = layout;
    const shown = resolveVisibleIds(
      all.map((s) => s.source.id),
      this.visible,
    );
    const hover = layout ? this._renderHover(layout) : { marks: nothing, tip: nothing };
    const h = Math.max(this.height, 100);
    return html`
      ${this._renderLegend(all, shown)}
      <div
        class="plot"
        style="height: ${h}px"
        tabindex=${layout && this.tooltip ? "0" : "-1"}
        aria-label=${this.tooltip
          ? `Line chart values: use the left and right arrow keys to inspect points${this.interactive ? ", Enter to select" : ""}`
          : nothing}
        @pointerdown=${this._onPlotPointerDown}
        @pointermove=${this._hoverAt}
        @pointerleave=${(event: PointerEvent) => {
          if (event.pointerType === "mouse") this._hoverX = null;
        }}
        @click=${this._onPlotClick}
        @keydown=${this._onKeyDown}
        @blur=${() => {
          this._hoverX = null;
          this._announcement = "";
          this._unpin();
        }}
      >
        ${!layout
          ? this._width < 10
            ? nothing
            : html`<div class="message">No data</div>`
          : html`
              <svg width=${layout.width} height=${layout.height} role="img" aria-label=${this._summary(layout)}>
                <defs>
                  <clipPath id="plot-area">
                    <rect x=${layout.left} y=${layout.top} width=${layout.plotW} height=${layout.bottom - layout.top} />
                  </clipPath>
                </defs>
                ${this._renderAxes(layout)}
                <g clip-path="url(#plot-area)">
                  ${this._renderReferences(layout)}
                  ${this._renderSeries(layout)}
                </g>
                ${this._renderSelectedX(layout)}
                ${hover.marks}
              </svg>
              ${hover.tip}
            `}
      </div>
      <div class="sr-only" role="status">${this._announcement}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "line-chart": LineChart;
  }
}
