import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { tokens } from "./tokens.js";

/**
 * A generic, presentational grid shell: renders one bordered card per entry
 * in `items`, with each tile's content produced by `renderTile` (default:
 * stringify). Knows nothing about what an "item" means — callers own the
 * data shape entirely. Modeled directly on `data-table`'s headless pattern.
 *
 * Optional `itemHref` makes whole tiles clickable (navigating via
 * `location.hash`), without hijacking clicks on nested interactive elements
 * (links/buttons) a tile's rendered content might contain.
 *
 * @element tile-grid
 */
@customElement("tile-grid")
export class TileGrid extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        font-family: var(--ui-font, ui-sans-serif, system-ui, sans-serif);
        font-size: var(--ui-font-size-sm, 0.75rem);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 0.75rem;
      }
      .tile {
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius, 0.5rem);
        padding: 0.75rem;
        color: var(--ui-text, #0f172a);
      }
      .tile.clickable {
        cursor: pointer;
      }
      .tile.clickable:hover {
        background: var(--ui-surface-muted, #f8fafc);
      }
    `,
  ];

  /** Tile data; opaque to this component beyond what `renderTile` does with it. */
  @property({ attribute: false }) items: unknown[] = [];
  /** Stable identity for `items[i]`, used as the repeat-directive key. Defaults to the item's index. */
  @property({ attribute: false }) itemKey: (item: unknown, index: number) => string | number = (
    _item,
    index,
  ) => index;
  /** Produces a tile's rendered content for `item`. Default: stringify. */
  @property({ attribute: false }) renderTile: (item: unknown) => unknown = (item) => String(item);
  /** When set, clicking a tile (outside any nested link/button) navigates to this hash. */
  @property({ attribute: false }) itemHref: ((item: unknown) => string | null) | null = null;

  #onTileClick(item: unknown, e: MouseEvent): void {
    if (!this.itemHref) return;
    if ((e.target as HTMLElement).closest("a, button")) return;
    const href = this.itemHref(item);
    if (href) location.hash = href;
  }

  override render() {
    return html`
      <div class="grid">
        ${repeat(
          this.items,
          (item, i) => this.itemKey(item, i),
          (item) => html`
            <div
              class=${this.itemHref ? "tile clickable" : "tile"}
              @click=${(e: MouseEvent) => this.#onTileClick(item, e)}
            >
              ${this.renderTile(item)}
            </div>
          `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tile-grid": TileGrid;
  }
}
