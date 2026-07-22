import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * A titled frame around a slot: a gray border with a small uppercase,
 * muted label overlapping the top edge (fieldset/legend-style). Generic —
 * the label text is entirely up to the consumer (e.g. "Debug" to visually
 * fence off dev-only chrome from the product UI).
 *
 * @element frame-box
 * @slot - Framed content.
 */
@customElement("frame-box")
export class FrameBox extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        margin-top: 0.5rem;
      }
      .frame {
        min-width: 0;
        margin: 0;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.75rem;
      }
      .label {
        padding: 0 0.5rem;
        background: var(--ui-surface, #ffffff);
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
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ui-text-muted, #64748b);
      }
    `,
  ];

  /** The overlapping title label, e.g. "Debug". */
  @property() label = "";

  override render() {
    return html`
      <fieldset class="frame">
        ${this.label ? html`<legend class="label">${this.label}</legend>` : null}
        <slot></slot>
      </fieldset>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "frame-box": FrameBox;
  }
}
