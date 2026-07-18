import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { parseTimestamp, formatRelativeTime } from "./utils/time.js";

const REFRESH_INTERVAL_MS = 60_000;

/**
 * Inline relative-time display (e.g. "3 hours ago"). Accepts either a
 * standard ISO 8601 string or a SQLite `datetime('now')` string
 * ("YYYY-MM-DD HH:MM:SS", UTC, no zone marker) via `datetime`. Shows the
 * full date/time in the viewer's local timezone as a hover tooltip, and
 * re-renders on an interval so the text stays current while visible.
 *
 * @element relative-time
 */
@customElement("relative-time")
export class RelativeTime extends LitElement {
  static override styles = css`
    :host {
      display: inline;
    }
  `;

  /** Timestamp to render, relative to now. */
  @property() datetime: string | null = null;

  @state() private _now = Date.now();

  private _timer: ReturnType<typeof setInterval> | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this._timer = setInterval(() => {
      this._now = Date.now();
    }, REFRESH_INTERVAL_MS);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this._timer != null) clearInterval(this._timer);
    this._timer = null;
  }

  override render() {
    if (!this.datetime) return html``;
    const date = parseTimestamp(this.datetime);
    if (Number.isNaN(date.getTime())) return html`${this.datetime}`;
    return html`<span title=${date.toLocaleString()}>${formatRelativeTime(date, this._now)}</span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "relative-time": RelativeTime;
  }
}
