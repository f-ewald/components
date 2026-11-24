import type { PropertyValues, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { AutocompleteBase, autocompleteStyles, type AutocompleteItemView } from "./autocomplete-base.js";
import { tokens } from "./tokens.js";

/** A single autocomplete candidate: an opaque `key` plus its display `value`. */
export interface AutocompleteOption {
  key: string;
  value: string;
  /**
   * Optional icon shown before the value: a pre-rendered template such as
   * `iconServer(14)` (local `options`), or the name of an entry in the
   * element's `icons` map — the form an `endpoint` returns, since JSON can't
   * carry a template.
   */
  icon?: TemplateResult | string;
  /** Optional secondary line shown under the value in smaller, muted text. Not matched when filtering. */
  description?: string;
}

/** Builds an icon at the requested pixel size, e.g. one of the package's `icon*` exports. */
export type AutocompleteIconFactory = (size: number) => TemplateResult;

/** Picks an icon for an option that has none of its own, or `undefined` for none. */
export type AutocompleteOptionIcon = (option: AutocompleteOption) => TemplateResult | undefined;

/** Inline icon size, in pixels, for suggestion rows and the field. */
const ICON_SIZE = 14;

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
 * Each option may also carry an `icon` (shown before the value) and a
 * `description` (a smaller, muted line under the value); options without
 * them render as a plain value. A local option's `icon` is a pre-rendered
 * template. An endpoint's JSON can't carry one, so it may name an icon
 * instead (`{"key": "api", "value": "API", "icon": "server"}`), which is
 * looked up in the `icons` map; any other JSON `icon` is ignored. Options
 * with no icon, or an unknown name, fall back to `optionIcon`, if set.
 *
 * The selected option's icon also shows inside the field until the text is
 * edited. Picking an option sets `selectedKey`; set `selectedKey` and
 * `value` together, in the same update, to show a selection made elsewhere.
 * In API mode such a selection shows `optionIcon`'s icon, since the
 * endpoint's own icon for it isn't known until it has been suggested.
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
  /**
   * Icons an endpoint may name in an option's `icon`, e.g.
   * `{ server: iconServer, library: iconBookOpen }`. Called with `14`.
   */
  @property({ attribute: false }) icons: Record<string, AutocompleteIconFactory> = {};
  /**
   * Icon for any option without one of its own (or whose named icon isn't in
   * `icons`), e.g. `() => iconServer(14)`. Applies to local and API options.
   */
  @property({ attribute: false }) optionIcon: AutocompleteOptionIcon | null = null;

  /** `value` as it was when `selectedKey` last changed; see `fieldIcon`. */
  #selectedValue: string | null = null;

  /** Selected option (picked, or matching `selectedKey`), or null once the input diverges from it. */
  get selectedOption(): AutocompleteOption | null {
    if (this.lastPicked && this.lastPicked.value === this.value) return this.lastPicked;
    return this.options?.find((o) => o.key === this.selectedKey && o.value === this.value) ?? null;
  }

  protected override localItems(): AutocompleteOption[] | null {
    return this.options;
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has("selectedKey")) this.#selectedValue = this.value;
  }

  protected override view(option: AutocompleteOption): AutocompleteItemView {
    return { text: option.value, icon: this.#iconFor(option), description: option.description };
  }

  protected override requestUrl(query: string): string {
    const params = new URLSearchParams({ [this.queryParam]: query });
    return `${this.endpoint}?${params.toString()}`;
  }

  /** Keeps a JSON `icon` only as a name: anything else could pose as a template. */
  protected override parseItems(body: unknown): AutocompleteOption[] {
    if (!Array.isArray(body)) return [];
    return body.filter((item) => item && typeof item === "object").map((item: AutocompleteOption) => {
      const { icon, ...rest } = item;
      return typeof icon === "string" ? { ...rest, icon } : rest;
    });
  }

  protected override onSelect(option: AutocompleteOption): void {
    this.selectedKey = option.key;
    this.dispatchEvent(
      new CustomEvent<AutocompleteOption>("option-select", { detail: option, bubbles: true, composed: true }),
    );
  }

  protected override fieldIcon(): TemplateResult | undefined {
    const option = this.selectedOption ?? this.#outsideSelection();
    return option ? this.#iconFor(option) : undefined;
  }

  /**
   * In API mode, a selection set from outside through `selectedKey` and
   * `value`, while the text is still what it was set to.
   */
  #outsideSelection(): AutocompleteOption | null {
    if (this.options || this.selectedKey === null || !this.value) return null;
    if (this.value !== this.#selectedValue) return null;
    return { key: this.selectedKey, value: this.value };
  }

  /** An option's own icon (template, or a name found in `icons`), else `optionIcon`'s. */
  #iconFor(option: AutocompleteOption): TemplateResult | undefined {
    const { icon } = option;
    if (typeof icon === "string") {
      if (this.icons && Object.hasOwn(this.icons, icon)) return this.icons[icon](ICON_SIZE);
    } else if (icon) {
      return icon;
    }
    return this.optionIcon?.(option) ?? undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "autocomplete-input": AutocompleteInput;
  }
}
