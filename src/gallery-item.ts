import { LitElement, css, html } from "lit";
import { customElement, property, queryAssignedElements } from "lit/decorators.js";
import "./gallery-item-variant.js";
import type { GalleryItemVariant } from "./gallery-item-variant.js";
import { tokens } from "./tokens.js";

/**
 * Declarative image metadata consumed by a parent `photo-gallery`.
 *
 * @element gallery-item
 * @slot - Optional `gallery-item-variant` elements for responsive sources.
 */
@customElement("gallery-item")
export class GalleryItem extends LitElement {
  /** URL of the fallback image. */
  @property({ reflect: true }) src = "";

  /** Required alternative text for the image. */
  @property({ reflect: true }) alt = "";

  /** Optional visible caption rendered below the image. */
  @property({ reflect: true }) caption?: string;

  /** Responsive source variants declared inside this item. */
  @queryAssignedElements({ selector: "gallery-item-variant" })
  readonly variants!: GalleryItemVariant[];

  static override styles = [
    tokens,
    css`
      :host {
        display: none;
      }
    `,
  ];

  /** Retains declarative variants while keeping the metadata host hidden. */
  protected override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gallery-item": GalleryItem;
  }
}
