import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";
import { parseFrontMatter, formatFrontMatterValue } from "./utils/front-matter.js";
import "./tab-bar.js";
import "./tab-item.js";
import "./text-area.js";
import "./markdown-view.js";
import "./frame-box.js";

/**
 * GitHub-style markdown editor: a "Write" tab holding a plain textarea and a
 * "Preview" tab rendering the markdown body (via `markdown-view`). Leading
 * YAML front matter (a `---`-delimited block) is detected, parsed, and shown
 * as a key-value table above the rendered body rather than as raw text.
 *
 * @element markdown-editor
 * @fires input - Fires on every keystroke in the Write tab; detail: { value: string }.
 * @fires change - Native change semantics (on blur, if the value changed); detail: { value: string }.
 */
@customElement("markdown-editor")
export class MarkdownEditor extends LitElement {
  /** Full raw document text, including any front matter block. */
  @property() value = "";

  /** Visible row count for the Write tab's textarea. */
  @property({ type: Number }) rows = 12;

  /** Placeholder text shown when the Write tab is empty. */
  @property() placeholder = "";

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      markdown-view {
        display: block;
        margin-top: 1rem;
      }
      .front-matter {
        margin: 0;
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.25rem 0.75rem;
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
        font-size: var(--ui-font-size-sm, 0.75rem);
        line-height: var(--ui-line-height-normal, 1.5);
      }
      .front-matter dt {
        font-weight: var(--ui-font-weight-medium, 500);
        color: var(--ui-text-muted, #64748b);
      }
      .front-matter dd {
        margin: 0;
        color: var(--ui-text, #0f172a);
        word-break: break-word;
      }
    `,
  ];

  private _onInput(e: Event): void {
    e.stopPropagation();
    this.value = (e as CustomEvent<{ value: string }>).detail.value;
    this.dispatchEvent(
      new CustomEvent("input", { detail: { value: this.value }, bubbles: true, composed: true }),
    );
  }

  private _onChange(e: Event): void {
    e.stopPropagation();
    this.value = (e as CustomEvent<{ value: string }>).detail.value;
    this.dispatchEvent(
      new CustomEvent("change", { detail: { value: this.value }, bubbles: true, composed: true }),
    );
  }

  override render() {
    const { data, body } = parseFrontMatter(this.value);
    return html`
      <tab-bar label="Editor mode">
        <tab-item label="Write" value="write" selected>
          <text-area
            .value=${this.value}
            .rows=${this.rows}
            .placeholder=${this.placeholder}
            @input=${this._onInput}
            @change=${this._onChange}
          ></text-area>
        </tab-item>
        <tab-item label="Preview" value="preview">
          ${data
            ? html`
                <frame-box label="Front matter">
                  <dl class="front-matter">
                    ${Object.entries(data).map(
                      ([key, entryValue]) => html`
                        <dt>${key}</dt>
                        <dd>${formatFrontMatterValue(entryValue)}</dd>
                      `,
                    )}
                  </dl>
                </frame-box>
              `
            : nothing}
          <markdown-view .markdown=${body}></markdown-view>
        </tab-item>
      </tab-bar>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "markdown-editor": MarkdownEditor;
  }
}
