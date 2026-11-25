import { LitElement, css, html, nothing, svg } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { bisector, max, min } from "d3-array";
import { scaleLinear, scaleLog, scaleTime } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { tokens } from "./tokens.js";
import {
  FanFormatter,
  bandNames,
  center,
  prepareSeries,
  sameMonth,
  toTime,
  valueAt,
  visibleIds,
  type FanChartEvent,
  type FanChartGoal,
  type FanChartSeries,
  type FanValue,
  type PreparedSeries,
  type ProjectionSample,
  type Sample,
} from "./utils/fan-data.js";

export type { FanChartProjectionPoint } from "./utils/percentiles.js";
export type { FanChartEvent, FanChartGoal, FanChartPoint, FanChartSeries } from "./utils/fan-data.js";

/** Loads chart data; called with a signal that aborts when a newer load supersedes this one. */
export type FanChartLoader = (signal: AbortSignal) => FanChartSeries[] | Promise<FanChartSeries[]>;

const MARGIN = { top: 16, right: 16, bottom: 28 };
const TICK_FONT_PX = 11;
/** Vertical distance between stacked marker-label rows above the plot. */
const LABEL_ROW_PX = 14;
const MAX_LABEL_ROWS = 3;
/** Tooltip width in pixels; matches the `.tooltip` CSS width (16rem). */
const TOOLTIP_W = 256;
const LONG_PRESS_MS = 500;
const YEAR_MS = 365.25 * 86_400_000;

interface TooltipRow extends FanValue {
  series: PreparedSeries;
}

interface TopLabel {
  x: number;
  text: string;
  kind: "today" | "event";
  anchor: "start" | "end";
  row: number;
}

type YScale = ((value: number) => number) & { ticks(count?: number): number[] };

interface Layout {
  width: number;
  height: number;
  top: number;
  left: number;
  plotW: number;
  bottom: number;
  x: ReturnType<typeof scaleTime<number, number>>;
  y: YScale;
  times: number[];
  visible: PreparedSeries[];
  labels: TopLabel[];
  events: { t: number; label: string }[];
}

/** Keeps the 1/2/5 × 10ⁿ ticks of a log scale, or only powers of ten when those are still too many. */
function logTicks(ticks: number[]): number[] {
  const leading = (v: number) => v / 10 ** Math.floor(Math.log10(v) + 1e-9);
  const nice = ticks.filter((v) => [1, 2, 5].some((d) => Math.abs(leading(v) - d) < 1e-6));
  return nice.length > 8 ? nice.filter((v) => Math.abs(leading(v) - 1) < 1e-6) : nice;
}

/**
 * Multi-series time-series fan chart: observed history as a solid line, and a
 * projection as percentile bands around a dashed median — e.g. Monte Carlo
 * savings forecasts. A "today" divider separates the past from the projection,
 * and each fan starts at its series' last observed value. Optional extras: a
 * `goal` line (the tooltip shows each projection's `goalProbability`), labelled
 * `events` markers, and per-series `samples` (individual runs as thin lines).
 *
 * The legend shows each series' final value under its name and toggles
 * series: a click shows only that series (clicking it again shows all);
 * Ctrl/Cmd-click — or a long press on touch screens — adds or removes one.
 * The y axis rescales to the visible series. Hover, tap, or drag across the
 * plot — or focus it and use ←/→/Home/End — to inspect values; Escape (or a
 * tap outside) clears.
 *
 * Values default to compact currency in `currency` and `locale` (USD, en-US);
 * dates follow `locale`. `valueFormat` overrides value formatting entirely.
 *
 * Totals: percentiles do not add across series, so build a total series from
 * the run-by-run sum of the accounts' simulated paths (`sumPaths()`), not by
 * adding their percentiles.
 *
 * Live data: `series` is a reactive property, so binding it from a parent Lit
 * template (`.series=${this.data}`) or assigning a new array redraws in place.
 * Updates must be immutable (a new array); after mutating in place, call
 * `refresh()`. Alternatively set `loader` to a function returning the series
 * (sync or async): it runs on connect, on `refresh()`, and every
 * `refresh-interval` seconds while the tab is visible. A newer load aborts the
 * older one, and a failed load keeps the last good data.
 *
 * Series colors default to the theme's primary, warning, danger, info, and
 * success tokens, so the chart follows light/dark themes; some themes share
 * the last two with the first, so set `color` when showing more than three.
 *
 * @element fan-chart
 * @fires series-visibility-change - Legend changed the visible series. `detail: { visible: string[] | null }` (null = all).
 * @fires fan-chart-load - `loader` resolved and the chart redrew. `detail: { series: FanChartSeries[] }`.
 * @fires fan-chart-error - `loader` threw or rejected; the last good data stays drawn. `detail: { error: unknown }`.
 */
@customElement("fan-chart")
export class FanChart extends LitElement {
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
        text-align: left;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        transition: background-color 150ms ease, color 150ms ease;
      }
      .legend-text {
        display: flex;
        flex-direction: column;
        line-height: var(--ui-line-height-tight, 1.25);
      }
      .legend-value {
        color: var(--ui-text-muted, #64748b);
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-regular, 400);
        font-variant-numeric: var(--ui-numeric, normal);
      }
      .legend-item:hover {
        background: var(--ui-surface-muted, #f8fafc);
      }
      .legend-item:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .legend-item[aria-pressed="false"] {
        color: var(--ui-text-muted, #64748b);
      }
      .swatch {
        flex: none;
        width: 0.625rem;
        height: 0.625rem;
        border-radius: var(--ui-radius-circle, 50%);
        background: currentColor;
      }
      .legend-item[aria-pressed="false"] .swatch {
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
      .grid-line {
        stroke: var(--ui-border, #e2e8f0);
      }
      .today-line,
      .event-line {
        stroke: var(--ui-text-muted, #64748b);
      }
      .event-line {
        stroke-opacity: 0.7;
      }
      .today-label,
      .event-label {
        fill: var(--ui-text-muted, #64748b);
      }
      .today-label {
        text-transform: var(--ui-label-transform, none);
      }
      .goal-line {
        stroke: var(--ui-text, #0f172a);
      }
      .goal-label {
        fill: var(--ui-text, #0f172a);
        font-weight: var(--ui-font-weight-semibold, 600);
        paint-order: stroke;
        stroke: var(--ui-surface, #ffffff);
        stroke-width: 3px;
        stroke-linejoin: round;
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
      .message.error {
        color: var(--ui-danger, #dc2626);
      }
      .tooltip {
        position: absolute;
        top: 0;
        box-sizing: border-box;
        width: 16rem;
        padding: 0.5rem 0.75rem;
        border-radius: var(--ui-radius-sm, 0.25rem);
        background: var(--ui-tooltip, #0f172a);
        color: var(--ui-tooltip-text, #ffffff);
        font-size: var(--ui-font-size-xs, 0.6875rem);
        line-height: var(--ui-line-height-normal, 1.5);
        font-variant-numeric: var(--ui-numeric, normal);
        pointer-events: none;
      }
      .tooltip-date {
        font-weight: var(--ui-font-weight-semibold, 600);
      }
      .tooltip-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .tooltip-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .tooltip-goal {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
      }
      .tooltip-range {
        display: grid;
        grid-template-columns: auto auto 1fr auto;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
      }
      .swatch.spacer {
        visibility: hidden;
      }
      .range-value,
      .tooltip-caption {
        opacity: 0.7;
      }
      .range-value {
        min-width: 3rem;
      }
      .range-value:last-child {
        text-align: right;
      }
      .range-bar {
        position: relative;
        height: 0.375rem;
      }
      .range-band {
        position: absolute;
        top: 0;
        bottom: 0;
        border-radius: var(--ui-radius-pill, 9999px);
      }
      .range-median {
        position: absolute;
        top: 50%;
        width: 0.5rem;
        height: 0.5rem;
        border-radius: var(--ui-radius-circle, 50%);
        box-shadow: 0 0 0 2px var(--ui-tooltip, #0f172a);
        transform: translate(-50%, -50%);
      }
      .tooltip-caption {
        margin-top: 0.25rem;
        padding-top: 0.25rem;
        border-top: var(--ui-border-width, 1px) solid currentColor;
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
        .legend-item {
          border: 1px solid CanvasText;
        }
        .legend-item[aria-pressed="true"] {
          outline: 2px solid Highlight;
        }
        .legend-item:focus-visible,
        .plot:focus-visible {
          outline: 2px solid CanvasText;
        }
        .tooltip {
          border: 1px solid CanvasText;
        }
        .range-bar {
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

  /** Series to draw. Assign a new array (or bind `.series` from Lit state) to redraw. */
  @property({ attribute: false }) series: FanChartSeries[] = [];
  /**
   * Percentiles (0–100) that each projection point's `values` are aligned to.
   * Paired outside-in into bands (first with last, …); an unpaired middle value
   * is drawn as the median line.
   */
  @property({ attribute: false }) percentiles: number[] = [10, 25, 50, 75, 90];
  /** Logarithmic y axis. Off by default; values ≤ 0 are drawn at the axis floor. */
  @property({ type: Boolean, reflect: true }) log = false;
  /** IDs of the series to show; `null` (default) shows all. Updated by the legend. */
  @property({ attribute: false }) visible: string[] | null = null;
  /** Optional horizontal goal line; always kept within the y axis. */
  @property({ attribute: false }) goal: FanChartGoal | null = null;
  /** Optional labelled vertical markers, e.g. retirement. */
  @property({ attribute: false }) events: FanChartEvent[] = [];
  /** Position of the "today" divider as an ISO date. Defaults to the latest observed date. */
  @property() now: string | null = null;
  /** Label drawn on the "today" divider. */
  @property({ attribute: "now-label" }) nowLabel = "Today";
  /** Plot height in CSS pixels, excluding the legend. */
  @property({ type: Number }) height = 320;
  /** BCP 47 locale for numbers and dates. */
  @property() locale = "en-US";
  /** ISO 4217 currency code for the default value format. */
  @property() currency = "USD";
  /** Formats axis, legend, and tooltip values. Defaults to compact `currency` in `locale` (`$1.2M`). */
  @property({ attribute: false }) valueFormat: ((value: number) => string) | null = null;
  /** Optional data source; its result replaces `series`. See the class docs. */
  @property({ attribute: false }) loader: FanChartLoader | null = null;
  /** Re-run `loader` every N seconds while the tab is visible; 0 (default) disables polling. */
  @property({ type: Number, attribute: "refresh-interval" }) refreshInterval = 0;

  @state() private _width = 0;
  @state() private _hoverT: number | null = null;
  @state() private _announcement = "";
  @state() private _loading = false;
  @state() private _error: string | null = null;

  private _ro: ResizeObserver | null = null;
  private _abort: AbortController | null = null;
  private _timer: ReturnType<typeof setInterval> | null = null;
  private _pressTimer: ReturnType<typeof setTimeout> | null = null;
  private _suppressClick = false;
  private _pinned = false;
  private _layout: Layout | null = null;
  private _formatter = new FanFormatter();

  override connectedCallback() {
    super.connectedCallback();
    this._ro = new ResizeObserver((entries) => {
      const width = Math.floor(entries[0].contentRect.width);
      if (width !== this._width) this._width = width;
    });
    this._ro.observe(this);
    if (!this.hasUpdated) return;
    if (this.loader) void this.refresh();
    this._syncTimer();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._ro?.disconnect();
    this._ro = null;
    this._abort?.abort();
    this._abort = null;
    this._loading = false;
    this._clearTimer();
    this._cancelPress();
    this._unpin();
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has("loader") && this.loader) void this.refresh();
    if (changed.has("loader") || changed.has("refreshInterval")) this._syncTimer();
  }

  /**
   * Re-runs `loader` and redraws with its result; without a loader, just
   * redraws (use after mutating `series` in place). Resolves once rendered.
   */
  async refresh(): Promise<void> {
    const loader = this.loader;
    if (!loader) {
      this.requestUpdate();
      await this.updateComplete;
      return;
    }
    this._abort?.abort();
    const controller = new AbortController();
    this._abort = controller;
    this._loading = true;
    try {
      const result = await loader(controller.signal);
      if (controller.signal.aborted) return;
      this.series = result;
      this._error = null;
      this.dispatchEvent(new CustomEvent("fan-chart-load", { detail: { series: result }, bubbles: true, composed: true }));
    } catch (error) {
      if (controller.signal.aborted) return;
      this._error = error instanceof Error ? error.message : "Failed to load";
      this.dispatchEvent(new CustomEvent("fan-chart-error", { detail: { error }, bubbles: true, composed: true }));
    } finally {
      if (this._abort === controller) {
        this._abort = null;
        this._loading = false;
      }
    }
    await this.updateComplete;
  }

  private _syncTimer() {
    this._clearTimer();
    if (!this.loader || !(this.refreshInterval > 0) || !this.isConnected) return;
    this._timer = setInterval(() => {
      if (!document.hidden) void this.refresh();
    }, this.refreshInterval * 1000);
  }

  private _clearTimer() {
    if (this._timer !== null) clearInterval(this._timer);
    this._timer = null;
  }

  private _format(value: number): string {
    return this.valueFormat ? this.valueFormat(value) : this._formatter.money(value, this.locale, this.currency, true);
  }

  private _formatDate(t: number, options: Intl.DateTimeFormatOptions): string {
    return this._formatter.date(t, this.locale, options);
  }

  private _month(t: number): string {
    return this._formatDate(t, { month: "short", year: "numeric" });
  }

  private _goalText(): string {
    return `${this.goal?.label ?? "Goal"} ${this._format(this.goal?.value ?? 0)}`;
  }

  private _prepare(): PreparedSeries[] {
    return prepareSeries(this.series, this.percentiles, this.goal?.value);
  }

  private _visibleIds(all: PreparedSeries[]): Set<string> {
    return visibleIds(all, this.visible);
  }

  /** Returns a factory for the y scale given the plot's top edge, which depends on the marker-label rows. */
  private _yFactory(values: number[], bottom: number): (top: number) => YScale {
    if (this.log) {
      const floor = min(values.filter((v) => v > 0)) ?? 1;
      const ceiling = Math.max(max(values)!, floor * 10);
      return (top) => {
        const scale = scaleLog().domain([floor, ceiling]).range([bottom, top]).nice().clamp(true);
        return Object.assign((v: number) => scale(Math.max(v, floor)), { ticks: () => logTicks(scale.ticks()) });
      };
    }
    const lo = Math.min(min(values)!, 0);
    const hi = max(values)!;
    return (top) =>
      scaleLinear()
        .domain([lo, hi > lo ? hi : lo + 1])
        .range([bottom, top])
        .nice();
  }

  /** Places the "today" and event labels above the plot, stacking overlapping ones into extra rows. */
  private _placeLabels(candidates: Omit<TopLabel, "anchor" | "row">[], right: number): TopLabel[] {
    const rowEnds: number[] = [];
    return [...candidates]
      .sort((a, b) => a.x - b.x)
      .map((c) => {
        const w = c.text.length * TICK_FONT_PX * 0.6 + 4;
        const anchor: TopLabel["anchor"] = c.x + 4 + w > right ? "end" : "start";
        const x0 = anchor === "start" ? c.x : c.x - w - 4;
        const x1 = anchor === "start" ? c.x + w + 4 : c.x;
        let row = rowEnds.findIndex((end) => x0 > end + 4);
        if (row === -1) row = Math.min(rowEnds.length, MAX_LABEL_ROWS - 1);
        rowEnds[row] = Math.max(rowEnds[row] ?? -Infinity, x1);
        return { ...c, anchor, row };
      });
  }

  private _computeLayout(all: PreparedSeries[]): Layout | null {
    if (this._width < 10) return null;
    const ids = this._visibleIds(all);
    const visible = all.filter((s) => ids.has(s.source.id) && (s.actual.length > 0 || s.projection.length > 0));
    if (visible.length === 0) return null;

    const allTimes = all.flatMap((s) => [...s.actual.map((p) => p.t), ...s.projection.map((p) => p.t)]);
    const values = visible.flatMap((s) => [
      ...s.actual.map((p) => p.v),
      ...s.projection.flatMap((p) => p.values),
      ...s.samples.flatMap((run) => run.map((p) => p.v)),
    ]);
    const goal = this.goal?.value;
    if (goal !== undefined && Number.isFinite(goal) && (!this.log || goal > 0)) values.push(goal);
    const latestActual = max(all.flatMap((s) => s.actual.map((p) => p.t)));
    const nowT = this.now ? toTime(this.now) : (latestActual ?? null);
    const now = nowT !== null && Number.isFinite(nowT) ? nowT : null;

    const t0 = min(allTimes)!;
    const t1 = max(allTimes)!;
    const height = Math.max(this.height, 80);
    const bottom = height - MARGIN.bottom;
    const makeY = this._yFactory(values, bottom);

    const tickCount = Math.max(2, Math.floor((bottom - MARGIN.top) / 50));
    const tickLabels = makeY(MARGIN.top).ticks(tickCount).map((v) => this._format(v));
    const longest = max(tickLabels, (label) => label.length) ?? 4;
    const left = Math.min(Math.max(Math.ceil(longest * TICK_FONT_PX * 0.62) + 12, 40), 120);
    const plotW = Math.max(this._width - left - MARGIN.right, 1);
    const x = scaleTime<number, number>()
      .domain([new Date(t0), new Date(t1 > t0 ? t1 : t0 + 86_400_000)])
      .range([left, left + plotW]);

    const events = this.events
      .map((e) => ({ t: toTime(e.date), label: e.label }))
      .filter((e) => Number.isFinite(e.t))
      .sort((a, b) => a.t - b.t);
    const inPlot = (px: number) => px >= left && px <= left + plotW;
    const candidates: Omit<TopLabel, "anchor" | "row">[] = [];
    if (now !== null && inPlot(x(now))) candidates.push({ x: x(now), text: this.nowLabel, kind: "today" });
    for (const e of events) if (inPlot(x(e.t))) candidates.push({ x: x(e.t), text: e.label, kind: "event" });
    const labels = this._placeLabels(candidates, left + plotW);
    const rows = labels.length > 0 ? Math.max(...labels.map((l) => l.row)) + 1 : 1;
    const top = MARGIN.top + (rows - 1) * LABEL_ROW_PX;

    const visibleTimes = new Set(visible.flatMap((s) => [...s.actual.map((p) => p.t), ...s.projection.map((p) => p.t)]));
    const times = [...visibleTimes].sort((a, b) => a - b);
    return { width: this._width, height, top, left, plotW, bottom, x, y: makeY(top), times, visible, labels, events };
  }

  private _rowsAt(layout: Layout, t: number): TooltipRow[] {
    return layout.visible.flatMap((series) => {
      const value = valueAt(series, t, this.goal !== null);
      return value ? [{ ...value, series }] : [];
    });
  }

  private _nearestTime(layout: Layout, t: number): number | null {
    const { times } = layout;
    if (times.length === 0) return null;
    const i = Math.min(Math.max(bisector((v: number) => v).center(times, t), 0), times.length - 1);
    return times[i];
  }

  private _hoverAt(event: PointerEvent) {
    const layout = this._layout;
    if (!layout) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const px = event.clientX - rect.left;
    if (px < layout.left || px > layout.left + layout.plotW) {
      if (event.pointerType === "mouse") this._hoverT = null;
      return;
    }
    this._hoverT = this._nearestTime(layout, layout.x.invert(px).getTime());
  }

  private _onPlotPointerDown(event: PointerEvent) {
    if (event.pointerType === "mouse") return;
    this._hoverAt(event);
    if (this._pinned) return;
    this._pinned = true;
    document.addEventListener("pointerdown", this._onOutsidePointerDown, true);
  }

  private _onOutsidePointerDown = (event: PointerEvent) => {
    if (event.composedPath().includes(this)) return;
    this._unpin();
    this._hoverT = null;
  };

  private _unpin() {
    if (!this._pinned) return;
    this._pinned = false;
    document.removeEventListener("pointerdown", this._onOutsidePointerDown, true);
  }

  private _onKeyDown(event: KeyboardEvent) {
    const layout = this._layout;
    if (!layout || layout.times.length === 0) return;
    const { times } = layout;
    if (event.key === "Escape") {
      if (this._hoverT === null) return;
      this._hoverT = null;
      this._announcement = "";
      this._unpin();
      event.preventDefault();
      return;
    }
    const current = this._hoverT === null ? -1 : times.indexOf(this._hoverT);
    const nowLabel = layout.labels.find((l) => l.kind === "today");
    const startT = nowLabel ? layout.x.invert(nowLabel.x).getTime() : times[0];
    const start = times.indexOf(this._nearestTime(layout, startT)!);
    let next: number;
    if (event.key === "ArrowRight") next = current >= 0 ? current + 1 : start;
    else if (event.key === "ArrowLeft") next = current >= 0 ? current - 1 : start;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = times.length - 1;
    else return;
    event.preventDefault();
    this._hoverT = times[Math.min(Math.max(next, 0), times.length - 1)];
    this._announcement = this._describe(layout, this._hoverT);
  }

  private _eventsAt(layout: Layout, t: number): string[] {
    return layout.events.filter((e) => sameMonth(e.t, t)).map((e) => e.label);
  }

  private _describe(layout: Layout, t: number): string {
    const rows = this._rowsAt(layout, t).map((row) => {
      const outer = row.bands[0];
      const range = outer ? `, ${this._format(outer[0])} to ${this._format(outer[1])}` : "";
      const goal = row.goal !== null ? `, ${Math.round(row.goal * 100)}% at or above ${this._goalText()}` : "";
      return `${row.series.source.label} ${this._format(row.value)}${range}${goal}`;
    });
    const events = this._eventsAt(layout, t);
    return `${this._month(t)}${events.length > 0 ? ` (${events.join(", ")})` : ""}: ${rows.join("; ")}`;
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

  /** Shows only `id` (or all again when it is already the only one shown), or with `toggle` adds/removes it. */
  private _toggleSeries(id: string, toggle: boolean) {
    const all = this.series.map((s) => s.id);
    const current = all.filter((i) => this.visible === null || this.visible.includes(i));
    const shown = current.length > 0 ? current : all;
    let next: string[] | null;
    if (toggle) next = shown.includes(id) ? shown.filter((i) => i !== id) : all.filter((i) => i === id || shown.includes(i));
    else next = shown.length === 1 && shown[0] === id ? null : [id];
    if (next !== null && (next.length === 0 || next.length === all.length)) next = null;
    this.visible = next;
    this.dispatchEvent(
      new CustomEvent("series-visibility-change", { detail: { visible: next }, bubbles: true, composed: true }),
    );
  }

  /** The series' final projected median (or last observed value) and its year, for the legend. */
  private _legendValue(s: PreparedSeries): string {
    const projected = s.projection[s.projection.length - 1];
    if (projected && projected.values.length > 0) {
      return `${this._format(center(projected.values))} · ${this._formatDate(projected.t, { year: "numeric" })}`;
    }
    const observed = s.actual[s.actual.length - 1];
    return observed ? `${this._format(observed.v)} · ${this._formatDate(observed.t, { year: "numeric" })}` : "";
  }

  private _summary(layout: Layout): string {
    const parts = layout.visible.map((s) => {
      const lastActual = s.actual[s.actual.length - 1];
      const lastProjection = s.projection[s.projection.length - 1];
      const observed = lastActual ? ` ${this._format(lastActual.v)} in ${this._month(lastActual.t)}` : "";
      if (!lastProjection) return `${s.source.label}:${observed}`;
      const row = this._rowsAt({ ...layout, visible: [s] }, lastProjection.t)[0];
      const outer = row?.bands[0];
      const range = outer ? ` (${this._format(outer[0])} to ${this._format(outer[1])})` : "";
      const projected = row ? `projected ${this._format(row.value)}${range} by ${this._month(lastProjection.t)}` : "";
      return `${s.source.label}:${observed}${observed && projected ? "," : ""} ${projected}`.trim();
    });
    const goal = this.goal ? ` ${this._goalText()}.` : "";
    const events = layout.events.length > 0
      ? ` Events: ${layout.events.map((e) => `${e.label} (${this._month(e.t)})`).join(", ")}.`
      : "";
    return `Fan chart, ${layout.visible.length} series. ${parts.join(". ")}.${goal}${events}`;
  }

  private _renderSeries(layout: Layout) {
    const { x, y } = layout;
    const n = this.percentiles.length;
    const pairs = Math.floor(n / 2);
    const dim = layout.visible.length > 1 ? 0.6 : 1;
    const bands = layout.visible.flatMap((s) =>
      Array.from({ length: pairs }, (_, i) => {
        const shape = area<ProjectionSample>()
          .curve(curveMonotoneX)
          .x((p) => x(p.t))
          .y0((p) => y(p.values[i]))
          .y1((p) => y(p.values[n - 1 - i]));
        const opacity = (0.12 + (0.14 * (i + 1)) / pairs) * dim;
        return svg`<path class="band" data-series=${s.source.id} d=${shape(s.projection) ?? ""}
          style="fill: ${s.color}; fill-opacity: ${opacity.toFixed(3)}" />`;
      }),
    );
    const sampleLine = line<Sample>().x((p) => x(p.t)).y((p) => y(p.v));
    const samples = layout.visible.flatMap((s) =>
      s.samples
        .filter((run) => run.length > 1)
        .map(
          (run) => svg`<path class="sample-path" data-series=${s.source.id} d=${sampleLine(run) ?? ""} fill="none"
            stroke-width="1" stroke-linejoin="round" style="stroke: ${s.color}; stroke-opacity: 0.45" />`,
        ),
    );
    const medianLine = line<ProjectionSample>().curve(curveMonotoneX).x((p) => x(p.t)).y((p) => y(center(p.values)));
    const actualLine = line<Sample>().curve(curveMonotoneX).x((p) => x(p.t)).y((p) => y(p.v));
    const lines = layout.visible.map(
      (s) => svg`
        ${n > 0 && s.projection.length > 1
          ? svg`<path class="median" data-series=${s.source.id} d=${medianLine(s.projection) ?? ""} fill="none"
              stroke-width="2" stroke-dasharray="5 4" stroke-linecap="round" style="stroke: ${s.color}" />`
          : nothing}
        ${s.actual.length > 1
          ? svg`<path class="actual" data-series=${s.source.id} d=${actualLine(s.actual) ?? ""} fill="none"
              stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" style="stroke: ${s.color}" />`
          : nothing}
      `,
    );
    return svg`${bands}${samples}${lines}`;
  }

  private _renderAxes(layout: Layout) {
    const { x, y, left, plotW, top, bottom, height } = layout;
    const yTicks = y.ticks(Math.max(2, Math.floor((bottom - top) / 50)));
    const xTicks = x.ticks(Math.max(2, Math.floor(plotW / 96)));
    const [d0, d1] = x.domain();
    const span = d1.getTime() - d0.getTime();
    const xOptions: Intl.DateTimeFormatOptions =
      span >= 3 * YEAR_MS ? { year: "numeric" } : span >= YEAR_MS / 4 ? { month: "short", year: "2-digit" } : { month: "short", day: "numeric" };
    return svg`
      ${yTicks.map(
        (v) => svg`
          <line class="grid-line" x1=${left} x2=${left + plotW} y1=${y(v)} y2=${y(v)} stroke-width="1" />
          <text class="axis-label y-tick" x=${left - 8} y=${y(v)} dy="0.32em" text-anchor="end"
            font-size=${TICK_FONT_PX}>${this._format(v)}</text>
        `,
      )}
      ${xTicks.map(
        (d) => svg`<text class="axis-label x-tick" x=${x(d)} y=${height - 8} text-anchor="middle"
          font-size=${TICK_FONT_PX}>${this._formatDate(d.getTime(), xOptions)}</text>`,
      )}
    `;
  }

  private _renderMarkers(layout: Layout) {
    const { top, bottom } = layout;
    return layout.labels.map((label) => {
      const labelY = top - 4 - label.row * LABEL_ROW_PX;
      const textX = label.anchor === "start" ? label.x + 4 : label.x - 4;
      return svg`
        <line class="${label.kind}-line" x1=${label.x} x2=${label.x} y1=${labelY - 8} y2=${bottom} stroke-width="1"
          stroke-dasharray=${label.kind === "today" ? "2 3" : "4 4"} />
        <text class="${label.kind}-label" x=${textX} y=${labelY} text-anchor=${label.anchor}
          font-size=${TICK_FONT_PX}>${label.text}</text>
      `;
    });
  }

  private _renderGoal(layout: Layout) {
    const value = this.goal?.value;
    if (value === undefined || !Number.isFinite(value) || (this.log && value <= 0)) return nothing;
    const { left, plotW } = layout;
    const goalY = layout.y(value);
    return svg`
      <line class="goal-line" x1=${left} x2=${left + plotW} y1=${goalY} y2=${goalY} stroke-width="1.5"
        stroke-dasharray="6 4" />
      <text class="goal-label" x=${left + plotW - 4} y=${goalY - 6} text-anchor="end"
        font-size=${TICK_FONT_PX}>${this._goalText()}</text>
    `;
  }

  private _renderHover(layout: Layout) {
    if (this._hoverT === null || !layout.times.includes(this._hoverT)) return { marks: nothing, tip: nothing };
    const t = this._hoverT;
    const px = layout.x(t);
    const rows = this._rowsAt(layout, t);
    const marks = svg`
      <line class="crosshair" x1=${px} x2=${px} y1=${layout.top} y2=${layout.bottom} stroke-width="1" />
      ${rows.map(
        (row) => svg`<circle class="hover-dot" cx=${px} cy=${layout.y(row.value)} r="4" stroke-width="2"
          style="fill: ${row.series.color}" />`,
      )}
    `;
    const flip = px + 12 + TOOLTIP_W > layout.width;
    const tipLeft = flip ? Math.max(px - 12 - TOOLTIP_W, 0) : px + 12;
    const events = this._eventsAt(layout, t);
    const tip = html`
      <div class="tooltip" style="left: ${tipLeft}px" aria-hidden="true">
        <div class="tooltip-date">${this._month(t)}${events.length > 0 ? ` · ${events.join(", ")}` : ""}</div>
        ${rows.map(
          (row) => html`
            <div class="tooltip-row">
              <span class="swatch" style="color: ${row.series.color}"></span>
              <span class="tooltip-label">${row.series.source.label}</span>
              <span>${this._format(row.value)}</span>
            </div>
            ${this._renderRange(row)}
            ${row.goal !== null
              ? html`<div class="tooltip-goal">
                  <span class="swatch spacer"></span>${Math.round(row.goal * 100)}% ≥ ${this._goalText()}
                </div>`
              : nothing}
          `,
        )}
        ${rows.some((row) => row.bands.length > 0) ? html`<div class="tooltip-caption">${this._bandCaption()}</div>` : nothing}
      </div>
    `;
    return { marks, tip };
  }

  /** A miniature of the fan at one date: shaded bands scaled to the outer range, with the median as a dot. */
  private _renderRange(row: TooltipRow) {
    const outer = row.bands[0];
    if (!outer) return nothing;
    const [low, high] = outer;
    const pct = (v: number) => (high > low ? ((v - low) / (high - low)) * 100 : 50);
    return html`
      <div class="tooltip-range">
        <span class="swatch spacer"></span>
        <span class="range-value">${this._format(low)}</span>
        <span class="range-bar">
          ${row.bands.map(
            ([a, b], i) => html`<span
              class="range-band"
              style="left: ${pct(a)}%; width: ${pct(b) - pct(a)}%; background: ${row.series.color};
                opacity: ${(0.4 + (0.5 * i) / Math.max(row.bands.length - 1, 1)).toFixed(2)}"
            ></span>`,
          )}
          <span class="range-median" style="left: ${pct(row.value)}%; background: ${row.series.color}"></span>
        </span>
        <span class="range-value">${this._format(high)}</span>
      </div>
    `;
  }

  /** Names the range ends and inner bands for the tooltip, e.g. "Range: P10–P90 · band: P25–P75". */
  private _bandCaption(): string {
    const [outer, ...inner] = bandNames(this.percentiles);
    return inner.length > 0 ? `Range: ${outer} · band: ${inner.join(", ")}` : `Range: ${outer}`;
  }

  private _renderPlot(layout: Layout | null) {
    if (!layout) {
      if (this._width < 10) return nothing;
      const message = this._error ?? (this._loading ? "Loading…" : "No data");
      return html`<div class="message ${this._error ? "error" : ""}" role=${this._error ? "alert" : nothing}>${message}</div>`;
    }
    const hover = this._renderHover(layout);
    return html`
      <svg width=${layout.width} height=${layout.height} role="img" aria-label=${this._summary(layout)}>
        <defs>
          <clipPath id="plot-area">
            <rect x=${layout.left} y=${layout.top} width=${layout.plotW} height=${layout.bottom - layout.top} />
          </clipPath>
        </defs>
        ${this._renderAxes(layout)}
        <g clip-path="url(#plot-area)">${this._renderSeries(layout)}</g>
        ${this._renderMarkers(layout)} ${this._renderGoal(layout)} ${hover.marks}
      </svg>
      ${hover.tip}
    `;
  }

  private _renderLegend(all: PreparedSeries[], shown: Set<string>) {
    if (all.length < 2) return nothing;
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
          <span class="swatch" style="color: ${s.color}"></span>
          <span class="legend-text">
            <span class="legend-name">${s.source.label}</span>
            <span class="legend-value">${this._legendValue(s)}</span>
          </span>
        </button>`,
      )}
    </div>`;
  }

  override render() {
    const all = this._prepare();
    const layout = this._computeLayout(all);
    this._layout = layout;
    return html`
      ${this._renderLegend(all, this._visibleIds(all))}
      <div
        class="plot"
        style="height: ${Math.max(this.height, 80)}px"
        tabindex=${layout ? "0" : "-1"}
        aria-label="Chart values: use the left and right arrow keys to step through dates"
        aria-busy=${this._loading ? "true" : "false"}
        @pointerdown=${this._onPlotPointerDown}
        @pointermove=${this._hoverAt}
        @pointerleave=${(event: PointerEvent) => {
          if (event.pointerType === "mouse") this._hoverT = null;
        }}
        @keydown=${this._onKeyDown}
        @blur=${() => {
          this._hoverT = null;
          this._announcement = "";
          this._unpin();
        }}
      >
        ${this._renderPlot(layout)}
      </div>
      <div class="sr-only" role="status">${this._announcement}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "fan-chart": FanChart;
  }
}
