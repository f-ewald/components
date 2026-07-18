import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { formatMiles, formatKm } from "./utils/distance.js";

/**
 * Inline distance display. Renders miles/feet or km/m, switching units at
 * sensible thresholds (< 0.25 mi → ft; < 0.5 km → m).
 *
 * Supply exactly one of `miles` or `km`; the other stays null.
 * km support is present but reserved for future use.
 *
 * @element distance-value
 */
@customElement("distance-value")
export class DistanceValue extends LitElement {
  static override styles = css`
    :host {
      display: inline;
    }
  `;

  /** Distance in miles (imperial). Switches to feet below 0.25 mi. */
  @property({ type: Number }) miles: number | null = null;

  /** Distance in kilometers (metric, future). Switches to meters below 0.5 km. */
  @property({ type: Number }) km: number | null = null;

  override render() {
    if (this.km != null) return html`${formatKm(this.km)}`;
    if (this.miles != null) return html`${formatMiles(this.miles)}`;
    return nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "distance-value": DistanceValue;
  }
}
