import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "./tokens.js";
import { submitWithDefaultButton } from "./utils/form.js";

let instanceCount = 0;

/** A single autocomplete candidate: an opaque `key` plus its display `value`. */
export interface AutocompleteOption {
  key: string;
  value: string;
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
 * @element autocomplete-input
 * @fires option-select - An option was picked; detail: AutocompleteOption.
 */
@customElement("autocomplete-input")
export class AutocompleteInput extends LitElement {
  static formAssociated = true;

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        position: relative;
      }
      input {
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
        font-size: var(--ui-font-size-sm, 0.75rem);
        color: var(--ui-text, #0f172a);
        background: var(--ui-surface, #ffffff);
        padding: 0.5rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        width: 100%;
        box-sizing: border-box;
      }
      input:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
      input:focus-visible {
        outline: none;
        border-color: var(--ui-primary, #4f46e5);
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .suggestions {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        z-index: 10;
        max-height: 40vh;
        overflow-y: auto;
        margin: 0.25rem 0 0;
        padding: 0.25rem 0;
        list-style: none;
        background: var(--ui-surface, #ffffff);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        box-shadow: var(--ui-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
      }
      .suggestion {
        padding: 0.5rem 0.75rem;
        font-size: var(--ui-font-size-sm, 0.75rem);
        cursor: pointer;
      }
      .suggestion.active,
      .suggestion:hover {
        background: var(--ui-surface-muted, #f8fafc);
      }
      .no-suggestions {
        padding: 0.5rem 0.75rem;
        color: var(--ui-text-muted, #64748b);
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-style: italic;
      }
      @media (forced-colors: active) {
        input:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
        input:disabled {
          color: GrayText;
          opacity: 1;
        }
        .suggestion.active,
        .suggestion:hover {
          color: HighlightText;
          background: Highlight;
        }
      }
    `,
  ];

  /** Current input value; also the form-associated value submitted with the form. */
  @property() value = "";
  /** Placeholder text shown when the input is empty. */
  @property() placeholder = "";
  /** Marks the input as required for native form validation. */
  @property({ type: Boolean }) required = false;
  /** Disables the input and closes its suggestion popup. */
  @property({ type: Boolean, reflect: true }) disabled = false;
  /** API endpoint queried in API mode. Ignored when `options` is set. */
  @property() endpoint = "";
  /** Query string parameter name the current input text is sent under. */
  @property({ attribute: "query-param" }) queryParam = "q";
  /** Debounce delay (ms) before firing a request/filter after typing. */
  @property({ type: Number }) debounce = 300;
  /** Minimum query length before suggestions are shown. */
  @property({ type: Number, attribute: "min-length" }) minLength = 3;
  /**
   * Fixed candidate list to filter locally instead of fetching from
   * `endpoint`. When set (non-null), no network request is ever made —
   * this takes priority over the API mode.
   */
  @property({ attribute: false }) options: AutocompleteOption[] | null = null;

  @state() private _suggestions: AutocompleteOption[] = [];
  @state() private _open = false;
  @state() private _activeIndex = -1;
  @state() private _formDisabled = false;

  #internals = this.attachInternals();
  #lastPicked: AutocompleteOption | null = null;
  #debounceTimer: ReturnType<typeof setTimeout> | null = null;
  #abortController: AbortController | null = null;
  #isComposing = false;
  #compositionJustEnded = false;
  #compositionEndTimer: ReturnType<typeof setTimeout> | null = null;
  readonly #listboxId = `autocomplete-input-listbox-${++instanceCount}`;

  /** Whether the host or an ancestor fieldset currently disables the control. */
  get #isDisabled(): boolean {
    return this.disabled || this._formDisabled;
  }

  /** Last-picked option, or null once the input diverges from it. */
  get selectedOption(): AutocompleteOption | null {
    if (this.#lastPicked && this.#lastPicked.value === this.value) return this.#lastPicked;
    return null;
  }

  protected override willUpdate(changed: PropertyValues) {
    if (changed.has("disabled") && this.#isDisabled) {
      if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
      this.#resetComposition();
      this.#abortController?.abort();
      this._open = false;
      this._activeIndex = -1;
    }
  }

  protected override updated(changed: PropertyValues) {
    if (changed.has("value")) this.#internals.setFormValue(this.value);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
    this.#resetComposition();
    this.#abortController?.abort();
  }

  /** Resets to empty on `form.reset()`, per the form-associated custom element contract. */
  formResetCallback() {
    this.value = "";
    this._suggestions = [];
    this._open = false;
    this.#lastPicked = null;
  }

  /** Mirrors ancestor fieldset disabled state onto the native input. */
  formDisabledCallback(disabled: boolean) {
    this._formDisabled = disabled;
    if (!disabled) return;
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
    this.#resetComposition();
    this.#abortController?.abort();
    this._open = false;
    this._activeIndex = -1;
  }

  private onInput(e: InputEvent) {
    if (this.#isDisabled) return;
    this.value = (e.target as HTMLInputElement).value;
    this.#lastPicked = null;
    this.#scheduleFetch(this.value);
  }

  #scheduleFetch(query: string) {
    if (this.#isDisabled) return;
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
    if (query.trim().length < this.minLength) {
      this._suggestions = [];
      this._open = false;
      this._activeIndex = -1;
      return;
    }
    if (this.options) {
      // Local mode: filtering is synchronous and cheap, but keep the same
      // debounce as the API mode so the UX doesn't shift between sources.
      this.#debounceTimer = setTimeout(() => this.#filterLocalOptions(query), this.debounce);
      return;
    }
    this.#debounceTimer = setTimeout(() => void this.#fetchOptions(query), this.debounce);
  }

  /** Filters the locally-supplied `options` list for `query`, case-insensitively. */
  #filterLocalOptions(query: string) {
    const needle = query.trim().toLowerCase();
    this._suggestions = (this.options ?? [])
      .filter((o) => o.value.toLowerCase().includes(needle))
      .slice(0, 5);
    this._activeIndex = -1;
    this._open = !this.#isDisabled;
  }

  /** Fetches options for `query` from `endpoint`, cancelling any request still in flight. */
  async #fetchOptions(query: string) {
    this.#abortController?.abort();
    const controller = new AbortController();
    this.#abortController = controller;
    try {
      const res = await fetch(this.#buildUrl(query), { signal: controller.signal });
      if (!res.ok) throw new Error(`autocomplete request failed: ${res.status}`);
      if (this.#isDisabled) return;
      this._suggestions = ((await res.json()) as AutocompleteOption[]).slice(0, 5);
      this._activeIndex = -1;
      this._open = true;
    } catch {
      // Aborted (superseded by newer keystroke) or a network failure while
      // typing — fail silently and just close the list.
      if (!controller.signal.aborted) {
        this._suggestions = [];
        this._open = false;
      }
    }
  }

  #buildUrl(query: string): string {
    const params = new URLSearchParams({ [this.queryParam]: query });
    return `${this.endpoint}?${params.toString()}`;
  }

  private onKeydown(e: KeyboardEvent) {
    if (this.#isDisabled) return;
    if (e.isComposing || e.keyCode === 229 || this.#isComposing || this.#compositionJustEnded) {
      return;
    }
    if (e.key === "ArrowDown") this.#moveActive(1, e);
    else if (e.key === "ArrowUp") this.#moveActive(-1, e);
    else if (e.key === "Enter") this.#handleEnter(e);
    else if (e.key === "Escape") this.#handleEscape(e);
  }

  #moveActive(delta: number, e: KeyboardEvent) {
    if (!this._open || this._suggestions.length === 0) return;
    e.preventDefault();
    const n = this._suggestions.length;
    this._activeIndex = (this._activeIndex + delta + n) % n;
  }

  #handleEnter(e: KeyboardEvent) {
    const pick = this._suggestions[this._activeIndex] ?? this._suggestions[0];
    if (this._open && pick) {
      e.preventDefault();
      this.#selectOption(pick);
      return;
    }
    if (this.#internals.form) {
      const form = this.#internals.form;
      window.setTimeout(() => {
        if (!e.defaultPrevented && form.isConnected) submitWithDefaultButton(form);
      });
    }
  }

  #handleEscape(e: KeyboardEvent) {
    if (!this._open) return;
    e.preventDefault();
    this._open = false;
  }

  private onBlur() {
    this._open = false;
  }

  private onCompositionStart(): void {
    if (this.#compositionEndTimer) clearTimeout(this.#compositionEndTimer);
    this.#compositionEndTimer = null;
    this.#compositionJustEnded = false;
    this.#isComposing = true;
  }

  private onCompositionEnd(): void {
    this.#isComposing = false;
    this.#compositionJustEnded = true;
    if (this.#compositionEndTimer) clearTimeout(this.#compositionEndTimer);
    this.#compositionEndTimer = setTimeout(() => {
      this.#compositionJustEnded = false;
      this.#compositionEndTimer = null;
    });
  }

  /** Clears composition state when the control can no longer receive keys. */
  #resetComposition(): void {
    if (this.#compositionEndTimer) clearTimeout(this.#compositionEndTimer);
    this.#compositionEndTimer = null;
    this.#isComposing = false;
    this.#compositionJustEnded = false;
  }

  #selectOption(o: AutocompleteOption) {
    this.value = o.value;
    this.#lastPicked = o;
    this._open = false;
    this._suggestions = [];
    this.dispatchEvent(new CustomEvent<AutocompleteOption>("option-select", { detail: o, bubbles: true, composed: true }));
  }

  /** Selects on mousedown (not click) so it wins over the input's blur, which closes the list. */
  #onSuggestionMousedown(e: MouseEvent, o: AutocompleteOption) {
    e.preventDefault();
    this.#selectOption(o);
  }

  private renderSuggestions() {
    if (!this._open || this.#isDisabled) return nothing;
    return html`
      <ul id=${this.#listboxId} class="suggestions" role="listbox" aria-label="Suggestions">
        ${this._suggestions.map(
          (o, i) => html`
            <li
              id=${`${this.#listboxId}-option-${i}`}
              role="option"
              aria-selected=${i === this._activeIndex}
              class="suggestion ${i === this._activeIndex ? "active" : ""}"
              @mousedown=${(e: MouseEvent) => this.#onSuggestionMousedown(e, o)}
            >
              ${o.value}
            </li>
          `,
        )}
        ${this._suggestions.length === 0
          ? html`<li class="no-suggestions" role="presentation">
              <span role="status">No suggestions found</span>
            </li>`
          : nothing}
      </ul>
    `;
  }

  override render() {
    const activeDescendant =
      this._open && !this.#isDisabled && this._activeIndex >= 0
        ? `${this.#listboxId}-option-${this._activeIndex}`
        : nothing;
    const expanded = this._open && !this.#isDisabled;
    return html`
      <div>
        <input
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded=${expanded}
          aria-controls=${this.#listboxId}
          aria-activedescendant=${activeDescendant}
          .value=${this.value}
          placeholder=${this.placeholder}
          ?required=${this.required}
          ?disabled=${this.#isDisabled}
          autocomplete="off"
          @input=${this.onInput}
          @compositionstart=${this.onCompositionStart}
          @compositionend=${this.onCompositionEnd}
          @keydown=${this.onKeydown}
          @blur=${this.onBlur}
        />
        ${this.renderSuggestions()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "autocomplete-input": AutocompleteInput;
  }
}
