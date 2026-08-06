import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconChevronRight } from "./icons.js";
import { tokens } from "./tokens.js";

/**
 * A generic disclosure: a clickable header that expands/collapses a body,
 * with a chevron that rotates to reflect state. Headline and body are both
 * slotted, so any markup can go in either — unlike `chat-message`'s
 * built-in collapsible mode, which only slots the body and builds its
 * header from discrete properties (author/timestamp/summary).
 *
 * @element chevron-panel
 * @slot headline - Header content, always visible, clickable to toggle.
 * @slot - Body content, shown only while `open`.
 * @fires toggle - Fired with `{ open: boolean }` when the header is clicked.
 */
@customElement("chevron-panel")
export class ChevronPanel extends LitElement {
  /** Whether the body is currently expanded. */
  @property({ type: Boolean, reflect: true }) open = false;

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
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
      }
      button.header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        min-height: 2rem;
        padding: 0;
        border: 0;
        background: none;
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
        text-align: left;
        cursor: pointer;
      }
      button.header:focus-visible {
        outline: none;
        border-radius: var(--ui-radius-sm, 0.25rem);
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .headline {
        flex: 1 1 auto;
        min-width: 0;
      }
      .chevron {
        display: inline-flex;
        flex: 0 0 auto;
        color: var(--ui-text-muted, #64748b);
        transition: transform 150ms ease;
      }
      :host([open]) .chevron {
        transform: rotate(90deg);
      }
      .body[hidden] {
        display: none;
      }
      @media (prefers-reduced-motion: reduce) {
        .chevron {
          transition: none;
        }
      }
      @media (forced-colors: active) {
        button.header:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
      }
    `,
  ];

  #toggle(): void {
    this.open = !this.open;
    this.dispatchEvent(new CustomEvent("toggle", { detail: { open: this.open } }));
  }

  override render() {
    return html`
      <button
        class="header"
        type="button"
        aria-expanded=${String(this.open)}
        aria-controls="panel-body"
        @click=${() => this.#toggle()}
      >
        <span class="chevron" aria-hidden="true">${iconChevronRight(14)}</span>
        <span class="headline"><slot name="headline"></slot></span>
      </button>
      <div id="panel-body" class="body" ?hidden=${!this.open}>
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "chevron-panel": ChevronPanel;
  }
}
