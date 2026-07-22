import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";
import { mixHex } from "./utils/color.js";

let gradientIdCounter = 0;

/**
 * A circular "Apple Maps"-style map pin: a light-to-dark gradient fill with
 * a slight point at the bottom. Purely a visual primitive — it has no
 * `mapbox-gl` (or any mapping library) dependency; the consumer positions
 * it, e.g. via `new mapboxgl.Marker({ element: pinEl })`.
 *
 * @element map-pin
 * @slot - Badge content shown centered on the pin's circular head — a rank
 *   number, an emoji, a small icon.
 */
@customElement("map-pin")
export class MapPin extends LitElement {
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
        /* The path's circular head is centered at viewBox y=13 of 34 total
           (13/34 ≈ 38%) — not the pin's full bounding box, which is pulled
           down by the point below the circle. */
        top: 38%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #fff;
        font-family: var(
          --ui-font,
          ui-sans-serif,
          system-ui,
          sans-serif,
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji"
        );
        font-weight: var(--ui-font-weight-bold, 700);
        line-height: var(--ui-line-height-glyph, 1);
        text-shadow: 0 1px 2px rgb(0 0 0 / 0.35);
        pointer-events: none;
        white-space: nowrap;
      }
      @media (prefers-reduced-motion: reduce) {
        svg {
          transition: none;
        }
      }
    `,
  ];

  /** Fill color; the gradient's light (top) and dark (bottom) stops are derived from this. */
  @property() color = "#4f46e5";
  /** Diameter of the circular head, in CSS pixels. */
  @property({ type: Number }) size = 32;
  /** Scales and glows the pin — a generic emphasis state (e.g. hover, selection). */
  @property({ type: Boolean, reflect: true }) highlighted = false;

  private readonly _gradId = `map-pin-grad-${gradientIdCounter++}`;

  override render() {
    const light = mixHex(this.color, "#ffffff", 30);
    const dark = mixHex(this.color, "#000000", 30);
    const height = Math.round(this.size * (34 / 32));
    return html`
      <svg
        aria-hidden="true"
        width=${this.size}
        height=${height}
        viewBox="0 0 32 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id=${this._gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color=${light} />
            <stop offset="100%" stop-color=${dark} />
          </linearGradient>
        </defs>
        <path
          d="M16 30 C10 24 4 19.5 4 13 A12 12 0 1 1 28 13 C28 19.5 22 24 16 30 Z"
          fill="url(#${this._gradId})"
          stroke="#ffffff"
          stroke-width="1.5"
        />
      </svg>
      <div class="content" style="font-size:${Math.round(this.size * 0.4)}px">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "map-pin": MapPin;
  }
}
