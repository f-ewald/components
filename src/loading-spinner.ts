import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * Indeterminate circular loading spinner: a rotating arc over a faint track,
 * in the style of a browser page-load indicator. Purely presentational and
 * property-driven — show it while work is in flight and remove it when done.
 *
 * Exposes an accessible `role="status"` with `label` as its name, so assistive
 * technology announces the loading state; the arc itself is decorative. Under
 * `prefers-reduced-motion` it stops rotating and stays a static ring.
 *
 * @element loading-spinner
 */
@customElement("loading-spinner")
export class LoadingSpinner extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: inline-flex;
        line-height: var(--ui-line-height-glyph, 1);
      }
      .spinner {
        width: 1.5rem;
        height: 1.5rem;
        animation: spin 0.8s linear infinite;
      }
      .spinner.sm {
        width: 1rem;
        height: 1rem;
      }
      .spinner.lg {
        width: 2rem;
        height: 2rem;
      }
      .track {
        fill: none;
        stroke: var(--ui-border, #e2e8f0);
        stroke-width: 3;
      }
      .arc {
        fill: none;
        stroke: var(--ui-primary, #4f46e5);
        stroke-width: 3;
        stroke-linecap: round;
        stroke-dasharray: 42 100;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .spinner {
          animation: none;
        }
      }
      @media (forced-colors: active) {
        .track {
          stroke: GrayText;
        }
        .arc {
          stroke: CanvasText;
        }
      }
    `,
  ];

  /** Diameter step — `sm` ≈ 1rem, `md` ≈ 1.5rem (default), `lg` ≈ 2rem. */
  @property() size: "sm" | "md" | "lg" = "md";
  /** Accessible name announced by the `role="status"` live region. */
  @property() label = "Loading";

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "status");
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has("label")) this.setAttribute("aria-label", this.label);
  }

  override render() {
    return html`
      <svg class="spinner ${this.size}" viewBox="0 0 24 24" aria-hidden="true">
        <circle class="track" cx="12" cy="12" r="9"></circle>
        <circle class="arc" cx="12" cy="12" r="9"></circle>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "loading-spinner": LoadingSpinner;
  }
}
