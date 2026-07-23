import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * Form footer button bar with a fixed action order for internal apps: the
 * primary (submit) button is always rightmost, the secondary (cancel) button
 * sits to its immediate left, and an optional tertiary/destructive action is
 * pinned to the far left. The order is enforced by the component regardless of
 * the source order the buttons are authored in, so every form in a product
 * reads the same way.
 *
 * Purely presentational: it lays out whatever controls (usually `ui-button`)
 * are slotted and never intercepts their clicks, `type="submit"`, or events.
 *
 * @element form-actions
 * @slot start - Optional far-left action (e.g. a destructive "Delete").
 * @slot secondary - The secondary/cancel action, placed left of primary.
 * @slot primary - The primary/submit action, always rightmost.
 */
@customElement("form-actions")
export class FormActions extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 0.5rem;
      }
      .start {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-right: auto;
      }
      ::slotted(*) {
        margin: 0;
      }
    `,
  ];

  override render() {
    return html`
      <div class="actions">
        <span class="start"><slot name="start"></slot></span>
        <slot name="secondary"></slot>
        <slot name="primary"></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "form-actions": FormActions;
  }
}
