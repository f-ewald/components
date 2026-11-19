import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { tokens } from "./tokens.js";

/** One column header: `key` is looked up via `renderCell`/`getCellValue`, `label` is the header text. */
export interface DataTableColumn {
  key: string;
  label: string;
  /** Pre-rendered decorative icon shown before the header text, e.g. `iconClock(14)`. */
  icon?: TemplateResult;
  /** Horizontal alignment of the header and its cells; `end` suits numbers. Defaults to `start`. */
  align?: DataTableAlign;
}

/** Horizontal alignment of a column's header and cells. */
export type DataTableAlign = "start" | "center" | "end";

/**
 * A generic, presentational table shell: renders a `<thead>` from `columns`
 * and one `<tr>` per entry in `rows`, with each cell's content produced by
 * `renderCell` (default: plain property lookup on the row object). Knows
 * nothing about what a "row" means — callers own the data shape entirely.
 *
 * Each column may add a decorative header `icon` and an `align` for its
 * header and cells (`end` right-aligns numbers, with tabular figures).
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
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th {
        text-align: start;
        font-weight: var(--ui-font-weight-semibold, 600);
        text-transform: var(--ui-label-transform, none);
        color: var(--ui-text-muted, #64748b);
        padding: 0.5rem 0.75rem;
        border-bottom: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
      }
      td {
        padding: 0.5rem 0.75rem;
        border-bottom: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        color: var(--ui-text, #0f172a);
      }
      .align-center {
        text-align: center;
      }
      .align-end {
        text-align: end;
        font-variant-numeric: tabular-nums;
      }
      .header {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }
      .header-icon {
        display: inline-flex;
        line-height: 0;
      }
      td:first-child {
        position: relative;
      }
      .row-link {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        white-space: nowrap;
      }
      tbody tr.clickable {
        cursor: pointer;
      }
      tbody tr.clickable:hover {
        background: var(--ui-surface-muted, #f8fafc);
      }
      tbody tr.clickable:has(.row-link:focus-visible) {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35)) inset;
      }
      @media (forced-colors: active) {
        tbody tr.clickable:has(.row-link:focus-visible) {
          outline: 2px solid CanvasText;
          outline-offset: -2px;
          box-shadow: none;
        }
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
  /** Accessible label for a row's keyboard link; defaults to primitive cell values. */
  @property({ attribute: false }) rowLabel: ((row: unknown) => string) | null = null;

  #onRowClick(row: unknown, e: MouseEvent): void {
    if (!this.rowHref) return;
    if (this.#isNestedInteractive(e.composedPath(), e.currentTarget)) return;
    const href = this.rowHref(row);
    if (href) location.hash = href;
  }

  #isNestedInteractive(path: EventTarget[], row: EventTarget | null): boolean {
    const selector =
      "a, button, input, select, textarea, summary, [contenteditable], [role='button'], [role='link'], [tabindex]";
    for (const target of path) {
      if (target === row) return false;
      if (target instanceof HTMLElement && target.matches(selector)) return true;
    }
    return false;
  }

  #alignClass(column: DataTableColumn): string {
    return column.align && column.align !== "start" ? `align-${column.align}` : "";
  }

  #rowLinkLabel(row: unknown): string {
    const explicitLabel = this.rowLabel?.(row).trim();
    if (explicitLabel) return explicitLabel;
    const values = this.columns
      .map((column) => (row as Record<string, unknown>)[column.key])
      .filter((value) => typeof value === "string" || typeof value === "number");
    return values.length > 0 ? `Open ${values.join(", ")}` : "Open row";
  }

  override render() {
    return html`
      <table>
        <thead>
          <tr>
            ${this.columns.map(
              (c) => html`<th class=${this.#alignClass(c)}>
                ${c.icon
                  ? html`<span class="header"
                      ><span class="header-icon" aria-hidden="true">${c.icon}</span>${c.label}</span
                    >`
                  : c.label}
              </th>`,
            )}
          </tr>
        </thead>
        <tbody>
          ${repeat(
            this.rows,
            (row, i) => this.rowKey(row, i),
            (row) => {
              const href = this.rowHref?.(row) ?? null;
              return html`
                <tr
                  class=${href ? "clickable" : ""}
                  @click=${(e: MouseEvent) => this.#onRowClick(row, e)}
                >
                  ${this.columns.map(
                    (c, columnIndex) => html`
                      <td class=${this.#alignClass(c)}>
                        ${href && columnIndex === 0
                          ? html`
                              <a
                                class="row-link"
                                href=${href}
                                aria-label=${this.#rowLinkLabel(row)}
                              ></a>
                            `
                          : nothing}
                        ${this.renderCell(row, c.key) ?? nothing}
                      </td>
                    `,
                  )}
                </tr>
              `;
            },
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
