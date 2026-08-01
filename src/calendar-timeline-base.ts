import { LitElement, html, nothing } from "lit";
import { queryAssignedElements, state } from "lit/decorators.js";
import type { CalendarEntry } from "./calendar-entry.js";
import {
  CALENDAR_ENTRY_ATTRIBUTES,
  overlapsRange,
  readCalendarEntryElement,
  resolveTimedEntry,
  type LanedEntry,
  type ResolvedTimedEntry,
} from "./utils/calendar.js";

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
      .filter((entry) => overlapsRange(entry, rangeStart, rangeEnd));
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
