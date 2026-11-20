import type { TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { AutocompleteBase, autocompleteStyles, type AutocompleteItemView } from "./autocomplete-base.js";
import { tokens } from "./tokens.js";

/** A single autocomplete candidate: an opaque `key` plus its display `value`. */
export interface AutocompleteOption {
  key: string;
  value: string;
  /** Optional pre-rendered icon shown before the value, e.g. `iconServer(14)`. Local `options` only — not JSON-serializable. */
  icon?: TemplateResult;
  /** Optional secondary line shown under the value in smaller, muted text. Not matched when filtering. */
  description?: string;
}

/**
 * Generic form-associated text input with a suggestion dropdown, for any
 * "type to filter a list of `{key, value}` options" use case. Works as a
 * drop-in replacement for a plain `<input>` inside a `<form>`: set `name` on
 * the element itself and consumers keep reading
 * `new FormData(form).get(name)` and calling `form.reset()` unchanged — the
 * submitted value is the picked option's `value`, while `key` is available
 * via the `option-select` event and the `selectedOption` getter for cases
 * that need the underlying id rather than the display text.
 *
 * Supports two suggestion sources:
 * - **API**: set `endpoint` to a URL that, given a `?<query-param>=<text>`
 *   query string, responds with a JSON array of `{key, value}` objects.
 *   Requests are debounced as the user types.
 * - **Local array**: set `options` to a fixed `AutocompleteOption[]` and the
 *   component filters it client-side instead of making any network
 *   request. Useful for small/fixed lists, offline use, or tests. Takes
 *   priority over `endpoint` whenever it's non-null.
 *
 * Each option may also carry a pre-rendered `icon` (shown before the value)
 * and a `description` (a smaller, muted line under the value); options
 * without them render as a plain value. The selected option's icon also
 * shows inside the field until the text is edited. Picking an option sets
 * `selectedKey`; set `selectedKey` and `value` together to show a selection
 * made elsewhere.
 *
 * Set `clearable` to show an in-field clear action whenever a value is
 * present.
 *
 * @element autocomplete-input
 * @fires option-select - An option was picked; detail: AutocompleteOption.
 * @fires input - Native-compatible input event fired while editing or clearing.
 */
@customElement("autocomplete-input")
export class AutocompleteInput extends AutocompleteBase<AutocompleteOption> {
  static override styles = [tokens, autocompleteStyles];

  /** API endpoint queried in API mode. Ignored when `options` is set. */
  @property() endpoint = "";
  /** Query string parameter name the current input text is sent under. */
  @property({ attribute: "query-param" }) queryParam = "q";
  /**
   * Fixed candidate list to filter locally instead of fetching from
   * `endpoint`. When set (non-null), no network request is ever made —
   * this takes priority over the API mode.
   */
  @property({ attribute: false }) options: AutocompleteOption[] | null = null;
  /** Key of the selected option: set by picking one, or by the caller together with `value`. */
  @property({ attribute: "selected-key" }) selectedKey: string | null = null;

  /** Selected option (picked, or matching `selectedKey`), or null once the input diverges from it. */
  get selectedOption(): AutocompleteOption | null {
    if (this.lastPicked && this.lastPicked.value === this.value) return this.lastPicked;
    return this.options?.find((o) => o.key === this.selectedKey && o.value === this.value) ?? null;
  }

  protected override localItems(): AutocompleteOption[] | null {
    return this.options;
  }

  protected override view(option: AutocompleteOption): AutocompleteItemView {
    return { text: option.value, icon: option.icon, description: option.description };
  }

  protected override requestUrl(query: string): string {
    const params = new URLSearchParams({ [this.queryParam]: query });
    return `${this.endpoint}?${params.toString()}`;
  }

  protected override parseItems(body: unknown): AutocompleteOption[] {
    return body as AutocompleteOption[];
  }

  protected override onSelect(option: AutocompleteOption): void {
    this.selectedKey = option.key;
    this.dispatchEvent(
      new CustomEvent<AutocompleteOption>("option-select", { detail: option, bubbles: true, composed: true }),
    );
  }

  protected override fieldIcon(): TemplateResult | undefined {
    return this.selectedOption?.icon;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "autocomplete-input": AutocompleteInput;
  }
}
