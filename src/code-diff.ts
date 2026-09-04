import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { tokens } from "./tokens.js";

/** The visual treatment for one diff line. */
export type CodeDiffLineType = "add" | "del" | "context";

/** One ordered line in the diff body. */
export interface CodeDiffLine {
  /** Whether the line is added, removed, or unchanged context. */
  type: CodeDiffLineType;
  /** The plain code text for the line, without the rendered diff prefix. */
  text: string;
}

/**
 * A compact, read-only code diff viewer: a bordered panel with a header bar
 * for `filename` and `stat`, followed by a numbered `<pre>` listing of
 * `lines`. Each {@link CodeDiffLine} renders as `"add"`, `"del"`, or
 * `"context"` with fixed `"+ "` / `"- "` / `"  "` prefixes so the diff
 * remains understandable even when color is unavailable.
 *
 * Added and removed rows reuse `--ui-success` / `--ui-danger` for their text
 * and low-alpha background washes, while the shell itself reuses
 * `--ui-font-mono`, `--ui-border`, and `--ui-surface`. The caller owns the
 * data shape entirely: `filename` and `stat` are passed through verbatim, and
 * `lines` is a flat ordered array of `{ type, text }` objects.
 *
 * @element code-diff
 */
@customElement("code-diff")
export class CodeDiff extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .panel {
        overflow: hidden;
        border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius, 0.5rem);
        background: var(--ui-surface, #ffffff);
        color: var(--ui-text, #0f172a);
        font-family: var(
          --ui-font-mono,
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          monospace
        );
        font-size: var(--ui-font-size-sm, 0.75rem);
        line-height: var(--ui-line-height-normal, 1.5);
      }
      .bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.5rem 0.75rem;
        border-bottom: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        color: var(--ui-text-muted, #64748b);
        font-variant-numeric: var(--ui-numeric, normal);
      }
      .filename {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .stat {
        flex: 0 0 auto;
        white-space: nowrap;
      }
      .body {
        margin: 0;
        overflow-x: auto;
        background: var(--ui-surface, #ffffff);
      }
      .line {
        display: grid;
        grid-template-columns: 4ch minmax(0, 1fr);
      }
      .number {
        box-sizing: border-box;
        padding: 0.25rem 0.5rem 0.25rem 0;
        border-right: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        color: var(--ui-text-muted, #64748b);
        font-variant-numeric: tabular-nums;
        text-align: right;
        user-select: none;
      }
      .text {
        min-width: 0;
        padding: 0.25rem 0.75rem;
      }
      .line.context {
        color: var(--ui-text-muted, #64748b);
      }
      /* Derived from the light theme's --ui-success/#16a34a and
         --ui-danger/#dc2626 fallbacks; there is no dedicated diff-wash token. */
      .line.add {
        background: rgb(22 163 74 / 0.1);
        color: var(--ui-success, #16a34a);
      }
      .line.del {
        background: rgb(220 38 38 / 0.1);
        color: var(--ui-danger, #dc2626);
      }
      @media (forced-colors: active) {
        .panel {
          border: 1px solid CanvasText;
          background: Canvas;
        }
        .bar,
        .number {
          border-color: CanvasText;
        }
        .line {
          background: transparent;
        }
      }
    `,
  ];

  /** The filename shown in the header bar's left side. */
  @property() filename = "";

  /** The caller-supplied stat summary shown in the header bar's right side. */
  @property() stat = "";

  /** Ordered diff lines, each rendered with its type-driven prefix and styling. */
  @property({ type: Array }) lines: CodeDiffLine[] = [];

  override render() {
    return html`
      <div class="panel">
        <!-- Keep the bar even when both values are blank so the shell stays stable. -->
        <div class="bar">
          <span class="filename">${this.filename}</span>
          <span class="stat">${this.stat}</span>
        </div>
        <pre class="body">${repeat(
          this.lines,
          // Fixed diffs do not reorder lines, so the display index is the deliberate stable key.
          (_line, index) => index,
          (line, index) => {
            const prefix = line.type === "add" ? "+ " : line.type === "del" ? "- " : "  ";
            return html`<span class=${`line ${line.type}`}><span class="number" aria-hidden="true">${index + 1}</span><span class="text">${prefix}${line.text}</span></span>`;
          },
        )}</pre>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "code-diff": CodeDiff;
  }
}
