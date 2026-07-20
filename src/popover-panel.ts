import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconX } from "./icons.js";
import { tokens } from "./tokens.js";

/**
 * Generic anchored popover shell: a floating card positioned relative to its
 * nearest `position: relative` ancestor (place it next to its trigger button
 * inside such a wrapper), as opposed to `slide-panel`'s fixed screen-edge
 * drawer. Closes on outside click or Escape. Header chrome and close button
 * match `slide-panel`'s API (`heading`, `panel-close`) so either can be
 * swapped in for the other with no consumer-side changes beyond the wrapper.
 *
 * Set `centered` to render as a screen-centered modal with a translucent
 * backdrop instead of the default anchored placement.
 *
 * @element popover-panel
 * @fires panel-close - User clicked the close (✕) button, pressed Escape, or clicked outside/the backdrop.
 * @slot title - Overrides the plain `heading` text with custom markup.
 * @slot actions - Extra header controls (e.g. an icon+label link) rendered between the title and the close button.
 * @slot - Popover body content.
 */
@customElement("popover-panel")
export class PopoverPanel extends LitElement {
  /** Whether the popover is currently visible. */
  @property({ type: Boolean, reflect: true }) open = false;
  /** Title text shown in the popover header. */
  @property() heading = "";
  /** Render as a screen-centered modal with a backdrop instead of anchored placement. */
  @property({ type: Boolean, reflect: true }) centered = false;

  static override styles = [
    tokens,
    css`
      :host {
        display: none;
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        z-index: 20;
      }
      :host([open]) {
        display: block;
      }
      :host([centered][open]) {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgb(0 0 0 / 0.35);
        z-index: 30;
      }
      :host([centered]) .panel {
        width: 400px;
      }
      .panel {
        width: 320px;
        max-width: calc(100vw - 2rem);
        background: var(--ui-surface, #fff);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius, 0.5rem);
        box-shadow: var(--ui-shadow-lg, 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1));
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0.625rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
        flex: 0 0 auto;
      }
      .panel-title {
        font-weight: 600;
        font-size: var(--ui-font-size, 0.875rem);
        font-family: var(--ui-font, ui-sans-serif, system-ui, sans-serif);
        color: var(--ui-text, #0f172a);
        flex: 1 1 auto;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        padding-right: 0.5rem;
      }
      .panel-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 0 0 auto;
        margin-right: 0.25rem;
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
    `,
  ];

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("mousedown", this.#onWindowMousedown, true);
    window.removeEventListener("keydown", this.#onWindowKeydown);
  }

  protected override updated(changed: PropertyValues): void {
    if (!changed.has("open")) return;
    if (this.open) {
      window.addEventListener("mousedown", this.#onWindowMousedown, true);
      window.addEventListener("keydown", this.#onWindowKeydown);
    } else {
      window.removeEventListener("mousedown", this.#onWindowMousedown, true);
      window.removeEventListener("keydown", this.#onWindowKeydown);
    }
  }

  #onWindowMousedown = (e: MouseEvent): void => {
    // In centered mode the host itself renders the backdrop, so a mousedown
    // landing directly on the host (not on .panel or its content) is a
    // backdrop click and must close like an outside click would.
    if (this.centered && e.target === this) {
      this.#close();
      return;
    }
    if (!e.composedPath().includes(this)) this.#close();
  };

  #onWindowKeydown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") this.#close();
  };

  #close(): void {
    this.dispatchEvent(new CustomEvent("panel-close", { bubbles: true, composed: true }));
  }

  override render() {
    return html`
      <div class="panel">
        <div class="panel-header">
          <slot name="title">
            ${this.heading ? html`<span class="panel-title">${this.heading}</span>` : null}
          </slot>
          <span class="panel-actions"><slot name="actions"></slot></span>
          <button class="close-btn" aria-label="Close popover" @click=${() => this.#close()}>
            ${iconX(18)}
          </button>
        </div>
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "popover-panel": PopoverPanel;
  }
}
