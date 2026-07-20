import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { iconChevronRight } from "./icons.js";
import { tokens } from "./tokens.js";

/** A single selectable option. */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * A styled dropdown select: a trigger button showing the current option's
 * label, opening a listbox popover on click. Drop-in generic replacement for
 * a native `<select>` wherever consistent cross-browser styling and a
 * `change` event carrying `{ value }` are wanted (e.g. a task's status
 * picker).
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
        font-family: var(--ui-font, ui-sans-serif, system-ui, sans-serif);
        font-size: var(--ui-font-size-sm, 0.75rem);
      }
      button.trigger {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font: inherit;
        color: var(--ui-text, #0f172a);
        background: var(--ui-surface, #fff);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.3rem 0.5rem;
        cursor: pointer;
      }
      button.trigger:hover {
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
      .chevron {
        display: flex;
        color: var(--ui-text-muted, #64748b);
        transform: rotate(90deg);
        transition: transform 0.1s ease;
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
        margin: 2px 0 0;
        padding: 4px 0;
        list-style: none;
        white-space: nowrap;
        background: var(--ui-surface, #fff);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        box-shadow: var(--ui-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
      }
      li {
        padding: 0.35rem 0.6rem;
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

  @state() private _open = false;
  @state() private _activeIndex = -1;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("mousedown", this.#onWindowMousedown, true);
  }

  protected override updated(changed: PropertyValues): void {
    if (!changed.has("_open")) return;
    this.toggleAttribute("open", this._open);
    if (this._open) {
      window.addEventListener("mousedown", this.#onWindowMousedown, true);
    } else {
      window.removeEventListener("mousedown", this.#onWindowMousedown, true);
    }
  }

  #onWindowMousedown = (e: MouseEvent): void => {
    if (!e.composedPath().includes(this)) this._open = false;
  };

  #toggle(): void {
    if (this.disabled) return;
    this._open = !this._open;
    if (this._open) {
      this._activeIndex = Math.max(
        0,
        this.options.findIndex((o) => o.value === this.value),
      );
    }
  }

  #select(option: SelectOption): void {
    this._open = false;
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
      this._open = false;
    }
  }

  #moveActive(delta: number): void {
    if (this.options.length === 0) return;
    const n = this.options.length;
    this._activeIndex = (this._activeIndex + delta + n) % n;
  }

  #confirmActive(): void {
    const option = this.options[this._activeIndex];
    if (option) this.#select(option);
  }

  private renderListbox() {
    if (!this._open) return nothing;
    return html`
      <ul class="options" role="listbox">
        ${this.options.map(
          (o, i) => html`
            <li
              role="option"
              aria-selected=${o.value === this.value}
              class=${i === this._activeIndex ? "active" : ""}
              @mousedown=${(e: MouseEvent) => {
                e.preventDefault();
                this.#select(o);
              }}
            >
              ${o.label}
            </li>
          `,
        )}
      </ul>
    `;
  }

  override render() {
    const current = this.options.find((o) => o.value === this.value);
    return html`
      <button
        type="button"
        class="trigger"
        aria-haspopup="listbox"
        aria-expanded=${this._open}
        aria-label=${this.label || nothing}
        ?disabled=${this.disabled}
        @click=${() => this.#toggle()}
        @keydown=${(e: KeyboardEvent) => this.#onTriggerKeydown(e)}
      >
        <span>${current?.label ?? this.value}</span>
        <span class="chevron">${iconChevronRight(14)}</span>
      </button>
      ${this.renderListbox()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "form-select": FormSelect;
  }
}
