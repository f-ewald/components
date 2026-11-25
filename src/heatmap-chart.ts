import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { max, min } from "d3-array";
import { tokens } from "./tokens.js";
import {
  ChartFormatter,
  defaultTrueBoolean,
  needsLightText,
  rampCssGradient,
  sampleColorRamp,
  type HeatmapColorScheme,
} from "./utils/chart.js";

export type { HeatmapColorScheme } from "./utils/chart.js";

/** One cell in a `heatmap-chart` row. */
export interface HeatmapCell {
  /** Numeric value encoded by color; `null` renders as a missing-data cell. */
  value: number | null;
  /** Optional explicit text inside the cell, overriding `valueFormat`. */
  label?: string;
  /** Optional suffix appended to the formatted value (e.g. `"*"`). */
  marker?: string;
  /** Optional detail shown in the tooltip for this cell. */
  note?: string;
}

/** One row in a `heatmap-chart`. */
export interface HeatmapRow {
  /** Optional stable identifier returned in events. Defaults to `label`. */
  id?: string;
  /** Row heading shown in the sticky first column. */
  label: string;
  /** Optional secondary metadata shown beside the row label (e.g. sample count). */
  meta?: string | number;
  /** Cell values aligned with `columns`; a plain number or `null` is shorthand for `{ value }`. */
  cells: (number | null | HeatmapCell)[];
}

/** One column descriptor in `heatmap-chart`, or a plain string label. */
export type HeatmapColumn = string | { id?: string; label: string };

interface NormalizedColumn {
  id: string;
  label: string;
}

interface HoveredCell {
  row: number;
  col: number;
  x: number;
  y: number;
}

const TOOLTIP_W = 240;

function normalizeCell(raw: number | null | HeatmapCell | undefined): HeatmapCell {
  if (raw === undefined || raw === null) return { value: null };
  if (typeof raw === "number") return { value: Number.isFinite(raw) ? raw : null };
  return { ...raw, value: raw.value !== null && Number.isFinite(raw.value) ? raw.value : null };
}

function normalizeColumn(col: HeatmapColumn): NormalizedColumn {
  if (typeof col === "string") return { id: col, label: col };
  return { id: col.id ?? col.label, label: col.label };
}

/**
 * Interactive row × column matrix chart encoding cell values along a sequential
 * or diverging color ramp, with a gradient legend, missing-data cells,
 * contrast-checked value labels, sticky row headings, selectable columns/cells,
 * floating tooltips, and arrow-key grid navigation.
 *
 * @element heatmap-chart
 * @fires heatmap-cell-select - User clicked or activated a cell. `detail: { row, col, rowId, columnId, rowLabel, columnLabel, value, cell }`.
 * @fires heatmap-column-select - User clicked a column header. `detail: { col, columnId, columnLabel }`.
 */
@customElement("heatmap-chart")
export class HeatmapChart extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        width: 100%;
        color: var(--ui-text, #0f172a);
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
      .shell {
        position: relative;
      }
      .legend {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
        color: var(--ui-text-muted, #64748b);
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-variant-numeric: tabular-nums;
      }
      .legend-ramp {
        display: inline-flex;
        flex-direction: column;
        gap: 0.125rem;
      }
      .ramp-bar {
        width: 12rem;
        height: 0.5rem;
        border-radius: var(--ui-radius-sm, 0.25rem);
        border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        box-sizing: border-box;
      }
      .ramp-ticks {
        display: flex;
        justify-content: space-between;
        line-height: var(--ui-line-height-glyph, 1);
      }
      .legend-missing {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }
      .missing-swatch {
        width: 0.75rem;
        height: 0.75rem;
        border-radius: var(--ui-radius-sm, 0.25rem);
        border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        background: var(--ui-surface-muted, #f8fafc);
        box-sizing: border-box;
      }
      .scroll {
        max-height: var(--heatmap-chart-max-height, none);
        overflow: auto;
        border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius, 0.5rem);
        background: var(--ui-surface, #ffffff);
      }
      .scroll:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-variant-numeric: tabular-nums;
      }
      thead tr.axis-row th {
        position: static;
        padding: 0.25rem 0.5rem 0;
        border-bottom: none;
        background: var(--ui-surface, #ffffff);
        color: var(--ui-text-muted, #64748b);
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-medium, 500);
        text-transform: var(--ui-label-transform, none);
        letter-spacing: var(--ui-tracking-wide, 0.04em);
        text-align: center;
      }
      thead th {
        position: sticky;
        top: 0;
        z-index: 2;
        padding: 0.25rem;
        border-bottom: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        background: var(--ui-surface, #ffffff);
        color: var(--ui-text-muted, #64748b);
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-medium, 500);
        text-align: center;
        white-space: nowrap;
      }
      thead th.row-head,
      thead th.meta-head {
        padding: 0.25rem 0.5rem;
        text-transform: var(--ui-label-transform, none);
        letter-spacing: var(--ui-tracking-wide, 0.04em);
      }
      thead th.row-head {
        left: 0;
        z-index: 4;
        text-align: left;
      }
      thead th.meta-head {
        text-align: right;
      }
      .col-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 100%;
        min-height: 2rem;
        padding: 0.25rem 0.25rem;
        border: none;
        border-radius: var(--ui-radius-sm, 0.25rem);
        background: transparent;
        color: inherit;
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
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-medium, 500);
        font-variant-numeric: tabular-nums;
        cursor: pointer;
        transition: background-color 150ms ease, color 150ms ease;
      }
      .col-btn:hover {
        background: var(--ui-surface-muted, #f8fafc);
        color: var(--ui-text, #0f172a);
      }
      .col-btn:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .col-btn.selected,
      .col-label.selected {
        color: var(--ui-primary, #4f46e5);
        font-weight: var(--ui-font-weight-bold, 700);
      }
      .col-label {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 100%;
        min-height: 2rem;
        padding: 0.25rem 0.25rem;
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-medium, 500);
        font-variant-numeric: tabular-nums;
      }
      tbody th.row-label {
        position: sticky;
        left: 0;
        z-index: 1;
        max-width: 18rem;
        padding: 0.25rem 0.5rem;
        border-bottom: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        background: var(--ui-surface, #ffffff);
        color: var(--ui-text, #0f172a);
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-regular, 400);
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      tbody td.meta {
        padding: 0.25rem 0.5rem;
        border-bottom: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        background: var(--ui-surface, #ffffff);
        color: var(--ui-text-muted, #64748b);
        font-size: var(--ui-font-size-xs, 0.6875rem);
        text-align: right;
        white-space: nowrap;
      }
      tbody td.cell {
        padding: 0.125rem;
        border-bottom: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        background: var(--ui-surface, #ffffff);
      }
      tbody tr:last-child th,
      tbody tr:last-child td {
        border-bottom: none;
      }
      tbody td.cell.col-selected {
        box-shadow:
          inset 2px 0 0 var(--ui-primary, #4f46e5),
          inset -2px 0 0 var(--ui-primary, #4f46e5);
      }
      tbody tr:first-child td.cell.col-selected {
        box-shadow:
          inset 2px 0 0 var(--ui-primary, #4f46e5),
          inset -2px 0 0 var(--ui-primary, #4f46e5),
          inset 0 2px 0 var(--ui-primary, #4f46e5);
      }
      tbody tr:last-child td.cell.col-selected {
        box-shadow:
          inset 2px 0 0 var(--ui-primary, #4f46e5),
          inset -2px 0 0 var(--ui-primary, #4f46e5),
          inset 0 -2px 0 var(--ui-primary, #4f46e5);
      }
      tbody tr:first-child:last-child td.cell.col-selected {
        box-shadow: inset 0 0 0 2px var(--ui-primary, #4f46e5);
      }
      .cell-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 100%;
        padding: 0 0.25rem;
        border: none;
        border-radius: var(--ui-radius-sm, 0.25rem);
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
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: var(--ui-line-height-glyph, 1);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        cursor: pointer;
        transition: filter 120ms ease;
      }
      .cell-btn:hover {
        filter: brightness(0.95);
      }
      .cell-btn.static {
        cursor: default;
      }
      .cell-btn.static:hover {
        filter: none;
      }
      .cell-btn:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .cell-btn.cell-selected {
        box-shadow: inset 0 0 0 2px var(--ui-primary, #4f46e5);
      }
      .cell-btn.missing {
        background: var(--ui-surface-muted, #f8fafc);
        color: var(--ui-text-muted, #64748b);
        font-weight: var(--ui-font-weight-regular, 400);
      }
      .tooltip {
        position: absolute;
        z-index: 10;
        box-sizing: border-box;
        width: 15rem;
        padding: 0.5rem 0.75rem;
        border-radius: var(--ui-radius-sm, 0.25rem);
        background: var(--ui-tooltip, #0f172a);
        color: var(--ui-tooltip-text, #ffffff);
        font-size: var(--ui-font-size-xs, 0.6875rem);
        line-height: var(--ui-line-height-normal, 1.5);
        font-variant-numeric: var(--ui-numeric, normal);
        pointer-events: none;
      }
      .tooltip-title {
        font-weight: var(--ui-font-weight-semibold, 600);
        word-break: break-word;
      }
      .tooltip-value {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .tooltip-note {
        margin-top: 0.25rem;
        opacity: 0.8;
      }
      .message {
        padding: 1.5rem 0;
        text-align: center;
        color: var(--ui-text-muted, #64748b);
        font-size: var(--ui-font-size-sm, 0.75rem);
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      @media (forced-colors: active) {
        .scroll:focus-visible,
        .col-btn:focus-visible,
        .cell-btn:focus-visible {
          outline: 2px solid CanvasText;
        }
        .tooltip {
          border: 1px solid CanvasText;
        }
        .ramp-bar,
        .missing-swatch,
        .cell-btn:not(.missing) {
          forced-color-adjust: none;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .col-btn,
        .cell-btn {
          transition: none;
        }
      }
    `,
  ];

  /** Column definitions or labels across the top of the matrix. */
  @property({ attribute: false }) columns: HeatmapColumn[] = [];
  /** Rows of cells; each row's `cells` aligns index-for-index with `columns`. */
  @property({ attribute: false }) rows: HeatmapRow[] = [];
  /** Optional column-axis header drawn above the column labels. */
  @property({ attribute: "x-label" }) xLabel = "";
  /** Optional heading for the row-label column. */
  @property({ attribute: "row-label" }) rowLabel = "";
  /** Optional heading for the secondary `meta` column (shown when any row has `meta`). */
  @property({ attribute: "meta-label" }) metaLabel = "";
  /** Built-in sequential or diverging color ramp. */
  @property({ attribute: "color-scheme" }) colorScheme: HeatmapColorScheme = "heat";
  /** Optional custom color function `(value, normalized01) => cssColor`, overriding `color-scheme`. */
  @property({ attribute: false }) colorScale: ((value: number, t: number) => string) | null = null;
  /** Fixed `[min, max]` value domain for color mapping; `null` computes it from the data. */
  @property({ attribute: false }) domain: [number, number] | null = null;
  /** Renders formatted values inside cells. */
  @property({ type: Boolean, reflect: true, attribute: "show-values" }) showValues = true;
  /** Renders the gradient color legend above the matrix. */
  @property({ type: Boolean, reflect: true, attribute: "show-legend" }) showLegend = true;
  /** Label shown for missing (`null`) cells and in the legend. */
  @property({ attribute: "missing-label" }) missingLabel = "No data";
  /** Highlighted column by zero-based index, column `id`, or column `label`. */
  @property({ attribute: "selected-column" }) selectedColumn: number | string | null = null;
  /** Optional highlighted cell coordinates `{ row, col }`. */
  @property({ attribute: false }) selectedCell: { row: number; col: number } | null = null;
  /** Minimum width of each data column in CSS pixels. */
  @property({ type: Number, attribute: "cell-width" }) cellWidth = 56;
  /** Height of each cell button in CSS pixels. */
  @property({ type: Number, attribute: "cell-height" }) cellHeight = 28;
  /** Visible or accessible table caption. */
  @property() caption = "";
  /** BCP 47 locale for default number formatting. */
  @property() locale = "en-US";
  /** Custom value formatter for cells, legend ticks, and tooltips. */
  @property({ attribute: false }) valueFormat: ((value: number) => string) | null = null;
  /** Enables clicking cells and column headers (default `true`; accepts `interactive="false"`). */
  @property({ type: Boolean, converter: defaultTrueBoolean }) interactive = true;
  /** Shows floating cell tooltips on hover and focus (default `true`; accepts `tooltip="false"`). */
  @property({ type: Boolean, converter: defaultTrueBoolean }) tooltip = true;

  @state() private _hovered: HoveredCell | null = null;

  private _formatter = new ChartFormatter();

  override updated(changed: Map<string, unknown>) {
    if (changed.has("tooltip") && !this.tooltip) this._hovered = null;
  }

  private _format(value: number): string {
    return this.valueFormat ? this.valueFormat(value) : this._formatter.number(value, this.locale);
  }

  private _computeDomain(cells: HeatmapCell[][]): [number, number] {
    if (this.domain && this.domain.every(Number.isFinite) && this.domain[0] !== this.domain[1]) {
      return [Math.min(...this.domain), Math.max(...this.domain)];
    }
    const vals = cells.flatMap((row) => row.map((c) => c.value).filter((v): v is number => v !== null));
    if (vals.length === 0) return [0, 1];
    const lo = min(vals)!;
    const hi = max(vals)!;
    if (this.colorScheme === "diverging") {
      const bound = Math.max(Math.abs(lo), Math.abs(hi), 1e-9);
      return [-bound, bound];
    }
    const low = lo < 0 ? lo : 0;
    return [low, hi > low ? hi : low + 1];
  }

  private _selectedColIndex(cols: NormalizedColumn[]): number {
    if (this.selectedColumn === null || this.selectedColumn === "") return -1;
    if (typeof this.selectedColumn === "number") return this.selectedColumn;
    const asNum = Number(this.selectedColumn);
    if (Number.isInteger(asNum) && asNum >= 0 && asNum < cols.length && String(asNum) === this.selectedColumn.trim()) {
      return asNum;
    }
    return cols.findIndex((c) => c.id === this.selectedColumn || c.label === this.selectedColumn);
  }

  private _colorFor(value: number, domain: [number, number]): string {
    const t = Math.max(0, Math.min(1, (value - domain[0]) / (domain[1] - domain[0])));
    return this.colorScale ? this.colorScale(value, t) : sampleColorRamp(this.colorScheme, t);
  }

  private _selectColumn(col: number, column: NormalizedColumn) {
    if (!this.interactive) return;
    this.dispatchEvent(
      new CustomEvent("heatmap-column-select", {
        detail: { col, columnId: column.id, columnLabel: column.label },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _selectCell(row: number, col: number, rowObj: HeatmapRow, column: NormalizedColumn, cell: HeatmapCell) {
    if (!this.interactive) return;
    this.dispatchEvent(
      new CustomEvent("heatmap-cell-select", {
        detail: {
          row,
          col,
          rowId: rowObj.id ?? rowObj.label,
          columnId: column.id,
          rowLabel: rowObj.label,
          columnLabel: column.label,
          value: cell.value,
          cell,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _hoverCell(row: number, col: number, target: HTMLElement) {
    if (!this.tooltip) return;
    const shell = this.shadowRoot?.querySelector<HTMLElement>(".shell");
    if (!shell) return;
    const hostRect = shell.getBoundingClientRect();
    const cellRect = target.getBoundingClientRect();
    const x = cellRect.left - hostRect.left + cellRect.width / 2;
    const y = cellRect.top - hostRect.top;
    this._hovered = { row, col, x, y };
  }

  private _onCellKeyDown(event: KeyboardEvent, row: number, col: number, rowCount: number, colCount: number) {
    let nextRow = row;
    let nextCol = col;
    if (event.key === "ArrowRight") nextCol = Math.min(col + 1, colCount - 1);
    else if (event.key === "ArrowLeft") nextCol = Math.max(col - 1, 0);
    else if (event.key === "ArrowDown") nextRow = Math.min(row + 1, rowCount - 1);
    else if (event.key === "ArrowUp") nextRow = Math.max(row - 1, 0);
    else if (event.key === "Home") nextCol = 0;
    else if (event.key === "End") nextCol = colCount - 1;
    else if (event.key === "Escape") {
      this._hovered = null;
      return;
    } else {
      return;
    }
    if (nextRow === row && nextCol === col) return;
    event.preventDefault();
    const target = this.shadowRoot?.querySelector<HTMLElement>(
      `.cell-btn[data-row="${nextRow}"][data-col="${nextCol}"]`,
    );
    target?.focus();
  }

  private _renderLegend(domain: [number, number], hasMissing: boolean) {
    if (!this.showLegend) return nothing;
    const mid = (domain[0] + domain[1]) / 2;
    const gradient = this.colorScale
      ? `linear-gradient(90deg, ${Array.from({ length: 11 }, (_, i) => {
          const t = i / 10;
          return `${this.colorScale!(domain[0] + (domain[1] - domain[0]) * t, t)} ${i * 10}%`;
        }).join(", ")})`
      : rampCssGradient(this.colorScheme);
    return html`
      <div class="legend" aria-hidden="true">
        <div class="legend-ramp">
          <div class="ramp-bar" style="background: ${gradient}"></div>
          <div class="ramp-ticks">
            <span>${this._format(domain[0])}</span>
            <span>${this._format(mid)}</span>
            <span>${this._format(domain[1])}</span>
          </div>
        </div>
        ${hasMissing
          ? html`<span class="legend-missing">
              <span class="missing-swatch"></span>
              <span>${this.missingLabel}</span>
            </span>`
          : nothing}
      </div>
    `;
  }

  private _renderTooltip(cols: NormalizedColumn[], matrix: HeatmapCell[][]) {
    if (!this.tooltip || !this._hovered) return nothing;
    const { row, col, x, y } = this._hovered;
    const rowObj = this.rows[row];
    const colObj = cols[col];
    const cell = matrix[row]?.[col];
    if (!rowObj || !colObj || !cell) return nothing;
    const shellW = this.shadowRoot?.querySelector<HTMLElement>(".shell")?.clientWidth ?? 400;
    const left = Math.max(0, Math.min(x - TOOLTIP_W / 2, shellW - TOOLTIP_W));
    const top = y > 92 ? y - 8 : y + Math.max(this.cellHeight, 24) + 12;
    const transform = y > 92 ? "translateY(-100%)" : "none";
    const valueText =
      cell.value === null
        ? this.missingLabel
        : `${cell.label ?? this._format(cell.value)}${cell.marker ?? ""}`;
    return html`
      <div class="tooltip" style="left: ${left}px; top: ${top}px; transform: ${transform}" aria-hidden="true">
        <div class="tooltip-title">${rowObj.label}</div>
        <div class="tooltip-value">
          <span>${colObj.label}</span>
          <span>${valueText}</span>
        </div>
        ${rowObj.meta !== undefined
          ? html`<div class="tooltip-note">${this.metaLabel ? `${this.metaLabel}: ` : ""}${rowObj.meta}</div>`
          : nothing}
        ${cell.note ? html`<div class="tooltip-note">${cell.note}</div>` : nothing}
      </div>
    `;
  }

  override render() {
    const cols = this.columns.map(normalizeColumn);
    if (cols.length === 0 || this.rows.length === 0) {
      return html`<p class="message">No data</p>`;
    }
    const matrix = this.rows.map((r) => cols.map((_, j) => normalizeCell(r.cells[j])));
    const domain = this._computeDomain(matrix);
    const hasMissing = matrix.some((row) => row.some((c) => c.value === null));
    const hasMeta = this.rows.some((r) => r.meta !== undefined);
    const selectedCol = this._selectedColIndex(cols);
    const cellW = Math.max(this.cellWidth, 32);
    const cellH = Math.max(this.cellHeight, 24);
    const caption = this.caption || `Heatmap: ${this.rows.length} rows by ${cols.length} columns`;

    return html`
      <div class="shell" @pointerleave=${() => (this._hovered = null)}>
        ${this._renderLegend(domain, hasMissing)}
        <div class="scroll" role="region" tabindex="0" aria-labelledby="heatmap-caption">
          <table>
            <caption id="heatmap-caption" class=${this.caption ? "" : "sr-only"}>${caption}</caption>
            <thead>
              ${this.xLabel
                ? html`<tr class="axis-row">
                    <th colspan=${hasMeta ? 2 : 1}></th>
                    <th colspan=${cols.length}>${this.xLabel}</th>
                  </tr>`
                : nothing}
              <tr>
                <th scope="col" class="row-head">${this.rowLabel}</th>
                ${hasMeta ? html`<th scope="col" class="meta-head">${this.metaLabel}</th>` : nothing}
                ${cols.map(
                  (col, j) => html`<th scope="col" style="min-width: ${cellW}px">
                    ${this.interactive
                      ? html`<button
                          type="button"
                          class="col-btn ${j === selectedCol ? "selected" : ""}"
                          data-col=${j}
                          aria-pressed=${j === selectedCol ? "true" : "false"}
                          @click=${() => this._selectColumn(j, col)}
                        >
                          ${col.label}
                        </button>`
                      : html`<span class="col-label ${j === selectedCol ? "selected" : ""}" data-col=${j}>
                          ${col.label}
                        </span>`}
                  </th>`,
                )}
              </tr>
            </thead>
            <tbody>
              ${this.rows.map((rowObj, i) => html`
                <tr>
                  <th scope="row" class="row-label" title=${rowObj.label}>${rowObj.label}</th>
                  ${hasMeta ? html`<td class="meta">${rowObj.meta ?? ""}</td>` : nothing}
                  ${cols.map((col, j) => {
                    const cell = matrix[i][j];
                    const isMissing = cell.value === null;
                    const bg = isMissing ? "" : this._colorFor(cell.value!, domain);
                    const fg = isMissing ? "" : needsLightText(bg) ? "#ffffff" : "#0f172a";
                    const text = isMissing
                      ? this.missingLabel
                      : `${cell.label ?? this._format(cell.value!)}${cell.marker ?? ""}`;
                    const cellSelected = this.selectedCell?.row === i && this.selectedCell?.col === j;
                    const aria = `${rowObj.label}, ${col.label}: ${text}`;
                    return html`<td class="cell ${j === selectedCol ? "col-selected" : ""}">
                      ${this.interactive
                        ? html`<button
                            type="button"
                            class="cell-btn ${isMissing ? "missing" : ""} ${cellSelected ? "cell-selected" : ""}"
                            data-row=${i}
                            data-col=${j}
                            aria-label=${aria}
                            aria-pressed=${cellSelected ? "true" : "false"}
                            style="height: ${cellH}px; ${isMissing ? "" : `background: ${bg}; color: ${fg};`}"
                            @click=${() => this._selectCell(i, j, rowObj, col, cell)}
                            @pointerenter=${(e: PointerEvent) => this._hoverCell(i, j, e.currentTarget as HTMLElement)}
                            @focus=${(e: FocusEvent) => this._hoverCell(i, j, e.currentTarget as HTMLElement)}
                            @blur=${() => (this._hovered = null)}
                            @keydown=${(e: KeyboardEvent) => this._onCellKeyDown(e, i, j, this.rows.length, cols.length)}
                          >
                            ${this.showValues ? text : nothing}
                          </button>`
                        : html`<div
                            class="cell-btn static ${isMissing ? "missing" : ""} ${cellSelected ? "cell-selected" : ""}"
                            data-row=${i}
                            data-col=${j}
                            tabindex=${this.tooltip ? "0" : nothing}
                            aria-label=${this.tooltip ? aria : nothing}
                            style="height: ${cellH}px; ${isMissing ? "" : `background: ${bg}; color: ${fg};`}"
                            @pointerenter=${(e: PointerEvent) => this._hoverCell(i, j, e.currentTarget as HTMLElement)}
                            @focus=${(e: FocusEvent) => this._hoverCell(i, j, e.currentTarget as HTMLElement)}
                            @blur=${() => (this._hovered = null)}
                            @keydown=${(e: KeyboardEvent) =>
                              this.tooltip ? this._onCellKeyDown(e, i, j, this.rows.length, cols.length) : undefined}
                          >
                            ${this.showValues ? text : nothing}
                          </div>`}
                    </td>`;
                  })}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${this._renderTooltip(cols, matrix)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "heatmap-chart": HeatmapChart;
  }
}
