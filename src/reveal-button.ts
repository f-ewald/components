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
        font-family: var(--ui-font, ui-sans-serif, system-ui, sans-serif);
        font-size: var(--ui-font-size, 0.875rem);
        background: var(--ui-primary, #4f46e5);
        color: #fff;
        border: none;
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.5rem 0.9rem;
        cursor: pointer;
      }
      button:hover {
        background: var(--ui-primary-hover, #4338ca);
      }
    `,
  ];

  /** Label shown on the button before it's clicked. */
  @property({ type: String })
  label: string = "Reveal hidden content";

  private _reveal() {
    const div = this.shadowRoot!.querySelector("div");
    const button = this.shadowRoot!.querySelector("button");
    div?.classList.toggle("hidden");
    button?.classList.toggle("hidden");
  }

  protected override render() {
    return html`
      <div class="hidden"><slot></slot></div>
      <button @click="${this._reveal}">${this.label}</button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "reveal-button": RevealButton;
  }
}
