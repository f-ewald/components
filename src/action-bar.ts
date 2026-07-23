import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * Toolbar that sits directly above a list or table: a left cluster for
 * search and filters and a right cluster for record actions (create, delete,
 * bulk actions). It's a presentational layout container only — drop any
 * controls (`autocomplete-input`, `multi-select`, `ui-button`, …) into the
 * `start` and `end` slots; the bar owns none of their behavior and adds no
 * search field of its own. The two clusters wrap onto separate rows when the
 * bar is too narrow.
 *
 * @element action-bar
 * @slot start - Left cluster: search and filter controls.
 * @slot end - Right cluster: record actions (create, delete, …).
 */
@customElement("action-bar")
export class ActionBar extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
      }
      .start {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        flex: 1 1 16rem;
        min-width: 0;
      }
      .end {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        flex: 0 0 auto;
        margin-left: auto;
      }
    `,
  ];

  override render() {
    return html`
      <div class="bar">
        <div class="start"><slot name="start"></slot></div>
        <div class="end"><slot name="end"></slot></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "action-bar": ActionBar;
  }
}
