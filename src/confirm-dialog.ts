import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { iconArrowPath } from "./icons.js";
import { tokens } from "./tokens.js";
import {
  activateLayer,
  claimEscape,
  deactivateLayer,
  isTopLayer,
} from "./utils/layer-stack.js";

/**
 * Reusable confirmation dialog: a native modal `<dialog>` (top layer, inert
 * page behind it, built-in focus containment) with a slotted body, an
 * optional error line, and Cancel/Confirm actions. Instant open/close (no
 * transitions). Fires `confirm`/`cancel`
 * (bubbling, composed) instead of owning any deletion logic itself —
 * callers stay in charge of the request. Set `size="sm"` for compact
 * actions one step below the default, matching `ui-button`'s `sm` size.
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
      .dialog {
        /* Native modal <dialog>: top layer, inert page behind it, built-in focus containment. */
        position: fixed;
        inset: 0 0 auto 0;
        margin: 10vh auto 0;
        border: 0;
        color: inherit;
        background: var(--ui-surface, #ffffff);
        border-radius: var(--ui-radius, 0.5rem);
        box-shadow: var(
          --ui-shadow-lg,
          0 20px 25px -5px rgb(0 0 0 / 0.1),
          0 8px 10px -6px rgb(0 0 0 / 0.1)
        );
        width: 100%;
        max-width: min(25rem, calc(100vw - 2rem));
        padding: 1rem;
        box-sizing: border-box;
        outline: none;
      }
      .dialog::backdrop {
        background: var(--ui-overlay, rgb(15 23 42 / 0.45));
      }
      .dialog-text {
        margin: 0 0 1rem;
        color: var(--ui-text, #0f172a);
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
        font-size: var(--ui-font-size, 0.875rem);
        line-height: var(--ui-line-height-normal, 1.5);
      }
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
      .btn-cancel,
      .btn-danger,
      .btn-primary {
        height: 2rem;
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
        line-height: var(--ui-line-height-tight, 1.25);
      }
      .btn-cancel {
        /* Opaque base under the transparent-by-default secondary token, the
           same as ui-button's secondary variant — see the comment there. */
        background:
          var(--ui-button-secondary-background, none),
          var(--ui-surface, #ffffff);
        border: var(--ui-border-width, 1px) solid var(--ui-button-secondary-border, var(--ui-border, #e2e8f0));
        color: var(--ui-text, #0f172a);
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.5rem 1rem;
        font-size: var(--ui-font-size-sm, 0.75rem);
        cursor: pointer;
        box-shadow: var(--ui-button-highlight, 0 0 0 0 transparent);
      }
      .btn-cancel:hover:not(:disabled) {
        background:
          var(--ui-button-secondary-background-hover, none),
          var(--ui-surface, #ffffff);
        border-color: var(--ui-button-secondary-border-hover, var(--ui-text-muted, #64748b));
      }
      .btn-cancel:active:not(:disabled) {
        background:
          var(--ui-button-secondary-background-active, var(--ui-button-secondary-background, none)),
          var(--ui-surface, #ffffff);
        box-shadow: none;
      }
      .btn-danger,
      .btn-primary {
        border: var(--ui-border-width, 1px) solid transparent;
        border-radius: var(--ui-radius-sm, 0.25rem);
        /* The border width is themeable, so it has to stay inside the fixed
           height the sm size sets below. */
        box-sizing: border-box;
        padding: 0.5rem 1rem;
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-medium, 500);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }
      .btn-danger {
        background: var(--ui-button-danger-background, var(--ui-danger, #dc2626));
        border-color: var(--ui-button-danger-border, transparent);
        color: var(--ui-on-accent, #ffffff);
        box-shadow: var(--ui-button-highlight, 0 0 0 0 transparent);
        text-shadow: var(--ui-button-text-shadow, none);
      }
      .btn-danger:hover:not(:disabled) {
        background: var(--ui-button-danger-background-hover, var(--ui-danger-hover, #b91c1c));
      }
      .btn-danger:active:not(:disabled) {
        background: var(--ui-button-danger-background-active, var(--ui-button-danger-background, var(--ui-danger, #dc2626)));
        box-shadow: none;
      }
      .btn-primary {
        background: var(--ui-button-background, var(--ui-primary, #4f46e5));
        border-color: var(--ui-button-border, transparent);
        color: var(--ui-on-accent, #ffffff);
        box-shadow: var(--ui-button-highlight, 0 0 0 0 transparent);
        text-shadow: var(--ui-button-text-shadow, none);
      }
      .btn-primary:hover:not(:disabled) {
        background: var(--ui-button-background-hover, var(--ui-primary-hover, #4338ca));
      }
      .btn-primary:active:not(:disabled) {
        background: var(--ui-button-background-active, var(--ui-button-background, var(--ui-primary, #4f46e5)));
        box-shadow: none;
      }
      button:disabled {
        opacity: 0.6;
        cursor: default;
      }
      button:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .btn-primary:focus-visible:not(:active),
      .btn-danger:focus-visible:not(:active),
      .btn-cancel:focus-visible:not(:active) {
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35)), var(--ui-button-highlight, 0 0 0 0 transparent);
      }
      :host([size="sm"]) .btn-cancel,
      :host([size="sm"]) .btn-danger,
      :host([size="sm"]) .btn-primary {
        height: 1.5rem;
        padding: 0.25rem 0.5rem;
        font-size: var(--ui-font-size-xs, 0.6875rem);
      }
      .error-text {
        color: var(--ui-danger, #dc2626);
        font-size: var(--ui-font-size-sm, 0.75rem);
        margin: 0.5rem 0 0.75rem;
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
      @media (forced-colors: active) {
        button:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
      }
      @media (max-width: 48rem) {
        .dialog {
          margin-top: 0.75rem;
          padding: 0.75rem;
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
  /** Size — `sm` reduces both action buttons' height/padding/font-size one step below the default. */
  @property({ reflect: true }) size: "sm" | "md" = "md";

  @query("dialog") private _dialog!: HTMLDialogElement;

  private _confirm() {
    this.dispatchEvent(new CustomEvent("confirm", { bubbles: true, composed: true }));
  }

  private _cancel() {
    this.dispatchEvent(new CustomEvent("cancel", { bubbles: true, composed: true }));
  }

  /** Native focus delegation doesn't reliably reach slotted light-DOM content, so focus explicitly. */
  private _focusInitial(): void {
    const autofocus = this.querySelector<HTMLElement>("[autofocus]");
    const cancel = this.shadowRoot?.querySelector<HTMLElement>(".btn-cancel:not(:disabled)");
    (autofocus ?? cancel)?.focus();
  }

  /** Escape goes to the topmost layer only; it's ignored while a request is in flight. */
  private _onWindowKeydown = (event: KeyboardEvent): void => {
    if (this.open && claimEscape(this, event) && !this.busy) this._cancel();
  };

  /**
   * Native close requests (e.g. a back gesture) are routed through `cancel`; the consumer owns `open`.
   * Named `_onNativeCancel` because this component also fires its own bubbling `cancel` CustomEvent.
   */
  private _onNativeCancel = (event: Event): void => {
    event.preventDefault();
    if (this.open && isTopLayer(this) && !this.busy) this._cancel();
  };

  protected override updated(changed: PropertyValues): void {
    if (!changed.has("open")) return;
    if (this.open) {
      activateLayer(this);
      window.addEventListener("keydown", this._onWindowKeydown, true);
      if (!this._dialog.open) this._dialog.showModal();
      this._focusInitial();
      return;
    }
    deactivateLayer(this);
    window.removeEventListener("keydown", this._onWindowKeydown, true);
    if (this._dialog.open) this._dialog.close();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this._onWindowKeydown, true);
    deactivateLayer(this);
    this.open = false;
  }

  override render() {
    const accessibleName = this.getAttribute("aria-label") ?? "Confirmation";
    return html`
      <dialog
        class="dialog"
        aria-label=${accessibleName}
        aria-describedby=${this.error ? "dialog-text dialog-error" : "dialog-text"}
        @cancel=${this._onNativeCancel}
      >
        <p id="dialog-text" class="dialog-text"><slot></slot></p>
        ${this.error
          ? html`<p id="dialog-error" class="error-text" role="alert">${this.error}</p>`
          : nothing}
        <div class="dialog-actions">
          <button class="btn-cancel" ?disabled=${this.busy} @click=${this._cancel}>${this.cancelLabel}</button>
          <button class=${this.danger ? "btn-danger" : "btn-primary"} ?disabled=${this.busy} @click=${this._confirm}>
            ${this.busy
              ? html`<span class="spin" aria-hidden="true">${iconArrowPath(14)}</span>`
              : nothing}
            ${this.confirmLabel}
          </button>
        </div>
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "confirm-dialog": ConfirmDialog;
  }
}
