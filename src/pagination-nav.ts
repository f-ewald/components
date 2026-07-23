import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconChevronLeft, iconChevronRight } from "./icons.js";
import { tokens } from "./tokens.js";

/** Fired when the user requests a different page. `detail.page` is the 1-based target page. */
export interface PageChangeDetail {
  page: number;
}

/**
 * Minimal, controlled pager for list/table views: a previous/next control pair
 * around a "Page N of M" status. It owns no data — the consumer sets
 * `current-page` / `total-pages` and moves the page in response to the
 * `page-change` event (typically alongside its own data fetch), exactly like
 * `data-table` leaves the row data to the caller.
 *
 * Previous is disabled on the first page and next on the last; neither fires an
 * event when there is nowhere to go.
 *
 * @element pagination-nav
 * @fires page-change - The user picked a new page (`detail: { page }`).
 */
@customElement("pagination-nav")
export class PaginationNav extends LitElement {
  /** The 1-based current page. */
  @property({ type: Number, attribute: "current-page" }) currentPage = 1;
  /** The total number of pages (minimum 1). */
  @property({ type: Number, attribute: "total-pages" }) totalPages = 1;

  static override styles = [
    tokens,
    css`
      :host {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
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
      }
      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        padding: 0;
        background: none;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        color: var(--ui-text, #0f172a);
        cursor: pointer;
      }
      button:hover:not(:disabled) {
        background: var(--ui-surface-muted, #f8fafc);
        border-color: var(--ui-text-muted, #64748b);
      }
      button:disabled {
        opacity: 0.5;
        cursor: default;
      }
      button:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .status {
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text-muted, #64748b);
        min-width: 6rem;
        text-align: center;
      }
      @media (forced-colors: active) {
        button:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
        button:disabled {
          color: GrayText;
          border-color: GrayText;
          opacity: 1;
        }
      }
    `,
  ];

  /** Clamps `page` to the valid range and fires `page-change` when it actually moves. */
  private _go(page: number): void {
    const total = Math.max(1, Math.floor(this.totalPages));
    const target = Math.min(total, Math.max(1, Math.floor(page)));
    if (target === this.currentPage) return;
    this.dispatchEvent(
      new CustomEvent<PageChangeDetail>("page-change", {
        detail: { page: target },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    const total = Math.max(1, Math.floor(this.totalPages));
    const current = Math.min(total, Math.max(1, Math.floor(this.currentPage)));
    return html`
      <button
        type="button"
        aria-label="Previous page"
        ?disabled=${current <= 1}
        @click=${() => this._go(current - 1)}
      >
        ${iconChevronLeft(18)}
      </button>
      <span class="status" aria-live="polite">Page ${current} of ${total}</span>
      <button
        type="button"
        aria-label="Next page"
        ?disabled=${current >= total}
        @click=${() => this._go(current + 1)}
      >
        ${iconChevronRight(18)}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "pagination-nav": PaginationNav;
  }
}
