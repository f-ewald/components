import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconX } from "./icons.js";
import { tokens } from "./tokens.js";
import { activateLayer, claimEscape, deactivateLayer } from "./utils/layer-stack.js";

/**
 * Generic sliding panel shell. Handles positioning, open/close animation,
 * header chrome, and a close button. Body content is provided via the
 * default slot; the consumer controls its own padding and overflow.
 *
 * Desktop: fixed right-side panel that slides from the right.
 * Mobile (≤48rem): bottom-sheet drawer (60vh) — reserved for future use.
 *
 * @element slide-panel
 * @fires panel-close - User clicked the close (✕) button.
 */
@customElement("slide-panel")
export class SlidePanel extends LitElement {
  /** Whether the panel is currently visible. */
  @property({ type: Boolean }) open = false;
  /** Title text shown in the panel header (overridable via slot="title"). */
  @property() heading = "";

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .panel {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 18.75rem;
        z-index: var(--component-layer-z, 20);
        background: var(--ui-surface, #ffffff);
        box-shadow: var(--ui-shadow-lg, 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1));
        transform: translateX(110%);
        transition: transform 250ms ease;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .panel.open {
        transform: translateX(0);
      }
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
        flex: 0 0 auto;
      }
      .panel-title {
        font-weight: 600;
        font-size: var(--ui-font-size, 0.875rem);
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
        padding: 0.25rem 0.5rem;
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
      .handle {
        display: none;
      }
      @media (prefers-reduced-motion: reduce) {
        .panel {
          transition: none;
        }
      }
      @media (forced-colors: active) {
        .close-btn:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
      }
      @media (max-width: 48rem) {
        .panel {
          top: auto;
          right: 0;
          bottom: 0;
          left: 0;
          width: auto;
          height: 60vh;
          border-radius: var(--ui-radius, 0.5rem) var(--ui-radius, 0.5rem) 0 0;
          box-shadow: var(
            --ui-shadow-lg,
            0 20px 25px -5px rgb(0 0 0 / 0.1),
            0 8px 10px -6px rgb(0 0 0 / 0.1)
          );
          transform: translateY(110%);
        }
        .panel.open {
          transform: translateY(0);
        }
        .handle {
          display: block;
          width: 2.25rem;
          height: 0.25rem;
          background: var(--ui-border, #e2e8f0);
          border-radius: 9999px;
          margin: 0.5rem auto 0;
          flex: 0 0 auto;
        }
        .panel-header {
          padding: 0.25rem 0.5rem 0.5rem;
        }
      }
    `,
  ];

  private _previousFocus: HTMLElement | null = null;

  private _close() {
    this.dispatchEvent(new CustomEvent("panel-close", { bubbles: true, composed: true }));
  }

  private _onWindowKeydown = (event: KeyboardEvent): void => {
    if (!this.open || !claimEscape(this, event)) return;
    this._close();
  };

  protected override updated(changed: PropertyValues): void {
    if (!changed.has("open")) return;
    if (this.open) {
      activateLayer(this);
      this._previousFocus = document.activeElement as HTMLElement | null;
      window.addEventListener("keydown", this._onWindowKeydown);
      this.shadowRoot?.querySelector<HTMLElement>(".close-btn")?.focus();
      return;
    }
    deactivateLayer(this);
    window.removeEventListener("keydown", this._onWindowKeydown);
    if (this._previousFocus?.isConnected) this._previousFocus.focus();
    this._previousFocus = null;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this._onWindowKeydown);
    deactivateLayer(this);
    if (this._previousFocus?.isConnected) this._previousFocus.focus();
    this._previousFocus = null;
    this.open = false;
  }

  override render() {
    const explicitLabel = this.getAttribute("aria-label");
    return html`
      <div
        class="panel ${this.open ? "open" : ""}"
        role="dialog"
        aria-modal="false"
        aria-label=${explicitLabel ?? nothing}
        aria-labelledby=${explicitLabel ? nothing : "panel-title"}
        aria-hidden=${String(!this.open)}
        ?inert=${!this.open}
      >
        <div class="handle" aria-hidden="true"></div>
        <div class="panel-header">
          <span id="panel-title" class="panel-title">
            <slot name="title">${this.heading || "Panel"}</slot>
          </span>
          <button class="close-btn" aria-label="Close panel" @click=${this._close}>
            <span aria-hidden="true">${iconX(18)}</span>
          </button>
        </div>
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "slide-panel": SlidePanel;
  }
}
