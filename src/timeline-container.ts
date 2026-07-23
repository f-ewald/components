import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * Vertical timeline: a single connecting line runs down the left edge and each
 * slotted `timeline-entry` places a dot on it. This is a thin layout and
 * semantics wrapper — the entries draw the line segments and dots themselves,
 * so the container adds no gap between them (a gap would break the line).
 * Exposed to assistive technology as a list of events.
 *
 * @element timeline-container
 * @slot - `timeline-entry` elements, in chronological order.
 */
@customElement("timeline-container")
export class TimelineContainer extends LitElement {
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

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "timeline-container": TimelineContainer;
  }
}
