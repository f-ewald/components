import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement('photo-gallery')
export class PhotoGallery extends LitElement {
  static override styles = css`
    #photoGallery {
      background-color: cyan;
    }

    #container {
      width: 100%;
      background-color: aliceblue;
      height: 12rem;
    }

    #controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  `;

  protected override render() {
    return html`
      <div id="photoGallery">
        <div id="container">
          <div id="controls">
            <a href="#previous">Previous</a>
            <a href="#next">Next</a>
          </div>
        </div>
        <slot></slot>  
      </div>
    `;
  }
}