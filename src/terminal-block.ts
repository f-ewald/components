import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { tokens } from "./tokens.js";

/** The visual treatment applied to one terminal transcript line. */
export type TerminalLineType = "prompt" | "comment" | "output";

/** One ordered line in the terminal transcript. */
export interface TerminalLine {
  type: TerminalLineType;
  text: string;
}

/**
 * A headless, data-driven terminal transcript shell for short install or usage
 * instructions. Callers provide a flat ordered `lines` array of
 * `TerminalLine` objects, and the component renders each line exactly in that
 * order with a type-driven visual treatment: `"prompt"` lines get a fixed
 * leading `❯` marker in `--ui-primary`, `"comment"` lines render as dim italic
 * guidance, and `"output"` lines render as plain terminal text.
 *
 * The panel deliberately stays dark regardless of the surrounding page theme:
 * it reuses `--ui-tooltip` for the surface and `--ui-tooltip-text` for the
 * main foreground (not `--ui-on-accent` — that token means "text on a solid
 * *semantic* fill" and a theme is free to darken it for a light accent color,
 * whereas `--ui-tooltip`'s own fill stays dark unconditionally), because this
 * is meant to read as "the terminal" rather than as a normal page card that
 * follows the ambient surface palette.
 *
 * An empty `lines` array still renders the bordered, padded shell so consumers
 * can see that an instruction block is present but currently has no transcript
 * content, rather than having the component silently disappear.
 *
 * @element terminal-block
 */
@customElement("terminal-block")
export class TerminalBlock extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .panel {
        box-sizing: border-box;
        margin: 0;
        display: grid;
        gap: 0.25rem;
        overflow-x: auto;
        padding: 0.75rem 1rem;
        border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius, 0.5rem);
        background: var(--ui-tooltip, #0f172a);
        color: var(--ui-tooltip-text, #ffffff);
        font-family: var(
          --ui-font-mono,
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          monospace
        );
        font-size: var(--ui-font-size, 0.875rem);
        line-height: var(--ui-line-height-normal, 1.5);
        white-space: normal;
      }
      .line {
        display: block;
        min-width: 0;
        white-space: pre-wrap;
      }
      .prompt::before {
        content: "❯";
        margin-right: 0.5rem;
        color: var(--ui-primary, #4f46e5);
        font-weight: var(--ui-font-weight-semibold, 600);
      }
      .comment {
        color: rgb(255 255 255 / 0.55);
        font-style: italic;
      }
      @media (forced-colors: active) {
        .panel {
          border: 1px solid CanvasText;
          background: Canvas;
          color: CanvasText;
        }
        .prompt::before {
          color: LinkText;
        }
        .comment {
          color: GrayText;
        }
      }
    `,
  ];

  /**
   * Ordered terminal transcript lines. Each entry is a `{ type, text }`
   * object, and an empty array still renders the visible terminal shell.
   */
  @property({ type: Array }) lines: TerminalLine[] = [];

  override render() {
    return html`<pre class="panel">${repeat(
      this.lines,
      (_line, index) => index,
      (line) => html`<span class=${`line ${line.type}`}>${line.text}</span>`,
    )}</pre>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "terminal-block": TerminalBlock;
  }
}
