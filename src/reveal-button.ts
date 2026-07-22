import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * Button that reveals hidden slotted content when clicked.
 *
 * @element reveal-button
 */
@customElement("reveal-button")
export class RevealButton extends LitElement {
  static override styles = [
    tokens,
    css`
      .hidden {
        display: none;
      }
      button {
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
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: var(--ui-line-height-tight, 1.25);
        height: 2rem;
        background: var(--ui-primary, #4f46e5);
        color: var(--ui-on-accent, #ffffff);
        border: none;
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.5rem 1rem;
        cursor: pointer;
      }
      button:hover:not(:disabled) {
        background: var(--ui-primary-hover, #4338ca);
      }
      button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
      button:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      @media (forced-colors: active) {
        button:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
        button:disabled {
          color: GrayText;
          opacity: 1;
        }
      }
    `,
  ];

  /** Label shown on the button before it's clicked. */
  @property({ type: String })
  label: string = "Reveal hidden content";
  /** Disables revealing the slotted content. */
  @property({ type: Boolean }) disabled = false;

  private _reveal() {
    if (this.disabled) return;
    const div = this.shadowRoot!.querySelector("div");
    const button = this.shadowRoot!.querySelector("button");
    div?.classList.toggle("hidden");
    button?.classList.toggle("hidden");
  }

  protected override render() {
    return html`
      <div class="hidden"><slot></slot></div>
      <button type="button" ?disabled=${this.disabled} @click=${this._reveal}>
        ${this.label}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "reveal-button": RevealButton;
  }
}
