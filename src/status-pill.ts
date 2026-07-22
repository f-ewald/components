import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconArrowPath } from "./icons.js";
import { tokens } from "./tokens.js";

export type StatusPillColor = "neutral" | "info" | "primary" | "success" | "warning" | "danger";

/**
 * Small colored status pill, optionally with a spinning icon — for task/run
 * states ("Open", "Blocked", "Done") and live-activity indicators ("Running").
 *
 * @element status-pill
 */
@customElement("status-pill")
export class StatusPill extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: inline-flex;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        border-radius: 9999px;
        padding: 0.25rem 0.5rem;
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: 500;
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
        white-space: nowrap;
      }
      .pill.neutral {
        background: color-mix(in srgb, var(--ui-text-muted, #64748b) 15%, transparent);
        color: var(--ui-text-muted, #64748b);
      }
      .pill.info {
        background: color-mix(in srgb, var(--ui-info, #0ea5e9) 15%, transparent);
        color: var(--ui-info, #0ea5e9);
      }
      .pill.primary {
        background: color-mix(in srgb, var(--ui-primary, #4f46e5) 15%, transparent);
        color: var(--ui-primary, #4f46e5);
      }
      .pill.success {
        background: color-mix(in srgb, var(--ui-success, #16a34a) 15%, transparent);
        color: var(--ui-success, #16a34a);
      }
      .pill.warning {
        background: color-mix(in srgb, var(--ui-warning, #d97706) 15%, transparent);
        color: var(--ui-warning, #d97706);
      }
      .pill.danger {
        background: color-mix(in srgb, var(--ui-danger, #dc2626) 15%, transparent);
        color: var(--ui-danger, #dc2626);
      }
      .spin {
        display: inline-flex;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .spin {
          animation: none;
        }
      }
    `,
  ];

  /** Text shown inside the pill. */
  @property() label = "";
  /** Color variant. */
  @property() color: StatusPillColor = "neutral";
  /** Renders a small spinning icon before the label. */
  @property({ type: Boolean }) spinner = false;

  override render() {
    return html`
      <span class="pill ${this.color}">
        ${this.spinner ? html`<span class="spin" aria-hidden="true">${iconArrowPath(11)}</span>` : nothing}
        ${this.label}
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "status-pill": StatusPill;
  }
}
