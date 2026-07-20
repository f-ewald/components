import { LitElement, css, html, nothing } from "lit";
import type { TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * A borderless button wrapping a passed-in icon, with a rounded
 * hover-highlight background. Use for a low-emphasis affordance next to
 * content it acts on (e.g. an "Edit" pencil at the end of a table row)
 * where a bordered `ui-button` would be too heavy.
 *
 * @element icon-button
 * @fires click - Native click, bubbling as usual — listen on the element itself.
 */
@customElement("icon-button")
export class IconButton extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: inline-flex;
      }
      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        padding: 0;
        border: none;
        border-radius: var(--ui-radius-sm, 0.25rem);
        background: none;
        color: var(--ui-text-muted, #64748b);
        cursor: pointer;
      }
      button:hover:not(:disabled) {
        background: var(--ui-surface-muted, #f8fafc);
        color: var(--ui-text, #0f172a);
      }
      button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      button:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
    `,
  ];

  /** Pre-rendered icon template, e.g. `iconPencil(16)` from this package's icon set. */
  @property({ attribute: false }) icon: TemplateResult | null = null;
  /** Required accessible label, applied as `aria-label`/`title`. */
  @property() label = "";
  /** Disables the button and dims it. */
  @property({ type: Boolean }) disabled = false;

  override render() {
    return html`
      <button type="button" aria-label=${this.label} title=${this.label} ?disabled=${this.disabled}>
        ${this.icon ?? nothing}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "icon-button": IconButton;
  }
}
