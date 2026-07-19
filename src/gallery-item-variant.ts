import { LitElement, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * Responsive image source metadata for a parent `gallery-item`.
 *
 * @element gallery-item-variant
 */
@customElement("gallery-item-variant")
export class GalleryItemVariant extends LitElement {
  /** Optional media query that controls when this source is selected. */
  @property({ reflect: true }) media?: string;

  /** Responsive image candidate string passed to a generated `<source>`. */
  @property({ reflect: true }) srcset = "";

  static override styles = [
    tokens,
    css`
      :host {
        display: none;
      }
    `,
  ];

  /** Keeps this metadata element non-visual. */
  protected override render() {
    return nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gallery-item-variant": GalleryItemVariant;
  }
}
