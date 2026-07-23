import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "./relative-time.js";
import { tokens } from "./tokens.js";

/**
 * One event on a `timeline-container`: a dot on the vertical line, an optional
 * headline, a relative timestamp ("3 hours ago"), and freely nested content.
 * The connecting line is drawn here — its segment above the dot is hidden on
 * the first entry and the segment below is hidden on the last, so the line caps
 * exactly at the first and last dots. Only meaningful inside a
 * `timeline-container`; demonstrated through it.
 *
 * @element timeline-entry
 * @slot headline - Optional headline/title for the event.
 * @slot - The event content; nest any elements here.
 */
@customElement("timeline-entry")
export class TimelineEntry extends LitElement {
  /** ISO 8601 or SQLite datetime string, rendered as a relative time. */
  @property() datetime: string | null = null;

  /** Whether the headline slot currently has assigned content. */
  @state() private _hasHeadline = false;

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
      }
      .entry {
        display: flex;
        gap: 0.75rem;
      }
      .rail {
        position: relative;
        flex: 0 0 auto;
        width: 0.75rem;
      }
      .line {
        position: absolute;
        left: 50%;
        width: 2px;
        transform: translateX(-50%);
        background: var(--ui-border, #e2e8f0);
      }
      .line-top {
        top: 0;
        height: 0.5rem;
      }
      .line-bottom {
        top: 0.5rem;
        bottom: 0;
      }
      .dot {
        position: absolute;
        top: 0.125rem;
        left: 50%;
        width: 0.75rem;
        height: 0.75rem;
        transform: translateX(-50%);
        border-radius: 9999px;
        /* Same primary-token gradient as map-circle/user-avatar, lighter on top. */
        background: linear-gradient(
          to bottom,
          color-mix(in srgb, var(--ui-primary, #4f46e5) 70%, #ffffff) 0%,
          color-mix(in srgb, var(--ui-primary, #4f46e5) 70%, #000000) 100%
        );
      }
      :host(:first-child) .line-top {
        display: none;
      }
      :host(:last-child) .line-bottom {
        display: none;
      }
      .body {
        flex: 1 1 auto;
        min-width: 0;
        padding-bottom: 1.5rem;
      }
      :host(:last-child) .body {
        padding-bottom: 0;
      }
      .head {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .headline {
        font-weight: var(--ui-font-weight-semibold, 600);
        font-size: var(--ui-font-size, 0.875rem);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text, #0f172a);
      }
      .headline.empty {
        display: none;
      }
      .time {
        font-size: var(--ui-font-size-sm, 0.75rem);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text-muted, #64748b);
      }
      .content {
        margin-top: 0.25rem;
        font-size: var(--ui-font-size, 0.875rem);
        line-height: var(--ui-line-height-normal, 1.5);
        color: var(--ui-text, #0f172a);
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "listitem");
  }

  /** Collapses the headline when nothing is slotted so the time sits alone. */
  private _onHeadlineSlotChange(event: Event): void {
    this._hasHeadline = (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  }

  override render() {
    return html`
      <div class="entry">
        <div class="rail" aria-hidden="true">
          <span class="line line-top"></span>
          <span class="line line-bottom"></span>
          <span class="dot"></span>
        </div>
        <div class="body">
          <div class="head">
            <span class="headline ${this._hasHeadline ? "" : "empty"}">
              <slot name="headline" @slotchange=${this._onHeadlineSlotChange}></slot>
            </span>
            ${this.datetime
              ? html`<relative-time class="time" datetime=${this.datetime}></relative-time>`
              : nothing}
          </div>
          <div class="content"><slot></slot></div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "timeline-entry": TimelineEntry;
  }
}
