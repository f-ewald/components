import { LitElement, type TemplateResult, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

export type StatusBannerVariant = "neutral" | "info" | "success" | "warning" | "danger";

/**
 * Full-width, app-level status bar for a persistent condition — "Reconnecting…",
 * "Read-only mode", "New version available". Unlike `toast-notification` (which
 * is transient, imperative, and stacks in a corner) this stays put for as long
 * as the condition holds, so the consumer controls its presence by rendering it
 * or not.
 *
 * Colors mirror `status-pill`: a tinted background with accent-colored text.
 * Announced to assistive tech via `role="status"` (or `role="alert"` for the
 * `danger` variant, matching `toast-notification`'s split).
 *
 * @element status-banner
 * @slot - The message text.
 * @slot actions - Optional trailing controls, e.g. a "Retry" button.
 */
@customElement("status-banner")
export class StatusBanner extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .bar {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        /* Deliberately taller than the 2rem control target: this is a passive
           page-level notice competing with real content, so it needs presence.
           Expressed against the type token so it keeps the 4x relationship if a
           consumer scales the font. */
        min-height: calc(var(--ui-font-size-sm, 0.75rem) * 4);
        box-sizing: border-box;
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
        font-size: var(--ui-font-size-sm, 0.75rem);
        line-height: var(--ui-line-height-normal, 1.5);
      }
      /* Keep the message centered while actions sit at the trailing edge. */
      .message {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        text-align: center;
      }
      .actions {
        margin-left: auto;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }
      .icon {
        display: inline-flex;
        line-height: 0;
      }
      .bar.neutral {
        background: color-mix(in srgb, var(--ui-text-muted, #64748b) 15%, transparent);
        color: var(--ui-text-muted, #64748b);
      }
      .bar.info {
        background: color-mix(in srgb, var(--ui-info, #0ea5e9) 15%, transparent);
        color: var(--ui-info, #0ea5e9);
      }
      .bar.success {
        background: color-mix(in srgb, var(--ui-success, #16a34a) 15%, transparent);
        color: var(--ui-success, #16a34a);
      }
      .bar.warning {
        background: color-mix(in srgb, var(--ui-warning, #d97706) 15%, transparent);
        color: var(--ui-warning, #d97706);
      }
      .bar.danger {
        background: color-mix(in srgb, var(--ui-danger, #dc2626) 15%, transparent);
        color: var(--ui-danger, #dc2626);
      }
      @media (forced-colors: active) {
        .bar {
          border-bottom: 1px solid CanvasText;
        }
      }
    `,
  ];

  /** Visual style; also selects the accent color. */
  @property({ reflect: true }) variant: StatusBannerVariant = "info";

  /**
   * Optional leading icon, pre-rendered by the consumer (e.g. `iconInfo(14)`),
   * matching `nav-item`/`icon-button` — icons are passed in, not named, so the
   * component never has to know the icon catalog.
   */
  @property({ attribute: false }) icon: TemplateResult | null = null;

  override render() {
    return html`
      <div class="bar ${this.variant}" role=${this.variant === "danger" ? "alert" : "status"}>
        <span class="message">
          ${this.icon ? html`<span class="icon">${this.icon}</span>` : nothing}
          <slot></slot>
        </span>
        <span class="actions"><slot name="actions"></slot></span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "status-banner": StatusBanner;
  }
}
