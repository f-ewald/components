import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement('photo-gallery')
export class PhotoGallery extends LitElement {
  static override styles = css`
    /** Needed because display:flex overrides hidden */
    [hidden] {
      display: none !important;
    }

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
    #controls > a {
      background-color: honeydew;
    }
  `;

  @property({type: Number})
  delay?: number
  private _delayInterval?: number


  @property({type: Boolean})
  showControls: boolean = false;

  private _nextImage(e: MouseEvent) {
    e.preventDefault();
    // TODO: Implement
  }

  private _previousImage(e: MouseEvent) {
    e.preventDefault();
    // TODO: Implement
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.delay) {
      this._delayInterval = setInterval(() => {
        console.log('next image');
      }, this.delay);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._delayInterval) {
      clearInterval(this._delayInterval);
    }
  }

  protected override render() {
    console.log(this.showControls);
    return html`
      <div id="photoGallery">
        <img src="/dev/picture1.jpg" />
        <div ?hidden=${!this.showControls} id="controls">
          <a @click="${this._previousImage}" href="#previous">Previous</a>
          <a @click="${this._nextImage}" href="#next">Next</a>
        </div>
        <slot></slot>  
      </div>
    `;
  }
}