import { css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { CalendarTimelineBase } from "./calendar-timeline-base.js";
import { tokens } from "./tokens.js";
import {
  assignLanes,
  minutesSinceMidnight,
  monthName,
  parseIsoDate,
  toIsoDate,
  type LanedEntry,
} from "./utils/calendar.js";

const HOUR_HEIGHT_REM = 3;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const hourLabelFormatter = new Intl.DateTimeFormat(undefined, { hour: "numeric" });

/** Formats hour `h` (0-23) as a locale-aware hour label, e.g. "9 AM". */
function hourLabel(h: number): string {
  return hourLabelFormatter.format(new Date(2000, 0, 1, h));
}

/**
 * A single day rendered as an hourly time grid — a Google-Calendar-style
 * view distinct from `calendar-month`'s whole-day table. Declarative
 * `calendar-entry` children with a time-of-day in `start`/`end` (e.g.
 * `start="2026-03-05T09:00"`) render as positioned/sized blocks; entries
 * with only a date (no time) render in an all-day band above the grid.
 * Overlapping timed entries stack into side-by-side columns; overlapping
 * all-day/multi-day entries stack into lanes, same as `calendar-month`.
 * Read-only.
 *
 * Shares its slotted-entry observation, resolution, and hover/focus
 * interaction sync with `calendar-week` via `CalendarTimelineBase`.
 *
 * @element calendar-day
 * @slot - Declarative `calendar-entry` elements to render for this day.
 * @slot actions - Optional controls rendered beside the day name (e.g. day-navigation buttons).
 */
@customElement("calendar-day")
export class CalendarDay extends CalendarTimelineBase {
  /** The day shown, `"YYYY-MM-DD"`. */
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
      .day-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }
      .day-name {
        margin: 0;
        min-width: 0;
        color: var(--ui-text, #0f172a);
        font-size: var(--ui-font-size-lg, 1rem);
        font-weight: var(--ui-font-weight-semibold, 600);
        line-height: var(--ui-line-height-tight, 1.25);
      }
      .day-name.today {
        color: var(--ui-primary, #4f46e5);
      }
      .actions {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        gap: 0.5rem;
      }
      .all-day-band {
        display: flex;
        margin-bottom: 0.5rem;
      }
      .all-day-band.empty {
        display: none;
      }
      .hour-gutter-spacer {
        flex: 0 0 3rem;
      }
      .all-day-lanes {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        gap: 0.25rem;
      }
      .all-day-lane {
        display: flex;
        gap: 0.25rem;
      }
      .grid {
        display: flex;
        border-top: 1px solid var(--ui-border, #e2e8f0);
      }
      .hour-gutter {
        flex: 0 0 3rem;
      }
      .hour-label-cell {
        box-sizing: border-box;
        height: ${HOUR_HEIGHT_REM}rem;
        padding-right: 0.5rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
        color: var(--ui-text-muted, #64748b);
        font-variant-numeric: tabular-nums;
        text-align: right;
        white-space: nowrap;
      }
      .day-column {
        position: relative;
        flex: 1 1 auto;
        height: ${HOUR_HEIGHT_REM * 24}rem;
      }
      .day-column.today {
        background: color-mix(in srgb, var(--ui-primary, #4f46e5) 6%, transparent);
      }
      .hour-line {
        box-sizing: border-box;
        height: ${HOUR_HEIGHT_REM}rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
      }
      .entry-bar {
        position: relative;
        box-sizing: border-box;
        flex: 1 1 auto;
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

  /** Renders one lane's stacked all-day bars, given the entries assigned to it. */
  private _renderAllDayLane(laned: LanedEntry[], lane: number) {
    const entries = laned.filter((entry) => entry.lane === lane);
    return html`
      <div class="all-day-lane">
        ${entries.map(
          (entry) => html`
            <div
              class="entry-bar ${entry.color}"
              data-entry-key=${this.entryKey(entry)}
              title=${entry.href ? nothing : entry.label}
            >
              ${this.renderEntryLink(entry, entry.label)}
              <span class="entry-title" aria-hidden=${entry.href ? "true" : nothing}>${entry.label}</span>
            </div>
          `,
        )}
      </div>
    `;
  }

  /** Renders a positioned/sized block for one timed entry, clamped to this day's bounds. */
  private _renderTimedEntry(entry: LanedEntry, laneCount: number, dayStart: Date, dayEnd: Date) {
    const visibleStart = entry.startDate < dayStart ? dayStart : entry.startDate;
    const visibleEnd = entry.endDate > dayEnd ? dayEnd : entry.endDate;
    const topRem = (minutesSinceMidnight(visibleStart) / 60) * HOUR_HEIGHT_REM;
    const bottomRem = (minutesSinceMidnight(visibleEnd) / 60) * HOUR_HEIGHT_REM;
    const heightRem = Math.max(bottomRem - topRem, HOUR_HEIGHT_REM / 4);
    const widthPercent = 100 / laneCount;
    const bodyText = [entry.label, ...(entry.details ?? [])].filter(Boolean).join("\n");
    return html`
      <div
        class="entry-bar entry-block ${entry.color}"
        data-entry-key=${this.entryKey(entry)}
        title=${entry.href ? nothing : bodyText}
        style="top: ${topRem}rem; height: ${heightRem}rem; left: ${entry.lane * widthPercent}%; width: ${widthPercent}%;"
      >
        ${this.renderEntryLink(entry, bodyText)}
        <span class="entry-title" aria-hidden=${entry.href ? "true" : nothing}>${entry.label}</span>
      </div>
    `;
  }

  protected override render() {
    const day = parseIsoDate(this.date) ?? new Date();
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    const isToday = toIsoDate(day) === toIsoDate(new Date());

    const resolved = this.resolveTimedEntriesFor(dayStart, dayEnd);
    const allDay = resolved.filter((entry) => entry.allDay);
    const timed = resolved.filter((entry) => !entry.allDay);
    const { entries: lanedAllDay, laneCount: allDayLaneCount } = assignLanes(allDay);
    const { entries: lanedTimed, laneCount: timedLaneCount } = assignLanes(timed);

    return html`
      <div class="day">
        <div class="day-header">
          <h4 class="day-name ${isToday ? "today" : ""}">
            ${monthName(day.getMonth() + 1)} ${day.getDate()}, ${day.getFullYear()}
          </h4>
          <div class="actions"><slot name="actions"></slot></div>
        </div>
        <div class="all-day-band ${allDay.length === 0 ? "empty" : ""}">
          <div class="hour-gutter-spacer"></div>
          <div class="all-day-lanes">
            ${repeat(
              Array.from({ length: Math.max(allDayLaneCount, 1) }, (_, i) => i),
              (lane) => lane,
              (lane) => this._renderAllDayLane(lanedAllDay, lane),
            )}
          </div>
        </div>
        <div class="grid">
          <div class="hour-gutter">
            ${HOURS.map((h) => html`<div class="hour-label-cell">${hourLabel(h)}</div>`)}
          </div>
          <div class="day-column ${isToday ? "today" : ""}">
            ${HOURS.map(() => html`<div class="hour-line"></div>`)}
            ${repeat(
              lanedTimed,
              (entry) => this.entryKey(entry),
              (entry) => this._renderTimedEntry(entry, Math.max(timedLaneCount, 1), dayStart, dayEnd),
            )}
          </div>
        </div>
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "calendar-day": CalendarDay;
  }
}
