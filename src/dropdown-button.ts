import { LitElement, css, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { iconChevronRight } from "./icons.js";
import { tokens } from "./tokens.js";

let instanceCount = 0;

/** A single menu action. */
export interface DropdownOption {
  value: string;
  label: string;
  /** Optional leading icon rendered ahead of the label in the menu item. */
  icon?: TemplateResult | null;
  /** Renders the item in the danger color, for a destructive action (e.g. Delete). */
  danger?: boolean;
}

/** How the trigger presents itself: label only, icon only, or icon + label. */
export type DropdownButtonVariant = "text" | "icon" | "text-icon";

/**
 * A button that opens an anchored menu of actions — essentially `form-select`
 * minus "current value" semantics: a menu, not a select. Use for a set of
 * mutually exclusive next-step actions (e.g. a failed task's Retry / Close /
 * Backlog, or a table row's overflow actions).
 *
 * Three trigger presentations share one base: `text` (the default — a
 * primary-filled button with a label and a rotating chevron), `text-icon`
 * (the same, with `icon` ahead of the label), and `icon` (a borderless,
 * square, low-emphasis icon target in the style of `icon-button` — the
 * classic "three-dot"/overflow menu, where `label` becomes the accessible
 * name rather than visible text). Set `size="sm"` for a compact trigger one
 * step below the default, matching `ui-button`'s `sm` size. Set `circular`
 * on the `icon` variant when the trigger wraps an inherently circular
 * element (e.g. an avatar) so the hover/focus highlight matches its shape
 * instead of the default rounded-square icon-button footprint.
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
      /* Shared trigger base — layout, type, shape, and interaction states every
         variant has in common. Variant blocks below only add fill/padding. */
      button.trigger {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        height: 2rem;
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
        border: 1px solid transparent;
        border-radius: var(--ui-radius-sm, 0.25rem);
        cursor: pointer;
      }
      button.trigger:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
      button.trigger:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      /* text + text-icon: the primary-filled trigger. Written as :not([variant="icon"])
         rather than two positive selectors so the default presentation is correct
         even before the reflected attribute lands. */
      :host(:not([variant="icon"])) button.trigger {
        color: var(--ui-on-accent, #ffffff);
        background: var(--ui-button-background, var(--ui-primary, #4f46e5));
        border-color: var(--ui-button-border, transparent);
        box-shadow: var(--ui-button-highlight, 0 0 0 0 transparent);
        text-shadow: var(--ui-button-text-shadow, none);
        padding: 0.5rem 1rem;
      }
      :host(:not([variant="icon"])) button.trigger:hover:not(:disabled) {
        background: var(--ui-button-background-hover, var(--ui-primary-hover, #4338ca));
      }
      :host(:not([variant="icon"])) button.trigger:active:not(:disabled) {
        background: var(--ui-button-background-active, var(--ui-button-background, var(--ui-primary, #4f46e5)));
        box-shadow: none;
      }
      :host(:not([variant="icon"])) button.trigger:focus-visible:not(:active) {
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35)), var(--ui-button-highlight, 0 0 0 0 transparent);
      }
      /* icon: borderless low-emphasis square target, matching icon-button. */
      :host([variant="icon"]) button.trigger {
        width: 2rem;
        padding: 0;
        color: var(--ui-text-muted, #64748b);
        background: none;
      }
      :host([variant="icon"]) button.trigger:hover:not(:disabled) {
        background: var(--ui-surface-muted, #f8fafc);
        color: var(--ui-text, #0f172a);
      }
      /* circular: for an icon-variant trigger wrapping a round element (e.g.
         an avatar) — overrides the default rounded-square footprint so the
         hover/focus highlight matches the wrapped element's own shape. */
      :host([variant="icon"][circular]) button.trigger {
        border-radius: 50%;
      }
      :host([size="sm"]) button.trigger {
        height: 1.5rem;
        font-size: var(--ui-font-size-xs, 0.6875rem);
      }
      :host(:not([variant="icon"])[size="sm"]) button.trigger {
        padding: 0.25rem 0.5rem;
      }
      :host([variant="icon"][size="sm"]) button.trigger {
        width: 1.5rem;
      }
      .icon {
        display: flex;
        line-height: 0;
      }
      .chevron {
        display: flex;
        transform: rotate(90deg);
        transition: transform 150ms ease;
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
        margin: 0.25rem 0 0;
        padding: 0.25rem 0;
        list-style: none;
        white-space: nowrap;
        background: var(--ui-surface, #ffffff);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        box-shadow: var(--ui-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
      }
      li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        color: var(--ui-text, #0f172a);
      }
      li .icon {
        color: var(--ui-text-muted, #64748b);
      }
      li.danger .icon {
        color: var(--ui-danger, #dc2626);
      }
      li.danger {
        color: var(--ui-danger, #dc2626);
      }
      li.active,
      li:hover {
        background: var(--ui-surface-muted, #f8fafc);
      }
      li.danger.active,
      li.danger:hover {
        color: var(--ui-danger-hover, #b91c1c);
      }
      @media (prefers-reduced-motion: reduce) {
        .chevron {
          transition: none;
        }
      }
      @media (forced-colors: active) {
        button.trigger:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
        button.trigger:disabled {
          color: GrayText;
          opacity: 1;
        }
        li.active,
        li:hover,
        li.danger.active,
        li.danger:hover {
          color: HighlightText;
          background: Highlight;
        }
      }
    `,
  ];

  /** The trigger button's label. In the `icon` variant it is the accessible name instead of visible text. */
  @property() label = "";
  /** The menu's actions. */
  @property({ attribute: false }) options: DropdownOption[] = [];
  /** Disables the trigger, preventing the menu from opening. */
  @property({ type: Boolean }) disabled = false;
  /** Trigger presentation: label only, icon only, or icon + label. */
  @property({ reflect: true }) variant: DropdownButtonVariant = "text";
  /** Icon template rendered by the `icon` and `text-icon` variants. */
  @property({ attribute: false }) icon: TemplateResult | null = null;
  /** Size — `sm` reduces the trigger's height/padding/font-size one step below the default. */
  @property({ reflect: true }) size: "sm" | "md" = "md";
  /** `icon` variant only: renders the trigger's highlight as a circle instead of a rounded square, to match a wrapped circular element (e.g. an avatar). */
  @property({ type: Boolean, reflect: true }) circular = false;

  @state() private _open = false;
  @state() private _activeIndex = -1;
  readonly #menuId = `dropdown-button-menu-${++instanceCount}`;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("mousedown", this.#onWindowMousedown, true);
    this._open = false;
    this._activeIndex = -1;
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has("disabled") && this.disabled) {
      this._open = false;
      this._activeIndex = -1;
    }
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
    if (this.disabled) return;
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
      <ul id=${this.#menuId} class="options" role="menu" aria-label=${this.label}>
        ${this.options.map(
          (o, i) => html`
            <li
              id=${`${this.#menuId}-item-${i}`}
              role="menuitem"
              class=${[i === this._activeIndex ? "active" : "", o.danger ? "danger" : ""]
                .filter(Boolean)
                .join(" ")}
              @mousedown=${(e: MouseEvent) => {
                if (e.button !== 0) return;
                e.preventDefault();
                this.#select(o);
              }}
            >
              ${o.icon ? html`<span class="icon" aria-hidden="true">${o.icon}</span>` : nothing}
              ${o.label}
            </li>
          `,
        )}
      </ul>
    `;
  }

  override render() {
    const activeDescendant =
      this._open && this._activeIndex >= 0
        ? `${this.#menuId}-item-${this._activeIndex}`
        : nothing;
    const iconOnly = this.variant === "icon";
    return html`
      <button
        type="button"
        class="trigger"
        aria-haspopup="menu"
        aria-expanded=${this._open}
        aria-controls=${this.#menuId}
        aria-activedescendant=${activeDescendant}
        aria-label=${iconOnly && this.label ? this.label : nothing}
        title=${iconOnly && this.label ? this.label : nothing}
        ?disabled=${this.disabled}
        @click=${() => this.#toggle()}
        @keydown=${(e: KeyboardEvent) => this.#onTriggerKeydown(e)}
      >
        ${this.variant !== "text" && this.icon
          ? html`<span class="icon" aria-hidden="true">${this.icon}</span>`
          : nothing}
        ${iconOnly ? nothing : html`<span>${this.label}</span>`}
        ${iconOnly
          ? nothing
          : html`<span class="chevron" aria-hidden="true">${iconChevronRight(14)}</span>`}
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
