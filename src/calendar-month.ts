import { LitElement, css, html, nothing } from "lit";
import { customElement, property, queryAssignedElements, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { CalendarEntry } from "./calendar-entry.js";
import { tokens } from "./tokens.js";
import {
  CALENDAR_ENTRY_ATTRIBUTES,
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
 * bars spanning the days they cover. An entry's title uses its first visible
 * day; every remaining visible day becomes one shared body for wrapped
 * details and an optional ending footer. Overlapping entries stack into
 * side-by-side lanes rather than being layered/hidden. Read-only.
 *
 * Lanes are computed independently per instance, from only the entries
 * overlapping this month — an entry spanning a month boundary may therefore
 * land in a different lane index in the adjacent month's `calendar-month`.
 * This is an accepted v1 limitation: cross-month lane continuity would
 * require a shared parent (`calendar-year`) to assign lanes globally.
 *
 * Entry attributes and slotted title/detail text are observed, so a
 * standalone month re-renders when consumers update declarative metadata.
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

  /** Bumped when entry elements, attributes, or slotted text change to force a re-render. */
  @state() private _entriesVersion = 0;

  private _entriesObserver?: MutationObserver;

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
      .month-name {
        margin: 0 0 0.5rem;
        color: var(--ui-text, #0f172a);
        font-size: var(--ui-font-size-lg, 1rem);
        font-weight: var(--ui-font-weight-semibold, 600);
        line-height: var(--ui-line-height-tight, 1.25);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }
      .day-row td {
        padding: 0.25rem 0.5rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
      }
      .day-row.weekend {
        background: var(--ui-surface-muted, #f8fafc);
      }
      .day-row.today {
        background: color-mix(in srgb, var(--ui-primary, #4f46e5) 10%, transparent);
      }
      .day-number {
        width: 1.5rem;
        color: var(--ui-text-muted, #64748b);
        font-variant-numeric: tabular-nums;
        text-align: right;
        white-space: nowrap;
      }
      .day-row.today .day-number {
        color: var(--ui-primary, #4f46e5);
        font-weight: var(--ui-font-weight-bold, 700);
      }
      .day-weekday {
        width: 2.25rem;
        color: var(--ui-text-muted, #64748b);
        white-space: nowrap;
      }
      .day-row.today .day-weekday {
        color: var(--ui-primary, #4f46e5);
        font-weight: var(--ui-font-weight-semibold, 600);
      }
      .day-row.weekend .day-weekday {
        font-weight: var(--ui-font-weight-semibold, 600);
      }
      .lane-cell {
        padding: 0.25rem 0.5rem;
      }
      .entry-bar {
        border-radius: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: box-shadow 120ms ease;
        white-space: nowrap;
      }
      .entry-bar.entry-hovered,
      .entry-bar.entry-focused {
        box-shadow: inset 0 0 0 100vmax var(--ui-hover-overlay, rgb(255 255 255 / 0.32));
      }
      .entry-bar.segment-single {
        border-radius: var(--ui-radius-sm, 0.25rem);
      }
      .entry-bar.segment-start {
        border-radius: var(--ui-radius-sm, 0.25rem) var(--ui-radius-sm, 0.25rem) 0 0;
      }
      .entry-bar.segment-end {
        border-radius: 0 0 var(--ui-radius-sm, 0.25rem) var(--ui-radius-sm, 0.25rem);
      }
      .entry-bar.segment-start,
      .entry-bar.segment-middle {
        border-bottom: 0;
      }
      .entry-bar.neutral {
        background: color-mix(in srgb, var(--ui-text-muted, #64748b) 15%, var(--ui-surface, #ffffff));
        color: var(--ui-text-muted, #64748b);
      }
      .entry-bar.info {
        background: color-mix(in srgb, var(--ui-info, #0ea5e9) 15%, var(--ui-surface, #ffffff));
        color: var(--ui-info, #0ea5e9);
      }
      .entry-bar.primary {
        background: color-mix(in srgb, var(--ui-primary, #4f46e5) 15%, var(--ui-surface, #ffffff));
        color: var(--ui-primary, #4f46e5);
      }
      .entry-bar.success {
        background: color-mix(in srgb, var(--ui-success, #16a34a) 15%, var(--ui-surface, #ffffff));
        color: var(--ui-success, #16a34a);
      }
      .entry-bar.warning {
        background: color-mix(in srgb, var(--ui-warning, #d97706) 15%, var(--ui-surface, #ffffff));
        color: var(--ui-warning, #d97706);
      }
      .entry-bar.danger {
        background: color-mix(in srgb, var(--ui-danger, #dc2626) 15%, var(--ui-surface, #ffffff));
        color: var(--ui-danger, #dc2626);
      }
      .entry-line {
        display: block;
        overflow: hidden;
      }
      .day-row td.entry-title-cell {
        position: relative;
        padding: 0;
      }
      .entry-title {
        box-sizing: border-box;
        font-weight: var(--ui-font-weight-medium, 500);
        padding: 0.25rem 0.5rem;
        pointer-events: none;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .entry-details {
        display: -webkit-box;
        min-height: 0;
        max-height: var(--entry-detail-max-height, 1.15em);
        flex: 0 0 auto;
        overflow: hidden;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: var(--entry-detail-lines, 1);
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-regular, 400);
        line-height: 1.15;
        overflow-wrap: anywhere;
        text-overflow: ellipsis;
        white-space: normal;
      }
      .entry-detail {
        min-height: 1.15em;
      }
      .day-row td.entry-body-cell {
        position: relative;
        padding: 0;
        vertical-align: top;
      }
      .entry-body {
        position: absolute;
        inset: 0;
        box-sizing: border-box;
        display: flex;
        min-height: 0;
        flex-direction: column;
        overflow: hidden;
        padding: 0.25rem 0.5rem;
        color: inherit;
        pointer-events: none;
      }
      .entry-footer {
        flex: 0 0 auto;
        min-height: 1.15em;
        margin-top: auto;
        border-top: 1px solid color-mix(in srgb, currentColor 20%, transparent);
        padding-top: 0.25rem;
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: 1.15;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .entry-link {
        position: absolute;
        z-index: 1;
        inset: 0;
        border-radius: inherit;
        color: inherit;
        cursor: pointer;
        text-decoration: none;
      }
      .entry-link:focus-visible {
        outline: 2px solid var(--ui-primary, #4f46e5);
        outline-offset: -2px;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35)) inset;
      }
      @media (forced-colors: active) {
        .entry-link:focus-visible {
          outline-color: Highlight;
          box-shadow: none;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .entry-bar {
          transition: none;
        }
      }
      slot {
        display: none;
      }
    `,
  ];

  /** Observes declarative entry attributes and slotted text for live updates. */
  override connectedCallback(): void {
    super.connectedCallback();
    this._entriesVersion++;
    this._entriesObserver ??= new MutationObserver(() => this._entriesVersion++);
    this._entriesObserver.observe(this, {
      attributes: true,
      attributeFilter: CALENDAR_ENTRY_ATTRIBUTES,
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  /** Releases the entry observer when this month disconnects. */
  override disconnectedCallback(): void {
    this._entriesObserver?.disconnect();
    super.disconnectedCallback();
  }

  /** Restores hover/focus classes from the live DOM after Lit updates or reuses cells. */
  protected override updated(): void {
    this._syncEntryInteractions();
  }

  /** Re-renders when declarative `calendar-entry` children are added or removed. */
  private _handleSlotChange(): void {
    this._entriesVersion++;
  }

  /** Finds the laned entry (if any) covering `date` in a given lane. */
  private _entryFor(laned: LanedEntry[], lane: number, date: Date): LanedEntry | undefined {
    return laned.find((entry) => entry.lane === lane && entry.startDate <= date && date <= entry.endDate);
  }

  /** Classifies one day of an entry so only the outer endpoints are rounded. */
  private _segmentClass(entry: LanedEntry, date: Date): string {
    const startsHere = date.getTime() === entry.startDate.getTime();
    const endsHere = date.getTime() === entry.endDate.getTime();
    if (startsHere && endsHere) return "segment-single";
    if (startsHere) return "segment-start";
    if (endsHere) return "segment-end";
    return "segment-middle";
  }

  /** Current render key shared by an entry's title and body cells. */
  private _entryKey(entry: LanedEntry): string {
    return `${entry.lane}|${entry.start}|${entry.end}|${entry.label}|${entry.href ?? ""}`;
  }

  /** Toggles one interaction class on every rendered cell belonging to an entry. */
  private _setEntryInteraction(entryKey: string, className: string, active: boolean): void {
    for (const cell of this.renderRoot.querySelectorAll<HTMLElement>(".entry-bar")) {
      if (cell.dataset.entryKey === entryKey) {
        cell.classList.toggle(className, active);
      }
    }
  }

  /** Reconciles classes against the links actually hovered or focused after a render. */
  private _syncEntryInteractions(): void {
    for (const cell of this.renderRoot.querySelectorAll<HTMLElement>(".entry-bar")) {
      cell.classList.remove("entry-hovered", "entry-focused");
    }
    for (const link of this.renderRoot.querySelectorAll<HTMLElement>(".entry-link:hover")) {
      this._setEntryInteraction(link.dataset.entryKey ?? "", "entry-hovered", true);
    }
    const activeElement = this.shadowRoot?.activeElement;
    if (activeElement instanceof HTMLElement && activeElement.matches(".entry-link")) {
      this._setEntryInteraction(activeElement.dataset.entryKey ?? "", "entry-focused", true);
    }
  }

  /** Renders a transparent full-cell link without wrapping the visible text. */
  private _renderEntryLink(entry: LanedEntry, accessibleText: string) {
    const entryKey = this._entryKey(entry);
    return entry.href
      ? html`<a
          class="entry-link"
          href=${entry.href}
          aria-label=${accessibleText}
          data-entry-key=${entryKey}
          @pointerenter=${() => this._setEntryInteraction(entryKey, "entry-hovered", true)}
          @pointerleave=${() => this._setEntryInteraction(entryKey, "entry-hovered", false)}
          @focus=${() => this._setEntryInteraction(entryKey, "entry-focused", true)}
          @blur=${() => this._setEntryInteraction(entryKey, "entry-focused", false)}
        ></a>`
      : nothing;
  }

  /** Joins the event title, details, and visible footer for tooltips and accessible link names. */
  private _entryBodyText(entry: LanedEntry, showFooter: boolean): string {
    return [entry.label, ...(entry.details ?? []), showFooter ? entry.footer : undefined]
      .filter((line): line is string => Boolean(line))
      .join("\n");
  }

  /** Renders the shared details body, with the footer reserved at its bottom edge. */
  private _renderEntryBody(
    entry: LanedEntry,
    showFooter: boolean,
    detailLineClamp: number,
    showTitleFallback = false,
  ) {
    const sourceDetails = entry.details ?? [];
    const footer = showFooter ? entry.footer : undefined;
    const details =
      showTitleFallback && sourceDetails.length === 0 && !footer
        ? [entry.label]
        : sourceDetails;
    const bodyText = this._entryBodyText(entry, showFooter);
    return html`
      ${this._renderEntryLink(entry, bodyText)}
      <div class="entry-body" aria-hidden=${entry.href ? "true" : nothing}>
        ${detailLineClamp > 0 && details.length > 0
          ? html`
              <div
                class="entry-details"
                style=${`--entry-detail-lines: ${detailLineClamp}; --entry-detail-max-height: ${
                  detailLineClamp * 1.15
                }em`}
              >
                ${details.map((detail) => html`<div class="entry-detail">${detail}</div>`)}
              </div>
            `
          : nothing}
        ${footer ? html`<div class="entry-footer" title=${footer}>${footer}</div>` : nothing}
      </div>
    `;
  }

  /** Renders a row-spanning body cell with whole-line detail and footer budgets. */
  private _renderEntryBodyCell(
    entry: LanedEntry,
    bodyRows: number,
    reachesEventEnd: boolean,
    showTitleFallback = false,
  ) {
    const segmentClass = reachesEventEnd ? "segment-end" : "segment-middle";
    const footerLineBudget = reachesEventEnd && entry.footer ? 1 : 0;
    const detailLineClamp = Math.max(0, bodyRows - footerLineBudget);
    const bodyText = this._entryBodyText(entry, reachesEventEnd);
    return html`
      <td
        class="lane-cell entry-bar entry-body-cell ${entry.color} ${segmentClass}"
        data-entry-key=${this._entryKey(entry)}
        rowspan=${bodyRows}
        title=${entry.href ? nothing : bodyText}
      >
        ${this._renderEntryBody(entry, reachesEventEnd, detailLineClamp, showTitleFallback)}
      </td>
    `;
  }

  /** Renders a lane's title/body cell, skips rows covered by a body rowspan, or emits an empty spacer. */
  private _renderLaneCell(
    laned: LanedEntry[],
    lane: number,
    date: Date,
    monthStart: Date,
    monthEnd: Date,
  ) {
    const entry = this._entryFor(laned, lane, date);
    if (!entry) {
      return html`<td class="lane-cell empty"></td>`;
    }

    const firstVisibleDay = entry.startDate > monthStart ? entry.startDate : monthStart;
    const lastVisibleDay = entry.endDate < monthEnd ? entry.endDate : monthEnd;
    const dayOffset = date.getDate() - firstVisibleDay.getDate();
    const visibleDayCount = lastVisibleDay.getDate() - firstVisibleDay.getDate() + 1;
    const isMultiDayEntry = entry.startDate.getTime() !== entry.endDate.getTime();
    const isEndingOnlyClip =
      visibleDayCount === 1 &&
      isMultiDayEntry &&
      date.getTime() === entry.endDate.getTime();
    if (isEndingOnlyClip) {
      return this._renderEntryBodyCell(entry, 1, true, true);
    }
    if (dayOffset > 1) return nothing;

    if (dayOffset === 1) {
      const bodyRows = visibleDayCount - 1;
      const reachesEventEnd = lastVisibleDay.getTime() === entry.endDate.getTime();
      return this._renderEntryBodyCell(entry, bodyRows, reachesEventEnd);
    }

    return html`
      <td
        class="lane-cell entry-bar entry-title-cell ${entry.color} ${this._segmentClass(entry, date)}"
        data-entry-key=${this._entryKey(entry)}
        title=${entry.href ? nothing : entry.label}
      >
        ${this._renderEntryLink(entry, entry.label)}
        <span class="entry-line entry-title" aria-hidden=${entry.href ? "true" : nothing}>
          ${entry.label}
        </span>
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
    const lanes = Array.from({ length: Math.max(laneCount, 1) }, (_, i) => i);

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
                    ${lanes.map((lane) => this._renderLaneCell(laned, lane, date, monthStart, monthEnd))}
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
