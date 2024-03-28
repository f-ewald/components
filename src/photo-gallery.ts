import { LitElement, css, html } from "lit";

export class PhotoGallery extends LitElement {
  static override styles = css``;

  protected override render() {
    return html`
      <div>
        <slot></slot>  
      </div>
    `;
  }
}