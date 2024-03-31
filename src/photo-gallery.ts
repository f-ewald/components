import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement('photo-gallery')
export class PhotoGallery extends LitElement {
  static override styles = css`
    #photoGallery {
      background-color: cyan;
      position: relative;
      display: block;
    }

    #photoGallery > img {
      display: block;
      width: 100%;
    }

    #controls {
      position: absolute;
      display: flex;
      flex-grow: 1;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
    }
    #controls>a {
      background-color: honeydew;
    }
  `;

  protected override render() {
    return html`
      <div id="photoGallery">
        <img src="/dev/picture1.jpg" />
        <div id="controls">
          <a href="#previous">Previous</a>
          <a href="#next">Next</a>
        </div>
        <slot></slot>  
      </div>
    `;
  }
}