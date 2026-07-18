import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconX } from "./icons.js";
import { tokens } from "./tokens.js";

/**
 * Generic sliding panel shell. Handles positioning, open/close animation,
 * header chrome, and a close button. Body content is provided via the
 * default slot; the consumer controls its own padding and overflow.
 *
 * Desktop: 300 px fixed right-side panel that slides from the right.
 * Mobile (≤768px): bottom-sheet drawer (60vh) — reserved for future use.
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
        width: 300px;
        z-index: 20;
        background: var(--ui-surface, #fff);
        box-shadow: var(--ui-shadow-lg, 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1));
        transform: translateX(110%);
        transition: transform 0.25s ease;
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
      .handle {
        display: none;
      }
      @media (max-width: 768px) {
        .panel {
          top: auto;
          right: 0;
          bottom: 0;
          left: 0;
          width: auto;
          height: 60vh;
          border-radius: 14px 14px 0 0;
          box-shadow: 0 -3px 20px rgb(0 0 0 / 0.18);
          transform: translateY(110%);
        }
        .panel.open {
          transform: translateY(0);
        }
        .handle {
          display: block;
          width: 36px;
          height: 4px;
          background: var(--ui-border, #e2e8f0);
          border-radius: 2px;
          margin: 10px auto 0;
          flex: 0 0 auto;
        }
        .panel-header {
          padding: 4px 10px 8px;
        }
      }
    `,
  ];

  private _close() {
    this.dispatchEvent(new CustomEvent("panel-close", { bubbles: true, composed: true }));
  }

  override render() {
    return html`
      <div class="panel ${this.open ? "open" : ""}">
        <div class="handle"></div>
        <div class="panel-header">
          <slot name="title">
            ${this.heading ? html`<span class="panel-title">${this.heading}</span>` : null}
          </slot>
          <button class="close-btn" aria-label="Close panel" @click=${this._close}>${iconX(18)}</button>
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
