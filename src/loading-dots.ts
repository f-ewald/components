import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * Three dots that bounce one after another as a lightweight, indeterminate
 * "working" / "typing" indicator. Purely presentational and property-driven —
 * show it while a short operation is pending and remove it when done.
 *
 * Exposes an accessible `role="status"` with `label` as its name, so assistive
 * technology announces the loading state; the dots themselves are decorative.
 * Under `prefers-reduced-motion` the bounce is removed and the dots rest.
 *
 * @element loading-dots
 */
@customElement("loading-dots")
export class LoadingDots extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: inline-flex;
        line-height: var(--ui-line-height-glyph, 1);
      }
      .dots {
        display: inline-flex;
        align-items: flex-end;
        gap: 0.25rem;
      }
      .dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 999px;
        background: var(--ui-primary, #4f46e5);
        animation: loading-dots-bounce 1.4s ease-in-out infinite;
      }
      .dot:nth-child(2) {
        animation-delay: 0.16s;
      }
      .dot:nth-child(3) {
        animation-delay: 0.32s;
      }
      .dots.sm .dot {
        width: 0.375rem;
        height: 0.375rem;
      }
      .dots.lg .dot {
        width: 0.625rem;
        height: 0.625rem;
      }
      @keyframes loading-dots-bounce {
        0%,
        80%,
        100% {
          transform: translateY(0);
          opacity: 0.5;
        }
        40% {
          transform: translateY(-0.375rem);
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .dot {
          animation: none;
          opacity: 1;
        }
      }
      @media (forced-colors: active) {
        .dot {
          background: CanvasText;
        }
      }
    `,
  ];

  /** Dot-size step — `sm`, `md` (default), or `lg`. */
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
      <span class="dots ${this.size}" aria-hidden="true">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "loading-dots": LoadingDots;
  }
}
