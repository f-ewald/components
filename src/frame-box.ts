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
        position: relative;
        margin-top: 0.6rem;
      }
      .frame {
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 1rem 0.75rem 0.75rem;
      }
      .label {
        position: absolute;
        top: -0.55rem;
        left: 0.6rem;
        padding: 0 0.4rem;
        background: var(--ui-surface, #fff);
        font-size: 0.65rem;
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
      <div class="frame">
        ${this.label ? html`<span class="label">${this.label}</span>` : null}
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "frame-box": FrameBox;
  }
}
