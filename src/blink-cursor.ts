import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * A small inline blinking cursor glyph for terminal- or editor-styled
 * headings, prompts, and status lines. It renders its own decorative
 * character so consumers can append it directly to adjacent text while
 * inheriting the surrounding typography.
 *
 * The cursor uses the shared `--ui-primary` accent color so it reads as an
 * active insertion point across themes. Change `char` to swap the glyph (for
 * example `|` or `▋`). Under `prefers-reduced-motion` the blink stops and the
 * cursor remains visible.
 *
 * @element blink-cursor
 */
@customElement("blink-cursor")
export class BlinkCursor extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: inline-block;
        line-height: var(--ui-line-height-glyph, 1);
        color: var(--ui-primary, #4f46e5);
      }

      .cursor {
        display: inline-block;
        white-space: pre;
        animation: blink-cursor-blink 1s steps(1, end) infinite;
      }

      @keyframes blink-cursor-blink {
        0%,
        50% {
          opacity: 1;
        }
        50.01%,
        100% {
          opacity: 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .cursor {
          animation: none;
          opacity: 1;
        }
      }
    `,
  ];

  /** Character shown for the cursor; any single character or short string such as `|` or `▋` works. */
  @property() char = "▋";

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("aria-hidden", "true");
  }

  override render() {
    return html`<span class="cursor">${this.char}</span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "blink-cursor": BlinkCursor;
  }
}
