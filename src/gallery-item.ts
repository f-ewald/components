import { LitElement, html } from "lit";
import { customElement, property, queryAssignedElements } from "lit/decorators.js";

@customElement('gallery-item')
export class GalleryItem extends LitElement {
  @property({type: String})
  src!: string

  @property({type: String})
  caption!: string

  @queryAssignedElements()
  variants!: Array<HTMLElement>

  protected override render() {
      return html`<slot></slot>`;
  }
}