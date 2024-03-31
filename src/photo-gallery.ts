import { LitElement, css, html, nothing } from "lit";
import { customElement, property, queryAssignedElements, state } from "lit/decorators.js";
import { GalleryItem } from "./gallery-item";
import { GalleryItemVariant } from "./gallery-item-variant";

@customElement('photo-gallery')
export class PhotoGallery extends LitElement {
  static override styles = css`
    /** Needed because display:flex overrides hidden */
    [hidden] {
      display: none !important;
    }

    svg {
      width: 24px;
      height: 24px;
      color: white;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 6px;
      padding: .4rem;
    }
    svg:hover {
      background-color: rgba(0, 0, 0, 0.5);
    }
    
    #photoGallery {
      position: relative;
      display: block;
    }

    figure {
      margin: 0;
    }

    #photoGallery > figure > img {
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
      padding: 0 .5rem;
      box-sizing: border-box;
    }
  `;

  @property({type: Number})
  delay?: number
  private _delayInterval?: number


  @property({type: Boolean})
  showControls: boolean = false;

  @queryAssignedElements()
  galleryItems!: Array<HTMLElement>

  @state()
  private _currentIdx?: number;

  private _nextImage(e: MouseEvent) {
    e.preventDefault();
    this._currentIdx = (this._currentIdx! + 1) % this.galleryItems.length;
  }

  private _previousImage(e: MouseEvent) {
    e.preventDefault();
    this._currentIdx = this._currentIdx! == 0 ? this.galleryItems.length - 1 : this._currentIdx! - 1;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.delay) {
      this._delayInterval = setInterval(() => {
        this._currentIdx = (this._currentIdx! + 1) % this.galleryItems.length;
      }, this.delay);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._delayInterval) {
      clearInterval(this._delayInterval);
    }
  }

  private _renderFigure() {
    if (this._currentIdx == undefined) {
      return nothing;
    }
    const item = <GalleryItem> this.galleryItems[this._currentIdx];
    const variants: Array<GalleryItemVariant> = <Array<GalleryItemVariant>> item.variants;
    return html`
    <figure>
      ${variants.map(( variant) => 
        html`<source media="${variant.media!}" srcset="${variant.srcset!}" />`)}
      <img src="${item.src}" />
      <figcaption>${item.caption}</figcaption>
    </figure>
    `;
  }

  private _handleSlotChange(_e: Event) {
    if (this.galleryItems.length > 0) {
      this._currentIdx = 0;
    }
  }

  protected override render() {
    return html`
      <div id="photoGallery">
        ${this._renderFigure()}
        <div ?hidden=${!this.showControls} id="controls">
          <a @click="${this._previousImage}" href="#previous">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fill-rule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clip-rule="evenodd" />
            </svg>
          </a>
          <a @click="${this._nextImage}" href="#next">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
              <path fill-rule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clip-rule="evenodd" />
            </svg>
          </a>
        </div>
        <slot @slotchange="${this._handleSlotChange}"></slot>  
      </div>
    `;
  }
}