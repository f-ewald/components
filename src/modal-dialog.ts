import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconX } from "./icons.js";
import { tokens } from "./tokens.js";
import { activateLayer, claimEscape, deactivateLayer, isTopLayer } from "./utils/layer-stack.js";

export type ModalDialogSize = "default" | "lg" | "fullscreen";

/**
 * Generic centered modal-dialog shell: overlay + card with header chrome, a
 * close button, and an arbitrary slotted body — the modal sibling to
 * `slide-panel` (fixed-edge) and `popover-panel` (anchored). Unlike
 * `confirm-dialog`, it has no baked-in actions; the consumer supplies the
 * body content (a form, a read-only viewer, a table) and any footer buttons
 * itself. Instant `display:none` → `display:flex` toggle, no transition.
 * Traps focus, closes on Escape, and restores focus to the trigger on
 * close, stacking correctly against other open `confirm-dialog`/
 * `slide-panel`/`popover-panel`/`modal-dialog` layers.
 *
 * @element modal-dialog
 * @fires panel-close - User clicked the close (✕) button, pressed Escape, or (when `dismissible`) clicked the backdrop.
 * @slot - Dialog body content.
 * @slot title - Overrides the header title text (falls back to the `heading` property).
 */
@customElement("modal-dialog")
export class ModalDialog extends LitElement {
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
      .overlay.fullscreen {
        padding: 0;
        align-items: stretch;
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
        max-height: calc(100vh - 10vh - 1.25rem);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-sizing: border-box;
        outline: none;
      }
      .dialog.lg {
        max-width: min(60rem, calc(100vw - 2rem));
      }
      .dialog.fullscreen {
        width: 100vw;
        height: 100vh;
        max-width: 100vw;
        max-height: 100vh;
        border-radius: 0;
      }
      .dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
        flex: 0 0 auto;
      }
      .dialog-title {
        font-weight: var(--ui-font-weight-semibold, 600);
        font-size: var(--ui-font-size-lg, 1rem);
        line-height: var(--ui-line-height-tight, 1.25);
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
        color: var(--ui-text, #0f172a);
        flex: 1 1 auto;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        padding-right: 0.5rem;
      }
      .close-btn {
        background: none;
        border: none;
        cursor: pointer;
        width: 2rem;
        height: 2rem;
        padding: 0;
        color: var(--ui-text-muted, #64748b);
        border-radius: var(--ui-radius-sm, 0.25rem);
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .close-btn:hover {
        background: var(--ui-surface-muted, #f8fafc);
      }
      .close-btn:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .body {
        overflow-y: auto;
        flex: 1 1 auto;
      }
      @media (forced-colors: active) {
        .close-btn:focus-visible {
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
      }
    `,
  ];

  /** Whether the dialog is visible. */
  @property({ type: Boolean }) open = false;
  /** Title text shown in the dialog header (overridable via slot="title"). */
  @property() heading = "";
  /**
   * `"lg"` widens the dialog to 60rem for content like tables; `"default"`
   * is 25rem; `"fullscreen"` covers the entire viewport edge-to-edge with
   * no border-radius or overlay padding.
   */
  @property() size: ModalDialogSize = "default";
  /** When true, clicking the backdrop also closes the dialog (off by default — safe for forms with unsaved input). */
  @property({ type: Boolean }) dismissible = false;

  private _previousFocus: HTMLElement | null = null;

  private _close() {
    this.dispatchEvent(new CustomEvent("panel-close", { bubbles: true, composed: true }));
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
    const close = this.shadowRoot?.querySelector<HTMLElement>(".close-btn");
    const dialog = this.shadowRoot?.querySelector<HTMLElement>(".dialog");
    (autofocus ?? close ?? this._getFocusableElements()[0] ?? dialog)?.focus();
  }

  private _onDocumentFocusIn = (event: FocusEvent): void => {
    if (!this.open || !isTopLayer(this) || event.composedPath().includes(this)) return;
    this._focusInitial();
  };

  private _onWindowKeydown = (event: KeyboardEvent): void => {
    if (!this.open || !isTopLayer(this)) return;
    if (claimEscape(this, event)) {
      this._close();
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

  private _onOverlayClick = (event: MouseEvent): void => {
    if (this.dismissible && event.target === event.currentTarget) this._close();
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
    const explicitLabel = this.getAttribute("aria-label");
    return html`
      <div
        class="overlay ${this.open ? "open" : ""} ${this.size === "fullscreen" ? "fullscreen" : ""}"
        @click=${this._onOverlayClick}
      >
        <div
          class="dialog ${this.size === "lg" ? "lg" : this.size === "fullscreen" ? "fullscreen" : ""}"
          role="dialog"
          aria-modal="true"
          aria-label=${explicitLabel ?? nothing}
          aria-labelledby=${explicitLabel ? nothing : "dialog-title"}
          tabindex="-1"
        >
          <div class="dialog-header">
            <span id="dialog-title" class="dialog-title">
              <slot name="title">${this.heading}</slot>
            </span>
            <button class="close-btn" aria-label="Close" @click=${this._close}>
              <span aria-hidden="true">${iconX(18)}</span>
            </button>
          </div>
          <div class="body">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "modal-dialog": ModalDialog;
  }
}
