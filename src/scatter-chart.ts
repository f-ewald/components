import { LitElement, css, html, nothing, svg } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { max, min } from "d3-array";
import { tokens } from "./tokens.js";
import {
  CHART_COLORS,
  ChartFormatter,
  buildAxisScale,
  defaultTrueBoolean,
  resolveVisibleIds,
  toggleLegendVisibility,
  type ChartScale,
} from "./utils/chart.js";

/** One data point rendered by `scatter-chart`. */
export interface ScatterPoint {
  /** Stable identifier used to animate smoothly when coordinates update. */
  id?: string;
  /** X coordinate. */
  x: number;
  /** Y coordinate. */
  y: number;
  /** Optional category/group ID used for coloring and the interactive legend. */
  group?: string;
  /** Optional explicit CSS color overriding the group color. */
  color?: string;
  /** Optional dot radius in CSS pixels (default 4.5). */
  radius?: number;
  /** Optional headline shown in the tooltip and screen-reader announcements. */
  label?: string;
  /** Optional secondary detail line shown in the tooltip. */
  detail?: string;
  /** Marks the dot as linked/actionable with an outer ring and pointer cursor. */
  linked?: boolean;
}

/** Optional metadata for a `scatter-chart` group in the legend. */
export interface ScatterGroup {
  id: string;
  label?: string;
  color?: string;
}

/** A diagonal (`y = x`), horizontal, or vertical reference line on `scatter-chart`. */
export type ScatterReference =
  | {
      axis: "diagonal";
      label?: string;
      dashed?: boolean;
      color?: string;
    }
  | {
      axis: "x" | "y";
      value: number;
      label?: string;
      dashed?: boolean;
      color?: string;
    };

interface PreparedGroup {
  id: string;
  label: string;
  color: string;
}

interface PreparedPoint {
  key: string;
  index: number;
  x: number;
  y: number;
  group: string;
  color: string;
  radius: number;
  source: ScatterPoint;
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
  groups: PreparedGroup[];
  points: PreparedPoint[];
  /** Indices into `points`, ordered by `(x, y)` for predictable arrow-key stepping. */
  order: number[];
}

const MARGIN = { top: 16, right: 16, bottom: 28 };
const X_LABEL_PX = 18;
const Y_LABEL_PX = 16;
const TICK_FONT_PX = 11;
const TOOLTIP_W = 240;
const HIT_RADIUS_PX = 28;
const DEFAULT_RADIUS = 4.5;
const LONG_PRESS_MS = 500;

/**
 * Interactive 2D scatter plot with optional grouped colors and legend,
 * diagonal (`y = x`) and axis reference lines, equal-axis scaling, ringed
 * clickable points, smooth keyed updates (respecting `prefers-reduced-motion`),
 * floating tooltips, touch tap pinning, and arrow-key navigation.
 *
 * @element scatter-chart
 * @fires scatter-point-select - User clicked a dot or pressed Enter/Space while inspecting it. `detail: { point: ScatterPoint, index: number }`.
 * @fires series-visibility-change - Legend changed visible groups. `detail: { visible: string[] | null }` (null = all).
 */
@customElement("scatter-chart")
export class ScatterChart extends LitElement {
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
        align-items: center;
        gap: 0.25rem;
        margin-bottom: 0.5rem;
      }
      .legend-heading {
        margin-right: 0.25rem;
        color: var(--ui-text-muted, #64748b);
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-medium, 500);
        text-transform: var(--ui-label-transform, none);
        letter-spacing: var(--ui-tracking-wide, 0.04em);
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
        width: 0.625rem;
        height: 0.625rem;
        border-radius: var(--ui-radius-circle, 50%);
        background: currentColor;
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
      .dot-group {
        transition: transform 250ms ease;
      }
      .dot-group.no-animate {
        transition: none;
      }
      .dot {
        fill-opacity: 0.78;
        stroke: var(--ui-surface, #ffffff);
        stroke-width: 1px;
        cursor: pointer;
      }
      .dot.static {
        cursor: default;
      }
      .dot.linked {
        fill-opacity: 0.92;
        stroke: var(--ui-text, #0f172a);
        stroke-width: 1.5px;
      }
      .hover-ring {
        fill: none;
        stroke: var(--ui-primary, #4f46e5);
        stroke-width: 2px;
        pointer-events: none;
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
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: var(--ui-font-weight-semibold, 600);
      }
      .tooltip-title {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .tooltip-row {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .tooltip-muted {
        opacity: 0.75;
      }
      .tooltip-detail {
        margin-top: 0.25rem;
        opacity: 0.85;
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
        .swatch {
          forced-color-adjust: none;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .dot-group,
        .legend-item {
          transition: none;
        }
      }
    `,
  ];

  /** Points to plot. Assign a new array to update; give points stable `id`s for smooth movement. */
  @property({ attribute: false }) points: ScatterPoint[] = [];
  /** Optional explicit group order, labels, and colors for the legend. */
  @property({ attribute: false }) groups: ScatterGroup[] | null = null;
  /** Visible group IDs; `null` (default) shows all. Updated by the legend. */
  @property({ attribute: false }) visible: string[] | null = null;
  /** X axis scale: `"linear"` (default) or `"log"`. */
  @property({ attribute: "x-type" }) xType: "linear" | "log" = "linear";
  /** Y axis scale: `"linear"` (default) or `"log"`. */
  @property({ attribute: "y-type" }) yType: "linear" | "log" = "linear";
  /** Optional x axis title drawn below tick labels. */
  @property({ attribute: "x-label" }) xLabel = "";
  /** Optional y axis title drawn along the left edge. */
  @property({ attribute: "y-label" }) yLabel = "";
  /** Fixed x axis range `[min, max]`; `null` fits the data. */
  @property({ attribute: false }) xDomain: [number, number] | null = null;
  /** Fixed y axis range `[min, max]`; `null` fits the data. */
  @property({ attribute: false }) yDomain: [number, number] | null = null;
  /** Uses the same `[min, max]` extent on both axes (ideal for predicted-vs-true diagonal plots). */
  @property({ type: Boolean, reflect: true, attribute: "equal-axes" }) equalAxes = false;
  /** Diagonal (`y = x`), horizontal, or vertical reference lines. */
  @property({ attribute: false }) references: ScatterReference[] = [];
  /** Optional prefix label shown before the group legend items (e.g. `"Delay"`). */
  @property({ attribute: "legend-label" }) legendLabel = "";
  /** Smoothly transitions dot positions across updates (disabled under `prefers-reduced-motion`). */
  @property({ type: Boolean }) animated = true;
  /** Plot height in CSS pixels, excluding the legend. */
  @property({ type: Number }) height = 340;
  /** BCP 47 locale for default number formatting. */
  @property() locale = "en-US";
  /** Custom formatter for x ticks, tooltip, and summary. */
  @property({ attribute: false }) xFormat: ((x: number) => string) | null = null;
  /** Custom formatter for y ticks, tooltip, and summary. */
  @property({ attribute: false }) yFormat: ((y: number) => string) | null = null;
  /** Enables clicking points and legend toggling (default `true`; accepts `interactive="false"`). */
  @property({ type: Boolean, converter: defaultTrueBoolean }) interactive = true;
  /** Shows the hover/tap/keyboard tooltip and focus ring (default `true`; accepts `tooltip="false"`). */
  @property({ type: Boolean, converter: defaultTrueBoolean }) tooltip = true;

  @state() private _width = 0;
  @state() private _activeKey: string | null = null;
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
      this._activeKey = null;
      this._announcement = "";
      this._unpin();
    }
  }

  private _formatX(v: number): string {
    return this.xFormat ? this.xFormat(v) : this._formatter.number(v, this.locale);
  }

  private _formatY(v: number): string {
    return this.yFormat ? this.yFormat(v) : this._formatter.number(v, this.locale);
  }

  private _prepareGroups(): PreparedGroup[] {
    if (this.groups && this.groups.length > 0) {
      return this.groups.map((g, i) => ({
        id: g.id,
        label: g.label ?? g.id,
        color: g.color ?? CHART_COLORS[i % CHART_COLORS.length],
      }));
    }
    const seen = new Map<string, PreparedGroup>();
    for (const p of this.points) {
      if (!p.group || seen.has(p.group)) continue;
      const i = seen.size;
      seen.set(p.group, { id: p.group, label: p.group, color: CHART_COLORS[i % CHART_COLORS.length] });
    }
    return [...seen.values()];
  }

  private _computeLayout(): Layout | null {
    if (this._width < 10) return null;
    const groups = this._prepareGroups();
    const colorByGroup = new Map(groups.map((g) => [g.id, g.color]));
    const shownGroups =
      groups.length > 0
        ? resolveVisibleIds(
            groups.map((g) => g.id),
            this.visible,
          )
        : null;

    const allValid: PreparedPoint[] = [];
    this.points.forEach((source, index) => {
      if (!Number.isFinite(source.x) || !Number.isFinite(source.y)) return;
      if (this.xType === "log" && !(source.x > 0)) return;
      if (this.yType === "log" && !(source.y > 0)) return;
      const group = source.group ?? "";
      const color = source.color ?? (group ? colorByGroup.get(group) : undefined) ?? CHART_COLORS[0];
      const radius = Math.max(source.radius ?? DEFAULT_RADIUS, 2);
      allValid.push({ key: source.id ?? String(index), index, x: source.x, y: source.y, group, color, radius, source });
    });

    const points = shownGroups ? allValid.filter((p) => !p.group || shownGroups.has(p.group)) : allValid;
    if (points.length === 0) return null;

    const xVals = points.map((p) => p.x);
    const yVals = points.map((p) => p.y);
    let xLo = this.xDomain ? Math.min(...this.xDomain) : Math.min(min(xVals)!, this.xType === "linear" ? 0 : Infinity);
    let xHi = this.xDomain ? Math.max(...this.xDomain) : max(xVals)!;
    let yLo = this.yDomain ? Math.min(...this.yDomain) : Math.min(min(yVals)!, this.yType === "linear" ? 0 : Infinity);
    let yHi = this.yDomain ? Math.max(...this.yDomain) : max(yVals)!;

    if (this.equalAxes && this.xType === this.yType) {
      const lo = Math.min(xLo, yLo);
      const hi = Math.max(xHi, yHi);
      if (!this.xDomain) {
        xLo = lo;
        xHi = hi;
      }
      if (!this.yDomain) {
        yLo = lo;
        yHi = hi;
      }
    }

    const height = Math.max(this.height, 120);
    const top = MARGIN.top;
    const bottom = height - MARGIN.bottom - (this.xLabel ? X_LABEL_PX : 0);
    const y = buildAxisScale(this.yType, yLo, yHi, [bottom, top], { nice: this.yDomain === null });

    const yTickCount = Math.max(2, Math.floor((bottom - top) / 50));
    const longestY = max(y.ticks(yTickCount), (v) => this._formatY(v).length) ?? 4;
    const left = Math.min(Math.max(Math.ceil(longestY * TICK_FONT_PX * 0.65) + 12, 40), 120) + (this.yLabel ? Y_LABEL_PX : 0);
    const plotW = Math.max(this._width - left - MARGIN.right, 1);
    const x = buildAxisScale(
      this.xType,
      this.equalAxes && !this.xDomain && this.xType === this.yType ? y.domain[0] : xLo,
      this.equalAxes && !this.xDomain && this.xType === this.yType ? y.domain[1] : xHi,
      [left, left + plotW],
      { nice: this.xDomain === null && !this.equalAxes },
    );

    const order = points
      .map((_, i) => i)
      .sort((a, b) => points[a].x - points[b].x || points[a].y - points[b].y);

    return { width: this._width, height, top, left, plotW, bottom, x, y, groups, points, order };
  }

  private _nearestPoint(layout: Layout, px: number, py: number): PreparedPoint | null {
    let best: PreparedPoint | null = null;
    let bestDist = HIT_RADIUS_PX * HIT_RADIUS_PX;
    for (const p of layout.points) {
      const dx = layout.x(p.x) - px;
      const dy = layout.y(p.y) - py;
      const dist = dx * dx + dy * dy;
      if (dist <= bestDist) {
        bestDist = dist;
        best = p;
      }
    }
    return best;
  }

  private _emitSelect(point: PreparedPoint) {
    this.dispatchEvent(
      new CustomEvent("scatter-point-select", {
        detail: { point: point.source, index: point.index },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _hoverAt(event: PointerEvent) {
    if (!this.tooltip) return;
    const layout = this._layout;
    if (!layout) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const hit = this._nearestPoint(layout, px, py);
    if (hit) this._activeKey = hit.key;
    else if (event.pointerType === "mouse") this._activeKey = null;
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
    this._activeKey = null;
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
    const hit = this._nearestPoint(layout, event.clientX - rect.left, event.clientY - rect.top);
    if (hit) {
      if (this.tooltip) this._activeKey = hit.key;
      this._emitSelect(hit);
    }
  }

  private _onKeyDown(event: KeyboardEvent) {
    if (!this.tooltip) return;
    const layout = this._layout;
    if (!layout || layout.order.length === 0) return;
    if (event.key === "Escape") {
      if (this._activeKey === null) return;
      this._activeKey = null;
      this._announcement = "";
      this._unpin();
      event.preventDefault();
      return;
    }
    const orderedPoints = layout.order.map((i) => layout.points[i]);
    const current = this._activeKey === null ? -1 : orderedPoints.findIndex((p) => p.key === this._activeKey);
    if ((event.key === "Enter" || event.key === " ") && current >= 0) {
      if (!this.interactive) return;
      event.preventDefault();
      this._emitSelect(orderedPoints[current]);
      return;
    }
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = current >= 0 ? current + 1 : 0;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = current >= 0 ? current - 1 : orderedPoints.length - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = orderedPoints.length - 1;
    else return;
    event.preventDefault();
    const picked = orderedPoints[Math.min(Math.max(next, 0), orderedPoints.length - 1)];
    this._activeKey = picked.key;
    this._announcement = this._describe(picked);
  }

  private _describe(p: PreparedPoint): string {
    const title = p.source.label ?? (p.group ? p.group : `Point ${p.index + 1}`);
    const xName = this.xLabel || "x";
    const yName = this.yLabel || "y";
    return `${title}: ${xName} ${this._formatX(p.x)}, ${yName} ${this._formatY(p.y)}${p.source.detail ? `, ${p.source.detail}` : ""}`;
  }

  private _onLegendPointerDown(id: string, event: PointerEvent) {
    this._suppressClick = false;
    if (event.pointerType === "mouse") return;
    this._cancelPress();
    this._pressTimer = setTimeout(() => {
      this._pressTimer = null;
      this._suppressClick = true;
      this._toggleGroup(id, true);
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
    this._toggleGroup(id, event.ctrlKey || event.metaKey);
  }

  private _toggleGroup(id: string, toggle: boolean) {
    const allIds = this._prepareGroups().map((g) => g.id);
    const next = toggleLegendVisibility(allIds, this.visible, id, toggle);
    this.visible = next;
    this.dispatchEvent(
      new CustomEvent("series-visibility-change", { detail: { visible: next }, bubbles: true, composed: true }),
    );
  }

  private _summary(layout: Layout): string {
    const xRange = `${this._formatX(layout.x.domain[0])} to ${this._formatX(layout.x.domain[1])}`;
    const yRange = `${this._formatY(layout.y.domain[0])} to ${this._formatY(layout.y.domain[1])}`;
    return `Scatter chart, ${layout.points.length} points. ${this.xLabel || "X"} ${xRange}; ${this.yLabel || "Y"} ${yRange}.`;
  }

  private _renderAxes(layout: Layout) {
    const { x, y, left, plotW, top, bottom, height } = layout;
    const yTicks = y.ticks(Math.max(2, Math.floor((bottom - top) / 50)));
    const xTicks = x.ticks(Math.max(2, Math.floor(plotW / 80)));
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
          <line class="grid-line" x1=${x(v)} x2=${x(v)} y1=${top} y2=${bottom} stroke-width="1" />
          <text class="axis-label x-tick" x=${x(v)} y=${bottom + MARGIN.bottom - 8} text-anchor="middle"
            font-size=${TICK_FONT_PX}>${this._formatX(v)}</text>
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
    return this.references.map((ref) => {
      const dash = ref.dashed === false ? nothing : "4 4";
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
        if (!Number.isFinite(ref.value) || (this.yType === "log" && ref.value <= 0)) return nothing;
        const py = y(ref.value);
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
      if (!Number.isFinite(ref.value) || (this.xType === "log" && ref.value <= 0)) return nothing;
      const px = x(ref.value);
      if (px < left - 1 || px > right + 1) return nothing;
      return svg`
        <line class="ref-line ref-x" x1=${px} x2=${px} y1=${top} y2=${bottom}
          stroke-width="1.5" stroke-dasharray=${dash} style=${strokeStyle} />
        ${ref.label
          ? svg`<text class="ref-label" x=${px + 4} y=${top + 12} text-anchor="start"
              font-size=${TICK_FONT_PX} style=${fillStyle}>${ref.label}</text>`
          : nothing}
      `;
    });
  }

  private _renderHover(layout: Layout) {
    if (!this.tooltip || this._activeKey === null) return { ring: nothing, tip: nothing };
    const active = layout.points.find((p) => p.key === this._activeKey);
    if (!active) return { ring: nothing, tip: nothing };
    const px = layout.x(active.x);
    const py = layout.y(active.y);
    const ring = svg`<circle class="hover-ring" cx=${px} cy=${py} r=${active.radius + 3} />`;
    const flip = px + 14 + TOOLTIP_W > layout.width;
    const tipLeft = flip ? Math.max(px - 14 - TOOLTIP_W, 0) : px + 14;
    const tipTop = Math.max(0, Math.min(py - 16, layout.bottom - 112));
    const groupLabel = layout.groups.find((g) => g.id === active.group)?.label ?? active.group;
    const heading = active.source.label ?? (groupLabel || `Point ${active.index + 1}`);
    const tip = html`
      <div class="tooltip" style="left: ${tipLeft}px; top: ${tipTop}px" aria-hidden="true">
        <div class="tooltip-head">
          <span class="swatch" style="color: ${active.color}"></span>
          <span class="tooltip-title">${heading}</span>
        </div>
        ${active.source.label && groupLabel
          ? html`<div class="tooltip-muted">${groupLabel}</div>`
          : nothing}
        <div class="tooltip-row">
          <span class="tooltip-muted">${this.xLabel || "X"}</span>
          <span>${this._formatX(active.x)}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-muted">${this.yLabel || "Y"}</span>
          <span>${this._formatY(active.y)}</span>
        </div>
        ${active.source.detail ? html`<div class="tooltip-detail">${active.source.detail}</div>` : nothing}
      </div>
    `;
    return { ring, tip };
  }

  private _renderLegend(groups: PreparedGroup[], shown: Set<string>) {
    if (groups.length < 2) return nothing;
    if (!this.interactive) {
      return html`<div class="legend" role="group" aria-label=${this.legendLabel || "Groups"}>
        ${this.legendLabel ? html`<span class="legend-heading">${this.legendLabel}</span>` : nothing}
        ${groups.map(
          (g) => html`<span class="legend-item static ${shown.has(g.id) ? "" : "dimmed"}" data-group=${g.id}>
            <span class="swatch" style="color: ${g.color}"></span>
            <span>${g.label}</span>
          </span>`,
        )}
      </div>`;
    }
    return html`<div class="legend" role="group" aria-label=${this.legendLabel || "Groups"}>
      ${this.legendLabel ? html`<span class="legend-heading">${this.legendLabel}</span>` : nothing}
      ${groups.map(
        (g) => html`<button
          type="button"
          class="legend-item"
          data-group=${g.id}
          aria-pressed=${shown.has(g.id) ? "true" : "false"}
          title="Click to show only this group; Ctrl/Cmd-click or long-press to toggle it"
          @click=${(event: MouseEvent) => this._onLegendClick(g.id, event)}
          @pointerdown=${(event: PointerEvent) => this._onLegendPointerDown(g.id, event)}
          @pointerup=${this._cancelPress}
          @pointercancel=${this._cancelPress}
          @pointerleave=${this._cancelPress}
          @contextmenu=${(event: Event) => {
            if (this._pressTimer !== null || this._suppressClick) event.preventDefault();
          }}
        >
          <span class="swatch" style="color: ${g.color}"></span>
          <span>${g.label}</span>
        </button>`,
      )}
    </div>`;
  }

  override render() {
    const layout = this._computeLayout();
    this._layout = layout;
    const groups = layout ? layout.groups : this._prepareGroups();
    const shown = resolveVisibleIds(
      groups.map((g) => g.id),
      this.visible,
    );
    const hover = layout ? this._renderHover(layout) : { ring: nothing, tip: nothing };
    const h = Math.max(this.height, 120);
    return html`
      ${this._renderLegend(groups, shown)}
      <div
        class="plot"
        style="height: ${h}px"
        tabindex=${layout && this.tooltip ? "0" : "-1"}
        aria-label=${this.tooltip
          ? `Scatter chart points: use arrow keys to inspect points${this.interactive ? ", Enter to select" : ""}`
          : nothing}
        @pointerdown=${this._onPlotPointerDown}
        @pointermove=${this._hoverAt}
        @pointerleave=${(event: PointerEvent) => {
          if (event.pointerType === "mouse") this._activeKey = null;
        }}
        @click=${this._onPlotClick}
        @keydown=${this._onKeyDown}
        @blur=${() => {
          this._activeKey = null;
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
                  <clipPath id="scatter-plot-area">
                    <rect x=${layout.left} y=${layout.top} width=${layout.plotW} height=${layout.bottom - layout.top} />
                  </clipPath>
                </defs>
                ${this._renderAxes(layout)}
                <g clip-path="url(#scatter-plot-area)">
                  ${this._renderReferences(layout)}
                  ${repeat(
                    layout.points,
                    (p) => p.key,
                    (p) => {
                      const px = layout.x(p.x);
                      const py = layout.y(p.y);
                      return svg`<g class="dot-group ${this.animated ? "" : "no-animate"}"
                        data-id=${p.key} data-group=${p.group}
                        style="transform: translate(${px.toFixed(2)}px, ${py.toFixed(2)}px)">
                        <circle class="dot ${p.source.linked ? "linked" : ""} ${this.interactive ? "" : "static"}" r=${p.radius}
                          style="fill: ${p.color}" />
                      </g>`;
                    },
                  )}
                </g>
                ${hover.ring}
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
    "scatter-chart": ScatterChart;
  }
}
