import { LitElement, css, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import mapboxgl from "mapbox-gl";
import { tokens } from "./tokens.js";

const MAPBOX_GL_VERSION = "3.9.0";

/**
 * A thin, generic wrapper around a `mapboxgl.Map` — construction, access
 * token, style loading/switching, and container resizing only. It carries no
 * domain logic: no layer registry, no click-handler system, no markers or
 * popups. A consumer registers its own sources/layers/handlers against the
 * `mapboxgl.Map` instance handed back on `map-ready`, the same instance
 * `mapbox-map` continues to own (this component never calls `map.remove()`
 * except on disconnect, so a consumer's own registrations survive style
 * reloads exactly as they would using `mapboxgl.Map` directly).
 *
 * Deliberately does not construct the map until `styleUrl` is a non-empty
 * string — if a consumer knows the desired style only after an async
 * lookup (e.g. a saved user preference), delay setting `styleUrl` rather
 * than setting a default and swapping it later, which would visibly flash
 * the wrong basemap before the real one loads.
 *
 * @element mapbox-map
 * @fires map-ready - The map (and, if `styleUrl` changed before the initial
 *   load finished, its final requested style) has finished loading;
 *   detail: `{ map: mapboxgl.Map }`.
 * @fires map-style-reloaded - A subsequent `styleUrl` change finished
 *   loading its new style (sources/layers registered by a consumer via the
 *   `map-ready` instance do not survive a style change and must be
 *   re-registered — same behavior as calling `map.setStyle()` directly);
 *   detail: `{ map: mapboxgl.Map }`.
 */
@customElement("mapbox-map")
export class MapboxMap extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        position: relative;
        width: 100%;
        height: 100%;
      }
      #map {
        width: 100%;
        height: 100%;
      }
    `,
  ];

  /** Mapbox access token. Required before the map can be constructed. */
  @property({ attribute: "access-token" }) accessToken = "";
  /**
   * Style URL (e.g. `mapbox://styles/mapbox/light-v11`). The map is not
   * constructed until this is a non-empty string — see the class doc.
   */
  @property({ attribute: "style-url" }) styleUrl = "";
  /** Initial center as `[lng, lat]`. Only read at construction time. */
  @property({ attribute: false }) center: [number, number] = [0, 0];
  /** Initial zoom level. Only read at construction time. */
  @property({ type: Number }) zoom = 0;

  @query("#map") private mapContainer!: HTMLDivElement;

  private map?: mapboxgl.Map;
  private mapLoaded = false;
  private currentStyleUrl?: string;
  private resizeObserver?: ResizeObserver;

  /** The live `mapboxgl.Map` instance, once constructed (also available via `map-ready`'s event detail). */
  getMap(): mapboxgl.Map | undefined {
    return this.map;
  }

  protected override firstUpdated(): void {
    this.resizeObserver = new ResizeObserver(() => this.map?.resize());
    this.resizeObserver.observe(this);
    if (this.accessToken && this.styleUrl) this.#initializeMap();
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if ((changed.has("accessToken") || changed.has("styleUrl")) && !this.map && this.accessToken && this.styleUrl) {
      this.#initializeMap();
      return;
    }
    if (changed.has("styleUrl") && this.map && this.mapLoaded && this.styleUrl !== this.currentStyleUrl) {
      this.currentStyleUrl = this.styleUrl;
      this.map.setStyle(this.styleUrl);
      this.map.once("style.load", () =>
        this.dispatchEvent(new CustomEvent("map-style-reloaded", { detail: { map: this.map }, bubbles: true, composed: true })),
      );
    }
  }

  #initializeMap(): void {
    mapboxgl.accessToken = this.accessToken;
    this.currentStyleUrl = this.styleUrl;
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: this.currentStyleUrl,
      center: this.center,
      zoom: this.zoom,
    });
    this.map.once("load", () => {
      this.mapLoaded = true;
      // `updated()`'s style-swap branch requires `mapLoaded` to already be
      // true, so a `styleUrl` change that arrives between construction and
      // this "load" event is not caught there — reconcile it here instead.
      if (this.styleUrl !== this.currentStyleUrl) {
        this.currentStyleUrl = this.styleUrl;
        this.map?.setStyle(this.styleUrl);
        this.map?.once("style.load", () =>
          this.dispatchEvent(new CustomEvent("map-ready", { detail: { map: this.map }, bubbles: true, composed: true })),
        );
        return;
      }
      this.dispatchEvent(new CustomEvent("map-ready", { detail: { map: this.map }, bubbles: true, composed: true }));
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  override render() {
    return html`
      <link href="https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_GL_VERSION}/mapbox-gl.css" rel="stylesheet" />
      <div id="map"></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "mapbox-map": MapboxMap;
  }
}
