import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

let instanceCount = 0;

/**
 * A single labeled panel inside a `tab-bar`. Renders its default slot as an
 * ARIA `tabpanel`, shown or hidden based on `selected` — `tab-bar` reads
 * `label`/`value` to build its tab strip and toggles `selected` on the
 * active panel.
 *
 * @element tab-item
 * @slot - Panel content, shown only while `selected`.
 */
@customElement("tab-item")
export class TabItem extends LitElement {
  /** Text shown in the tab-bar's tab button for this panel. */
  @property() label = "";

  /** Stable identifier reported in `tab-bar`'s `change` event; defaults to `label`. */
  @property() value = "";

  /** Whether this panel is the active one; `tab-bar` owns this. */
  @property({ type: Boolean, reflect: true }) selected = false;

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      :host(:not([selected])) {
        display: none;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    // Custom element constructors must not gain attributes (throws when
    // created via document.createElement), so this is set on connect instead.
    if (!this.id) this.id = `tab-item-${++instanceCount}`;
    this.setAttribute("role", "tabpanel");
    this.setAttribute("tabindex", "0");
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tab-item": TabItem;
  }
}
