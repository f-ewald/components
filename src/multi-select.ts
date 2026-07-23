import {
  LitElement,
  css,
  html,
  nothing,
  type PropertyValues,
  type TemplateResult,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { iconCheckCircle, iconChevronRight, iconX } from "./icons.js";
import { tokens } from "./tokens.js";

let instanceCount = 0;

/**
 * Presentation variant of {@link MultiSelect}.
 *
 * - `"dropdown"` (default): a compact trigger that opens a listbox popover.
 * - `"list"`: a persistently visible, bordered list surface with no popover.
 */
export type MultiSelectVariant = "dropdown" | "list";

/** A single selectable option. */
export interface MultiSelectOption {
  value: string;
  label: string;
  /** Optional pre-rendered icon template displayed before the label. */
  icon?: TemplateResult;
  /** Square icon size in pixels. Defaults to 16 when `icon` is set. */
  iconSize?: number;
  /** When true, the option can neither be selected nor removed via the UI. */
  disabled?: boolean;
}

/**
 * A form-associated multi-select: a trigger showing a compact summary of the
 * current selection, opening a multi-selectable listbox popover, with an
 * optional removable-chip list of the chosen values. A drop-in generic
 * replacement for a native `<select multiple>` — set `name` on the element
 * itself and each
 * selected value is submitted as a repeated `name=value` entry, matching native
 * multiple-select semantics; `new FormData(form).getAll(name)` and
 * `form.reset()` work unchanged.
 *
 * The trigger visually follows `form-select`: a `2rem` field showing the
 * `placeholder` when empty, the single selected label when one value is chosen,
 * and `N selected` when several are. Set `show-chips` to additionally render
 * the selected values as compact chips below the trigger, each with an
 * accessible `32px` remove control; chips are off by default and the region
 * reserves no space while nothing is selected. Like `form-select`, the host is
 * `display: block` and fills its container by default; constrain the host
 * (`multi-select { display: inline-block; }`) to shrink it to its content
 * instead.
 *
 * Set `searchable` to replace the button trigger with an editable combobox that
 * infix-filters the predefined options by case-insensitive label. Typed text is
 * only a query: `values` changes exclusively when options are toggled, and an
 * uncommitted query is discarded when the list closes.
 *
 * The `variant` chooses between two presentations, and `searchable` applies to
 * both:
 *
 * - `"dropdown"` (default) is the popover form described above: a compact
 *   trigger (button, or search combobox when `searchable`) that opens a
 *   multi-selectable listbox on demand, closes on outside click / Escape, and
 *   shows a chevron.
 * - `"list"` renders the options as a persistently visible, bordered surface
 *   with no popover, no chevron, and no `open` host state; it never registers
 *   outside-click listeners. Its scroll viewport is sized to roughly
 *   `visibleRows` `2rem` rows (see `visible-rows`). When not `searchable` the
 *   `listbox` itself is focusable and drives Arrow/Home/End/Enter/Space keyboard
 *   navigation via `aria-activedescendant`; when `searchable` a `2rem` search
 *   field sits above the list and owns navigation, and Escape only clears the
 *   query instead of hiding the list.
 *
 * @element multi-select
 * @fires change - Fired with `{ values: string[] }` (a copied array) when a
 *   value is added or removed through the UI. Programmatic `values` assignments
 *   do not fire it.
 */
@customElement("multi-select")
export class MultiSelect extends LitElement {
  static formAssociated = true;

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        position: relative;
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
      }
      .control {
        position: relative;
      }
      button.trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.25rem;
        width: 100%;
        height: 2rem;
        box-sizing: border-box;
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
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text, #0f172a);
        background: var(--ui-surface, #ffffff);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.5rem 0.75rem;
        cursor: pointer;
      }
      button.trigger:hover:not(:disabled) {
        background: var(--ui-surface-muted, #f8fafc);
      }
      button.trigger:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
      button.trigger:focus-visible {
        outline: none;
        border-color: var(--ui-primary, #4f46e5);
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .trigger-label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .trigger-label.placeholder {
        color: var(--ui-text-muted, #64748b);
      }
      .search-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.25rem;
        width: 100%;
        height: 2rem;
        box-sizing: border-box;
        color: var(--ui-text, #0f172a);
        background: var(--ui-surface, #ffffff);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        cursor: text;
      }
      .search-trigger:hover:not(.disabled) {
        background: var(--ui-surface-muted, #f8fafc);
      }
      .search-trigger:not(.disabled):focus-within {
        border-color: var(--ui-primary, #4f46e5);
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .search-trigger.disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
      input.search-input {
        min-width: 0;
        flex: 1;
        box-sizing: border-box;
        padding: 0.5rem 0 0.5rem 0.75rem;
        color: inherit;
        background: transparent;
        border: 0;
        outline: 0;
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
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: var(--ui-line-height-tight, 1.25);
      }
      input.search-input::placeholder {
        color: var(--ui-text-muted, #64748b);
        font-weight: var(--ui-font-weight-medium, 500);
        opacity: 1;
      }
      .chevron {
        display: flex;
        flex: 0 0 auto;
        margin-right: 0.75rem;
        color: var(--ui-text-muted, #64748b);
        pointer-events: none;
        transform: rotate(90deg);
        transition: transform 150ms ease;
      }
      button.trigger .chevron {
        margin-right: 0;
      }
      :host([open]) .chevron {
        transform: rotate(-90deg);
      }
      ul.options {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 10;
        min-width: 100%;
        max-height: 40vh;
        overflow-y: auto;
        scrollbar-gutter: stable;
        margin: 0.25rem 0 0;
        padding: 0.25rem 0;
        list-style: none;
        white-space: nowrap;
        color: var(--ui-text, #0f172a);
        background: var(--ui-surface, #ffffff);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        box-shadow: var(--ui-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
      }
      ul.options::-webkit-scrollbar {
        width: 0.75rem;
      }
      ul.options::-webkit-scrollbar-thumb {
        background: var(--ui-border, #e2e8f0);
        border: 0.25rem solid transparent;
        border-radius: 999px;
        background-clip: padding-box;
      }
      .list-control {
        display: flex;
        flex-direction: column;
      }
      .search-field {
        display: flex;
        align-items: center;
        width: 100%;
        height: 2rem;
        box-sizing: border-box;
        margin-bottom: 0.25rem;
        color: var(--ui-text, #0f172a);
        background: var(--ui-surface, #ffffff);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        cursor: text;
      }
      .search-field:not(.disabled):focus-within {
        border-color: var(--ui-primary, #4f46e5);
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .search-field.disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
      input.list-search {
        padding-right: 0.75rem;
      }
      ul.options.persistent {
        position: static;
        z-index: auto;
        min-width: 0;
        max-height: none;
        margin: 0;
        box-sizing: border-box;
        border-radius: var(--ui-radius, 0.5rem);
        box-shadow: none;
      }
      ul.options.persistent.disabled {
        cursor: not-allowed;
        opacity: 0.6;
        pointer-events: none;
      }
      ul.options.persistent:focus-visible {
        outline: none;
        border-color: var(--ui-primary, #4f46e5);
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
      }
      li.active,
      li:hover:not([aria-disabled="true"]) {
        background: var(--ui-surface-muted, #f8fafc);
      }
      li[aria-selected="true"] {
        font-weight: var(--ui-font-weight-semibold, 600);
        color: var(--ui-primary, #4f46e5);
      }
      li[aria-disabled="true"] {
        cursor: not-allowed;
        color: var(--ui-text-muted, #64748b);
        opacity: 0.6;
      }
      .check {
        display: inline-flex;
        flex: 0 0 auto;
        width: 14px;
        height: 14px;
        align-items: center;
        justify-content: center;
        color: var(--ui-primary, #4f46e5);
      }
      .check.hidden {
        visibility: hidden;
      }
      .check > svg {
        width: 100%;
        height: 100%;
      }
      .option-content {
        display: inline-flex;
        min-width: 0;
        flex: 1;
        align-items: center;
        gap: 0.5rem;
      }
      .option-icon {
        display: inline-flex;
        width: var(--multi-select-icon-size);
        height: var(--multi-select-icon-size);
        flex: 0 0 var(--multi-select-icon-size);
        align-items: center;
        justify-content: center;
      }
      .option-icon > svg {
        width: 100%;
        height: 100%;
      }
      .option-label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      li.no-options {
        display: block;
        padding: 0.5rem 0.75rem;
        color: var(--ui-text-muted, #64748b);
        cursor: default;
        font-style: italic;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        margin-top: 0.25rem;
        /* Pin the chips row to the control's resolved width (0 width +
           min-width 100%) so a long selected label ellipsizes instead of
           contributing its content width and widening the control. */
        width: 0;
        min-width: 100%;
        box-sizing: border-box;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        max-width: 100%;
        box-sizing: border-box;
        padding-left: 0.5rem;
        color: var(--ui-text, #0f172a);
        background: var(--ui-surface-muted, #f8fafc);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
      }
      .chip-label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: var(--ui-line-height-tight, 1.25);
      }
      .chip-remove {
        display: inline-flex;
        flex: 0 0 auto;
        width: 2rem;
        height: 2rem;
        align-items: center;
        justify-content: center;
        padding: 0;
        color: var(--ui-text-muted, #64748b);
        background: transparent;
        border: 0;
        border-radius: var(--ui-radius-sm, 0.25rem);
        cursor: pointer;
      }
      .chip-remove:hover:not(:disabled) {
        color: var(--ui-danger, #dc2626);
      }
      .chip-remove:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
      .chip-remove:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .chip-remove > svg {
        width: 18px;
        height: 18px;
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
      @media (prefers-reduced-motion: reduce) {
        .chevron {
          transition: none;
        }
      }
      @media (forced-colors: active) {
        button.trigger:focus-visible,
        .search-trigger:not(.disabled):focus-within,
        .search-field:not(.disabled):focus-within,
        ul.options.persistent:focus-visible,
        .chip-remove:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
        button.trigger:disabled,
        .search-trigger.disabled,
        .search-field.disabled,
        ul.options.persistent.disabled,
        .chip-remove:disabled,
        li[aria-disabled="true"] {
          color: GrayText;
          opacity: 1;
        }
        li.active,
        li:hover:not([aria-disabled="true"]) {
          color: HighlightText;
          background: Highlight;
        }
        li[aria-selected="true"] {
          color: Highlight;
        }
        li.active[aria-selected="true"],
        li[aria-selected="true"]:hover {
          color: HighlightText;
        }
        .chip {
          border-color: CanvasText;
        }
      }
    `,
  ];

  /** The full list of selectable options. */
  @property({ attribute: false }) options: MultiSelectOption[] = [];
  /**
   * The currently selected values. Programmatic assignments are deduplicated
   * while preserving order and never fire `change`.
   */
  @property({ attribute: false }) values: string[] = [];
  /** Form control name; each selected value submits under it. */
  @property() name = "";
  /** Accessible label applied to the trigger. */
  @property() label = "";
  /** Text shown on the trigger when nothing is selected. */
  @property() placeholder = "Select options";
  /** Disables the whole control, preventing the popover from opening. */
  @property({ type: Boolean }) disabled = false;
  /** Marks the control as required for native form validation. */
  @property({ type: Boolean }) required = false;
  /**
   * Enables editable, case-insensitive infix filtering by option label.
   * Typed text never becomes a selected value.
   */
  @property({ type: Boolean, reflect: true }) searchable = false;
  /** Maximum number of selectable values; `0` (default) means unlimited. */
  @property({ type: Number }) max = 0;
  /**
   * Presentation variant. `"dropdown"` (default) opens a popover listbox;
   * `"list"` renders a persistently visible, bordered list surface. Reflected
   * so consumers can style by `[variant="list"]`.
   */
  @property({ reflect: true }) variant: MultiSelectVariant = "dropdown";
  /**
   * Number of `2rem` rows the `list` variant's scroll viewport shows before it
   * scrolls, mirroring a native `<select size>`. Normalized to an integer of at
   * least `1` (default `5`); ignored by the `dropdown` variant.
   */
  @property({ type: Number, attribute: "visible-rows" }) visibleRows = 5;
  /**
   * When true, the selected values are also rendered as removable chips below
   * the trigger, each with an accessible `32px` remove control. Off by default:
   * the trigger already summarizes the selection, and values can be toggled off
   * in the listbox. Applies to both variants.
   */
  @property({ type: Boolean, attribute: "show-chips" }) showChips = false;

  @state() private _open = false;
  @state() private _activeIndex = -1;
  @state() private _query: string | null = null;
  @state() private _formDisabled = false;

  #internals = this.attachInternals();
  #defaultValues: string[] | null = null;
  #listboxPointerDown = false;
  #suppressNextBlur = false;
  #restoringSearchFocus = false;
  #searchSelection: [number | null, number | null] | null = null;
  #isComposing = false;
  #compositionJustEnded = false;
  #compositionEndTimer: ReturnType<typeof setTimeout> | null = null;
  #blurTimer: ReturnType<typeof setTimeout> | null = null;
  readonly #listboxId = `multi-select-listbox-${++instanceCount}`;

  /** Whether the host or an ancestor fieldset currently disables the control. */
  get #isDisabled(): boolean {
    return this.disabled || this._formDisabled;
  }

  /** `visibleRows` normalized to a whole number of rows, at least `1`. */
  get #rows(): number {
    const raw = this.visibleRows;
    if (!Number.isFinite(raw)) return 5;
    const floored = Math.floor(raw);
    return floored < 1 ? 1 : floored;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("mousedown", this.#onWindowMousedown, true);
    if (this.#blurTimer) clearTimeout(this.#blurTimer);
    if (this.#compositionEndTimer) clearTimeout(this.#compositionEndTimer);
    this.#blurTimer = null;
    this.#compositionEndTimer = null;
    this.#listboxPointerDown = false;
    this.#suppressNextBlur = false;
    this.#searchSelection = null;
    this.#isComposing = false;
    this.#compositionJustEnded = false;
    this.#close();
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (!this.hasUpdated && this.#defaultValues === null) {
      this.#defaultValues = this.#dedupe(this.values);
    }
    if (changed.has("values")) {
      const deduped = this.#dedupe(this.values);
      if (
        deduped.length !== this.values.length ||
        deduped.some((value, index) => value !== this.values[index])
      ) {
        this.values = deduped;
      }
    }
    if (
      (changed.has("disabled") || changed.has("searchable") || changed.has("variant")) &&
      (this.#isDisabled || changed.has("searchable") || changed.has("variant"))
    ) {
      this.#close();
    }
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has("_open")) {
      this.toggleAttribute("open", this._open);
      if (this._open) {
        window.addEventListener("mousedown", this.#onWindowMousedown, true);
      } else {
        window.removeEventListener("mousedown", this.#onWindowMousedown, true);
      }
    }
    if (changed.has("values") || changed.has("name")) this.#syncFormValue();
    if (
      changed.has("values") ||
      changed.has("required") ||
      changed.has("disabled") ||
      changed.has("_formDisabled")
    ) {
      this.#syncValidity();
    }
    if (
      (changed.has("_activeIndex") || changed.has("_query") || changed.has("options")) &&
      (this._open || this.variant === "list") &&
      this._activeIndex >= 0
    ) {
      this.renderRoot
        .querySelector<HTMLElement>(`#${this.#listboxId}-option-${this._activeIndex}`)
        ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }

  /** Restores the selection captured at first render, per the form contract. */
  formResetCallback(): void {
    this.values = this.#defaultValues ? [...this.#defaultValues] : [];
    this.#close();
  }

  /** Mirrors an ancestor fieldset's disabled state and closes the popover. */
  formDisabledCallback(disabled: boolean): void {
    this._formDisabled = disabled;
    if (disabled) this.#close();
  }

  /** Restores the selection from the saved form state on navigation/autofill. */
  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state !== "string") return;
    try {
      const parsed: unknown = JSON.parse(state);
      if (Array.isArray(parsed)) {
        this.values = parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      /* ignore malformed restore state */
    }
  }

  #syncFormValue(): void {
    const values = this.values;
    if (!this.name || values.length === 0) {
      this.#internals.setFormValue(null);
      return;
    }
    const data = new FormData();
    for (const value of values) data.append(this.name, value);
    this.#internals.setFormValue(data, JSON.stringify(values));
  }

  #syncValidity(): void {
    const anchor = this.#anchorElement();
    if (this.#isDisabled) {
      this.#internals.setValidity({});
      return;
    }
    if (this.required && this.values.length === 0) {
      this.#internals.setValidity(
        { valueMissing: true },
        "Please select at least one option.",
        anchor ?? undefined,
      );
    } else {
      this.#internals.setValidity({});
    }
  }

  #anchorElement(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>(
      "button.trigger, input.search-input, ul.persistent",
    );
  }

  #dedupe(values: readonly string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const value of values) {
      if (seen.has(value)) continue;
      seen.add(value);
      result.push(value);
    }
    return result;
  }

  /** First option matching `value`, so duplicate values resolve deterministically. */
  #optionByValue(value: string): MultiSelectOption | undefined {
    return this.options.find((option) => option.value === value);
  }

  #labelFor(value: string): string {
    return this.#optionByValue(value)?.label ?? value;
  }

  #summaryText(): string {
    if (this.values.length === 0) return this.placeholder;
    if (this.values.length === 1) return this.#labelFor(this.values[0]);
    return `${this.values.length} selected`;
  }

  #liveText(): string {
    if (this.values.length === 0) return "No options selected";
    if (this.values.length === 1) return `${this.#labelFor(this.values[0])} selected`;
    return `${this.values.length} options selected`;
  }

  #visibleOptions(): MultiSelectOption[] {
    if (!this.searchable || this._query === null) return this.options;
    const needle = this._query.trim().toLocaleLowerCase();
    if (!needle) return this.options;
    return this.options.filter((option) =>
      option.label.toLocaleLowerCase().includes(needle),
    );
  }

  /** Whether `value` is currently at the selection cap and cannot be added. */
  #atCap(value: string): boolean {
    return (
      this.max > 0 && this.values.length >= this.max && !this.values.includes(value)
    );
  }

  #isOptionDisabled(option: MultiSelectOption): boolean {
    return Boolean(option.disabled) || this.#atCap(option.value) || this.#isDisabled;
  }

  #toggleOption(option: MultiSelectOption): void {
    if (this.#isDisabled || option.disabled) return;
    if (this.values.includes(option.value)) {
      this.#commit(this.values.filter((value) => value !== option.value));
      return;
    }
    if (this.#atCap(option.value)) return;
    this.#commit([...this.values, option.value]);
  }

  #removeValue(value: string): void {
    if (this.#isDisabled) return;
    if (!this.values.includes(value)) return;
    this.#commit(this.values.filter((existing) => existing !== value));
  }

  #commit(next: string[]): void {
    this.values = this.#dedupe(next);
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { values: [...this.values] },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #onWindowMousedown = (e: MouseEvent): void => {
    if (!e.composedPath().includes(this)) this.#close();
  };

  #onFocusOut = (e: FocusEvent): void => {
    if (this.#listboxPointerDown || this.#suppressNextBlur) return;
    const next = e.relatedTarget;
    // Focus leaving to body/null (e.g. a pointer press on a non-focusable
    // element inside the component) is handled by the outside-mousedown
    // listener; only a genuine Tab-out to another element closes here.
    if (!(next instanceof Node)) return;
    if (this === next || this.renderRoot.contains(next)) return;
    this.#close();
  };

  #toggle(): void {
    if (this.#isDisabled) return;
    if (this._open) this.#close();
    else this.#open();
  }

  #open(): void {
    if (this.#isDisabled) return;
    this._query = null;
    this._open = true;
    this._activeIndex = this.#initialActiveIndex();
  }

  #close(): void {
    this._open = false;
    this._query = null;
    this._activeIndex = -1;
    this.#searchSelection = null;
  }

  #initialActiveIndex(): number {
    const options = this.#visibleOptions();
    if (options.length === 0) return -1;
    if (this._query !== null) return 0;
    const selectedIndex = options.findIndex((option) =>
      this.values.includes(option.value),
    );
    return selectedIndex >= 0 ? selectedIndex : 0;
  }

  #moveActive(delta: number): void {
    const options = this.#visibleOptions();
    if (options.length === 0) return;
    const n = options.length;
    this._activeIndex = (this._activeIndex + delta + n) % n;
  }

  #toggleActive(): void {
    const options = this.#visibleOptions();
    const option = options[this._activeIndex] ?? options[0];
    if (option) this.#toggleOption(option);
  }

  #onTriggerKeydown(e: KeyboardEvent): void {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!this._open) {
        this.#open();
        return;
      }
      if (e.key === "ArrowDown") this.#moveActive(1);
      else if (e.key === "ArrowUp") this.#moveActive(-1);
      else this.#toggleActive();
    } else if ((e.key === "Home" || e.key === "End") && this._open) {
      e.preventDefault();
      const options = this.#visibleOptions();
      this._activeIndex = e.key === "Home" ? 0 : options.length - 1;
    } else if (e.key === "Escape" && this._open) {
      e.preventDefault();
      this.#close();
    }
  }

  #onSearchFocus(e: FocusEvent): void {
    if (this.#isDisabled) return;
    if (this.#blurTimer) {
      clearTimeout(this.#blurTimer);
      this.#blurTimer = null;
    }
    if (!this._open) this.#open();
    if (!this.#restoringSearchFocus) (e.currentTarget as HTMLInputElement).select();
  }

  #onSearchClick(): void {
    if (!this._open) this.#open();
  }

  #onSearchMousedown(e: MouseEvent): void {
    if (e.button !== 0) e.preventDefault();
  }

  /** Seeds the active option when the persistent (non-searchable) list focuses. */
  #onListFocus(): void {
    if (this.#isDisabled || this.searchable) return;
    if (this._activeIndex < 0) this._activeIndex = this.#initialActiveIndex();
  }

  /** Keyboard navigation for the focusable, non-searchable persistent list. */
  #onListKeydown(e: KeyboardEvent): void {
    if (this.#isDisabled || this.searchable) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (this._activeIndex < 0) this._activeIndex = this.#initialActiveIndex();
      else this.#moveActive(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const options = this.#visibleOptions();
      this._activeIndex = e.key === "Home" ? 0 : options.length - 1;
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.#toggleActive();
    }
    // Escape intentionally does nothing: the list is never hidden.
  }

  /** Infix-filters the persistent list as the searchable-list query changes. */
  #onListSearchInput(e: InputEvent): void {
    this._query = (e.currentTarget as HTMLInputElement).value;
    const options = this.#visibleOptions();
    this._activeIndex = options.length > 0 ? 0 : -1;
  }

  /** Keyboard navigation for the search field above a searchable persistent list. */
  #onListSearchKeydown(e: KeyboardEvent): void {
    if (e.isComposing || e.keyCode === 229 || this.#isComposing || this.#compositionJustEnded) {
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      this.#moveActive(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const options = this.#visibleOptions();
      this._activeIndex = e.key === "Home" ? 0 : options.length - 1;
    } else if (e.key === "Enter") {
      e.preventDefault();
      this.#toggleActive();
    } else if (e.key === "Escape") {
      e.preventDefault();
      this._query = null;
      const options = this.#visibleOptions();
      this._activeIndex = options.length > 0 ? 0 : -1;
    } else if (
      e.key === "Backspace" &&
      (e.currentTarget as HTMLInputElement).value === "" &&
      this.values.length > 0
    ) {
      e.preventDefault();
      this.#removeValue(this.values[this.values.length - 1]);
    }
  }

  #onSearchInput(e: InputEvent): void {
    this._query = (e.currentTarget as HTMLInputElement).value;
    this._open = true;
    const options = this.#visibleOptions();
    this._activeIndex = options.length > 0 ? 0 : -1;
  }

  #onSearchKeydown(e: KeyboardEvent): void {
    if (e.isComposing || e.keyCode === 229 || this.#isComposing || this.#compositionJustEnded) {
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!this._open) {
        this.#open();
        return;
      }
      this.#moveActive(e.key === "ArrowDown" ? 1 : -1);
    } else if ((e.key === "Home" || e.key === "End") && this._open) {
      e.preventDefault();
      const options = this.#visibleOptions();
      this._activeIndex = e.key === "Home" ? 0 : options.length - 1;
    } else if (e.key === "Enter" && this._open) {
      e.preventDefault();
      this.#toggleActive();
    } else if (e.key === "Escape" && this._open) {
      e.preventDefault();
      this.#close();
    } else if (
      e.key === "Backspace" &&
      (e.currentTarget as HTMLInputElement).value === "" &&
      this.values.length > 0
    ) {
      e.preventDefault();
      this.#removeValue(this.values[this.values.length - 1]);
    }
  }

  #onSearchBlur(): void {
    if (this.#blurTimer) clearTimeout(this.#blurTimer);
    this.#blurTimer = setTimeout(() => {
      this.#blurTimer = null;
      if (!this._open) return;
      if (!this.#listboxPointerDown && !this.#suppressNextBlur) this.#close();
    });
  }

  #focusSearchInput(e: MouseEvent): void {
    if (
      e.button !== 0 ||
      this.#isDisabled ||
      e.composedPath()[0] instanceof HTMLInputElement
    ) {
      return;
    }
    e.preventDefault();
    const input = this.renderRoot.querySelector<HTMLInputElement>("input.search-input");
    if (!this._open) this.#open();
    input?.focus();
    input?.select();
  }

  #onCompositionStart(): void {
    if (this.#compositionEndTimer) clearTimeout(this.#compositionEndTimer);
    this.#compositionEndTimer = null;
    this.#compositionJustEnded = false;
    this.#isComposing = true;
  }

  #onCompositionEnd(): void {
    this.#isComposing = false;
    this.#compositionJustEnded = true;
    if (this.#compositionEndTimer) clearTimeout(this.#compositionEndTimer);
    this.#compositionEndTimer = setTimeout(() => {
      this.#compositionJustEnded = false;
      this.#compositionEndTimer = null;
    });
  }

  #onListboxMousedown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.#listboxPointerDown = true;
    this.#suppressNextBlur = true;
    const input = this.renderRoot.querySelector<HTMLInputElement>("input.search-input");
    this.#searchSelection = input ? [input.selectionStart, input.selectionEnd] : null;
    window.addEventListener(
      "mouseup",
      () => {
        this.#listboxPointerDown = false;
        if (this._open) {
          const searchInput =
            this.renderRoot.querySelector<HTMLInputElement>("input.search-input");
          if (searchInput) {
            this.#restoringSearchFocus = true;
            searchInput.focus({ preventScroll: true });
            this.#restoringSearchFocus = false;
            const [start, end] = this.#searchSelection ?? [null, null];
            if (start !== null && end !== null) searchInput.setSelectionRange(start, end);
          }
        }
        this.#searchSelection = null;
        setTimeout(() => {
          this.#suppressNextBlur = false;
        });
      },
      { capture: true, once: true },
    );
  }

  #onOptionMousedown(e: MouseEvent, option: MultiSelectOption): void {
    if (e.button !== 0) return;
    const optionElement = e.currentTarget as HTMLElement;
    const listbox = optionElement.parentElement;
    if (listbox) {
      const scrollbarWidth = listbox.offsetWidth - listbox.clientWidth;
      const bounds = listbox.getBoundingClientRect();
      const isRtl = getComputedStyle(listbox).direction === "rtl";
      const inScrollbarGutter = isRtl
        ? e.clientX <= bounds.left + scrollbarWidth
        : e.clientX >= bounds.right - scrollbarWidth;
      if (scrollbarWidth > 0 && inScrollbarGutter) return;
    }
    e.preventDefault();
    if (this.#isOptionDisabled(option)) return;
    this.#toggleOption(option);
    if (this.variant === "list" && !this.searchable && !this.#isDisabled) {
      this.renderRoot
        .querySelector<HTMLElement>("ul.persistent")
        ?.focus({ preventScroll: true });
    }
  }

  #optionIconSize(option: MultiSelectOption): number {
    const size = option.iconSize ?? 16;
    return Number.isFinite(size) && size > 0 ? size : 16;
  }

  #renderOptionIcon(option: MultiSelectOption) {
    if (!option.icon) return nothing;
    return html`
      <span
        class="option-icon"
        style=${`--multi-select-icon-size: ${this.#optionIconSize(option)}px`}
        aria-hidden="true"
      >
        ${option.icon}
      </span>
    `;
  }

  /** The shared `<li role="option">` items for both variants' listboxes. */
  private renderOptionItems(options: MultiSelectOption[]) {
    return html`
      ${options.map((option, index) => {
        const selected = this.values.includes(option.value);
        const disabled = this.#isOptionDisabled(option);
        return html`
          <li
            id=${`${this.#listboxId}-option-${index}`}
            role="option"
            aria-selected=${selected}
            aria-disabled=${disabled ? "true" : nothing}
            class=${index === this._activeIndex ? "active" : ""}
            @mousedown=${(e: MouseEvent) => this.#onOptionMousedown(e, option)}
          >
            <span class="check ${selected ? "" : "hidden"}" aria-hidden="true">
              ${iconCheckCircle(14)}
            </span>
            <span class="option-content">
              ${this.#renderOptionIcon(option)}
              <span class="option-label">${option.label}</span>
            </span>
          </li>
        `;
      })}
      ${options.length === 0
        ? html`<li class="no-options" role="presentation">
            <span role="status">No options found</span>
          </li>`
        : nothing}
    `;
  }

  private renderListbox() {
    if (!this._open) return nothing;
    const options = this.#visibleOptions();
    return html`
      <ul
        id=${this.#listboxId}
        class="options"
        role="listbox"
        aria-multiselectable="true"
        aria-label=${this.label ? `${this.label} options` : "Options"}
        @mousedown=${(e: MouseEvent) => this.#onListboxMousedown(e)}
      >
        ${this.renderOptionItems(options)}
      </ul>
    `;
  }

  private renderChips() {
    if (!this.showChips || this.values.length === 0) return nothing;
    return html`
      <div class="chips">
        ${this.values.map((value) => {
          const label = this.#labelFor(value);
          return html`
            <span class="chip">
              <span class="chip-label">${label}</span>
              <button
                type="button"
                class="chip-remove"
                aria-label=${`Remove ${label}`}
                ?disabled=${this.#isDisabled}
                @click=${() => this.#removeValue(value)}
              >
                ${iconX(18)}
              </button>
            </span>
          `;
        })}
      </div>
    `;
  }

  private renderSearchTrigger() {
    const activeDescendant =
      this._open && this._activeIndex >= 0
        ? `${this.#listboxId}-option-${this._activeIndex}`
        : nothing;
    return html`
      <div
        class="search-trigger ${this.#isDisabled ? "disabled" : ""}"
        @mousedown=${(e: MouseEvent) => this.#focusSearchInput(e)}
      >
        <input
          type="text"
          class="search-input"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded=${this._open}
          aria-controls=${this.#listboxId}
          aria-activedescendant=${activeDescendant}
          aria-label=${this.label || "Select options"}
          placeholder=${this.#summaryText()}
          autocomplete="off"
          ?disabled=${this.#isDisabled}
          .value=${this._query ?? ""}
          @mousedown=${(e: MouseEvent) => this.#onSearchMousedown(e)}
          @focus=${(e: FocusEvent) => this.#onSearchFocus(e)}
          @click=${() => this.#onSearchClick()}
          @input=${(e: InputEvent) => this.#onSearchInput(e)}
          @compositionstart=${() => this.#onCompositionStart()}
          @compositionend=${() => this.#onCompositionEnd()}
          @keydown=${(e: KeyboardEvent) => this.#onSearchKeydown(e)}
          @blur=${() => this.#onSearchBlur()}
        />
        <span class="chevron">${iconChevronRight(14)}</span>
      </div>
    `;
  }

  private renderButtonTrigger() {
    const activeDescendant =
      this._open && this._activeIndex >= 0
        ? `${this.#listboxId}-option-${this._activeIndex}`
        : nothing;
    const empty = this.values.length === 0;
    return html`
      <button
        type="button"
        class="trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded=${this._open}
        aria-controls=${this.#listboxId}
        aria-activedescendant=${activeDescendant}
        aria-label=${this.label || nothing}
        ?disabled=${this.#isDisabled}
        @click=${() => this.#toggle()}
        @keydown=${(e: KeyboardEvent) => this.#onTriggerKeydown(e)}
      >
        <span class="trigger-label ${empty ? "placeholder" : ""}">${this.#summaryText()}</span>
        <span class="chevron">${iconChevronRight(14)}</span>
      </button>
    `;
  }

  private renderListSearch() {
    const activeDescendant =
      this._activeIndex >= 0 ? `${this.#listboxId}-option-${this._activeIndex}` : nothing;
    return html`
      <div class="search-field ${this.#isDisabled ? "disabled" : ""}">
        <input
          type="text"
          class="search-input list-search"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded="true"
          aria-controls=${this.#listboxId}
          aria-activedescendant=${activeDescendant}
          aria-label=${this.label || "Select options"}
          placeholder=${this.#summaryText()}
          autocomplete="off"
          ?disabled=${this.#isDisabled}
          .value=${this._query ?? ""}
          @input=${(e: InputEvent) => this.#onListSearchInput(e)}
          @compositionstart=${() => this.#onCompositionStart()}
          @compositionend=${() => this.#onCompositionEnd()}
          @keydown=${(e: KeyboardEvent) => this.#onListSearchKeydown(e)}
        />
      </div>
    `;
  }

  private renderPersistentList() {
    const options = this.#visibleOptions();
    const focusable = !this.searchable && !this.#isDisabled;
    const activeDescendant =
      !this.searchable && this._activeIndex >= 0 && options.length > 0
        ? `${this.#listboxId}-option-${this._activeIndex}`
        : nothing;
    return html`
      <ul
        id=${this.#listboxId}
        class="options persistent ${this.#isDisabled ? "disabled" : ""}"
        role="listbox"
        aria-multiselectable="true"
        aria-label=${this.label ? `${this.label} options` : "Options"}
        aria-disabled=${this.#isDisabled ? "true" : nothing}
        tabindex=${focusable ? "0" : nothing}
        aria-activedescendant=${activeDescendant}
        style=${`height: calc(${this.#rows} * 2rem + 0.5rem + 2px)`}
        @mousedown=${(e: MouseEvent) => this.#onListboxMousedown(e)}
        @focus=${() => this.#onListFocus()}
        @keydown=${(e: KeyboardEvent) => this.#onListKeydown(e)}
      >
        ${this.renderOptionItems(options)}
      </ul>
    `;
  }

  private renderListVariant() {
    return html`
      <div class="control list-control">
        ${this.searchable ? this.renderListSearch() : nothing}
        ${this.renderPersistentList()}
      </div>
      ${this.renderChips()}
      <span class="sr-only" aria-live="polite">${this.#liveText()}</span>
    `;
  }

  override render() {
    if (this.variant === "list") return this.renderListVariant();
    return html`
      <div class="control" @focusout=${(e: FocusEvent) => this.#onFocusOut(e)}>
        ${this.searchable ? this.renderSearchTrigger() : this.renderButtonTrigger()}
        ${this.renderListbox()}
      </div>
      ${this.renderChips()}
      <span class="sr-only" aria-live="polite">${this.#liveText()}</span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "multi-select": MultiSelect;
  }
}
