import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * A responsive auto-filling grid shell for `link-card` (or any card-shaped
 * content) — each slotted child becomes a grid item, wrapping to a new row
 * once the container is too narrow for another `15rem` column.
 *
 * @element card-grid
 * @slot - `link-card` elements (or other card-shaped content).
 */
@customElement("card-grid")
export class CardGrid extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
        gap: 1rem;
      }
    `,
  ];

  override render() {
    return html`
      <div class="grid">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "card-grid": CardGrid;
  }
}
