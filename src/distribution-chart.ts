import { LitElement, css, html, nothing, svg } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { scaleLinear } from "d3-scale";
import { line, area } from "d3-shape";
import { max } from "d3-array";
import { tokens } from "./tokens.js";

interface DistributionPoint {
  x: number;
  y: number;
}

interface DistributionData {
  points: DistributionPoint[];
  unit: string;
  label: string;
  min: number;
  max: number;
  mean: number;
}

export interface DistributionValue {
  /** Short label shown on the chart marker, e.g. 'A'. Empty string = show raw value instead. */
  label: string;
  value: number;
}

/** Fixed SVG height in CSS pixels — the coordinate system is always 1 user-unit = 1 px. */
const SVG_H = 130;
const PAD = { top: 22, right: 12, bottom: 18, left: 12 };

/** Default marker colors (indigo/amber/teal/rose 600s), assigned in order. */
const DEFAULT_MARKER_COLORS = ["#4f46e5", "#d97706", "#0d9488", "#e11d48"];

/**
 * Renders a KDE distribution curve for a named metric with one or more value
 * markers. The SVG viewBox is kept in sync with the element's pixel width via
 * ResizeObserver so that font sizes and stroke widths are always in real pixels
 * regardless of container width.
 *
 * Pass `fontSize` to control all text size (default 11). Pass a single
 * `{label:'', value}` for a single-value display or multiple
 * `{label:'A'|'B'|...}` entries to compare several values.
 *
 * @element distribution-chart
 */
@customElement("distribution-chart")
export class DistributionChart extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        width: 100%;
      }
      .wrap {
        padding: 4px 0 8px;
      }
      svg {
        display: block;
        overflow: visible;
      }
      .curve {
        fill: none;
        stroke: #4f46e5;
        stroke-width: 1.5;
        stroke-linejoin: round;
      }
      .fill {
        fill: url(#dist-fill-grad);
      }
      .skeleton {
        background: linear-gradient(90deg, #f8fafc 25%, #e2e8f0 50%, #f8fafc 75%);
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite;
        border-radius: var(--ui-radius-sm, 0.25rem);
        height: 100px;
      }
      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
      .error {
        font-size: var(--ui-font-size-sm, 0.75rem);
        color: var(--ui-danger, #dc2626);
        padding: 8px 0;
      }
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 6px 12px;
        padding: 2px 0 2px 8px;
      }
      .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: var(--ui-font-size-sm, 0.75rem);
        color: var(--ui-text-muted, #64748b);
      }
      .legend-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex: 0 0 auto;
      }
    `,
  ];

  /** Metric name, fetched from `/api/distribution/<metric>` on change. */
  @property() metric = "";
  /** One or more values to mark on the distribution curve. */
  @property({ attribute: false }) values: DistributionValue[] = [];
  /** Colors assigned to markers in order. Defaults to indigo/amber/teal/rose 600s. */
  @property({ attribute: false }) markerColors: string[] = DEFAULT_MARKER_COLORS;
  /** Target font size in CSS pixels (default 11). Always renders at this size regardless of container width. */
  @property({ type: Number, attribute: "font-size" }) fontSize = 11;

  @state() private _data: DistributionData | null = null;
  @state() private _loading = false;
  @state() private _error: string | null = null;
  /** Measured element width in CSS pixels. 0 until ResizeObserver fires. */
  @state() private _width = 0;
  /** Inner x coordinate (px) of the current hover position, or null when not hovering. */
  @state() private _hoverX: number | null = null;

  private _fetchedFor = "";
  private _ro: ResizeObserver | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this._maybeFetch();
  }

  override firstUpdated() {
    this._ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      if (w > 0 && w !== this._width) this._width = w;
    });
    this._ro.observe(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._ro?.disconnect();
    this._ro = null;
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has("metric")) this._maybeFetch();
  }

  private _maybeFetch() {
    if (!this.metric || this._fetchedFor === this.metric) return;
    this._fetchedFor = this.metric;
    this._loading = true;
    this._error = null;
    fetch(`/api/distribution/${encodeURIComponent(this.metric)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<DistributionData>;
      })
      .then((data) => {
        this._data = data;
        this._loading = false;
      })
      .catch((err: unknown) => {
        this._error = err instanceof Error ? err.message : "Failed to load";
        this._loading = false;
      });
  }

  private _renderSvg(data: DistributionData) {
    if (this._width === 0) return nothing;

    const innerW = this._width - PAD.left - PAD.right;
    const innerH = SVG_H - PAD.top - PAD.bottom;
    const fs = this.fontSize;

    const pts = data.points;
    const maxY = max(pts, (p) => p.y) ?? 1;

    const xScale = scaleLinear().domain([pts[0].x, pts[pts.length - 1].x]).range([0, innerW]);
    const yScale = scaleLinear().domain([0, maxY]).range([innerH, 0]);

    const lineFn = line<DistributionPoint>()
      .x((p) => xScale(p.x))
      .y((p) => yScale(p.y));

    const areaFn = area<DistributionPoint>()
      .x((p) => xScale(p.x))
      .y0(innerH)
      .y1((p) => yScale(p.y));

    const curvePath = lineFn(pts) ?? "";
    const fillPath = areaFn(pts) ?? "";

    const minLabel = data.min.toLocaleString("en-US", { maximumFractionDigits: 0 });
    const maxLabel = data.max.toLocaleString("en-US", { maximumFractionDigits: 0 });

    const hasLabels = this.values.some((v) => v.label !== "");

    const markers = this.values
      .filter((v) => v.value >= pts[0].x && v.value <= pts[pts.length - 1].x)
      .map((v, i) => {
        const color = this.markerColors[i % this.markerColors.length];
        const mx = xScale(v.value);
        const labelText = hasLabels
          ? v.label
          : `${v.value.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${data.unit}`;
        return svg`
          <line stroke=${color} stroke-width="1.5" stroke-dasharray="4 3"
                x1=${mx} y1=${0} x2=${mx} y2=${innerH} />
          <text font-size=${fs} font-weight="600" fill=${color} text-anchor="middle"
                x=${mx} y=${-fs * 0.4}>${labelText}</text>
        `;
      });

    const crosshair = this._hoverX != null ? (() => {
      const hx = Math.max(0, Math.min(innerW, this._hoverX!));
      const hVal = xScale.invert(hx);
      const hLabel = `${Math.round(hVal).toLocaleString("en-US")} ${data.unit}`;
      // Keep label anchor away from edges so it doesn't clip
      const anchor = hx < innerW * 0.2 ? "start" : hx > innerW * 0.8 ? "end" : "middle";
      const lx = hx < innerW * 0.2 ? 0 : hx > innerW * 0.8 ? innerW : hx;
      return svg`
        <line stroke="#94a3b8" stroke-width="1" x1=${hx} y1=${0} x2=${hx} y2=${innerH} />
        <text font-size=${fs} fill="#64748b" font-weight="500"
              text-anchor=${anchor} x=${lx} y=${-fs * 0.4}>${hLabel}</text>
      `;
    })() : nothing;

    return svg`
      <svg viewBox="0 0 ${this._width} ${SVG_H}" width=${this._width} height=${SVG_H}
           style="cursor:crosshair"
           @mousemove=${(e: MouseEvent) => {
             const innerX = e.offsetX - PAD.left;
             this._hoverX = (innerX >= 0 && innerX <= innerW) ? innerX : null;
           }}
           @mouseleave=${() => { this._hoverX = null; }}>
        <defs>
          <linearGradient id="dist-fill-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.28"/>
            <stop offset="100%" stop-color="#4f46e5" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <g transform="translate(${PAD.left},${PAD.top})">
          <path class="fill" d=${fillPath} />
          <path class="curve" d=${curvePath} />
          ${markers}
          ${crosshair}
          <text font-size=${fs} fill="#94a3b8" text-anchor="start" x=${0} y=${innerH + fs * 1.4}>${minLabel}</text>
          <text font-size=${fs} fill="#94a3b8" text-anchor="end"   x=${innerW} y=${innerH + fs * 1.4}>${maxLabel}</text>
          <text font-size=${fs} fill="#94a3b8" text-anchor="middle" x=${innerW / 2} y=${innerH + fs * 1.4}>${data.unit}</text>
        </g>
      </svg>
    `;
  }

  private _renderLegend(data: DistributionData) {
    const hasLabels = this.values.some((v) => v.label !== "");
    if (!hasLabels) return nothing;
    return html`
      <div class="legend">
        ${this.values.map((v, i) => {
          const color = this.markerColors[i % this.markerColors.length];
          const formatted = v.value.toLocaleString("en-US", { maximumFractionDigits: 0 });
          return html`
            <span class="legend-item">
              <span class="legend-dot" style="background:${color}"></span>
              ${v.label}: ${formatted} ${data.unit}
            </span>
          `;
        })}
      </div>
    `;
  }

  override render() {
    if (this._loading || this._width === 0) return html`<div class="wrap"><div class="skeleton"></div></div>`;
    if (this._error) return html`<div class="wrap"><div class="error">Could not load distribution</div></div>`;
    if (!this._data) return nothing;
    return html`
      <div class="wrap">
        ${this._renderSvg(this._data)}
        ${this._renderLegend(this._data)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "distribution-chart": DistributionChart;
  }
}
