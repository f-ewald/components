import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";
import { mixHex } from "./utils/color.js";

let gradientIdCounter = 0;

/**
 * A plain circular map marker: a light-to-dark gradient fill with a white
 * outer ring, no point/tail (unlike `<map-pin>`) — for markers that don't
 * need to visually "point" at their exact coordinate. Purely a visual
 * primitive — it has no `mapbox-gl` (or any mapping library) dependency;
 * the consumer positions it, e.g. via `new mapboxgl.Marker({ element: el })`.
 * It can also replace the former `<map-point>` dense-layer primitive: use
 * `size="14" ring-width="3"`, leave the slot empty, and rasterize one marker
 * per color for use as a map `icon-image`.
 *
 * @element map-circle
 * @slot - Optional badge content shown centered on the circle — a rank
 *   number, an emoji, a small icon.
 */
@customElement("map-circle")
export class MapCircle extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: inline-block;
        position: relative;
        line-height: 0;
      }
      svg {
        display: block;
        transition: transform 120ms ease, filter 120ms ease;
      }
      :host([highlighted]) svg {
        transform: scale(1.12);
        filter: brightness(1.08) drop-shadow(0 0 5px rgb(0 0 0 / 0.35));
      }
      .content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #fff;
        font-family: var(--ui-font, ui-sans-serif, system-ui, sans-serif);
        font-weight: 700;
        line-height: 1;
        text-shadow: 0 1px 2px rgb(0 0 0 / 0.35);
        pointer-events: none;
        white-space: nowrap;
      }
    `,
  ];

  /** Fill color; the gradient's light (top) and dark (bottom) stops are derived from this. */
  @property() color = "#4f46e5";
  /** Diameter, in CSS pixels. */
  @property({ type: Number }) size = 18;
  /** White outer ring thickness, in the same viewBox units as `size` (scales with it). */
  @property({ type: Number, attribute: "ring-width" }) ringWidth = 4;
  /** Scales and glows the circle — a generic emphasis state (e.g. hover, selection). */
  @property({ type: Boolean, reflect: true }) highlighted = false;

  private readonly _gradId = `map-circle-grad-${gradientIdCounter++}`;

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
      <div class="content" style="font-size:${Math.round(this.size * 0.4)}px">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "map-circle": MapCircle;
  }
}
