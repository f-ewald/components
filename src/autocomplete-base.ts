import { LitElement, css, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { property, query, state } from "lit/decorators.js";
import { iconX } from "./icons.js";
import {
  formFieldControl,
  type FormFieldControlConfig,
} from "./utils/form-field-control.js";
import { submitWithDefaultButton } from "./utils/form.js";

let instanceCount = 0;

/** How one candidate is shown: its value text plus an optional icon and description line. */
export interface AutocompleteItemView {
  text: string;
  icon?: TemplateResult;
  description?: string;
}

/** Shared styles for every `AutocompleteBase` subclass; use as `[tokens, autocompleteStyles]`. */
export const autocompleteStyles = css`
    :host {
      display: block;
      position: relative;
    }
    .field-shell {
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
      font-size: var(--ui-font-size, 0.875rem);
      line-height: var(--ui-line-height-tight, 1.25);
      color: var(--ui-text, #0f172a);
      background: var(--ui-surface, #ffffff);
      padding: 0.5rem 0.75rem;
      border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
      border-radius: var(--ui-radius-sm, 0.25rem);
      width: 100%;
      height: 2rem;
      box-sizing: border-box;
    }
    .field-shell.clearable input {
      padding-right: 2rem;
    }
    .field-shell.has-icon input {
      padding-left: 2rem;
    }
    .field-icon {
      position: absolute;
      top: 50%;
      left: 0.75rem;
      display: inline-flex;
      line-height: 0;
      transform: translateY(-50%);
      color: var(--ui-text-muted, #64748b);
      pointer-events: none;
    }
    .clear-button {
      position: absolute;
      top: 0;
      right: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: 2rem;
      height: 2rem;
      /* Insets the hover/focus background by the input's 1px border so it
         stays fully inside the field instead of painting over the border. */
      padding: 1px;
      background-clip: content-box;
      border: 0;
      border-radius: var(--ui-radius-sm, 0.25rem);
      color: var(--ui-text-muted, #64748b);
      background-color: transparent;
      cursor: pointer;
      line-height: 0;
    }
    .clear-button:hover {
      color: var(--ui-text, #0f172a);
      background-color: var(--ui-surface-muted, #f8fafc);
    }
    .clear-button:focus-visible {
      outline: none;
      box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
    }
    .floating-label {
      position: absolute;
      top: 50%;
      left: 0.75rem;
      right: 0.75rem;
      z-index: 1;
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
      overflow: hidden;
      transform: translateY(-50%);
      color: var(--ui-text-muted, #64748b);
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
      font-weight: var(--ui-font-weight-regular, 400);
      line-height: var(--ui-line-height-tight, 1.25);
      white-space: nowrap;
      text-overflow: ellipsis;
      cursor: text;
      transition:
        top 150ms ease,
        transform 150ms ease,
        font-size 150ms ease;
    }
    .field-shell.clearable .floating-label {
      right: 2rem;
    }
    .field-shell.floating input {
      height: 3rem;
      padding-top: 1.25rem;
      padding-bottom: 0.25rem;
    }
    .field-shell.floating .clear-button {
      top: 0.5rem;
    }
    .field-shell.floating .field-icon {
      top: 2rem;
    }
    .field-shell.has-icon .floating-label {
      left: 2rem;
    }
    .field-shell.floating.has-value .floating-label,
    .field-shell.floating:focus-within .floating-label {
      top: 0.25rem;
      transform: none;
      font-size: var(--ui-font-size-xs, 0.6875rem);
    }
    .field-shell.floating:not(.has-value):not(:focus-within) input::placeholder {
      opacity: 0;
    }
    .field-shell.disabled .floating-label {
      cursor: not-allowed;
      opacity: 0.6;
    }
    .required-mark {
      flex: 0 0 auto;
      color: var(--ui-danger, #dc2626);
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0 0 0 0);
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
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
      border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
      border-radius: var(--ui-radius-sm, 0.25rem);
      box-shadow: var(--ui-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
    }
    .suggestion {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      font-size: var(--ui-font-size-sm, 0.75rem);
      cursor: pointer;
    }
    .suggestion-icon {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      /* Centers the icon on the value's first line rather than the whole row. */
      min-height: calc(1em * var(--ui-line-height-tight, 1.25));
      color: var(--ui-text-muted, #64748b);
    }
    .suggestion-text {
      display: flex;
      min-width: 0;
      flex-direction: column;
      line-height: var(--ui-line-height-tight, 1.25);
    }
    .suggestion-description {
      color: var(--ui-text-muted, #64748b);
      font-size: var(--ui-font-size-xs, 0.6875rem);
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
      .clear-button:focus-visible {
        outline: 2px solid CanvasText;
        outline-offset: -2px;
        box-shadow: none;
      }
      .field-shell.disabled .floating-label {
        color: GrayText;
        opacity: 1;
      }
      .suggestion.active,
      .suggestion:hover {
        color: HighlightText;
        background: Highlight;
      }
      .suggestion.active :is(.suggestion-icon, .suggestion-description),
      .suggestion:hover :is(.suggestion-icon, .suggestion-description) {
        color: HighlightText;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .floating-label {
        transition: none;
      }
    }
`;

/**
 * Shared form-associated combobox behind `autocomplete-input` and
 * `address-autocomplete` — not a registered custom element itself. Owns the
 * input, debounced local filtering or fetching, keyboard and IME handling,
 * the clear action, and the form contract. Subclasses supply the item type
 * `T` and how to filter, fetch, show, and announce it.
 */
export abstract class AutocompleteBase<T> extends LitElement {
  static formAssociated = true;

  /** Current input value; also the form-associated value submitted with the form. */
  @property() value = "";
  /** Placeholder text shown when the input is empty. */
  @property() placeholder = "";
  /** Marks the input as required for native form validation. */
  @property({ type: Boolean }) required = false;
  /** Disables the input and closes its suggestion popup. */
  @property({ type: Boolean, reflect: true }) disabled = false;
  /** Shows an in-field clear action while the control has a value. */
  @property({ type: Boolean, reflect: true }) clearable = false;
  /** Debounce delay (ms) before firing a request/filter after typing. */
  @property({ type: Number }) debounce = 300;
  /** Minimum query length before suggestions are shown. */
  @property({ type: Number, attribute: "min-length" }) minLength = 3;

  @state() private _suggestions: T[] = [];
  @state() private _open = false;
  @state() private _activeIndex = -1;
  @state() private _formDisabled = false;
  @state() private _formFieldConfig: FormFieldControlConfig | null = null;

  @query("input") private _input?: HTMLInputElement;

  /** Accessible name of the suggestion list. */
  protected readonly listboxLabel: string = "Suggestions";
  /** Accessible name and tooltip of the clear action. */
  protected readonly clearLabel: string = "Clear input";
  /** The last item picked from the list; cleared on reset and clear. */
  protected lastPicked: T | null = null;

  #internals = this.attachInternals();
  #debounceTimer: ReturnType<typeof setTimeout> | null = null;
  #abortController: AbortController | null = null;
  #isComposing = false;
  #compositionJustEnded = false;
  #compositionEndTimer: ReturnType<typeof setTimeout> | null = null;
  readonly #inputId = `${this.localName}-field-${++instanceCount}`;
  readonly #listboxId = `${this.localName}-listbox-${instanceCount}`;

  /** The fixed candidate list to filter locally, or null to fetch instead. */
  protected abstract localItems(): T[] | null;
  /** How `item` is matched, shown, and written into the field. */
  protected abstract view(item: T): AutocompleteItemView;
  /** The request URL for `query` in fetch mode. */
  protected abstract requestUrl(query: string): string;
  /** Turns a fetch response's JSON body into candidates. */
  protected abstract parseItems(body: unknown): T[];
  /** Runs after `item` was picked and written into the field, e.g. to fire an event. */
  protected abstract onSelect(item: T): void;

  /** Icon shown inside the field, if any. */
  protected fieldIcon(): TemplateResult | undefined {
    return undefined;
  }

  /** Whether the host or an ancestor fieldset currently disables the control. */
  get #isDisabled(): boolean {
    return this.disabled || this._formDisabled;
  }

  /**
   * Applies or clears label configuration supplied by a wrapping `form-field`.
   * @private
   */
  [formFieldControl](config: FormFieldControlConfig | null): void {
    this._formFieldConfig = config;
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
    this.lastPicked = null;
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
    this.lastPicked = null;
    this.#scheduleFetch(this.value);
  }

  #scheduleFetch(query: string) {
    if (this.#isDisabled) return;
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
    // Any response still in flight is for older text now.
    this.#abortController?.abort();
    this.#abortController = null;
    if (query.trim().length < this.minLength) {
      this._suggestions = [];
      this._open = false;
      this._activeIndex = -1;
      return;
    }
    if (this.localItems()) {
      // Local mode: filtering is synchronous and cheap, but keep the same
      // debounce as the API mode so the UX doesn't shift between sources.
      this.#debounceTimer = setTimeout(() => this.#filterLocalItems(query), this.debounce);
      return;
    }
    this.#debounceTimer = setTimeout(() => void this.#fetchItems(query), this.debounce);
  }

  /** Filters the local candidate list for `query`, case-insensitively. */
  #filterLocalItems(query: string) {
    const needle = query.trim().toLowerCase();
    this._suggestions = (this.localItems() ?? [])
      .filter((item) => this.view(item).text.toLowerCase().includes(needle))
      .slice(0, 5);
    this._activeIndex = -1;
    this._open = !this.#isDisabled;
  }

  /** Fetches candidates for `query`, cancelling any request still in flight. */
  async #fetchItems(query: string) {
    this.#abortController?.abort();
    const controller = new AbortController();
    this.#abortController = controller;
    try {
      const res = await fetch(this.requestUrl(query), { signal: controller.signal });
      if (!res.ok) throw new Error(`autocomplete request failed: ${res.status}`);
      const body: unknown = await res.json();
      if (controller.signal.aborted || this.#isDisabled) return;
      this._suggestions = this.parseItems(body).slice(0, 5);
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
      this.#select(pick);
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

  #select(item: T) {
    this.value = this.view(item).text;
    this.lastPicked = item;
    this._open = false;
    this._suggestions = [];
    this.onSelect(item);
  }

  /** Clears the field and all pending autocomplete state, then restores input focus. */
  #clear(): void {
    if (this.#isDisabled || !this.value) return;
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
    this.#debounceTimer = null;
    this.#abortController?.abort();
    this.#abortController = null;
    this.#resetComposition();
    this.value = "";
    this.lastPicked = null;
    this._suggestions = [];
    this._activeIndex = -1;
    this._open = false;
    this.#internals.setFormValue("");
    this.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        composed: true,
        inputType: "deleteContentBackward",
      }),
    );
    this._input?.focus({ preventScroll: true });
  }

  /** Selects on mousedown (not click) so it wins over the input's blur, which closes the list. */
  #onSuggestionMousedown(e: MouseEvent, item: T) {
    e.preventDefault();
    this.#select(item);
  }

  private renderSuggestions() {
    if (!this._open || this.#isDisabled) return nothing;
    return html`
      <ul id=${this.#listboxId} class="suggestions" role="listbox" aria-label=${this.listboxLabel}>
        ${this._suggestions.map((item, i) => {
          const { text, icon, description } = this.view(item);
          return html`
            <li
              id=${`${this.#listboxId}-option-${i}`}
              role="option"
              aria-selected=${i === this._activeIndex}
              class="suggestion ${i === this._activeIndex ? "active" : ""}"
              @mousedown=${(e: MouseEvent) => this.#onSuggestionMousedown(e, item)}
            >
              ${icon ? html`<span class="suggestion-icon" aria-hidden="true">${icon}</span>` : nothing}
              <span class="suggestion-text">
                <span class="suggestion-value">${text}</span>
                ${description ? html`<span class="suggestion-description">${description}</span>` : nothing}
              </span>
            </li>
          `;
        })}
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
    const floating =
      Boolean(this._formFieldConfig?.floating) && Boolean(this._formFieldConfig?.label);
    const showClear = this.clearable && Boolean(this.value) && !this.#isDisabled;
    const icon = this.fieldIcon();
    return html`
      <div
        class="field-shell ${this.clearable ? "clearable" : ""} ${floating
          ? "floating"
          : ""} ${this.value ? "has-value" : ""} ${this.#isDisabled ? "disabled" : ""} ${icon
          ? "has-icon"
          : ""}"
      >
        ${icon ? html`<span class="field-icon" aria-hidden="true">${icon}</span>` : nothing}
        ${floating
          ? html`
              <label class="floating-label" for=${this.#inputId}>
                <span>${this._formFieldConfig!.label}</span>
                ${this._formFieldConfig!.required
                  ? html`
                      <span class="required-mark" aria-hidden="true">*</span>
                      <span class="sr-only"> (required)</span>
                    `
                  : nothing}
              </label>
            `
          : nothing}
        <input
          id=${this.#inputId}
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
        ${showClear
          ? html`
              <button
                type="button"
                class="clear-button"
                aria-label=${this.clearLabel}
                title=${this.clearLabel}
                @mousedown=${(event: MouseEvent) => event.preventDefault()}
                @click=${() => this.#clear()}
              >
                ${iconX(18)}
              </button>
            `
          : nothing}
        ${this.renderSuggestions()}
      </div>
    `;
  }
}
