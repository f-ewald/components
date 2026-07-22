import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconArrowPath } from "./icons.js";
import { tokens } from "./tokens.js";
import {
  activateLayer,
  claimEscape,
  deactivateLayer,
  isTopLayer,
} from "./utils/layer-stack.js";

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
        z-index: var(--component-layer-z, 50);
        display: none;
        align-items: flex-start;
        justify-content: center;
        padding: 10vh 1.25rem 1.25rem;
        box-sizing: border-box;
      }
      .overlay.open {
        display: flex;
      }
      .dialog {
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
        background: none;
        border: 1px solid var(--ui-border, #e2e8f0);
        color: var(--ui-text, #0f172a);
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.5rem 1rem;
        font-size: var(--ui-font-size-sm, 0.75rem);
        cursor: pointer;
      }
      .btn-cancel:hover:not(:disabled) {
        border-color: var(--ui-text-muted, #64748b);
      }
      .btn-danger,
      .btn-primary {
        border: none;
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.5rem 1rem;
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-medium, 500);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }
      .btn-danger {
        background: var(--ui-danger, #dc2626);
        color: var(--ui-on-accent, #ffffff);
      }
      .btn-danger:hover:not(:disabled) {
        background: var(--ui-danger-hover, #b91c1c);
      }
      .btn-primary {
        background: var(--ui-primary, #4f46e5);
        color: var(--ui-on-accent, #ffffff);
      }
      .btn-primary:hover:not(:disabled) {
        background: var(--ui-primary-hover, #4338ca);
      }
      button:disabled {
        opacity: 0.6;
        cursor: default;
      }
      button:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
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
        .overlay {
          padding: 0.75rem;
          overflow-y: auto;
        }
        .dialog {
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

  private _previousFocus: HTMLElement | null = null;

  private _confirm() {
    this.dispatchEvent(new CustomEvent("confirm", { bubbles: true, composed: true }));
  }

  private _cancel() {
    this.dispatchEvent(new CustomEvent("cancel", { bubbles: true, composed: true }));
  }

  private _getFocusableElements(): HTMLElement[] {
    const selector =
      "a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])";
    const slotted = Array.from(this.querySelectorAll<HTMLElement>(selector));
    const internal = Array.from(
      this.shadowRoot?.querySelectorAll<HTMLElement>(selector) ?? [],
    ).filter((element) => element.closest(".dialog") !== null);
    return [...slotted, ...internal].filter((element) => !element.hasAttribute("hidden"));
  }

  private _focusInitial(): void {
    const autofocus = this.querySelector<HTMLElement>("[autofocus]");
    const cancel = this.shadowRoot?.querySelector<HTMLElement>(".btn-cancel:not(:disabled)");
    const dialog = this.shadowRoot?.querySelector<HTMLElement>(".dialog");
    (autofocus ?? cancel ?? this._getFocusableElements()[0] ?? dialog)?.focus();
  }

  private _onDocumentFocusIn = (event: FocusEvent): void => {
    if (!this.open || !isTopLayer(this) || event.composedPath().includes(this)) return;
    this._focusInitial();
  };

  private _onWindowKeydown = (event: KeyboardEvent): void => {
    if (!this.open || !isTopLayer(this)) return;
    if (claimEscape(this, event) && !this.busy) {
      this._cancel();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = this._getFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      this._focusInitial();
      return;
    }
    const active = (this.shadowRoot?.activeElement ?? document.activeElement) as HTMLElement | null;
    const index = focusable.indexOf(active as HTMLElement);
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      focusable.at(-1)?.focus();
    } else if (!event.shiftKey && index === focusable.length - 1) {
      event.preventDefault();
      focusable[0]?.focus();
    }
  };

  protected override updated(changed: PropertyValues): void {
    if (!changed.has("open")) return;
    if (this.open) {
      activateLayer(this);
      this._previousFocus = document.activeElement as HTMLElement | null;
      document.addEventListener("focusin", this._onDocumentFocusIn, true);
      window.addEventListener("keydown", this._onWindowKeydown, true);
      this._focusInitial();
      return;
    }
    deactivateLayer(this);
    document.removeEventListener("focusin", this._onDocumentFocusIn, true);
    window.removeEventListener("keydown", this._onWindowKeydown, true);
    if (this._previousFocus?.isConnected) this._previousFocus.focus();
    this._previousFocus = null;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("focusin", this._onDocumentFocusIn, true);
    window.removeEventListener("keydown", this._onWindowKeydown, true);
    deactivateLayer(this);
    if (this._previousFocus?.isConnected) this._previousFocus.focus();
    this._previousFocus = null;
    this.open = false;
  }

  override render() {
    const accessibleName = this.getAttribute("aria-label") ?? "Confirmation";
    return html`
      <div class="overlay ${this.open ? "open" : ""}">
        <div
          class="dialog"
          role="dialog"
          aria-modal="true"
          aria-label=${accessibleName}
          aria-describedby=${this.error ? "dialog-text dialog-error" : "dialog-text"}
          tabindex="-1"
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
