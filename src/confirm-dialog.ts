import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconArrowPath } from "./icons.js";
import { tokens } from "./tokens.js";

/**
 * Reusable confirmation dialog: overlay + centered card with a slotted body,
 * an optional error line, and Cancel/Confirm actions. Instant `display:none`
 * → `display:flex` toggle (no transitions). Fires `confirm`/`cancel`
 * (bubbling, composed) instead of owning any deletion logic itself —
 * callers stay in charge of the request.
 *
 * @element confirm-dialog
 * @fires confirm - User clicked the confirm button.
 * @fires cancel - User clicked the cancel button.
 */
@customElement("confirm-dialog")
export class ConfirmDialog extends LitElement {
  static override styles = [
    tokens,
    css`
      .overlay {
        position: fixed;
        inset: 0;
        background: var(--ui-overlay, rgb(15 23 42 / 0.45));
        z-index: 50;
        display: none;
        align-items: flex-start;
        justify-content: center;
        padding: 10vh 20px 20px;
        box-sizing: border-box;
      }
      .overlay.open {
        display: flex;
      }
      .dialog {
        background: var(--ui-surface, #fff);
        border-radius: var(--ui-radius, 0.5rem);
        box-shadow: var(
          --ui-shadow-lg,
          0 20px 25px -5px rgb(0 0 0 / 0.1),
          0 8px 10px -6px rgb(0 0 0 / 0.1)
        );
        width: 100%;
        max-width: 420px;
        padding: 1.25rem;
        box-sizing: border-box;
      }
      .dialog-text {
        margin: 0 0 1rem;
        color: var(--ui-text, #0f172a);
        font-family: var(--ui-font, ui-sans-serif, system-ui, sans-serif);
        font-size: var(--ui-font-size, 0.875rem);
        line-height: 1.45;
      }
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.6rem;
      }
      .btn-cancel {
        background: none;
        border: 1px solid var(--ui-border, #e2e8f0);
        color: var(--ui-text, #0f172a);
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.5rem 0.9rem;
        font-size: var(--ui-font-size-sm, 0.75rem);
        cursor: pointer;
        font-family: inherit;
      }
      .btn-cancel:hover:not(:disabled) {
        border-color: var(--ui-text-muted, #64748b);
      }
      .btn-danger,
      .btn-primary {
        border: none;
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.5rem 0.9rem;
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: 500;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-family: inherit;
      }
      .btn-danger {
        background: var(--ui-danger, #dc2626);
        color: #fff;
      }
      .btn-danger:hover:not(:disabled) {
        background: var(--ui-danger-hover, #b91c1c);
      }
      .btn-primary {
        background: var(--ui-primary, #4f46e5);
        color: #fff;
      }
      .btn-primary:hover:not(:disabled) {
        background: var(--ui-primary-hover, #4338ca);
      }
      button:disabled {
        opacity: 0.6;
        cursor: default;
      }
      .error-text {
        color: var(--ui-danger, #dc2626);
        font-size: var(--ui-font-size-sm, 0.75rem);
        margin: 0.4rem 0 0.8rem;
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
      @media (max-width: 768px) {
        .overlay {
          padding: 12px;
          overflow-y: auto;
        }
      }
    `,
  ];

  /** Whether the dialog is visible. */
  @property({ type: Boolean }) open = false;
  /** Label for the confirm button. */
  @property({ attribute: "confirm-label" }) confirmLabel = "Delete";
  /** Label for the cancel button. */
  @property({ attribute: "cancel-label" }) cancelLabel = "Cancel";
  /** Danger (red) vs. primary (indigo) styling for the confirm button. */
  @property({ type: Boolean }) danger = true;
  /** Shows a spinner and disables both buttons while a request is in flight. */
  @property({ type: Boolean }) busy = false;
  /** Inline error line shown below the body, or null for none. */
  @property() error: string | null = null;

  private _confirm() {
    this.dispatchEvent(new CustomEvent("confirm", { bubbles: true, composed: true }));
  }

  private _cancel() {
    this.dispatchEvent(new CustomEvent("cancel", { bubbles: true, composed: true }));
  }

  override render() {
    return html`
      <div class="overlay ${this.open ? "open" : ""}">
        <div class="dialog">
          <p class="dialog-text"><slot></slot></p>
          ${this.error ? html`<p class="error-text">${this.error}</p>` : nothing}
          <div class="dialog-actions">
            <button class="btn-cancel" ?disabled=${this.busy} @click=${this._cancel}>${this.cancelLabel}</button>
            <button class=${this.danger ? "btn-danger" : "btn-primary"} ?disabled=${this.busy} @click=${this._confirm}>
              ${this.busy ? html`<span class="spin">${iconArrowPath(14)}</span>` : nothing} ${this.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "confirm-dialog": ConfirmDialog;
  }
}
