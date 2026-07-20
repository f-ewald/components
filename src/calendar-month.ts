import { LitElement, css, html } from "lit";
import { customElement, property, queryAssignedElements, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { CalendarEntry } from "./calendar-entry.js";
import { tokens } from "./tokens.js";
import {
  WEEKDAY_ABBR,
  assignLanes,
  daysInMonth,
  isWeekend,
  monthName,
  overlapsRange,
  readCalendarEntryElement,
  resolveEntry,
  toIsoDate,
  type LanedEntry,
  type ResolvedCalendarEntry,
} from "./utils/calendar.js";

/**
 * One month rendered as a top-to-bottom list of days — weekends and today
 * highlighted, with declarative `calendar-entry` children shown as colored
 * bars spanning the days they cover. Overlapping entries stack into
 * side-by-side lanes rather than being layered/hidden. Read-only.
 *
 * Lanes are computed independently per instance, from only the entries
 * overlapping this month — an entry spanning a month boundary may therefore
 * land in a different lane index in the adjacent month's `calendar-month`.
 * This is an accepted v1 limitation: cross-month lane continuity would
 * require a shared parent (`calendar-year`) to assign lanes globally.
 *
 * A standalone `calendar-month` (used outside `calendar-year`) also won't
 * re-render if a consumer mutates one of its hand-authored `calendar-entry`
 * children's attributes in place after the initial render — only slot
 * insertion/removal is observed. `calendar-year` avoids this by always
 * replacing (never mutating) the synthetic entries it projects down.
 *
 * @element calendar-month
 * @slot - Declarative `calendar-entry` elements to render for this month.
 */
@customElement("calendar-month")
export class CalendarMonth extends LitElement {
  /** Calendar year, e.g. `2026`. */
  @property({ type: Number, reflect: true }) year: number = new Date().getFullYear();

  /** Calendar month, 1-12 (January = 1). */
  @property({ type: Number, reflect: true }) month = 1;

  @queryAssignedElements({ selector: "calendar-entry" })
  private readonly _entryElements!: CalendarEntry[];

  /** Bumped on every slotchange purely to force a re-render — `_entryElements` is a live query, not a cache. */
  @state() private _entriesVersion = 0;

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        font-family: var(--ui-font, ui-sans-serif, system-ui, sans-serif);
        font-size: var(--ui-font-size-sm, 0.75rem);
      }
      .month-name {
        margin: 0 0 0.5rem;
        color: var(--ui-text, #0f172a);
        font-size: var(--ui-font-size, 0.875rem);
        font-weight: 600;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      .day-row td {
        padding: 0.25rem 0.5rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
      }
      .day-row.weekend {
        background: var(--ui-surface-muted, #f8fafc);
      }
      .day-number {
        color: var(--ui-text-muted, #64748b);
        font-variant-numeric: tabular-nums;
        text-align: right;
      }
      .day-row.today .day-number {
        border-radius: var(--ui-radius-sm, 0.25rem);
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35)) inset;
        color: var(--ui-primary, #4f46e5);
        font-weight: 700;
      }
      .day-weekday {
        color: var(--ui-text-muted, #64748b);
      }
      .day-row.weekend .day-weekday {
        font-weight: 600;
      }
      .lane-cell {
        padding: 0.1rem 0.4rem;
      }
      .entry-bar {
        border-radius: var(--ui-radius-sm, 0.25rem);
        white-space: nowrap;
      }
      .entry-bar.neutral {
        background: color-mix(in srgb, var(--ui-text-muted, #64748b) 15%, transparent);
        color: var(--ui-text-muted, #64748b);
      }
      .entry-bar.info {
        background: color-mix(in srgb, #0ea5e9 15%, transparent);
        color: #0ea5e9;
      }
      .entry-bar.primary {
        background: color-mix(in srgb, var(--ui-primary, #4f46e5) 15%, transparent);
        color: var(--ui-primary, #4f46e5);
      }
      .entry-bar.success {
        background: color-mix(in srgb, var(--ui-success, #16a34a) 15%, transparent);
        color: var(--ui-success, #16a34a);
      }
      .entry-bar.warning {
        background: color-mix(in srgb, #d97706 15%, transparent);
        color: #d97706;
      }
      .entry-bar.danger {
        background: color-mix(in srgb, var(--ui-danger, #dc2626) 15%, transparent);
        color: var(--ui-danger, #dc2626);
      }
      .entry-bar a {
        color: inherit;
        font-weight: 500;
        text-decoration: none;
      }
      .entry-bar a:hover {
        text-decoration: underline;
      }
      slot {
        display: none;
      }
    `,
  ];

  /** Re-renders when declarative `calendar-entry` children are added or removed. */
  private _handleSlotChange(): void {
    this._entriesVersion++;
  }

  /** Finds the laned entry (if any) covering `date` in a given lane. */
  private _entryFor(laned: LanedEntry[], lane: number, date: Date): LanedEntry | undefined {
    return laned.find((entry) => entry.lane === lane && entry.startDate <= date && date <= entry.endDate);
  }

  /** Renders a single lane's cell for one day: an entry bar, or an empty alignment spacer. */
  private _renderLaneCell(laned: LanedEntry[], lane: number, date: Date, monthStart: Date) {
    const entry = this._entryFor(laned, lane, date);
    if (!entry) {
      return html`<td class="lane-cell empty"></td>`;
    }

    const firstVisibleDay = entry.startDate > monthStart ? entry.startDate : monthStart;
    const showLabel = date.getTime() === firstVisibleDay.getTime();
    const label = showLabel ? entry.label : "";
    return html`
      <td class="lane-cell entry-bar ${entry.color}" title=${entry.label}>
        ${entry.href ? html`<a href=${entry.href}>${label}</a>` : label}
      </td>
    `;
  }

  protected override render() {
    const totalDays = daysInMonth(this.year, this.month);
    const monthStart = new Date(this.year, this.month - 1, 1);
    const monthEnd = new Date(this.year, this.month - 1, totalDays);

    const resolved = this._entryElements
      .map(readCalendarEntryElement)
      .map(resolveEntry)
      .filter((entry): entry is ResolvedCalendarEntry => entry !== null)
      .filter((entry) => overlapsRange(entry, monthStart, monthEnd));
    const { entries: laned, laneCount } = assignLanes(resolved);
    const todayIso = toIsoDate(new Date());
    const lanes = Array.from({ length: laneCount }, (_, i) => i);

    return html`
      <div class="month">
        <h4 class="month-name">${monthName(this.month)} ${this.year}</h4>
        <table>
          <tbody>
            ${repeat(
              Array.from({ length: totalDays }, (_, i) => i + 1),
              (d) => d,
              (d) => {
                const date = new Date(this.year, this.month - 1, d);
                const dow = date.getDay();
                const weekendCls = isWeekend(date) ? "weekend" : "";
                const todayCls = toIsoDate(date) === todayIso ? "today" : "";
                return html`
                  <tr class="day-row ${weekendCls} ${todayCls}">
                    <td class="day-number">${d}</td>
                    <td class="day-weekday">${WEEKDAY_ABBR[dow]}</td>
                    ${lanes.map((lane) => this._renderLaneCell(laned, lane, date, monthStart))}
                  </tr>
                `;
              },
            )}
          </tbody>
        </table>
        <slot @slotchange=${this._handleSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "calendar-month": CalendarMonth;
  }
}
