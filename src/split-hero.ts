import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * Full-viewport split layout: a user-supplied photo fills one half, the
 * default slot (typically a sign-in/sign-up form) fills the other. Below the
 * shared 48rem breakpoint the photo becomes a blurred, full-bleed backdrop
 * behind a solid content card instead of disappearing outright.
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
        position: relative;
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
      .backdrop {
        display: none;
      }
      .content-inner {
        position: relative;
        z-index: 1;
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
        .backdrop {
          display: block;
          position: absolute;
          inset: 0;
          z-index: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: blur(2.5rem);
          pointer-events: none;
        }
        .content-inner.card {
          background: var(--ui-surface, #ffffff);
          border-radius: var(--ui-radius, 0.5rem);
          box-shadow: var(
            --ui-shadow-lg,
            0 20px 25px -5px rgb(0 0 0 / 0.1),
            0 8px 10px -6px rgb(0 0 0 / 0.1)
          );
          padding: 1.5rem;
        }
      }
    `,
  ];

  override render() {
    const hasPhoto = Boolean(this.src);
    return html`
      ${hasPhoto ? html`<figure class="visual"><img src=${this.src} alt=${this.alt} /></figure>` : ""}
      <div class="content">
        ${hasPhoto ? html`<img class="backdrop" src=${this.src} alt="" aria-hidden="true" />` : ""}
        <div class="content-inner ${hasPhoto ? "card" : ""}"><slot></slot></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "split-hero": SplitHero;
  }
}
