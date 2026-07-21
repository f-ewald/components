import { LitElement, css, html, nothing } from "lit";
import { customElement, property, queryAssignedElements, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { CalendarEntry } from "./calendar-entry.js";
import "./calendar-month.js";
import { tokens } from "./tokens.js";
import {
  CALENDAR_ENTRY_ATTRIBUTES,
  daysInMonth,
  overlapsRange,
  readCalendarEntryElement,
  resolveEntry,
  type ResolvedCalendarEntry,
} from "./utils/calendar.js";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * A full year of `calendar-month` blocks, generated from declarative
 * `calendar-entry` children. Each entry is re-projected into the
 * `calendar-month` blocks it overlaps as a freshly-created `calendar-entry`
 * element — the original elements stay slotted here and are never moved,
 * since a DOM node can only have one parent. Read-only.
 *
 * @element calendar-year
 * @slot - Declarative `calendar-entry` elements spanning the displayed year.
 */
@customElement("calendar-year")
export class CalendarYear extends LitElement {
  /** Calendar year to render all 12 months for, e.g. `2026`. */
  @property({ type: Number, reflect: true }) year: number = new Date().getFullYear();

  @queryAssignedElements({ selector: "calendar-entry" })
  private readonly _entryElements!: CalendarEntry[];

  /** Bumped whenever entry elements, attributes, or slotted text change to force a re-render. */
  @state() private _entriesVersion = 0;

  private _entriesObserver?: MutationObserver;

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        font-family: var(--ui-font, ui-sans-serif, system-ui, sans-serif);
      }
      .year {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 1.5rem;
      }
      slot {
        display: none;
      }
    `,
  ];

  /**
   * Watches slotted `calendar-entry` attributes and title/detail text.
   * Neither reflected-property changes nor edits inside assigned elements
   * fire this component's `slotchange`, so a subtree observer keeps the
   * projected month entries synchronized.
   */
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

  /** Releases the mutation observer when the element disconnects. */
  override disconnectedCallback(): void {
    this._entriesObserver?.disconnect();
    super.disconnectedCallback();
  }

  /** Re-renders when declarative `calendar-entry` children are added or removed. */
  private _handleSlotChange(): void {
    this._entriesVersion++;
  }

  protected override render() {
    const entries = this._entryElements
      .map(readCalendarEntryElement)
      .map(resolveEntry)
      .filter((entry): entry is ResolvedCalendarEntry => entry !== null);

    return html`
      <div class="year">
        ${repeat(
          MONTHS,
          (m) => m,
          (m) => {
            const monthStart = new Date(this.year, m - 1, 1);
            const monthEnd = new Date(this.year, m - 1, daysInMonth(this.year, m));
            const monthEntries = entries.filter((entry) => overlapsRange(entry, monthStart, monthEnd));
            return html`
              <calendar-month .year=${this.year} .month=${m}>
                ${repeat(
                  monthEntries,
                  (entry) =>
                    `${entry.start}|${entry.end}|${entry.label}|${(entry.details ?? []).join("|")}|${entry.footer ?? ""}|${entry.color}|${entry.href ?? ""}`,
                  (entry) => html`
                    <calendar-entry
                      start=${entry.start}
                      end=${entry.end}
                      label=${entry.label}
                      color=${entry.color}
                      href=${ifDefined(entry.href)}
                    >
                      ${(entry.details ?? []).map((detail) => html`<span slot="detail">${detail}</span>`)}
                      ${entry.footer ? html`<span slot="footer">${entry.footer}</span>` : nothing}
                    </calendar-entry>
                  `,
                )}
              </calendar-month>
            `;
          },
        )}
      </div>
      <slot @slotchange=${this._handleSlotChange}></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "calendar-year": CalendarYear;
  }
}
