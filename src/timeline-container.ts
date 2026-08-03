import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";
import type { TimelineEntry } from "./timeline-entry.js";

/** How a `timeline-container` arranges its entries. */
export type TimelineLayout = "left" | "alternating";

/**
 * Vertical timeline: a connecting line runs down the entries and each slotted
 * `timeline-entry` places a dot on it. This is a thin layout and semantics
 * wrapper — the entries draw the line segments and dots themselves, so the
 * container adds no gap between them (a gap would break the line). Exposed to
 * assistive technology as a list of events.
 *
 * `layout` chooses where the line runs. `left` (the default) puts it down the
 * left edge with each entry's label inline beside its headline. `alternating`
 * centers it and gives each entry three columns — label, line, body — with the
 * two sides swapping on every second entry, for a presentation timeline rather
 * than an event log.
 *
 * The layout is pushed onto each entry rather than read from here, because a
 * shadow-DOM child cannot style itself against an ancestor portably —
 * `:host-context()` is Chromium-only.
 *
 * @element timeline-container
 * @slot - `timeline-entry` elements, in chronological order.
 */
@customElement("timeline-container")
export class TimelineContainer extends LitElement {
  /** Arrangement of the entries: a left-edge line, or a centered alternating one. */
  @property({ reflect: true }) layout: TimelineLayout = "left";

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "list");
  }

  protected override updated(): void {
    this.#applyLayout();
  }

  /** Mirrors `layout` onto every slotted entry so each can style itself. */
  #applyLayout(): void {
    const alternating = this.layout === "alternating";
    for (const entry of this.querySelectorAll<TimelineEntry>("timeline-entry")) {
      entry.alternating = alternating;
    }
  }

  override render() {
    return html`<slot @slotchange=${this.#applyLayout}></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "timeline-container": TimelineContainer;
  }
}
