import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { iconDocument } from "./icons.js";
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
 * Optional `fileIcon` prefixes each tile with a decorative Heroicons
 * "document" glyph, for grids whose items represent files — the icon never
 * carries its own accessible name since the rendered tile content (e.g. a
 * filename) already identifies the item. Off by default, so it consumes no
 * layout space or markup for grids of non-file items.
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
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(8.75rem, 1fr));
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
      .tile.clickable:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .tile-body {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
      }
      .tile-icon {
        display: inline-flex;
        flex-shrink: 0;
        margin-top: 0.125rem;
        color: var(--ui-text-muted, #64748b);
      }
      .tile-content {
        min-width: 0;
        flex: 1;
      }
      @media (forced-colors: active) {
        .tile.clickable:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
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
  /** Prefixes each tile with a decorative "document" icon, for grids of file-like items. Off by default. */
  @property({ type: Boolean, attribute: "file-icon" }) fileIcon = false;

  #onTileClick(item: unknown, e: MouseEvent): void {
    if (!this.itemHref) return;
    if (this.#isNestedInteractive(e.composedPath(), e.currentTarget)) return;
    const href = this.itemHref(item);
    if (href) location.hash = href;
  }

  #onTileKeydown(href: string, e: KeyboardEvent): void {
    if (e.key !== "Enter" || e.target !== e.currentTarget) return;
    e.preventDefault();
    location.hash = href;
  }

  #isNestedInteractive(path: EventTarget[], tile: EventTarget | null): boolean {
    const selector =
      "a, button, input, select, textarea, summary, [contenteditable], [role='button'], [role='link'], [tabindex]";
    for (const target of path) {
      if (target === tile) return false;
      if (target instanceof HTMLElement && target.matches(selector)) return true;
    }
    return false;
  }

  override render() {
    return html`
      <div class="grid">
        ${repeat(
          this.items,
          (item, i) => this.itemKey(item, i),
          (item) => {
            const href = this.itemHref?.(item) ?? null;
            return html`
              <div
                class=${href ? "tile clickable" : "tile"}
                role=${href ? "link" : nothing}
                tabindex=${href ? "0" : nothing}
                @click=${(e: MouseEvent) => this.#onTileClick(item, e)}
                @keydown=${href ? (e: KeyboardEvent) => this.#onTileKeydown(href, e) : nothing}
              >
                ${this.fileIcon
                  ? html`
                      <div class="tile-body">
                        <span class="tile-icon" aria-hidden="true">${iconDocument(16)}</span>
                        <div class="tile-content">${this.renderTile(item)}</div>
                      </div>
                    `
                  : this.renderTile(item)}
              </div>
            `;
          },
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
