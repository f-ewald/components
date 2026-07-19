import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { formatDuration, type DurationFormat } from "./utils/duration.js";

const TICK_INTERVAL_MS = 1000;

/**
 * Per-second ticking count-up timer, e.g. a live "running for 12s" or
 * "Sleeping for 3 seconds" indicator. Renders nothing while `since` is unset
 * or unparseable.
 *
 * @element live-timer
 */
@customElement("live-timer")
export class LiveTimer extends LitElement {
  static override styles = css`
    :host {
      display: inline;
    }
  `;

  /** ISO-8601 start instant; elapsed time is measured from here. */
  @property() since: string | null = null;
  /** `"seconds"` -> "1 second", "12 seconds"; `"compact"` -> "12s", "3m 12s", "1h 03m 12s". */
  @property() format: DurationFormat = "seconds";
  /** Text rendered before the formatted value. */
  @property() override prefix = "";
  /** Text rendered after the formatted value. */
  @property() suffix = "";

  @state() private _now = Date.now();

  private _timer: ReturnType<typeof setInterval> | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this._timer = setInterval(() => {
      this._now = Date.now();
    }, TICK_INTERVAL_MS);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this._timer != null) clearInterval(this._timer);
    this._timer = null;
  }

  override render() {
    if (!this.since) return html``;
    const start = Date.parse(this.since);
    if (Number.isNaN(start)) return html``;
    const elapsed = Math.max(0, this._now - start);
    return html`${this.prefix}${formatDuration(elapsed, this.format)}${this.suffix}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "live-timer": LiveTimer;
  }
}
