import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { tokens } from "./tokens.js";

export interface WeightBarItem {
  id: string;
  label: string;
  /** Normalized fraction (fractions across all items sum to ~1). */
  value: number;
}

/**
 * Sorted horizontal bar chart of labeled weights (normalized fractions
 * summing to ~1). Bars sort descending — the order IS the priority ranking.
 * Widths scale relative to the largest weight (which fills its track); the
 * percent labels carry the absolute values. Rows are keyed by item id
 * (repeat directive) so a re-render with new weights moves the existing
 * rows; bar widths animate via CSS, re-sorting is instant.
 *
 * @element weight-bar-chart
 */
@customElement("weight-bar-chart")
export class WeightBarChart extends LitElement {
  /** Items to render as weighted rows, sorted descending by value. */
  @property({ attribute: false }) items: WeightBarItem[] = [];

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0.5rem 0;
      }
      .label {
        flex: 0 0 5.5rem;
        font-size: var(--ui-font-size-sm, 0.75rem);
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
        color: var(--ui-text, #0f172a);
      }
      .track {
        flex: 1 1 auto;
        height: 0.75rem;
        background: var(--ui-surface-muted, #f8fafc);
        border-radius: var(--ui-radius-sm, 0.25rem);
        overflow: hidden;
      }
      .bar {
        height: 100%;
        /* Match map-circle's 30% white/black vertical depth while preserving token overrides. */
        background: linear-gradient(
          to bottom,
          color-mix(in srgb, var(--ui-primary, #4f46e5) 70%, #ffffff) 0%,
          color-mix(in srgb, var(--ui-primary, #4f46e5) 70%, #000000) 100%
        );
        border-radius: 0 var(--ui-radius-sm, 0.25rem) var(--ui-radius-sm, 0.25rem) 0;
        transition: width 150ms ease-out;
      }
      .pct {
        flex: 0 0 2.5rem;
        text-align: right;
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-variant-numeric: tabular-nums;
        color: var(--ui-text-muted, #64748b);
      }
      @media (prefers-reduced-motion: reduce) {
        .bar {
          transition: none;
        }
      }
    `,
  ];

  override render() {
    if (this.items.length === 0) return null;
    // Stable sort: ties keep the incoming item order, so the chart never flickers.
    const sorted = [...this.items].sort((a, b) => b.value - a.value);
    const max = Math.max(0.01, ...sorted.map((item) => item.value));
    const summary = sorted.map((item) => `${item.label} ${Math.round(item.value * 100)}%`).join(", ");
    return html`
      <div role="img" aria-label="Weights: ${summary}">
        ${repeat(
          sorted,
          (item) => item.id,
          (item) => html`
            <div class="row">
              <span class="label">${item.label}</span>
              <div class="track">
                <div class="bar" style="width: ${(item.value / max) * 100}%"></div>
              </div>
              <span class="pct">${Math.round(item.value * 100)}%</span>
            </div>
          `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "weight-bar-chart": WeightBarChart;
  }
}
