import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * A compact labeled meter for a single percentage reading — e.g. CPU or
 * memory usage in a dashboard header. `percent` may be `null` when no
 * reading is available yet (e.g. the first tick of a polling metric); the
 * bar then renders empty and the value shows an em dash instead of "0%".
 *
 * @element stat-meter
 */
@customElement("stat-meter")
export class StatMeter extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
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

      .label {
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: 600;
        letter-spacing: 0.04em;
        color: var(--ui-text-muted, #64748b);
      }

      .track {
        display: block;
        width: 4rem;
        height: 0.375rem;
        border-radius: 9999px;
        background: var(--ui-surface-muted, #f8fafc);
        overflow: hidden;
      }

      .fill {
        display: block;
        height: 100%;
        /* Keep the top highlight while softening the dark edge for compact meters. */
        background: linear-gradient(
          to bottom,
          color-mix(in srgb, var(--fill-color, var(--ui-success, #16a34a)) 70%, #ffffff) 0%,
          color-mix(in srgb, var(--fill-color, var(--ui-success, #16a34a)) 80%, #000000) 100%
        );
        transition: width 200ms ease;
      }

      .value {
        min-width: 2rem;
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: 500;
        color: var(--ui-text, #0f172a);
        font-variant-numeric: tabular-nums;
        text-align: right;
      }
      @media (prefers-reduced-motion: reduce) {
        .fill {
          transition: none;
        }
      }
    `,
  ];

  /** Short label shown before the bar, e.g. "CPU" or "MEM". */
  @property() label = "";

  /** Percentage 0-100. `null` renders an empty bar and a "—" value instead of "0%". */
  @property({ type: Number }) percent: number | null = null;

  /** Fill color override; falls back to the `--ui-success` token. */
  @property() color = "";

  override render() {
    const pct = this.percent;
    const clamped = pct === null ? 0 : Math.min(100, Math.max(0, pct));
    const fillStyle = this.color ? `width: ${clamped}%; --fill-color: ${this.color}` : `width: ${clamped}%`;
    return html`
      <span class="label">${this.label}</span>
      <span class="track" role="img" aria-label="${this.label} ${pct === null ? "no reading" : `${pct}%`}">
        <span class="fill" style=${fillStyle}></span>
      </span>
      <span class="value">${pct === null ? "—" : `${pct}%`}</span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "stat-meter": StatMeter;
  }
}
