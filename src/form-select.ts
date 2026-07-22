import {
  LitElement,
  css,
  html,
  nothing,
  type PropertyValues,
  type TemplateResult,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { iconChevronRight } from "./icons.js";
import { tokens } from "./tokens.js";

let instanceCount = 0;

/** A single selectable option. */
export interface SelectOption {
  value: string;
  label: string;
  /** Optional pre-rendered icon template displayed before the label. */
  icon?: TemplateResult;
  /** Square icon size in pixels. Defaults to 16 when `icon` is set. */
  iconSize?: number;
}

/**
 * A styled dropdown select: a trigger button showing the current option's
 * label, opening a listbox popover on click. Drop-in generic replacement for
 * a native `<select>` wherever consistent cross-browser styling and a
 * `change` event carrying `{ value }` are wanted (e.g. a task's status
 * picker).
 *
 * The trigger fills its host's width (`justify-content: space-between`
 * pushes the chevron to the far edge), but the host itself stays
 * `display: inline-block` — so usages that never size the host (a filter
 * bar, a status picker) keep shrink-to-fit auto-width unchanged. To make an
 * instance full-width, size the host itself: `form-select { width: 100%; }`.
 *
 * Set `searchable` to replace the button trigger with an editable combobox
 * that filters the predefined options by case-insensitive label infix. Typed
 * text is only a query: `value` changes exclusively when an actual option is
 * selected, and an uncommitted query is discarded when the list closes.
 * Each option may also provide a pre-rendered `icon` and square `iconSize`;
 * iconless options reserve no leading space.
 *
 * @element form-select
 * @fires change - Fired with `{ value: string }` when a different option is picked.
 */
@customElement("form-select")
export class FormSelect extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: inline-block;
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
      button.trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.25rem;
        width: 100%;
        box-sizing: border-box;
        font: inherit;
        color: var(--ui-text, #0f172a);
        background: var(--ui-surface, #ffffff);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.25rem 0.5rem;
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
      .search-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.25rem;
        width: 100%;
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
      .search-trigger.has-icon input.search-input {
        padding-left: 0;
      }
      input.search-input {
        min-width: 0;
        flex: 1;
        box-sizing: border-box;
        padding: 0.25rem 0 0.25rem 0.5rem;
        color: inherit;
        background: transparent;
        border: 0;
        outline: 0;
        font: inherit;
      }
      .chevron {
        display: flex;
        flex: 0 0 auto;
        margin-right: 0.5rem;
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
      li {
        padding: 0.5rem;
        cursor: pointer;
      }
      li.active,
      li:hover {
        background: var(--ui-surface-muted, #f8fafc);
      }
      li[aria-selected="true"] {
        font-weight: 600;
        color: var(--ui-primary, #4f46e5);
      }
      .option-content {
        display: inline-flex;
        min-width: 0;
        align-items: center;
        gap: 0.5rem;
      }
      li .option-content {
        display: flex;
        width: 100%;
      }
      .option-icon {
        display: inline-flex;
        width: var(--form-select-icon-size);
        height: var(--form-select-icon-size);
        flex: 0 0 var(--form-select-icon-size);
        align-items: center;
        justify-content: center;
      }
      .option-icon > svg {
        width: 100%;
        height: 100%;
      }
      .selected-icon {
        margin-left: 0.5rem;
      }
      .option-label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      li.no-options {
        padding: 0.5rem;
        color: var(--ui-text-muted, #64748b);
        cursor: default;
        font-style: italic;
      }
      @media (prefers-reduced-motion: reduce) {
        .chevron {
          transition: none;
        }
      }
      @media (forced-colors: active) {
        button.trigger:focus-visible,
        .search-trigger:not(.disabled):focus-within {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
        button.trigger:disabled,
        .search-trigger.disabled {
          color: GrayText;
          opacity: 1;
        }
        li.active,
        li:hover {
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
      }
    `,
  ];

  /** The full list of selectable options. */
  @property({ attribute: false }) options: SelectOption[] = [];
  /** Currently selected value; must match one of `options[].value`. */
  @property() value = "";
  /** `aria-label` applied to the trigger button. */
  @property() label = "";
  /** Disables the trigger, preventing the popover from opening. */
  @property({ type: Boolean }) disabled = false;
  /**
   * Enables editable, case-insensitive infix filtering by option label.
   * Typed text never becomes the selected `value`.
   */
  @property({ type: Boolean, reflect: true }) searchable = false;

  @state() private _open = false;
  @state() private _activeIndex = -1;
  @state() private _query: string | null = null;

  #listboxPointerDown = false;
  #suppressNextBlur = false;
  #restoringSearchFocus = false;
  #searchSelection: [number | null, number | null] | null = null;
  #isComposing = false;
  #compositionJustEnded = false;
  #compositionEndTimer: ReturnType<typeof setTimeout> | null = null;
  #blurTimer: ReturnType<typeof setTimeout> | null = null;
  readonly #listboxId = `form-select-listbox-${++instanceCount}`;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("mousedown", this.#onWindowMousedown, true);
    if (this.#blurTimer) clearTimeout(this.#blurTimer);
    if (this.#compositionEndTimer) clearTimeout(this.#compositionEndTimer);
    this.#listboxPointerDown = false;
    this.#suppressNextBlur = false;
    this.#searchSelection = null;
    this.#isComposing = false;
    this.#compositionJustEnded = false;
    this.#close();
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
    if ((changed.has("disabled") && this.disabled) || changed.has("searchable")) {
      this.#close();
      return;
    }
    if (changed.has("options") && this._open) {
      this._activeIndex = this.#initialActiveIndex();
    } else if (changed.has("value") && this._open && this._query === null) {
      this._activeIndex = this.#initialActiveIndex();
    }
    if (
      (changed.has("_activeIndex") || changed.has("_query") || changed.has("options")) &&
      this._open &&
      this._activeIndex >= 0
    ) {
      this.renderRoot
        .querySelector<HTMLElement>(`#${this.#listboxId}-option-${this._activeIndex}`)
        ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }

  #onWindowMousedown = (e: MouseEvent): void => {
    if (!e.composedPath().includes(this)) this.#close();
  };

  #toggle(): void {
    if (this.disabled) return;
    if (this._open) this.#close();
    else this.#open();
  }

  #open(): void {
    if (this.disabled) return;
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
    const selectedIndex = options.findIndex((option) => option.value === this.value);
    return selectedIndex >= 0 ? selectedIndex : 0;
  }

  #visibleOptions(): SelectOption[] {
    if (!this.searchable || this._query === null) return this.options;
    const needle = this._query.trim().toLocaleLowerCase();
    if (!needle) return this.options;
    return this.options.filter((option) =>
      option.label.toLocaleLowerCase().includes(needle),
    );
  }

  #select(option: SelectOption): void {
    this.#close();
    if (option.value === this.value) return;
    this.value = option.value;
    this.dispatchEvent(new CustomEvent("change", { detail: { value: option.value } }));
  }

  #onTriggerKeydown(e: KeyboardEvent): void {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!this._open) {
        this.#toggle();
        return;
      }
      if (e.key === "ArrowDown") this.#moveActive(1);
      else if (e.key === "ArrowUp") this.#moveActive(-1);
      else this.#confirmActive();
    } else if (e.key === "Escape" && this._open) {
      e.preventDefault();
      this.#close();
    }
  }

  #moveActive(delta: number): void {
    const options = this.#visibleOptions();
    if (options.length === 0) return;
    const n = options.length;
    this._activeIndex = (this._activeIndex + delta + n) % n;
  }

  #confirmActive(): void {
    const options = this.#visibleOptions();
    const option = options[this._activeIndex] ?? options[0];
    if (option) this.#select(option);
  }

  #onSearchFocus(e: FocusEvent): void {
    if (this.disabled) return;
    if (this.#blurTimer) {
      clearTimeout(this.#blurTimer);
      this.#blurTimer = null;
    }
    if (!this._open) this.#open();
    if (!this.#restoringSearchFocus) (e.currentTarget as HTMLInputElement).select();
  }

  #onSearchClick(e: MouseEvent): void {
    if (!this._open) this.#open();
    if (this._query === null) (e.currentTarget as HTMLInputElement).select();
  }

  #onSearchMousedown(e: MouseEvent): void {
    if (e.button !== 0) e.preventDefault();
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
    } else if (e.key === "Enter" && this._open) {
      e.preventDefault();
      this.#confirmActive();
    } else if (e.key === "Escape" && this._open) {
      e.preventDefault();
      this.#close();
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
      this.disabled ||
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
    this.#searchSelection = input
      ? [input.selectionStart, input.selectionEnd]
      : null;
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

  #onOptionMousedown(e: MouseEvent, option: SelectOption): void {
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
    this.#select(option);
  }

  #optionIconSize(option: SelectOption): number {
    const size = option.iconSize ?? 16;
    return Number.isFinite(size) && size > 0 ? size : 16;
  }

  #renderOptionIcon(option: SelectOption, className = "option-icon") {
    if (!option.icon) return nothing;
    return html`
      <span
        class=${className}
        style=${`--form-select-icon-size: ${this.#optionIconSize(option)}px`}
        aria-hidden="true"
      >
        ${option.icon}
      </span>
    `;
  }

  #renderOptionContent(option: SelectOption) {
    return html`
      <span class="option-content">
        ${this.#renderOptionIcon(option)}
        <span class="option-label">${option.label}</span>
      </span>
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
        aria-label=${this.label ? `${this.label} options` : "Options"}
        @mousedown=${(e: MouseEvent) => this.#onListboxMousedown(e)}
      >
        ${options.map(
          (o, i) => html`
            <li
              id=${`${this.#listboxId}-option-${i}`}
              role="option"
              aria-selected=${o.value === this.value}
              class=${i === this._activeIndex ? "active" : ""}
              @mousedown=${(e: MouseEvent) => this.#onOptionMousedown(e, o)}
            >
              ${this.#renderOptionContent(o)}
            </li>
          `,
        )}
        ${options.length === 0
          ? html`<li class="no-options" role="presentation"><span role="status">No options found</span></li>`
          : nothing}
      </ul>
    `;
  }

  private renderSearchTrigger(current: SelectOption | undefined) {
    const displayValue = this._query ?? current?.label ?? this.value;
    const showSelectedIcon = this._query === null && Boolean(current?.icon);
    const activeDescendant =
      this._open && this._activeIndex >= 0
        ? `${this.#listboxId}-option-${this._activeIndex}`
        : nothing;
    return html`
      <div
        class="search-trigger ${this.disabled ? "disabled" : ""} ${showSelectedIcon
          ? "has-icon"
          : ""}"
        @mousedown=${(e: MouseEvent) => this.#focusSearchInput(e)}
      >
        ${showSelectedIcon && current
          ? this.#renderOptionIcon(current, "option-icon selected-icon")
          : nothing}
        <input
          type="text"
          class="search-input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded=${this._open}
          aria-controls=${this.#listboxId}
          aria-activedescendant=${activeDescendant}
          aria-label=${this.label || "Select an option"}
          autocomplete="off"
          ?disabled=${this.disabled}
          .value=${displayValue}
          @mousedown=${(e: MouseEvent) => this.#onSearchMousedown(e)}
          @focus=${(e: FocusEvent) => this.#onSearchFocus(e)}
          @click=${(e: MouseEvent) => this.#onSearchClick(e)}
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

  private renderButtonTrigger(current: SelectOption | undefined) {
    const activeDescendant =
      this._open && this._activeIndex >= 0
        ? `${this.#listboxId}-option-${this._activeIndex}`
        : nothing;
    return html`
      <button
        type="button"
        class="trigger"
        aria-haspopup="listbox"
        aria-expanded=${this._open}
        aria-controls=${this.#listboxId}
        aria-activedescendant=${activeDescendant}
        aria-label=${this.label || nothing}
        ?disabled=${this.disabled}
        @click=${() => this.#toggle()}
        @keydown=${(e: KeyboardEvent) => this.#onTriggerKeydown(e)}
      >
        ${current
          ? this.#renderOptionContent(current)
          : html`<span class="option-label">${this.value}</span>`}
        <span class="chevron">${iconChevronRight(14)}</span>
      </button>
    `;
  }

  override render() {
    const current = this.options.find((o) => o.value === this.value);
    return html`
      ${this.searchable
        ? this.renderSearchTrigger(current)
        : this.renderButtonTrigger(current)}
      ${this.renderListbox()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "form-select": FormSelect;
  }
}
