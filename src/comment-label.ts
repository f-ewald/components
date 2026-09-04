import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * A code-comment-style eyebrow line for section chrome in terminal- or
 * editor-themed pages. It renders a colored comment marker (`##` by default)
 * before muted slotted text, so `<comment-label>the_whole_idea</comment-label>`
 * reads like a short section kicker. Set `prefix="//"` and `italic` for a
 * closing or footer quote line that keeps the marker upright while the message
 * itself turns italic.
 *
 * @element comment-label
 * @slot - The label text, such as a section eyebrow or a longer closing quote.
 */
@customElement("comment-label")
export class CommentLabel extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        color: var(--ui-text-muted, #64748b);
        font-family: var(--ui-font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-semibold, 600);
        line-height: var(--ui-line-height-tight, 1.25);
        letter-spacing: var(--ui-tracking-wide, 0.04em);
        text-transform: var(--ui-label-transform, none);
      }
      :host([italic]) {
        font-style: italic;
      }
      .label {
        display: flex;
        align-items: baseline;
        gap: 0.25rem;
      }
      .prefix {
        flex: 0 0 auto;
        color: var(--ui-primary, #4f46e5);
        font-style: normal;
      }
      .content {
        flex: 1 1 auto;
        min-width: 0;
      }
    `,
  ];

  /** Comment marker rendered before the slotted label text. */
  @property() override prefix = "##";

  /** Renders the slotted label text in italics while leaving the prefix upright. */
  @property({ type: Boolean, reflect: true }) italic = false;

  override render() {
    const hasPrefix = this.prefix.length > 0;
    return html`
      <span class="label">
        ${hasPrefix ? html`<span class="prefix" aria-hidden="true">${this.prefix}</span>` : nothing}
        <span class="content"><slot></slot></span>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "comment-label": CommentLabel;
  }
}
