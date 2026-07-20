import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { StatusPillColor } from "./status-pill.js";
import { tokens } from "./tokens.js";

/**
 * Declarative metadata for one calendar event, consumed by a parent
 * `calendar-month` or `calendar-year`. Read-only/non-interactive; renders
 * nothing itself.
 *
 * @element calendar-entry
 * @slot - Reserved for future rich content; unused today.
 */
@customElement("calendar-entry")
export class CalendarEntry extends LitElement {
  /** Inclusive start date, `"YYYY-MM-DD"`. */
  @property({ reflect: true }) start = "";

  /** Inclusive end date, `"YYYY-MM-DD"`. Falls back to `start` when unset (single-day entry). */
  @property({ reflect: true }) end = "";

  /** Text shown on the entry's first visible day within a given month. */
  @property({ reflect: true }) label = "";

  /** Color variant, reusing `status-pill`'s palette. */
  @property({ reflect: true }) color: StatusPillColor = "neutral";

  /** Optional link target; the parent renders the entry as an `<a>` when set. */
  @property({ reflect: true }) href?: string;

  static override styles = [
    tokens,
    css`
      :host {
        display: none;
      }
    `,
  ];

  /** Keeps the metadata host hidden while retaining any slotted content. */
  protected override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "calendar-entry": CalendarEntry;
  }
}
