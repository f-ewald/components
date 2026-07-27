import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "./ui-button.js";
import { tokens } from "./tokens.js";

/**
 * Click-to-load button for either end of a list. Fully property-driven: the
 * consumer sets `loading` while a fetch is in flight and `exhausted` once
 * there's nothing left to load; this component never fetches or manages
 * state itself.
 *
 * @element load-more
 * @fires load-more - The button was clicked while not `loading`/`exhausted`;
 *   detail: `{ direction }`.
 */
@customElement("load-more")
export class LoadMore extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        text-align: center;
      }
    `,
  ];

  /** Which end of a list this instance loads more content for. */
  @property() direction: "top" | "bottom" = "bottom";
  /** Consumer-managed busy flag, forwarded to the internal `ui-button`'s `busy`. */
  @property({ type: Boolean }) loading = false;
  /** Terminal "no more content" state: disables the button and swaps its label. */
  @property({ type: Boolean }) exhausted = false;
  /** Button text in the normal (loadable) state. */
  @property() label = "Load more";
  /** Button text shown once `exhausted` is true. */
  @property({ attribute: "exhausted-label" }) exhaustedLabel = "No more results";

  #onClick(): void {
    if (this.loading || this.exhausted) return;
    this.dispatchEvent(
      new CustomEvent("load-more", { detail: { direction: this.direction }, bubbles: true, composed: true }),
    );
  }

  override render() {
    return html`
      <ui-button
        type="button"
        variant="secondary"
        ?busy=${this.loading}
        ?disabled=${this.exhausted}
        @click=${() => this.#onClick()}
      >
        ${this.exhausted ? this.exhaustedLabel : this.label}
      </ui-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "load-more": LoadMore;
  }
}
