import { LitElement, css, html, svg } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { scaleLinear } from "d3-scale";
import { tokens } from "./tokens.js";

export interface PercentBarGroup {
  key: string;
  label: string;
  /**
   * The row's value. In `mode="percent"` (default) this is a 0-100
   * percentage, scaled against a fixed domain. In `mode="value"` this is an
   * arbitrary raw number, scaled against `max` (or the largest `value`
   * across `groups` when `max` is unset).
   */
  value: number;
  color: string;
}

/** Whether `PercentBarGroup.value` is a 0-100 percentage or an arbitrary raw number. */
export type PercentBarMode = "percent" | "value";
/** Bars grow rightward as stacked rows, or upward as side-by-side columns. */
export type PercentBarOrientation = "horizontal" | "vertical";

// Horizontal (row) layout.
const ROW_H = 20;
const LABEL_W = 56;
const VALUE_W = 36;

// Vertical (column) layout.
const COL_TRACK_H = 96;
const CAT_LABEL_H = 16;
const VALUE_LABEL_H = 14;
const MAX_BAR_W = 28;
const COL_GAP = 8;

const PAD = { top: 4, right: 4, bottom: 4, left: 4 };

let gradientIdCounter = 0;

/**
 * Bar chart for labeled rows, using D3's linear scale. Horizontal (default)
 * renders stacked rows with bars growing rightward; `orientation="vertical"`
 * renders side-by-side columns growing upward instead. `mode="percent"`
 * (default) scales `value` against a fixed 0-100 domain and labels it with a
 * `%` suffix; `mode="value"` scales it against `max` (or the largest `value`
 * present) and formats it with `valueFormat`.
 *
 * @element percent-bar-chart
 */
@customElement("percent-bar-chart")
export class PercentBarChart extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        width: 100%;
      }
      svg {
        display: block;
        overflow: visible;
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
      .chart-label {
        fill: var(--ui-text-muted, #64748b);
      }
      .gradient-start {
        stop-color: color-mix(in srgb, var(--percent-bar-color) 70%, #ffffff);
      }
      .gradient-end {
        stop-color: color-mix(in srgb, var(--percent-bar-color) 70%, #000000);
      }
    `,
  ];

  /** Rows to render, one per group. */
  @property({ attribute: false }) groups: PercentBarGroup[] = [];
  /** Whether `value` is a 0-100 percentage (fixed domain) or an arbitrary number (domain from data/`max`). */
  @property() mode: PercentBarMode = "percent";
  /** Bar direction: stacked rows growing rightward, or columns growing upward. */
  @property() orientation: PercentBarOrientation = "horizontal";
  /** Explicit domain max for `mode="value"`; auto-computed from `groups` when unset. Ignored in `mode="percent"`. */
  @property({ type: Number }) max?: number;
  /** Formats a row's value for its label in `mode="value"`. Defaults to locale-formatted number. */
  @property({ attribute: false }) valueFormat: (value: number) => string = (value) =>
    value.toLocaleString();

  @state() private _width = 0;

  private _ro: ResizeObserver | null = null;
  private readonly _gradIdBase = `percent-bar-grad-${gradientIdCounter++}`;

  /** Per-row gradient id, unique across instances and rows. */
  private _gradId(index: number): string {
    return `${this._gradIdBase}-${index}`;
  }

  /** The row's value formatted for display, per the current `mode`. */
  private _labelFor(value: number): string {
    return this.mode === "percent" ? `${value.toFixed(1)}%` : this.valueFormat(value);
  }

  /** The scale domain's upper bound for the current `mode`. */
  private _domainMax(): number {
    if (this.mode === "percent") return 100;
    if (this.max !== undefined) return this.max;
    return Math.max(0.000001, ...this.groups.map((g) => g.value));
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

  private _renderGradients() {
    return this.groups.map((g, i) => {
      const color = g.color.trim();
      const gradId = this._gradId(i);
      return svg`
        <linearGradient
          id=${gradId}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
          style=${styleMap({ "--percent-bar-color": color })}
        >
          <stop class="gradient-start" offset="0%" />
          <stop class="gradient-end" offset="100%" />
        </linearGradient>
      `;
    });
  }

  private _renderHorizontal() {
    const innerW = this._width - PAD.left - PAD.right;
    const barMaxW = innerW - LABEL_W - VALUE_W;
    const svgH = PAD.top + this.groups.length * ROW_H + PAD.bottom;
    const xScale = scaleLinear().domain([0, this._domainMax()]).range([0, barMaxW]);

    const rows = this.groups.map((g, i) => {
      const cy = PAD.top + i * ROW_H + ROW_H / 2;
      const bw = Math.max(0, xScale(g.value));
      return svg`
        <text class="chart-label" x=${PAD.left} y=${cy} font-size="10"
              text-anchor="start" dominant-baseline="middle">${g.label}</text>
        <rect x=${PAD.left + LABEL_W} y=${cy - 5}
              width=${bw} height="10" rx="5"
              fill="url(#${this._gradId(i)})" />
        <text class="chart-label" x=${PAD.left + LABEL_W + barMaxW + 4} y=${cy} font-size="10"
              text-anchor="start" dominant-baseline="middle">${this._labelFor(g.value)}</text>
      `;
    });

    return { svgH, content: rows };
  }

  private _renderVertical() {
    const innerW = this._width - PAD.left - PAD.right;
    const n = this.groups.length;
    const colSlotW = n > 0 ? innerW / n : 0;
    const barW = Math.max(4, Math.min(MAX_BAR_W, colSlotW - COL_GAP));
    const svgH = PAD.top + VALUE_LABEL_H + COL_TRACK_H + CAT_LABEL_H + PAD.bottom;
    const yScale = scaleLinear().domain([0, this._domainMax()]).range([0, COL_TRACK_H]);

    const cols = this.groups.map((g, i) => {
      const cx = PAD.left + i * colSlotW + colSlotW / 2;
      const barH = Math.max(0, yScale(g.value));
      const barTop = PAD.top + VALUE_LABEL_H + (COL_TRACK_H - barH);
      const catLabelY = PAD.top + VALUE_LABEL_H + COL_TRACK_H + CAT_LABEL_H - 4;
      return svg`
        <rect x=${cx - barW / 2} y=${barTop} width=${barW} height=${barH} rx=${barW / 2}
              fill="url(#${this._gradId(i)})" />
        <text class="chart-label" x=${cx} y=${barTop - 4} font-size="10"
              text-anchor="middle">${this._labelFor(g.value)}</text>
        <text class="chart-label" x=${cx} y=${catLabelY} font-size="10"
              text-anchor="middle">${g.label}</text>
      `;
    });

    return { svgH, content: cols };
  }

  override render() {
    if (this._width === 0 || this.groups.length === 0) return html``;

    const { svgH, content } =
      this.orientation === "vertical" ? this._renderVertical() : this._renderHorizontal();
    const ariaPrefix = this.mode === "percent" ? "Percentages" : "Values";

    return html`
      <svg
        viewBox="0 0 ${this._width} ${svgH}"
        width=${this._width}
        height=${svgH}
        role="img"
        aria-label=${`${ariaPrefix}: ${this.groups.map((g) => `${g.label} ${this._labelFor(g.value)}`).join(", ")}`}
      >
        <defs>${this._renderGradients()}</defs>
        ${content}
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "percent-bar-chart": PercentBarChart;
  }
}
