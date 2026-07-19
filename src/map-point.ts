import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";
import { mixHex } from "./utils/color.js";

let gradientIdCounter = 0;

/**
 * A small plain-colored map marker for dense point layers (transit stops,
 * amenities, hazard points, etc.): a light-to-dark gradient fill with a thin
 * white ring, no badge/content slot — every instance on a given layer shares
 * the same look, so there's nothing to render per-feature (unlike
 * `<map-pin>`/`<map-circle>`, which carry per-marker slotted content).
 * Purely a visual primitive — it has no `mapbox-gl` (or any mapping library)
 * dependency; typically rasterized once per color and used as a Mapbox
 * `icon-image` on a `symbol` layer rather than mounted as individual DOM
 * markers, so a whole layer's worth of points shares one icon image.
 *
 * @element map-point
 */
@customElement("map-point")
export class MapPoint extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: inline-block;
        line-height: 0;
      }
      svg {
        display: block;
      }
    `,
  ];

  /** Fill color; the gradient's light (top) and dark (bottom) stops are derived from this. */
  @property() color = "#4f46e5";
  /** Diameter, in CSS pixels. */
  @property({ type: Number }) size = 14;
  /** White outer ring thickness, in the same viewBox units as `size` (scales with it). */
  @property({ type: Number, attribute: "ring-width" }) ringWidth = 3;

  private readonly _gradId = `map-point-grad-${gradientIdCounter++}`;

  override render() {
    const light = mixHex(this.color, "#ffffff", 30);
    const dark = mixHex(this.color, "#000000", 30);
    return html`
      <svg
        width=${this.size}
        height=${this.size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id=${this._gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color=${light} />
            <stop offset="100%" stop-color=${dark} />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="13" fill="url(#${this._gradId})" stroke="#ffffff" stroke-width=${this.ringWidth} />
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "map-point": MapPoint;
  }
}
