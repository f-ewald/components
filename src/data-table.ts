import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { tokens } from "./tokens.js";

/** One column header: `key` is looked up via `renderCell`/`getCellValue`, `label` is the header text. */
export interface DataTableColumn {
  key: string;
  label: string;
}

/**
 * A generic, presentational table shell: renders a `<thead>` from `columns`
 * and one `<tr>` per entry in `rows`, with each cell's content produced by
 * `renderCell` (default: plain property lookup on the row object). Knows
 * nothing about what a "row" means — callers own the data shape entirely.
 *
 * Optional `rowHref` makes whole rows clickable (navigating via `location.hash`),
 * without hijacking clicks on nested interactive elements (links/buttons) a
 * cell's rendered content might contain.
 *
 * @element data-table
 */
@customElement("data-table")
export class DataTable extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        font-family: var(--ui-font, ui-sans-serif, system-ui, sans-serif);
        font-size: var(--ui-font-size-sm, 0.75rem);
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th {
        text-align: left;
        font-weight: 600;
        color: var(--ui-text-muted, #64748b);
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
      }
      td {
        padding: 0.6rem 0.75rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
        color: var(--ui-text, #0f172a);
      }
      tbody tr.clickable {
        cursor: pointer;
      }
      tbody tr.clickable:hover {
        background: var(--ui-surface-muted, #f8fafc);
      }
    `,
  ];

  /** Column headers, in display order. */
  @property({ attribute: false }) columns: DataTableColumn[] = [];
  /** Row data; opaque to this component beyond what `renderCell` does with it. */
  @property({ attribute: false }) rows: unknown[] = [];
  /** Stable identity for `rows[i]`, used as the repeat-directive key. Defaults to the row's index. */
  @property({ attribute: false }) rowKey: (row: unknown, index: number) => string | number = (
    _row,
    index,
  ) => index;
  /** Produces a cell's rendered content for `row`/`column.key`. Default: `row[key]`. */
  @property({ attribute: false }) renderCell: (row: unknown, key: string) => unknown = (
    row,
    key,
  ) => (row as Record<string, unknown>)[key];
  /** When set, clicking a row (outside any nested link/button) navigates to this hash. */
  @property({ attribute: false }) rowHref: ((row: unknown) => string | null) | null = null;

  #onRowClick(row: unknown, e: MouseEvent): void {
    if (!this.rowHref) return;
    if ((e.target as HTMLElement).closest("a, button")) return;
    const href = this.rowHref(row);
    if (href) location.hash = href;
  }

  override render() {
    return html`
      <table>
        <thead>
          <tr>
            ${this.columns.map((c) => html`<th>${c.label}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${repeat(
            this.rows,
            (row, i) => this.rowKey(row, i),
            (row) => html`
              <tr
                class=${this.rowHref ? "clickable" : ""}
                @click=${(e: MouseEvent) => this.#onRowClick(row, e)}
              >
                ${this.columns.map((c) => html`<td>${this.renderCell(row, c.key) ?? nothing}</td>`)}
              </tr>
            `,
          )}
        </tbody>
      </table>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "data-table": DataTable;
  }
}
