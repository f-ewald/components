import { LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement('gallery-item-variant')
export class GalleryItemVariant extends LitElement {
  @property({type: String})
  media?: string

  @property({type: String})
  srcset?: string
}
