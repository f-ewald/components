import { LitElement, type TemplateResult, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

export type AdmonitionVariant = "neutral" | "info" | "success" | "warning" | "danger";

/**
 * Bordered, rounded callout card for an inline notice with an optional call
 * to action — "take the quiz to personalize your weights", "this feature is
 * in beta", etc. Unlike `status-banner` (a borderless, non-rounded
 * full-width bar for a persistent app-level condition), this is meant to sit
 * inline within a page's content column, so it always has a visible border
 * and radius. Colors follow the same tinted-background + accent-color
 * scheme as `status-banner`/`status-pill`.
 *
 * @element ui-admonition
 * @slot - The message text.
 * @slot actions - Optional call-to-action controls, e.g. a primary `<ui-button>`.
 */
@customElement("ui-admonition")
export class UiAdmonition extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .box {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        border-radius: var(--ui-radius, 0.5rem);
        border: 1px solid;
        padding: 0.75rem 1rem;
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
        color: var(--ui-text, #0f172a);
      }
      .icon {
        display: inline-flex;
        line-height: 0;
        flex: 0 0 auto;
        margin-top: 0.125rem;
      }
      .body {
        flex: 1 1 auto;
        min-width: 0;
      }
      .actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }
      .actions:empty {
        display: none;
      }
      .box.neutral {
        background: color-mix(in srgb, var(--ui-text-muted, #64748b) 8%, var(--ui-surface, #ffffff));
        border-color: color-mix(in srgb, var(--ui-text-muted, #64748b) 30%, transparent);
      }
      .box.neutral .icon {
        color: var(--ui-text-muted, #64748b);
      }
      .box.info {
        background: color-mix(in srgb, var(--ui-info, #0ea5e9) 8%, var(--ui-surface, #ffffff));
        border-color: color-mix(in srgb, var(--ui-info, #0ea5e9) 30%, transparent);
      }
      .box.info .icon {
        color: var(--ui-info, #0ea5e9);
      }
      .box.success {
        background: color-mix(in srgb, var(--ui-success, #16a34a) 8%, var(--ui-surface, #ffffff));
        border-color: color-mix(in srgb, var(--ui-success, #16a34a) 30%, transparent);
      }
      .box.success .icon {
        color: var(--ui-success, #16a34a);
      }
      .box.warning {
        background: color-mix(in srgb, var(--ui-warning, #d97706) 8%, var(--ui-surface, #ffffff));
        border-color: color-mix(in srgb, var(--ui-warning, #d97706) 30%, transparent);
      }
      .box.warning .icon {
        color: var(--ui-warning, #d97706);
      }
      .box.danger {
        background: color-mix(in srgb, var(--ui-danger, #dc2626) 8%, var(--ui-surface, #ffffff));
        border-color: color-mix(in srgb, var(--ui-danger, #dc2626) 30%, transparent);
      }
      .box.danger .icon {
        color: var(--ui-danger, #dc2626);
      }
      @media (forced-colors: active) {
        .box {
          border-color: CanvasText;
        }
      }
    `,
  ];

  /** Visual style; also selects the accent color for the icon/border/tint. */
  @property({ reflect: true }) variant: AdmonitionVariant = "info";

  /**
   * Optional leading icon, pre-rendered by the consumer (e.g. `iconInfo(18)`),
   * matching `status-banner`/`nav-item`/`icon-button` — icons are passed in,
   * not named, so the component never has to know the icon catalog.
   */
  @property({ attribute: false }) icon: TemplateResult | null = null;

  override render() {
    return html`
      <div class="box ${this.variant}" role=${this.variant === "danger" ? "alert" : "status"}>
        ${this.icon ? html`<span class="icon">${this.icon}</span>` : nothing}
        <div class="body">
          <div class="text"><slot></slot></div>
          <div class="actions"><slot name="actions"></slot></div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-admonition": UiAdmonition;
  }
}
