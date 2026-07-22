import { LitElement, css, html, svg } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { scaleTime, scaleLinear } from "d3-scale";
import { line, area } from "d3-shape";
import { min, max } from "d3-array";
import { tokens } from "./tokens.js";

export interface PricePoint {
  date: string | null;
  price: number | null;
  eventType: string;
  source?: string | null;
}

interface PlottedPoint extends PricePoint {
  x: number;
  y: number;
}

function fmtMoney(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

function fmtMoneyShort(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString("en-US")}`;
}

/**
 * D3-powered SVG line chart for property price history.
 *
 * Uses scaleTime (X) + scaleLinear (Y) from d3-scale and line/area path
 * generators from d3-shape. Adapts to container width via ResizeObserver.
 *
 * @element price-history-chart
 * @prop history - Array of price points (points with null price/date are skipped).
 * @prop yLabels - "auto" (default) | "always" | "never"
 * @prop maxXLabels - Max X-axis date ticks (default 3).
 */
@customElement("price-history-chart")
export class PriceHistoryChart extends LitElement {
  @property({ type: Array }) history: PricePoint[] = [];
  @property({ attribute: "y-labels" }) yLabels: "auto" | "always" | "never" = "auto";
  @property({ type: Number, attribute: "max-x-labels" }) maxXLabels = 3;

  @state() private _width = 0;
  @state() private _hoveredIdx: number | null = null;

  private _ro: ResizeObserver | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this._ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) this._width = entry.contentRect.width;
    });
    this._ro.observe(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._ro?.disconnect();
    this._ro = null;
  }

  private get validPoints(): PricePoint[] {
    return this.history
      .filter((h) => h.price != null && h.date != null)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
  }

  private get showY(): boolean {
    return this.yLabels === "always" || (this.yLabels === "auto" && this._width >= 260);
  }

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        width: 100%;
      }
      .wrap {
        position: relative;
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
      .axis-label {
        fill: var(--ui-text-muted, #64748b);
      }
      .grid-line {
        stroke: var(--ui-border, #e2e8f0);
      }
      .series-line {
        stroke: var(--ui-primary, #4f46e5);
      }
      .series-gradient {
        stop-color: var(--ui-primary, #4f46e5);
      }
      .series-point {
        fill: var(--ui-primary, #4f46e5);
        stroke: var(--ui-on-accent, #ffffff);
        cursor: pointer;
      }
      .tooltip {
        fill: var(--ui-tooltip, #0f172a);
      }
      .tooltip-label {
        fill: var(--ui-on-accent, #ffffff);
      }
    `,
  ];

  private computeLayout() {
    if (this._width < 10) return null;
    const points = this.validPoints;
    if (points.length < 2) return null;

    const H = 180;
    const MT = 20;
    const MB = 30;
    const MR = 12;
    const ML = this.showY ? 56 : 12;
    const plotW = Math.max(this._width - ML - MR, 1);
    const plotH = Math.max(H - MT - MB, 1);
    const bottomY = MT + plotH;

    const prices = points.map((p) => p.price!);
    const dates = points.map((p) => new Date(p.date!));
    const minPrice = min(prices)!;
    const maxPrice = max(prices)!;
    const pad = (maxPrice - minPrice) * 0.05 || maxPrice * 0.05;

    const xScale = scaleTime()
      .domain([min(dates)!, max(dates)!])
      .range([ML, ML + plotW]);

    const yScale = scaleLinear()
      .domain([minPrice - pad, maxPrice + pad])
      .range([bottomY, MT]);

    const lineFn = line<PricePoint>()
      .x((p) => xScale(new Date(p.date!)))
      .y((p) => yScale(p.price!));

    const areaFn = area<PricePoint>()
      .x((p) => xScale(new Date(p.date!)))
      .y0(bottomY)
      .y1((p) => yScale(p.price!));

    const plotted: PlottedPoint[] = points.map((p) => ({
      ...p,
      x: xScale(new Date(p.date!)),
      y: yScale(p.price!),
    }));

    return { points, plotted, H, MT, ML, MR, plotW, plotH, bottomY, minPrice, maxPrice, xScale, yScale, lineFn, areaFn };
  }

  override render() {
    const layout = this.computeLayout();
    if (!layout) return html``;

    const { points, plotted, H, MT, ML, MR, plotW, plotH, xScale, yScale, lineFn, areaFn } = layout;

    const lineD = lineFn(points) ?? "";
    const areaD = areaFn(points) ?? "";

    const hIdx = this._hoveredIdx;
    const hovPt = hIdx !== null ? plotted[hIdx] : null;

    const tooltipEl = hovPt ? (() => {
      const tipText = `${fmtMoney(hovPt.price!)} · ${hovPt.date ? new Date(hovPt.date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : ""} · ${hovPt.eventType}`;
      const tipW = Math.min(tipText.length * 6.5 + 16, this._width - ML - MR);
      const tipH = 24;
      const tipGap = 8;
      const above = hovPt.y > plotH / 2 + MT;
      const tipRectY = above ? hovPt.y - tipGap - tipH : hovPt.y + tipGap;
      const tipX = Math.min(Math.max(hovPt.x - tipW / 2, ML), this._width - MR - tipW);
      return svg`
        <g pointer-events="none">
          <rect class="tooltip" x="${tipX}" y="${tipRectY}" width="${tipW}" height="${tipH}"
                rx="4" />
          <text class="tooltip-label" x="${tipX + tipW / 2}" y="${tipRectY + 15.5}"
                text-anchor="middle" font-size="11">${tipText}</text>
        </g>
      `;
    })() : "";

    const xTicks = xScale.ticks(this.maxXLabels).map((d, i, arr) => {
      const x = xScale(d);
      const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const anchor = i === 0 ? "start" : i === arr.length - 1 ? "end" : "middle";
      return svg`
        <text class="axis-label" x="${x}" y="${H - 6}" text-anchor="${anchor}" font-size="10">${label}</text>
      `;
    });

    const yTicks = this.showY ? yScale.ticks(3).map((v, i, arr) => {
      const y = yScale(v);
      const isFirst = i === 0;
      const isLast = i === arr.length - 1;
      return svg`
        <line class="grid-line" x1="${ML - 4}" y1="${y}" x2="${ML + plotW}" y2="${y}"
              stroke-width="1" />
        ${isFirst || isLast ? svg`
          <text class="axis-label" x="${ML - 6}" y="${y + 4}" text-anchor="end" font-size="10">${fmtMoneyShort(v)}</text>
        ` : ""}
      `;
    }) : [];

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const formatDate = (date: string | null) =>
      new Date(date!).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const summary =
      `${points.length} price points from ${formatDate(firstPoint.date)} at ${fmtMoney(firstPoint.price!)} ` +
      `to ${formatDate(lastPoint.date)} at ${fmtMoney(lastPoint.price!)}.`;

    return html`
      <div class="wrap">
        <svg width="${this._width}" height="${H}" role="img" aria-label=${summary}>
          <defs>
            <linearGradient id="phg" x1="0" y1="0" x2="0" y2="1">
              <stop class="series-gradient" offset="0%" stop-opacity="0.25" />
              <stop class="series-gradient" offset="100%" stop-opacity="0" />
            </linearGradient>
          </defs>
          ${yTicks}
          <path d="${areaD}" fill="url(#phg)" />
          <path class="series-line" d="${lineD}" fill="none" stroke-width="2.5"
                stroke-linejoin="round" stroke-linecap="round" />
          ${plotted.map((p, i) => svg`
            <circle class="series-point" cx="${p.x}" cy="${p.y}" r="${i === hIdx ? 7 : 5}"
                    stroke-width="2"
                    @pointerenter=${() => { this._hoveredIdx = i; }}
                    @pointerleave=${() => { this._hoveredIdx = null; }} />
          `)}
          ${xTicks}
          ${tooltipEl}
        </svg>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "price-history-chart": PriceHistoryChart;
  }
}
