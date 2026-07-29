import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * Full-viewport split layout: a user-supplied photo fills one half, the
 * default slot (typically a sign-in/sign-up form) fills the other. Below the
 * shared 48rem breakpoint the photo hides so the slotted content spans the
 * full width.
 *
 * Give the host a height the same way as `app-shell` (e.g. `height: 100vh`).
 *
 * @element split-hero
 * @slot - Form or other content for the non-image half.
 */
@customElement("split-hero")
export class SplitHero extends LitElement {
  /** URL of the image filling the visual half; omit to render content full-width. */
  @property() src = "";

  /** Accessible alternative text for the image; leave empty for a decorative photo. */
  @property() alt = "";

  static override styles = [
    tokens,
    css`
      :host {
        display: flex;
        block-size: 100%;
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
      .visual {
        flex: 1 1 0;
        min-width: 0;
        margin: 0;
        background: var(--ui-surface-muted, #f8fafc);
      }
      .visual img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .content {
        flex: 1 1 0;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        padding: 2rem;
        overflow-y: auto;
        background: var(--ui-surface, #ffffff);
        color: var(--ui-text, #0f172a);
      }
      .content ::slotted(*) {
        width: 100%;
        max-width: 25rem;
      }
      @media (max-width: 48rem) {
        .visual {
          display: none;
        }
        .content {
          padding: 1.5rem;
        }
      }
    `,
  ];

  override render() {
    return html`
      ${this.src ? html`<figure class="visual"><img src=${this.src} alt=${this.alt} /></figure>` : ""}
      <div class="content"><slot></slot></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "split-hero": SplitHero;
  }
}
