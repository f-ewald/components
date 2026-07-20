import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { iconChevronRight } from "./icons.js";
import { tokens } from "./tokens.js";

/** A single menu action. */
export interface DropdownOption {
  value: string;
  label: string;
}

/**
 * A primary-styled button with a label and chevron that opens an anchored
 * menu of actions — essentially `form-select` minus "current value"
 * semantics: a menu, not a select. Use for a set of mutually exclusive
 * next-step actions (e.g. a failed task's Retry / Close / Backlog).
 *
 * @element dropdown-button
 * @fires select - Fired with `{ value: string }` when a menu item is picked.
 */
@customElement("dropdown-button")
export class DropdownButton extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: inline-block;
        position: relative;
        font-family: var(--ui-font, ui-sans-serif, system-ui, sans-serif);
      }
      button.trigger {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font: inherit;
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: 500;
        color: #fff;
        background: var(--ui-primary, #4f46e5);
        border: 1px solid transparent;
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.5rem 0.9rem;
        cursor: pointer;
      }
      button.trigger:hover:not(:disabled) {
        background: var(--ui-primary-hover, #4338ca);
      }
      button.trigger:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
      button.trigger:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .chevron {
        display: flex;
        transform: rotate(90deg);
        transition: transform 0.1s ease;
      }
      :host([open]) .chevron {
        transform: rotate(-90deg);
      }
      ul.options {
        position: absolute;
        top: 100%;
        right: 0;
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
        color: var(--ui-text, #0f172a);
      }
      li.active,
      li:hover {
        background: var(--ui-surface-muted, #f8fafc);
      }
    `,
  ];

  /** The trigger button's label. */
  @property() label = "";
  /** The menu's actions. */
  @property({ attribute: false }) options: DropdownOption[] = [];
  /** Disables the trigger, preventing the menu from opening. */
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
    if (this._open) this._activeIndex = 0;
  }

  #select(option: DropdownOption): void {
    this._open = false;
    this.dispatchEvent(new CustomEvent("select", { detail: { value: option.value } }));
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

  private renderMenu() {
    if (!this._open) return nothing;
    return html`
      <ul class="options" role="menu">
        ${this.options.map(
          (o, i) => html`
            <li
              role="menuitem"
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
    return html`
      <button
        type="button"
        class="trigger"
        aria-haspopup="menu"
        aria-expanded=${this._open}
        ?disabled=${this.disabled}
        @click=${() => this.#toggle()}
        @keydown=${(e: KeyboardEvent) => this.#onTriggerKeydown(e)}
      >
        <span>${this.label}</span>
        <span class="chevron">${iconChevronRight(14)}</span>
      </button>
      ${this.renderMenu()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dropdown-button": DropdownButton;
  }
}
