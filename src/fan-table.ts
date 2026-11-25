import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { max } from "d3-array";
import { tokens } from "./tokens.js";
import {
  FanFormatter,
  bandNames,
  prepareSeries,
  toTime,
  valueAt,
  visibleIds,
  type FanChartEvent,
  type FanChartGoal,
  type FanChartSeries,
  type FanValue,
  type PreparedSeries,
} from "./utils/fan-data.js";

/** Which dates become rows: the last date of each year or month, or every date. */
export type FanTableInterval = "year" | "month" | "all";

interface TableRow {
  t: number;
  label: string;
  events: string[];
  cells: (FanValue | null)[];
}

/** Date formats from coarsest to finest; duplicate row labels step to a finer one. */
const LABEL_FORMATS: Intl.DateTimeFormatOptions[] = [
  { year: "numeric" },
  { month: "short", year: "numeric" },
  { day: "numeric", month: "short", year: "numeric" },
];

const INTERVAL_KEY: Record<FanTableInterval, (t: number) => number> = {
  year: (t) => new Date(t).getFullYear(),
  month: (t) => new Date(t).getFullYear() * 12 + new Date(t).getMonth(),
  all: (t) => t,
};

/** Keeps the latest time per interval bucket, ascending. */
function sampleTimes(times: number[], interval: FanTableInterval): number[] {
  const latest = new Map<number, number>();
  for (const t of times) {
    const key = INTERVAL_KEY[interval](t);
    latest.set(key, Math.max(latest.get(key) ?? -Infinity, t));
  }
  return [...latest.values()].sort((a, b) => a - b);
}

/**
 * Tabular companion to `fan-chart`: the same `series`, `percentiles`, `goal`,
 * and `events`, shown as one row per date and one column per series. Rows are
 * grouped into observed and projected sections around the "today" date
 * (`now`, defaulting to the latest observed date). Observed cells show the
 * value; projected cells show the median, the outer percentile range (e.g.
 * P10–P90) beneath it, and — when the projection provides `goalProbability`
 * and a `goal` is set — the share of runs reaching the goal. Events are named
 * under the date of the row they fall in.
 *
 * `interval` picks the rows: the last date of each year (default) or month, or
 * every date. Values use whole `currency` units in `locale` (en-US, USD), or
 * compact ones with `compact`; `valueFormat` overrides both. Pair it with a
 * chart by forwarding `fan-chart`'s `series-visibility-change` detail to
 * `visible`.
 *
 * The header and date column stay pinned while the table scrolls; cap its
 * height with `--fan-table-max-height` (default none).
 *
 * @element fan-table
 */
@customElement("fan-table")
export class FanTable extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
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
      .scroll {
        max-height: var(--fan-table-max-height, none);
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
      caption {
        padding: 0.5rem 0.75rem;
        font-size: var(--ui-font-size, 0.875rem);
        font-weight: var(--ui-font-weight-semibold, 600);
        text-align: left;
      }
      th,
      td {
        padding: 0.5rem 0.75rem;
        border-bottom: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        background: var(--ui-surface, #ffffff);
        font-weight: var(--ui-font-weight-regular, 400);
        line-height: var(--ui-line-height-tight, 1.25);
        text-align: right;
        vertical-align: top;
        white-space: nowrap;
      }
      thead th {
        position: sticky;
        top: 0;
        z-index: 2;
        background: var(--ui-surface-muted, #f8fafc);
        font-weight: var(--ui-font-weight-semibold, 600);
        vertical-align: bottom;
      }
      th[scope="row"],
      thead th:first-child {
        position: sticky;
        left: 0;
        text-align: left;
      }
      th[scope="row"] {
        z-index: 1;
        font-weight: var(--ui-font-weight-medium, 500);
      }
      thead th:first-child {
        z-index: 3;
      }
      .group th {
        background: var(--ui-surface-muted, #f8fafc);
        color: var(--ui-text-muted, #64748b);
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-semibold, 600);
        letter-spacing: var(--ui-tracking-wide, 0.04em);
        text-align: left;
        text-transform: var(--ui-label-transform, none);
      }
      tbody tr:not(.group):hover > * {
        background: var(--ui-surface-muted, #f8fafc);
      }
      tbody:last-child tr:last-child > * {
        border-bottom: none;
      }
      .col-head {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      .swatch {
        flex: none;
        width: 0.5rem;
        height: 0.5rem;
        border-radius: var(--ui-radius-circle, 50%);
        background: currentColor;
      }
      .value,
      .sub {
        display: block;
      }
      .median {
        font-weight: var(--ui-font-weight-semibold, 600);
      }
      .sub {
        margin-top: 0.125rem;
        color: var(--ui-text-muted, #64748b);
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-regular, 400);
      }
      .col-sub {
        text-transform: var(--ui-label-transform, none);
      }
      .empty {
        color: var(--ui-text-muted, #64748b);
      }
      .message {
        margin: 0;
        padding: 1rem;
        color: var(--ui-text-muted, #64748b);
        text-align: center;
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
        .scroll:focus-visible {
          outline: 2px solid CanvasText;
        }
        .swatch {
          forced-color-adjust: none;
        }
      }
    `,
  ];

  /** Series to show, in `fan-chart`'s format. Assign a new array (or bind `.series` from Lit state) to redraw. */
  @property({ attribute: false }) series: FanChartSeries[] = [];
  /** Percentiles (0–100) that each projection point's `values` are aligned to; the outermost pair is shown. */
  @property({ attribute: false }) percentiles: number[] = [10, 25, 50, 75, 90];
  /** Optional goal; projected cells show the share of runs reaching it when the data provides `goalProbability`. */
  @property({ attribute: false }) goal: FanChartGoal | null = null;
  /** Optional labelled dates, named under the row they fall in. */
  @property({ attribute: false }) events: FanChartEvent[] = [];
  /** IDs of the series to show as columns; `null` (default) shows all. */
  @property({ attribute: false }) visible: string[] | null = null;
  /** Date splitting observed from projected rows, as an ISO date. Defaults to the latest observed date. */
  @property() now: string | null = null;
  /** Rows: the last date of each year (default) or month, or every date. */
  @property() interval: FanTableInterval = "year";
  /** BCP 47 locale for numbers and dates. */
  @property() locale = "en-US";
  /** ISO 4217 currency code for the default value format. */
  @property() currency = "USD";
  /** Compact values (`$1.2M`) instead of whole units (`$1,234,567`). */
  @property({ type: Boolean, reflect: true }) compact = false;
  /** Formats values. Defaults to `currency` in `locale`, whole or `compact`. */
  @property({ attribute: false }) valueFormat: ((value: number) => string) | null = null;
  /** Visible table caption; when empty, a visually hidden "Forecast" caption names the table. */
  @property() caption = "";
  /** Header of the date column. */
  @property({ attribute: "date-label" }) dateLabel = "Date";
  /** Heading of the observed row group. */
  @property({ attribute: "observed-label" }) observedLabel = "Observed";
  /** Heading of the projected row group. */
  @property({ attribute: "projected-label" }) projectedLabel = "Projected";

  private _formatter = new FanFormatter();

  private _format(value: number): string {
    return this.valueFormat ? this.valueFormat(value) : this._formatter.money(value, this.locale, this.currency, this.compact);
  }

  /** Labels each row at the interval's precision, refining any labels that would otherwise repeat. */
  private _labels(times: number[]): string[] {
    const levels = times.map(() => (this.interval === "year" ? 0 : 1));
    const label = (i: number) => this._formatter.date(times[i], this.locale, LABEL_FORMATS[levels[i]]);
    for (let pass = 0; pass < LABEL_FORMATS.length; pass++) {
      const labels = times.map((_, i) => label(i));
      const counts = new Map<string, number>();
      for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
      let refined = false;
      labels.forEach((l, i) => {
        if (counts.get(l)! > 1 && levels[i] < LABEL_FORMATS.length - 1) {
          levels[i] += 1;
          refined = true;
        }
      });
      if (!refined) break;
    }
    return times.map((_, i) => label(i));
  }

  private _rows(all: PreparedSeries[], columns: PreparedSeries[]): { observed: TableRow[]; projected: TableRow[] } {
    const nowT = this.now ? toTime(this.now) : (max(all.flatMap((s) => s.actual.map((p) => p.t))) ?? Number.NaN);
    const times = [...new Set(columns.flatMap((s) => [...s.actual.map((p) => p.t), ...s.projection.map((p) => p.t)]))];
    const isObserved = (t: number) => Number.isFinite(nowT) && t <= nowT;
    const picked = [
      ...sampleTimes(times.filter(isObserved), this.interval),
      ...sampleTimes(times.filter((t) => !isObserved(t)), this.interval),
    ];
    const labels = this._labels(picked);
    const events = this.events
      .map((e) => ({ t: toTime(e.date), label: e.label }))
      .filter((e) => Number.isFinite(e.t));
    const rows = picked.map((t, i): TableRow => ({
      t,
      label: labels[i],
      events: events.filter((e) => e.t <= t && (i === 0 || e.t > picked[i - 1])).map((e) => e.label),
      cells: columns.map((s) => valueAt(s, t, this.goal !== null)),
    }));
    return { observed: rows.filter((r) => isObserved(r.t)), projected: rows.filter((r) => !isObserved(r.t)) };
  }

  private _renderCell(cell: FanValue | null) {
    if (!cell) return html`<td class="empty">—</td>`;
    if (cell.observed) return html`<td><span class="value">${this._format(cell.value)}</span></td>`;
    const outer = cell.bands[0];
    const goal = this.goal;
    return html`<td>
      <span class="value median">${this._format(cell.value)}</span>
      ${outer ? html`<span class="sub">${this._format(outer[0])} – ${this._format(outer[1])}</span>` : nothing}
      ${cell.goal !== null && goal
        ? html`<span class="sub">${Math.round(cell.goal * 100)}% ≥ ${this._formatter.money(goal.value, this.locale, this.currency, true)}</span>`
        : nothing}
    </td>`;
  }

  private _renderGroup(label: string, rows: TableRow[], span: number) {
    if (rows.length === 0) return nothing;
    return html`<tbody>
      <tr class="group"><th scope="rowgroup" colspan=${span}>${label}</th></tr>
      ${rows.map(
        (row) => html`<tr>
          <th scope="row">
            <span class="value">${row.label}</span>${row.events.map((e) => html`<span class="sub">${e}</span>`)}
          </th>
          ${row.cells.map((cell) => this._renderCell(cell))}
        </tr>`,
      )}
    </tbody>`;
  }

  override render() {
    const all = prepareSeries(this.series, this.percentiles, this.goal?.value);
    const ids = visibleIds(all, this.visible);
    const columns = all.filter((s) => ids.has(s.source.id));
    const { observed, projected } = this._rows(all, columns);
    if (observed.length + projected.length === 0) return html`<p class="message">No data</p>`;
    const range = bandNames(this.percentiles)[0];
    return html`
      <div class="scroll" role="region" tabindex="0" aria-labelledby="caption">
        <table>
          <caption id="caption" class=${this.caption ? "" : "sr-only"}>${this.caption || "Forecast"}</caption>
          <thead>
            <tr>
              <th scope="col">${this.dateLabel}</th>
              ${columns.map(
                (s) => html`<th scope="col" data-series=${s.source.id}>
                  <span class="col-head"><span class="swatch" style="color: ${s.color}"></span>${s.source.label}</span>
                  ${s.projection.length > 0 && range ? html`<span class="sub col-sub">Median · ${range}</span>` : nothing}
                </th>`,
              )}
            </tr>
          </thead>
          ${this._renderGroup(this.observedLabel, observed, columns.length + 1)}
          ${this._renderGroup(this.projectedLabel, projected, columns.length + 1)}
        </table>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "fan-table": FanTable;
  }
}
