import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement('reveal-button')
export class RevealButton extends LitElement {
  static override styles = css`
    .hidden {
      display: none;
    }
  `;

  @property({type: String})
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
