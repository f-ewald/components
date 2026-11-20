import { customElement, property } from "lit/decorators.js";
import { AutocompleteBase, autocompleteStyles, type AutocompleteItemView } from "./autocomplete-base.js";
import { tokens } from "./tokens.js";

/** A picked address suggestion. */
export interface AddressSuggestion {
  address: string;
  lat: number;
  lng: number;
}

interface MapboxGeocodeFeature {
  properties?: { full_address?: string };
  geometry: { coordinates: [number, number] };
}

/**
 * Form-associated text input with a suggestion dropdown. Works as a
 * drop-in replacement for a plain `<input name="address">`: consumers keep
 * reading `new FormData(form).get("address")` and calling `form.reset()`
 * unchanged.
 *
 * Supports two suggestion sources:
 * - **API** (default): fetches from `endpoint`, a Mapbox Geocoding v6-shaped
 *   forward-geocode URL, debounced as the user types.
 * - **Local array**: set `suggestions` to a fixed `AddressSuggestion[]` and
 *   the component filters it client-side instead of making any network
 *   request. Useful for small/fixed address lists, offline use, or tests.
 *   Takes priority over `endpoint` whenever it's non-null.
 *
 * Set `clearable` to show an in-field clear action whenever a value is
 * present.
 *
 * @element address-autocomplete
 * @fires address-select - A suggestion was picked; detail: AddressSuggestion.
 * @fires input - Native-compatible input event fired while editing or clearing.
 */
@customElement("address-autocomplete")
export class AddressAutocomplete extends AutocompleteBase<AddressSuggestion> {
  static override styles = [tokens, autocompleteStyles];

  /** Mapbox `types` param, e.g. "address" or "address,poi". */
  @property() types = "address";
  /** Geocoding endpoint URL. Defaults to the Mapbox Geocoding v6 forward URL. */
  @property() endpoint: string = "https://api.mapbox.com/search/geocode/v6/forward";
  /** Mapbox access token. Required for requests to succeed. */
  @property({ attribute: "access-token" }) accessToken = "";
  /** Optional bounding box bias, comma-separated `west,south,east,north`. */
  @property() bbox = "";
  /** Optional proximity bias, comma-separated `lng,lat`. */
  @property() proximity = "";
  /**
   * Fixed candidate list to filter locally instead of fetching from
   * `endpoint`. When set (non-null), no network request is ever made —
   * this takes priority over the API mode.
   */
  @property({ attribute: false }) suggestions: AddressSuggestion[] | null = null;

  protected override readonly listboxLabel = "Address suggestions";
  protected override readonly clearLabel = "Clear address";

  /** Last-picked suggestion, or null once the input diverges from it. */
  get selectedSuggestion(): AddressSuggestion | null {
    return this.lastPicked && this.lastPicked.address === this.value ? this.lastPicked : null;
  }

  protected override localItems(): AddressSuggestion[] | null {
    return this.suggestions;
  }

  protected override view(suggestion: AddressSuggestion): AutocompleteItemView {
    return { text: suggestion.address };
  }

  protected override requestUrl(query: string): string {
    const params = new URLSearchParams({
      q: query,
      access_token: this.accessToken,
      autocomplete: "true",
      limit: "5",
      types: this.types,
    });
    if (this.bbox) params.set("bbox", this.bbox);
    if (this.proximity) params.set("proximity", this.proximity);
    return `${this.endpoint}?${params.toString()}`;
  }

  protected override parseItems(body: unknown): AddressSuggestion[] {
    return parseFeatures((body as { features?: MapboxGeocodeFeature[] }).features ?? []);
  }

  protected override onSelect(suggestion: AddressSuggestion): void {
    this.dispatchEvent(
      new CustomEvent<AddressSuggestion>("address-select", { detail: suggestion, bubbles: true, composed: true }),
    );
  }
}

/** Maps Mapbox v6 forward-geocode features to suggestions, skipping ones without a full_address. */
function parseFeatures(features: MapboxGeocodeFeature[]): AddressSuggestion[] {
  const suggestions: AddressSuggestion[] = [];
  for (const f of features) {
    const address = f.properties?.full_address;
    if (!address) continue;
    const [lng, lat] = f.geometry.coordinates;
    suggestions.push({ address, lng, lat });
  }
  return suggestions;
}

declare global {
  interface HTMLElementTagNameMap {
    "address-autocomplete": AddressAutocomplete;
  }
}
