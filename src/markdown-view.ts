import DOMPurify from "dompurify";
import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { marked } from "marked";
import { tokens } from "./tokens.js";

/**
 * Renders a markdown string as sanitized, styled HTML — headings, lists,
 * code, tables, blockquotes, and links all get token-driven styling, with
 * wide content (code blocks, tables) scrolling in its own container instead
 * of widening the page.
 *
 * The markdown source is treated as untrusted: it is always parsed with
 * `marked` and sanitized with `DOMPurify` before being injected, never
 * rendered as-is.
 *
 * @element markdown-view
 */
@customElement("markdown-view")
export class MarkdownView extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
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
        font-size: var(--ui-font-size, 0.875rem);
        line-height: var(--ui-line-height-normal, 1.5);
        color: var(--ui-text, #0f172a);
      }
      .body :first-child {
        margin-top: 0;
      }
      .body :last-child {
        margin-bottom: 0;
      }
      .body h1,
      .body h2,
      .body h3,
      .body h4,
      .body h5,
      .body h6 {
        font-weight: var(--ui-font-weight-semibold, 600);
        line-height: var(--ui-line-height-tight, 1.25);
        margin: 1.5rem 0 0.5rem;
      }
      .body h1 {
        font-size: var(--ui-font-size-lg, 1rem);
      }
      .body h2 {
        font-size: var(--ui-font-size-lg, 1rem);
      }
      .body h3,
      .body h4,
      .body h5,
      .body h6 {
        font-size: var(--ui-font-size, 0.875rem);
      }
      .body p {
        margin: 0.75rem 0;
      }
      .body ul,
      .body ol {
        margin: 0.75rem 0;
        padding-left: 1.5rem;
      }
      .body li + li {
        margin-top: 0.25rem;
      }
      .body a {
        color: var(--ui-primary, #4f46e5);
        text-decoration: underline;
        text-underline-offset: 0.125rem;
      }
      .body a:hover {
        color: var(--ui-primary-hover, #4338ca);
      }
      .body code {
        font-family: var(
          --ui-font-mono,
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Consolas,
          monospace
        );
        font-size: var(--ui-font-size-sm, 0.75rem);
        background: var(--ui-surface-muted, #f8fafc);
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.125rem 0.25rem;
      }
      .body pre {
        margin: 0.75rem 0;
        padding: 0.75rem;
        background: var(--ui-surface-muted, #f8fafc);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        overflow-x: auto;
      }
      .body pre code {
        background: none;
        padding: 0;
      }
      .body blockquote {
        margin: 0.75rem 0;
        padding: 0.25rem 0.75rem;
        border-left: 0.25rem solid var(--ui-border, #e2e8f0);
        color: var(--ui-text-muted, #64748b);
      }
      .body .table-wrap {
        margin: 0.75rem 0;
        overflow-x: auto;
      }
      .body table {
        border-collapse: collapse;
        width: 100%;
        font-size: var(--ui-font-size-sm, 0.75rem);
      }
      .body th,
      .body td {
        text-align: left;
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
      }
      .body th {
        font-weight: var(--ui-font-weight-semibold, 600);
        color: var(--ui-text-muted, #64748b);
      }
      .body hr {
        margin: 1.5rem 0;
        border: 0;
        border-top: 1px solid var(--ui-border, #e2e8f0);
      }
    `,
  ];

  /** Raw markdown source to render. */
  @property() markdown = "";

  private _renderedHtml(): string {
    if (!this.markdown) return "";
    const rawHtml = marked.parse(this.markdown, { async: false, gfm: true }) as string;
    // Wrap every table in a scroll container so wide tables don't widen the page.
    const wrapped = rawHtml.replace(/<table>/g, '<div class="table-wrap"><table>').replace(
      /<\/table>/g,
      "</table></div>",
    );
    return DOMPurify.sanitize(wrapped);
  }

  override render() {
    if (!this.markdown) return nothing;
    return html`<div class="body">${unsafeHTML(this._renderedHtml())}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "markdown-view": MarkdownView;
  }
}
