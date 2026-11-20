import { LitElement, html, nothing } from "lit";
import { queryAssignedElements, state } from "lit/decorators.js";
import type { CalendarEntry } from "./calendar-entry.js";
import { iconMapPin } from "./icons.js";
import {
  CALENDAR_ENTRY_ATTRIBUTES,
  minutesSinceMidnight,
  overlapsTimedRange,
  readCalendarEntryElement,
  resolveTimedEntry,
  type LanedEntry,
  type ResolvedTimedEntry,
} from "./utils/calendar.js";

/** Height of one hour row in the hour grid. */
export const HOUR_HEIGHT_REM = 3;

/**
 * Shared base for the hour-grid calendar views, `calendar-day` and
 * `calendar-week` — not a registered custom element itself. Holds what both
 * need identically: observing declarative `calendar-entry` children for live
 * updates, resolving them into time-aware entries, and syncing hover/focus
 * interaction classes on rendered entry bars/links. Pure date/geometry math
 * (parsing, lane assignment) stays in `utils/calendar.ts` per this
 * codebase's existing convention; this class holds only the parts that need
 * to be instance state on a `LitElement` (observers, cached query results).
 *
 * Subclasses must render a default `<slot @slotchange=${this.handleSlotChange}>`
 * for `calendar-entry` children, and use the `.entry-bar`/`.entry-link`
 * class-naming convention for `syncEntryInteractions`/`renderEntryLink` to
 * find rendered entry elements.
 */
export abstract class CalendarTimelineBase extends LitElement {
  @queryAssignedElements({ selector: "calendar-entry" })
  protected readonly entryElements!: CalendarEntry[];

  /** Bumped when entry elements, attributes, or slotted text change to force a re-render. */
  @state() protected entriesVersion = 0;

  private entriesObserver?: MutationObserver;

  /** Observes declarative entry attributes and slotted text for live updates. */
  override connectedCallback(): void {
    super.connectedCallback();
    this.entriesVersion++;
    this.entriesObserver ??= new MutationObserver(() => this.entriesVersion++);
    this.entriesObserver.observe(this, {
      attributes: true,
      attributeFilter: CALENDAR_ENTRY_ATTRIBUTES,
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  /** Releases the entry observer when this element disconnects. */
  override disconnectedCallback(): void {
    this.entriesObserver?.disconnect();
    super.disconnectedCallback();
  }

  /** Restores hover/focus classes from the live DOM after Lit updates or reuses cells. */
  protected override updated(): void {
    this.syncEntryInteractions();
  }

  /** Re-renders when declarative `calendar-entry` children are added or removed. */
  protected handleSlotChange(): void {
    this.entriesVersion++;
  }

  /** Reads, resolves, and filters slotted entries to those overlapping `[rangeStart, rangeEnd]`. */
  protected resolveTimedEntriesFor(rangeStart: Date, rangeEnd: Date): ResolvedTimedEntry[] {
    return this.entryElements
      .map(readCalendarEntryElement)
      .map(resolveTimedEntry)
      .filter((entry): entry is ResolvedTimedEntry => entry !== null)
      .filter((entry) => overlapsTimedRange(entry, rangeStart, rangeEnd));
  }

  /** Renders a positioned/sized block for one timed entry, clamped to `[dayStart, dayEnd]`. */
  protected renderTimedEntry(entry: LanedEntry, laneCount: number, dayStart: Date, dayEnd: Date) {
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

  /** Current render key shared by an entry's rendered cells/blocks. */
  protected entryKey(entry: LanedEntry): string {
    return `${entry.lane}|${entry.start}|${entry.end}|${entry.label}|${entry.href ?? ""}`;
  }

  /** Toggles one interaction class on every rendered element belonging to an entry. */
  protected setEntryInteraction(entryKey: string, className: string, active: boolean): void {
    for (const cell of this.renderRoot.querySelectorAll<HTMLElement>(".entry-bar")) {
      if (cell.dataset.entryKey === entryKey) {
        cell.classList.toggle(className, active);
      }
    }
  }

  /** Reconciles classes against the links actually hovered or focused after a render. */
  protected syncEntryInteractions(): void {
    for (const cell of this.renderRoot.querySelectorAll<HTMLElement>(".entry-bar")) {
      cell.classList.remove("entry-hovered", "entry-focused");
    }
    for (const link of this.renderRoot.querySelectorAll<HTMLElement>(".entry-link:hover")) {
      this.setEntryInteraction(link.dataset.entryKey ?? "", "entry-hovered", true);
    }
    const activeElement = this.shadowRoot?.activeElement;
    if (activeElement instanceof HTMLElement && activeElement.matches(".entry-link")) {
      this.setEntryInteraction(activeElement.dataset.entryKey ?? "", "entry-focused", true);
    }
  }

  /** Renders a transparent full-cell link without wrapping the visible text. */
  protected renderEntryLink(entry: LanedEntry, accessibleText: string) {
    const entryKey = this.entryKey(entry);
    return entry.href
      ? html`<a
          class="entry-link"
          href=${entry.href}
          aria-label=${accessibleText}
          data-entry-key=${entryKey}
          @pointerenter=${() => this.setEntryInteraction(entryKey, "entry-hovered", true)}
          @pointerleave=${() => this.setEntryInteraction(entryKey, "entry-hovered", false)}
          @focus=${() => this.setEntryInteraction(entryKey, "entry-focused", true)}
          @blur=${() => this.setEntryInteraction(entryKey, "entry-focused", false)}
        ></a>`
      : nothing;
  }
}
