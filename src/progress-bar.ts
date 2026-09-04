import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * A determinate horizontal progress indicator — a page-level "step 3 of 14"
 * bar. `stat-meter` is the closest existing thing but is an inline
 * CPU-gauge-style meter with a leading label and a computed percent value;
 * `progress-bar` instead takes a raw `value`/`max` pair and renders an
 * optional plain-text `label` to the right of the bar rather than a percent
 * inside it.
 *
 * @element progress-bar
 */
@customElement("progress-bar")
export class ProgressBar extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: flex;
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
      .track {
        flex: 1 1 auto;
        display: block;
        height: 0.5rem;
        border-radius: var(--ui-radius-sm, 0.25rem);
        background: var(--track-color, var(--ui-surface-muted, #f8fafc));
        overflow: hidden;
      }
      .fill {
        display: block;
        height: 100%;
        background: var(--fill-color, var(--ui-button-accent, var(--ui-primary, #4f46e5)));
        transition: width 200ms ease;
      }
      .label {
        flex: 0 0 auto;
        font-size: var(--ui-font-size-sm, 0.75rem);
        color: var(--ui-text-muted, #64748b);
        font-variant-numeric: var(--ui-numeric, normal);
        white-space: nowrap;
      }
      @media (prefers-reduced-motion: reduce) {
        .fill {
          transition: none;
        }
      }
      @media (forced-colors: active) {
        .track {
          border: 1px solid CanvasText;
        }
        .fill {
          background: Highlight;
        }
      }
    `,
  ];

  /** Current progress. Clamped into [0, max]. */
  @property({ type: Number }) value = 0;
  /** Value representing a full bar. */
  @property({ type: Number }) max = 100;
  /** Optional text rendered to the right of the bar (e.g. "Question 3 out of 14"). */
  @property() label = "";
  /** Fill color; defaults to the themed accent. */
  @property() color = "";
  /** Track color behind the fill. */
  @property({ attribute: "track-color" }) trackColor = "";

  override render() {
    const max = Math.max(0, this.max);
    const clamped = Math.min(max, Math.max(0, this.value));
    const pct = max === 0 ? 0 : (clamped / max) * 100;
    const fillStyle = this.color ? `width: ${pct}%; --fill-color: ${this.color}` : `width: ${pct}%`;
    const trackStyle = this.trackColor ? `--track-color: ${this.trackColor}` : "";
    return html`
      <span
        class="track"
        style=${trackStyle}
        role="progressbar"
        aria-valuenow=${clamped}
        aria-valuemin="0"
        aria-valuemax=${max}
        aria-label=${this.label || nothing}
      >
        <span class="fill" style=${fillStyle}></span>
      </span>
      ${this.label ? html`<span class="label">${this.label}</span>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "progress-bar": ProgressBar;
  }
}
