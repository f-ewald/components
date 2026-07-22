import { LitElement, css, html, svg } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
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

let gradientIdCounter = 0;

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
  @state() private _width = 0;

  private _ro: ResizeObserver | null = null;
  private readonly _gradIdBase = `percent-bar-grad-${gradientIdCounter++}`;

  /** Per-row gradient id, unique across instances and rows. */
  private _gradId(index: number): string {
    return `${this._gradIdBase}-${index}`;
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

  override render() {
    if (this._width === 0 || this.groups.length === 0) return html``;

    const innerW = this._width - PAD.left - PAD.right;
    const barMaxW = innerW - LABEL_W - PCT_W;
    const svgH = PAD.top + this.groups.length * ROW_H + PAD.bottom;

    const xScale = scaleLinear().domain([0, 100]).range([0, barMaxW]);

    // CSS stop styles preserve every valid CSS color format while matching
    // map-circle's 30% white/black vertical depth.
    const rowFills = this.groups.map((g, i) => {
      const color = g.color.trim();
      const gradId = this._gradId(i);
      return {
        fill: `url(#${gradId})`,
        gradient: svg`
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
        `,
      };
    });
    const gradients = rowFills.map((row) => row.gradient);

    const rows = this.groups.map((g, i) => {
      const cy = PAD.top + i * ROW_H + ROW_H / 2;
      const bw = Math.max(0, xScale(g.pct));
      return svg`
        <text class="chart-label" x=${PAD.left} y=${cy} font-size="10"
              text-anchor="start" dominant-baseline="middle">${g.label}</text>
        <rect x=${PAD.left + LABEL_W} y=${cy - 5}
              width=${bw} height="10" rx="5"
              fill=${rowFills[i].fill} />
        <text class="chart-label" x=${PAD.left + LABEL_W + barMaxW + 4} y=${cy} font-size="10"
              text-anchor="start" dominant-baseline="middle">${g.pct.toFixed(1)}%</text>
      `;
    });

    return html`
      <svg
        viewBox="0 0 ${this._width} ${svgH}"
        width=${this._width}
        height=${svgH}
        role="img"
        aria-label=${`Percentages: ${this.groups.map((group) => `${group.label} ${group.pct.toFixed(1)}%`).join(", ")}`}
      >
        <defs>${gradients}</defs>
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
