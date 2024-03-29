import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement('photo-gallery')
export class PhotoGallery extends LitElement {
  static override styles = css`
    #photoGallery {
      background-color: cyan;
    }

    #container {
      background-color: aliceblue;
      height: 12rem;
      display: flex;
      /* flex-grow: 1; */
      /* align-content: center; */
    }

    #controls {
      z-index: 10;
      display: flex;
      flex-grow: 1;
      justify-content: space-between;
      align-items: center;
    }
    #controls>a {
      background-color: honeydew;
    }
  `;

  protected override render() {
    return html`
      <div id="photoGallery">
        <div id="container">
          <!-- <img src="/dev/picture1.jpg" /> -->
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