import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "./relative-time.js";
import { tokens } from "./tokens.js";
import type { StatusPillColor } from "./status-pill.js";

/**
 * One event on a `timeline-container`: a dot on the vertical line, an optional
 * headline, a relative timestamp ("3 hours ago"), and freely nested content.
 * The connecting line is drawn here — its segment above the dot is hidden on
 * the first entry and the segment below is hidden on the last, so the line caps
 * exactly at the first and last dots. Only meaningful inside a
 * `timeline-container`; demonstrated through it.
 *
 * `datetime` is the entry's one timestamp. A nested element that has its own
 * timestamp prop (e.g. `chat-message`'s `timestamp`) should leave it unset —
 * setting both renders the same time twice.
 *
 * `label` is a free-text alternative for a timeline whose axis is not a wall
 * clock — a year, an era, a phase. It wins over `datetime` when both are set.
 * Slot `label` instead when it needs its own styling, since a property is
 * rendered inside this component's shadow DOM and cannot be reached from
 * outside.
 *
 * `alternating` is set by `timeline-container` and should not be set by hand:
 * it switches the entry to three columns — label, line, body — with the sides
 * swapping on every second entry. The entry fills whatever height it is given,
 * so the line spans it rather than only its content — do not override the
 * host's `display` from outside, since a light-DOM rule beats the `:host`
 * declaration this relies on.
 *
 * The dot's `color` types the entry using the shared status-pill palette —
 * `primary` by default, plus `neutral`, `info`, `success`, `warning`, and
 * `danger`.
 *
 * Set `compact` for dense, one-line system-status entries: it tightens the
 * vertical spacing and renders the content smaller and muted.
 *
 * Set `running` to replace the dot with an animated gray ring spinner,
 * indicating the entry represents in-progress work; `color` has no visible
 * effect while `running` is set.
 *
 * @element timeline-entry
 * @slot headline - Optional headline/title for the event.
 * @slot label - Optional replacement for the `label` property, for a label that
 *   needs its own styling.
 * @slot - The event content; nest any elements here.
 */
@customElement("timeline-entry")
export class TimelineEntry extends LitElement {
  /** ISO 8601 or SQLite datetime string, rendered as a relative time. */
  @property() datetime: string | null = null;

  /** Free-text label shown in place of the relative time; wins over `datetime`. */
  @property() label: string | null = null;

  /**
   * Three-column alternating presentation. Set by `timeline-container` from its
   * own `layout`; setting it directly is not supported.
   */
  @property({ type: Boolean, reflect: true }) alternating = false;

  /**
   * Visual type of the entry's dot, from the shared status-pill palette:
   * `primary` (default), `neutral`, `info`, `success`, `warning`, or `danger`.
   */
  @property() color: StatusPillColor = "primary";

  /**
   * Dense, one-line presentation for system-status entries: tighter vertical
   * spacing and smaller, muted content.
   */
  @property({ type: Boolean, reflect: true }) compact = false;

  /**
   * Shows an animated ring spinner in place of the dot, indicating the entry
   * represents in-progress work. Overrides `color` while set — the spinner
   * always uses the muted/gray palette.
   */
  @property({ type: Boolean, reflect: true }) running = false;

  /** Whether the headline slot currently has assigned content. */
  @state() private _hasHeadline = false;

  /** Whether the label slot currently has assigned content. */
  @state() private _hasLabel = false;

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
        border-radius: var(--ui-radius-pill, 9999px);
        /* Same lighter-on-top token gradient as map-circle/user-avatar; the
           base color is swapped per the color property via the private
           --_dot var. */
        background: linear-gradient(
          to bottom,
          color-mix(in srgb, var(--_dot, var(--ui-primary, #4f46e5)) 70%, #ffffff) 0%,
          color-mix(in srgb, var(--_dot, var(--ui-primary, #4f46e5)) 70%, #000000) 100%
        );
      }
      .dot.neutral {
        --_dot: var(--ui-text-muted, #64748b);
      }
      .dot.info {
        --_dot: var(--ui-info, #0ea5e9);
      }
      .dot.primary {
        --_dot: var(--ui-primary, #4f46e5);
      }
      .dot.success {
        --_dot: var(--ui-success, #16a34a);
      }
      .dot.warning {
        --_dot: var(--ui-warning, #d97706);
      }
      .dot.danger {
        --_dot: var(--ui-danger, #dc2626);
      }
      .spinner {
        position: absolute;
        top: 0.125rem;
        left: 0;
        display: block;
        width: 0.75rem;
        height: 0.75rem;
        border-radius: var(--ui-radius-pill, 9999px);
        /* Opaque backing so the connecting line is masked exactly like it is
           behind the solid .dot, instead of showing through the ring's
           hollow center and corners. */
        background: var(--ui-surface, #ffffff);
      }
      .spinner svg {
        display: block;
        width: 100%;
        height: 100%;
      }
      .spinner-track {
        fill: none;
        stroke: color-mix(in srgb, var(--ui-text-muted, #64748b) 25%, transparent);
        stroke-width: 3;
      }
      .spinner-arc {
        fill: none;
        stroke: var(--ui-text-muted, #64748b);
        stroke-width: 3;
        stroke-linecap: round;
        /* r=9 gives a 56.55-unit circumference. Keeping the dash and gap
           total equal to that circumference makes the fixed-length arc loop
           seamlessly while its dash offset advances around the static ring. */
        stroke-dasharray: 42.41 14.14;
        animation: spinner-orbit 0.8s linear infinite;
      }
      @keyframes spinner-orbit {
        from {
          stroke-dashoffset: 0;
        }
        to {
          stroke-dashoffset: -56.55;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .spinner-arc {
          animation: none;
        }
      }
      @media (forced-colors: active) {
        .spinner {
          background: Canvas;
        }
        .spinner-track {
          stroke: GrayText;
        }
        .spinner-arc {
          stroke: CanvasText;
        }
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
      :host([compact]) .body {
        padding-bottom: 0.5rem;
      }
      :host([compact]:last-child) .body {
        padding-bottom: 0;
      }
      :host([compact]) .content {
        margin-top: 0.125rem;
        font-size: var(--ui-font-size-sm, 0.75rem);
        color: var(--ui-text-muted, #64748b);
      }
      .time.empty {
        display: none;
      }

      /*
       * Alternating layout. minmax(0, 1fr) rather than a bare 1fr: an
       * auto-sized track grows to its content's minimum width, which would
       * push the middle column - and with it the line and dot - off center.
       */
      /* A grid host so its single auto row stretches to whatever height the
         consumer gives the entry. The line is drawn inside that row, so
         without this it spans only the content and leaves gaps between
         consecutive entries. Flex does not do this: with a content-sized
         height there is no free space for flex-grow to distribute. */
      :host([alternating]) {
        display: grid;
      }
      :host([alternating]) .entry {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: center;
        column-gap: 1.5rem;
      }
      :host([alternating]) .meta,
      :host([alternating]) .rail,
      :host([alternating]) .body {
        grid-row: 1;
      }
      :host([alternating]) .meta {
        grid-column: 1;
        justify-self: end;
        text-align: right;
      }
      :host([alternating]) .rail {
        grid-column: 2;
        align-self: stretch;
      }
      :host([alternating]) .body {
        grid-column: 3;
        padding: 1.5rem 0;
      }
      :host([alternating]:nth-child(even)) .meta {
        grid-column: 3;
        justify-self: start;
        text-align: left;
      }
      :host([alternating]:nth-child(even)) .body {
        grid-column: 1;
      }
      /* The dot marks the middle of the entry rather than its headline, and
         the line runs the entry's full height so consecutive entries join. */
      :host([alternating]) .dot {
        top: 50%;
        transform: translate(-50%, -50%);
      }
      :host([alternating]) .spinner {
        top: 50%;
        transform: translateY(-50%);
      }
      :host([alternating]) .line-top {
        top: 0;
        height: 50%;
      }
      :host([alternating]) .line-bottom {
        top: 50%;
        bottom: 0;
      }
      :host([alternating]) .time {
        font-size: var(--ui-font-size-lg, 1rem);
        font-weight: var(--ui-font-weight-medium, 500);
        letter-spacing: var(--ui-tracking-wide, 0.04em);
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "listitem");
  }

  /**
   * The entry's one time/label element: a slotted label, else the `label`
   * property, else a relative time. Placed inline beside the headline in the
   * default layout and in its own column when alternating.
   */
  private _renderMeta() {
    const fallback =
      this.label !== null && this.label !== ""
        ? html`${this.label}`
        : this.datetime
          ? html`<relative-time datetime=${this.datetime}></relative-time>`
          : nothing;
    // Collapsed rather than omitted when there is nothing to show: the slot has
    // to stay in the tree for its slotchange to report late-assigned content,
    // but an empty span would otherwise still claim the head row's gap.
    const empty = fallback === nothing && !this._hasLabel;
    return html`<span class="time ${empty ? "empty" : ""}">
      <slot name="label" @slotchange=${this._onLabelSlotChange}>${fallback}</slot>
    </span>`;
  }

  /** Tracks whether the label slot has content, so an empty one can collapse. */
  private _onLabelSlotChange(event: Event): void {
    this._hasLabel = (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  }

  /** Collapses the headline when nothing is slotted so the time sits alone. */
  private _onHeadlineSlotChange(event: Event): void {
    this._hasHeadline = (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  }

  override render() {
    return html`
      <div class="entry">
        ${this.alternating ? html`<div class="meta">${this._renderMeta()}</div>` : nothing}
        <div class="rail" aria-hidden="true">
          <span class="line line-top"></span>
          <span class="line line-bottom"></span>
          ${this.running
            ? html`
                <span class="spinner">
                  <svg viewBox="0 0 24 24">
                    <circle class="spinner-track" cx="12" cy="12" r="9"></circle>
                    <circle class="spinner-arc" cx="12" cy="12" r="9"></circle>
                  </svg>
                </span>
              `
            : html`<span class="dot ${this.color}"></span>`}
        </div>
        <div class="body">
          <div class="head">
            <span class="headline ${this._hasHeadline ? "" : "empty"}">
              <slot name="headline" @slotchange=${this._onHeadlineSlotChange}></slot>
            </span>
            ${this.alternating ? nothing : this._renderMeta()}
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
