import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { iconX } from "./icons.js";
import { tokens } from "./tokens.js";
import { activateLayer, claimEscape, deactivateLayer, isTopLayer } from "./utils/layer-stack.js";

export type ModalDialogSize = "default" | "lg" | "fullscreen";

/**
 * Generic centered modal-dialog shell: a native modal `<dialog>` card with
 * header chrome, a close button, and an arbitrary slotted body — the modal
 * sibling to `slide-panel` (fixed-edge) and `popover-panel` (anchored).
 * Unlike `confirm-dialog`, it has no baked-in actions; the consumer supplies
 * the body content (a form, a read-only viewer, a table) and any footer
 * buttons itself. Instant open/close, no transition. Because it uses
 * `showModal()`, it renders in the browser's top layer, makes the rest of the
 * page inert, contains focus, and restores focus to the trigger on close;
 * Escape is routed to the topmost layer only (see `utils/layer-stack`).
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
      .dialog {
        /* Native modal <dialog>: top layer, inert page behind it, built-in focus containment. */
        position: fixed;
        inset: 0 0 auto 0;
        margin: 10vh auto 0;
        padding: 0;
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
        max-height: calc(100vh - 10vh - 1.25rem);
        overflow: hidden;
        box-sizing: border-box;
        outline: none;
      }
      /* Scoped to [open]: an author display value would otherwise defeat the UA's display:none. */
      .dialog[open] {
        display: flex;
        flex-direction: column;
      }
      .dialog::backdrop {
        background: var(--ui-overlay, rgb(15 23 42 / 0.45));
      }
      .dialog.lg {
        max-width: min(60rem, calc(100vw - 2rem));
      }
      .dialog.fullscreen {
        inset: 0;
        margin: 0;
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
        border-bottom: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
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
        .dialog {
          margin-top: 0.75rem;
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

  @query("dialog") private _dialog!: HTMLDialogElement;

  private _close() {
    this.dispatchEvent(new CustomEvent("panel-close", { bubbles: true, composed: true }));
  }

  /** Native focus delegation doesn't reliably reach slotted light-DOM content, so focus explicitly. */
  private _focusInitial(): void {
    const autofocus = this.querySelector<HTMLElement>("[autofocus]");
    const close = this.shadowRoot?.querySelector<HTMLElement>(".close-btn");
    (autofocus ?? close)?.focus();
  }

  /** Escape goes to the topmost layer only (a popover opened inside this dialog claims it first). */
  private _onWindowKeydown = (event: KeyboardEvent): void => {
    if (this.open && claimEscape(this, event)) this._close();
  };

  /** Native close requests (e.g. a back gesture) are routed through `panel-close`; the consumer owns `open`. */
  private _onCancel = (event: Event): void => {
    event.preventDefault();
    if (this.open && isTopLayer(this)) this._close();
  };

  /** A click that lands on the `<dialog>` itself, outside its box, is a backdrop click. */
  private _onDialogClick = (event: MouseEvent): void => {
    if (!this.dismissible || event.target !== event.currentTarget) return;
    const box = this._dialog.getBoundingClientRect();
    const outside =
      event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
    if (outside) this._close();
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
    const explicitLabel = this.getAttribute("aria-label");
    return html`
      <dialog
        class="dialog ${this.size === "lg" ? "lg" : this.size === "fullscreen" ? "fullscreen" : ""}"
        aria-label=${explicitLabel ?? nothing}
        aria-labelledby=${explicitLabel ? nothing : "dialog-title"}
        @click=${this._onDialogClick}
        @cancel=${this._onCancel}
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
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "modal-dialog": ModalDialog;
  }
}
