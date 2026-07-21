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
 * @slot title - Plain-text title shown instead of the `label` fallback.
 * @slot detail - Repeatable plain-text details rendered inside the shared body spanning all remaining days.
 * @slot footer - Plain-text ending note pinned to the bottom of the shared body.
 */
@customElement("calendar-entry")
export class CalendarEntry extends LitElement {
  /** Inclusive start date, `"YYYY-MM-DD"`. */
  @property({ reflect: true }) start = "";

  /** Inclusive end date, `"YYYY-MM-DD"`. Falls back to `start` when unset (single-day entry). */
  @property({ reflect: true }) end = "";

  /** Fallback title used when no `title` slot is provided. */
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

  /** Keeps the metadata host hidden while exposing named text slots to the parent calendar. */
  protected override render() {
    return html`<slot name="title"></slot><slot name="detail"></slot><slot name="footer"></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "calendar-entry": CalendarEntry;
  }
}
