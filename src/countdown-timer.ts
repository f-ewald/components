import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { formatDuration, type DurationFormat } from "./utils/duration.js";

const TICK_INTERVAL_MS = 1000;

/**
 * Per-second ticking count-down timer, e.g. a live "Retrying in 3 seconds"
 * indicator while waiting to retry a failed request. Renders nothing while
 * `until` is unset or unparseable. Remaining time is clamped to zero — it
 * never goes negative once the target instant has passed.
 *
 * @element countdown-timer
 */
@customElement("countdown-timer")
export class CountdownTimer extends LitElement {
  /** ISO-8601 target instant; remaining time is measured until here. */
  @property() until: string | null = null;
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
    if (!this.until) return html``;
    const target = Date.parse(this.until);
    if (Number.isNaN(target)) return html``;
    const remaining = Math.max(0, target - this._now);
    return html`${this.prefix}${formatDuration(remaining, this.format)}${this.suffix}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "countdown-timer": CountdownTimer;
  }
}
