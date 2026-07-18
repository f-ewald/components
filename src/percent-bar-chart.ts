import { LitElement, css, html, svg } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { scaleLinear } from "d3-scale";
import { tokens } from "./tokens.js";

export interface PercentBarGroup {
  key: string;
  label: string;
  pct: number;
  color: string;
}

const ROW_H = 20;
const LABEL_W = 56;
const PCT_W = 36;
const PAD = { top: 4, right: 4, bottom: 4, left: 4 };

/**
 * Horizontal bar chart for labeled percentage rows, using D3's linear scale.
 * Each group gets its own labeled row; bars are proportional to percentage of 100.
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
      }
    `,
  ];

  /** Rows to render, one per group. */
  @property({ attribute: false }) groups: PercentBarGroup[] = [];
  @state() private _width = 0;

  private _ro: ResizeObserver | null = null;

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

  override render() {
    if (this._width === 0 || this.groups.length === 0) return html``;

    const innerW = this._width - PAD.left - PAD.right;
    const barMaxW = innerW - LABEL_W - PCT_W;
    const svgH = PAD.top + this.groups.length * ROW_H + PAD.bottom;

    const xScale = scaleLinear().domain([0, 100]).range([0, barMaxW]);

    const rows = this.groups.map((g, i) => {
      const cy = PAD.top + i * ROW_H + ROW_H / 2;
      const bw = Math.max(0, xScale(g.pct));
      return svg`
        <text x=${PAD.left} y=${cy} font-size="10" fill="#64748b"
              text-anchor="start" dominant-baseline="middle">${g.label}</text>
        <rect x=${PAD.left + LABEL_W} y=${cy - 5}
              width=${bw} height="10" rx="2"
              fill=${g.color} fill-opacity="0.82" />
        <text x=${PAD.left + LABEL_W + barMaxW + 4} y=${cy} font-size="10" fill="#64748b"
              text-anchor="start" dominant-baseline="middle">${g.pct.toFixed(1)}%</text>
      `;
    });

    return html`
      <svg viewBox="0 0 ${this._width} ${svgH}" width=${this._width} height=${svgH}>
        ${rows}
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "percent-bar-chart": PercentBarChart;
  }
}
