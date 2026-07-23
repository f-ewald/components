import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * A single kanban column: a titled, vertically scrollable region that holds
 * its `kanban-card` children (its default `<slot>`), with a header showing the
 * column title and card count. Purely presentational and metadata-only —
 * `kanban-board` creates it, positions the cards inside it, and drives the
 * drop-target highlight via the reflected `dragover` attribute and the empty
 * hint via `empty`.
 *
 * @element kanban-column
 * @slot - The column's `kanban-card` elements, in display order.
 */
@customElement("kanban-column")
export class KanbanColumn extends LitElement {
  /** Column title shown in the header. */
  @property() heading = "";
  /** Number of cards in the column, shown as a count badge. */
  @property({ type: Number }) count = 0;
  /** Set by the board while a card is dragged over this column, for highlight. */
  @property({ type: Boolean, reflect: true }) dragover = false;
  /** Whether the column currently has no cards, so it renders an empty hint. */
  @property({ type: Boolean, reflect: true }) empty = false;

  static override styles = [
    tokens,
    css`
      :host {
        display: flex;
        flex-direction: column;
        flex: 0 0 18rem;
        min-height: 0;
        max-height: 100%;
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
      .column {
        display: flex;
        flex-direction: column;
        min-height: 0;
        max-height: 100%;
        background: var(--ui-surface-muted, #f8fafc);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius, 0.5rem);
        transition: border-color 150ms ease;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.75rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
        flex: 0 0 auto;
      }
      .heading {
        font-size: var(--ui-font-size, 0.875rem);
        font-weight: var(--ui-font-weight-semibold, 600);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text, #0f172a);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.25rem;
        height: 1.25rem;
        padding: 0 0.25rem;
        box-sizing: border-box;
        background: var(--ui-surface, #ffffff);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 999px;
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: var(--ui-line-height-glyph, 1);
        color: var(--ui-text-muted, #64748b);
        flex: 0 0 auto;
      }
      .cards {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem;
        overflow-y: auto;
        flex: 1 1 auto;
        min-height: 3rem;
      }
      .empty {
        margin: 0;
        padding: 0.75rem;
        text-align: center;
        font-size: var(--ui-font-size-sm, 0.75rem);
        color: var(--ui-text-muted, #64748b);
        border: 1px dashed var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
      }
      :host([dragover]) .column {
        border-color: var(--ui-primary, #4f46e5);
      }
      :host([dragover]) .cards {
        background: color-mix(in srgb, var(--ui-primary, #4f46e5) 6%, transparent);
      }
      @media (forced-colors: active) {
        :host([dragover]) .column {
          outline: 2px solid Highlight;
          outline-offset: -2px;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .column {
          transition: none;
        }
      }
    `,
  ];

  override render() {
    return html`
      <section class="column" aria-label=${this.heading}>
        <header class="header">
          <span class="heading">${this.heading}</span>
          <span class="count" aria-hidden="true">${this.count}</span>
        </header>
        <div class="cards">
          <slot></slot>
          ${this.empty ? html`<p class="empty">No cards</p>` : nothing}
        </div>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kanban-column": KanbanColumn;
  }
}
