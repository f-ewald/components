import { LitElement, css, html, nothing } from "lit";
import { customElement, property, queryAssignedElements, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { tokens } from "./tokens.js";
import { TabItem } from "./tab-item.js";

let instanceCount = 0;

/** Fired when the active tab changes in response to user interaction. */
export interface TabChangeDetail {
  /** The newly active `tab-item`'s `value` (falling back to its `label`). */
  value: string;
  /** Index of the newly active `tab-item` among its siblings. */
  index: number;
}

/**
 * WAI-ARIA tabs pattern (automatic activation, roving tabindex) driving a
 * strip of declarative `tab-item` children. `tab-bar` renders the `role="tab"`
 * button strip itself, reading `label`/`value`/`selected` off each slotted
 * `tab-item`; each `tab-item` owns its own visibility via its reflected
 * `selected` attribute.
 *
 * The active tab's underline uses `--ui-primary`; a `--ui-border` line spans
 * the full strip beneath every tab, standing in for the inactive state since
 * this design system has no dedicated secondary accent color.
 *
 * @element tab-bar
 * @slot - `tab-item` elements.
 * @fires change - The active tab changed via click or keyboard; detail: `TabChangeDetail`.
 */
@customElement("tab-bar")
export class TabBar extends LitElement {
  /** Accessible name for the tablist (e.g. "Editor mode"). */
  @property() label = "";

  @queryAssignedElements({ selector: "tab-item" })
  private readonly _tabItems!: TabItem[];

  @state() private _version = 0;
  private readonly _uid = `tab-bar-${++instanceCount}`;
  private _observer?: MutationObserver;

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .tablist {
        display: flex;
        gap: 1rem;
        border-bottom: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
      }
      .tab {
        appearance: none;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
        min-height: 2rem;
        padding: 0.5rem 0.25rem;
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
        color: var(--ui-text-muted, #64748b);
        cursor: pointer;
      }
      .tab:hover {
        color: var(--ui-text, #0f172a);
      }
      .tab[aria-selected="true"] {
        color: var(--ui-text, #0f172a);
        font-weight: var(--ui-font-weight-semibold, 600);
        border-bottom-color: var(--ui-primary, #4f46e5);
      }
      .tab:focus-visible {
        outline: none;
        border-radius: var(--ui-radius-sm, 0.25rem);
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .panels {
        margin-top: 1rem;
      }
      @media (forced-colors: active) {
        .tab[aria-selected="true"] {
          border-bottom-color: Highlight;
        }
        .tab:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    this._observer ??= new MutationObserver(() => {
      this._version++;
      this._ensureSelection();
    });
    this._observer.observe(this, {
      attributes: true,
      attributeFilter: ["label", "value", "selected"],
      childList: true,
      subtree: true,
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
    this._observer = undefined;
  }

  protected override updated(): void {
    this._tabItems.forEach((item, index) => {
      item.setAttribute("aria-labelledby", this._tabButtonId(index));
    });
  }

  private _handleSlotChange(): void {
    this._version++;
    this._ensureSelection();
  }

  /** Defaults the first tab-item to selected if none was marked so by the consumer. */
  private _ensureSelection(): void {
    const items = this._tabItems;
    if (items.length > 0 && !items.some((item) => item.selected)) {
      items[0].selected = true;
    }
  }

  private _currentIndex(): number {
    const index = this._tabItems.findIndex((item) => item.selected);
    return index === -1 ? 0 : index;
  }

  private _tabButtonId(index: number): string {
    return `${this._uid}-tab-${index}`;
  }

  private _select(index: number, options?: { focus?: boolean }): void {
    const items = this._tabItems;
    const target = items[index];
    if (!target) return;
    const changed = !target.selected;
    for (const item of items) item.selected = item === target;
    this._version++;
    if (options?.focus) this._focusButton(index);
    if (changed) {
      this.dispatchEvent(
        new CustomEvent<TabChangeDetail>("change", {
          detail: { value: target.value || target.label, index },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private _focusButton(index: number): void {
    void this.updateComplete.then(() => {
      this.shadowRoot?.querySelectorAll<HTMLButtonElement>(".tab")[index]?.focus();
    });
  }

  /** Arrow/Home/End roving-tabindex navigation with automatic activation. */
  private _onKeydown(event: KeyboardEvent): void {
    const items = this._tabItems;
    if (items.length === 0) return;
    const current = this._currentIndex();
    let next: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (current + 1) % items.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (current - 1 + items.length) % items.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = items.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this._select(next, { focus: true });
  }

  override render() {
    const items = this._tabItems ?? [];
    const current = this._currentIndex();
    return html`
      <div
        class="tablist"
        role="tablist"
        aria-label=${this.label || nothing}
        @keydown=${this._onKeydown}
      >
        ${repeat(
          items,
          (item) => item,
          (item, index) => html`
            <button
              type="button"
              class="tab"
              role="tab"
              id=${this._tabButtonId(index)}
              aria-selected=${item.selected ? "true" : "false"}
              aria-controls=${item.id}
              tabindex=${index === current ? 0 : -1}
              @click=${() => this._select(index)}
            >
              ${item.label}
            </button>
          `,
        )}
      </div>
      <div class="panels"><slot @slotchange=${this._handleSlotChange}></slot></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tab-bar": TabBar;
  }
}
