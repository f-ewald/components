import { css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { CalendarTimelineBase } from "./calendar-timeline-base.js";
import { iconMapPin } from "./icons.js";
import { tokens } from "./tokens.js";
import {
  WEEKDAY_ABBR,
  addDays,
  assignLanes,
  minutesSinceMidnight,
  overlapsRange,
  parseIsoDate,
  startOfWeek,
  toIsoDate,
  type LanedEntry,
  type ResolvedTimedEntry,
} from "./utils/calendar.js";

const HOUR_HEIGHT_REM = 3;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const hourLabelFormatter = new Intl.DateTimeFormat(undefined, { hour: "numeric" });

/** Formats hour `h` (0-23) as a locale-aware hour label, e.g. "9 AM". */
function hourLabel(h: number): string {
  return hourLabelFormatter.format(new Date(2000, 0, 1, h));
}

/** 0-based day-of-week offset between `date` (local midnight) and `weekStart`. */
function dayIndex(date: Date, weekStart: Date): number {
  return Math.round((date.getTime() - weekStart.getTime()) / 86_400_000);
}

/**
 * Sunday-through-Saturday week rendered as one shared hourly time grid — the
 * seven-day sibling of `calendar-day`. Unlike `calendar-year` composing 12
 * `calendar-month` children, this is its own independent 7-column layout
 * (not 7 nested `<calendar-day>` elements): a single hour gutter is drawn
 * once, and multi-day/all-day entries span the days they cover as one
 * continuous bar in a shared all-day band, since lanes for that band are
 * assigned once across the whole visible week (unlike `calendar-month`'s
 * documented per-instance lane limitation). Timed entries stack into
 * side-by-side columns independently per day, same as `calendar-day`.
 * Read-only.
 *
 * Shares its slotted-entry observation, resolution, and hover/focus
 * interaction sync with `calendar-day` via `CalendarTimelineBase`.
 *
 * @element calendar-week
 * @slot - Declarative `calendar-entry` elements to render for this week.
 * @slot actions - Optional controls rendered beside the day headers (e.g. week-navigation buttons).
 */
@customElement("calendar-week")
export class CalendarWeek extends CalendarTimelineBase {
  /** Any date within the displayed week (`"YYYY-MM-DD"`) — the week runs Sunday through Saturday. */
  @property({ reflect: true }) date: string = toIsoDate(new Date());

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
      .week-header-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }
      .week-header {
        display: flex;
        flex: 1 1 auto;
        min-width: 0;
      }
      .actions {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        gap: 0.5rem;
      }
      .hour-gutter-spacer {
        flex: 0 0 3rem;
      }
      .day-header {
        flex: 1 1 0;
        color: var(--ui-text-muted, #64748b);
        font-weight: var(--ui-font-weight-semibold, 600);
        text-align: center;
      }
      .day-header .day-number {
        color: var(--ui-text, #0f172a);
        font-size: var(--ui-font-size-lg, 1rem);
      }
      .day-header.today,
      .day-header.today .day-number {
        color: var(--ui-primary, #4f46e5);
      }
      .all-day-band {
        display: flex;
        margin-bottom: 0.5rem;
      }
      .all-day-band.empty {
        display: none;
      }
      .all-day-lanes {
        display: grid;
        flex: 1 1 auto;
        grid-auto-rows: min-content;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.25rem;
      }
      .grid {
        display: flex;
        border-top: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        /* The hour grid is the week's canvas — .day-column only paints for
           weekend/today, so without this the page showed through every
           ordinary hour. The today tint is translucent and composites over
           this paper rather than over the page. */
        background: var(--ui-surface, #ffffff);
      }
      .hour-gutter {
        flex: 0 0 3rem;
      }
      .hour-label-cell {
        box-sizing: border-box;
        height: ${HOUR_HEIGHT_REM}rem;
        padding-right: 0.5rem;
        border-bottom: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        color: var(--ui-text-muted, #64748b);
        font-variant-numeric: tabular-nums;
        text-align: right;
        white-space: nowrap;
      }
      .week-days {
        display: flex;
        flex: 1 1 auto;
      }
      .day-column {
        position: relative;
        flex: 1 1 0;
        height: ${HOUR_HEIGHT_REM * 24}rem;
        border-left: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
      }
      .day-column.today {
        background: color-mix(in srgb, var(--ui-primary, #4f46e5) 6%, transparent);
      }
      .hour-line {
        box-sizing: border-box;
        height: ${HOUR_HEIGHT_REM}rem;
        border-bottom: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
      }
      .entry-bar {
        position: relative;
        box-sizing: border-box;
        overflow: hidden;
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.25rem 0.5rem;
        transition: box-shadow 120ms ease;
      }
      .entry-bar.entry-block {
        position: absolute;
      }
      .entry-bar.entry-hovered,
      .entry-bar.entry-focused {
        box-shadow: inset 0 0 0 100vmax var(--ui-hover-overlay, rgb(255 255 255 / 0.32));
      }
      .entry-title {
        display: block;
        overflow: hidden;
        font-weight: var(--ui-font-weight-medium, 500);
        white-space: nowrap;
        text-overflow: ellipsis;
        pointer-events: none;
      }
      .entry-location {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        overflow: hidden;
        color: inherit;
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-regular, 400);
        white-space: nowrap;
        text-overflow: ellipsis;
        pointer-events: none;
      }
      .entry-location svg {
        flex: 0 0 auto;
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
      slot:not([name]) {
        display: none;
      }
    `,
  ];

  /** Renders one all-day/multi-day bar, spanning the visible-week columns it covers. */
  private _renderAllDayEntry(entry: LanedEntry, weekStart: Date, weekEnd: Date) {
    const visibleStart = entry.startDate < weekStart ? weekStart : entry.startDate;
    const visibleEnd = entry.endDate > weekEnd ? weekEnd : entry.endDate;
    const startCol = dayIndex(visibleStart, weekStart) + 1;
    const endCol = dayIndex(visibleEnd, weekStart) + 2;
    const bodyText = [entry.label, entry.location].filter(Boolean).join(" · ");
    return html`
      <div
        class="entry-bar ${entry.color}"
        data-entry-key=${this.entryKey(entry)}
        title=${entry.href ? nothing : bodyText}
        style="grid-column: ${startCol} / ${endCol}; grid-row: ${entry.lane + 1};"
      >
        ${this.renderEntryLink(entry, bodyText)}
        <span class="entry-title" aria-hidden=${entry.href ? "true" : nothing}>${entry.label}</span>
        ${entry.location
          ? html`<span class="entry-location" aria-hidden=${entry.href ? "true" : nothing}
              >${iconMapPin(14)}${entry.location}</span
            >`
          : nothing}
      </div>
    `;
  }

  /** Renders a positioned/sized block for one timed entry, clamped to `day`'s bounds. */
  private _renderTimedEntry(entry: LanedEntry, laneCount: number, dayStart: Date, dayEnd: Date) {
    const visibleStart = entry.startDate < dayStart ? dayStart : entry.startDate;
    const visibleEnd = entry.endDate > dayEnd ? dayEnd : entry.endDate;
    const topRem = (minutesSinceMidnight(visibleStart) / 60) * HOUR_HEIGHT_REM;
    const bottomRem = (minutesSinceMidnight(visibleEnd) / 60) * HOUR_HEIGHT_REM;
    const heightRem = Math.max(bottomRem - topRem, HOUR_HEIGHT_REM / 4);
    const widthPercent = 100 / laneCount;
    const bodyText = [entry.label, ...(entry.details ?? []), entry.location].filter(Boolean).join("\n");
    return html`
      <div
        class="entry-bar entry-block ${entry.color}"
        data-entry-key=${this.entryKey(entry)}
        title=${entry.href ? nothing : bodyText}
        style="top: ${topRem}rem; height: ${heightRem}rem; left: ${entry.lane * widthPercent}%; width: ${widthPercent}%;"
      >
        ${this.renderEntryLink(entry, bodyText)}
        <span class="entry-title" aria-hidden=${entry.href ? "true" : nothing}>${entry.label}</span>
        ${entry.location
          ? html`<span class="entry-location" aria-hidden=${entry.href ? "true" : nothing}
              >${iconMapPin(14)}${entry.location}</span
            >`
          : nothing}
      </div>
    `;
  }

  /** Renders one day's hour column: grid lines plus its own independently laned timed entries. */
  private _renderDayColumn(day: Date, timedWeek: ResolvedTimedEntry[], todayIso: string) {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    const dayTimed = timedWeek.filter((entry) => overlapsRange(entry, dayStart, dayEnd));
    const { entries: laned, laneCount } = assignLanes(dayTimed);
    const isToday = toIsoDate(day) === todayIso;
    return html`
      <div class="day-column ${isToday ? "today" : ""}">
        ${HOURS.map(() => html`<div class="hour-line"></div>`)}
        ${repeat(
          laned,
          (entry) => this.entryKey(entry),
          (entry) => this._renderTimedEntry(entry, Math.max(laneCount, 1), dayStart, dayEnd),
        )}
      </div>
    `;
  }

  protected override render() {
    const anyDayInWeek = parseIsoDate(this.date) ?? new Date();
    const weekStart = startOfWeek(anyDayInWeek);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const weekEnd = new Date(days[6]);
    weekEnd.setHours(23, 59, 59, 999);
    const todayIso = toIsoDate(new Date());

    const resolved = this.resolveTimedEntriesFor(weekStart, weekEnd);
    const allDay = resolved.filter((entry) => entry.allDay);
    const timed = resolved.filter((entry) => !entry.allDay);
    const { entries: lanedAllDay, laneCount: allDayLaneCount } = assignLanes(allDay);

    return html`
      <div class="week">
        <div class="week-header-row">
          <div class="week-header">
            <div class="hour-gutter-spacer"></div>
            ${days.map(
              (day) => html`
                <div class="day-header ${toIsoDate(day) === todayIso ? "today" : ""}">
                  <div>${WEEKDAY_ABBR[day.getDay()]}</div>
                  <div class="day-number">${day.getDate()}</div>
                </div>
              `,
            )}
          </div>
          <div class="actions"><slot name="actions"></slot></div>
        </div>
        <div class="all-day-band ${allDay.length === 0 ? "empty" : ""}">
          <div class="hour-gutter-spacer"></div>
          <div class="all-day-lanes" style="grid-template-rows: repeat(${Math.max(allDayLaneCount, 1)}, min-content);">
            ${repeat(
              lanedAllDay,
              (entry) => this.entryKey(entry),
              (entry) => this._renderAllDayEntry(entry, weekStart, weekEnd),
            )}
          </div>
        </div>
        <div class="grid">
          <div class="hour-gutter">
            ${HOURS.map((h) => html`<div class="hour-label-cell">${hourLabel(h)}</div>`)}
          </div>
          <div class="week-days">
            ${days.map((day) => this._renderDayColumn(day, timed, todayIso))}
          </div>
        </div>
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "calendar-week": CalendarWeek;
  }
}
