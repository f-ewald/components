import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconChevronRight } from "./icons.js";
import "./relative-time.js";
import { tokens } from "./tokens.js";

export type ChatMessageRole = "user" | "agent" | "system";
export type ChatMessageVariant = "normal" | "tool" | "thinking";

/**
 * One conversation entry in a chat-style activity feed. Tool calls and
 * "thinking" traces are variants of this component rather than separate
 * ones — they share the same header, collapse behavior, and body card as a
 * normal message, just dimmed and collapsible with an always-visible summary.
 *
 * @element chat-message
 * @slot - Message body (consumers slot in already-rendered content, e.g. sanitized markdown HTML).
 * @fires toggle - Fired with `{ collapsed: boolean }` when the header/summary is clicked in collapsible mode.
 */
@customElement("chat-message")
export class ChatMessage extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        font-family: var(--ui-font, ui-sans-serif, system-ui, sans-serif);
        font-size: var(--ui-font-size, 0.875rem);
      }
      .header {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.75rem;
        color: var(--ui-text-muted, #64748b);
        margin-bottom: 0.3rem;
      }
      .header.clickable {
        cursor: pointer;
      }
      .chevron {
        display: inline-flex;
        transition: transform 0.15s ease;
      }
      .chevron.expanded {
        transform: rotate(90deg);
      }
      .author {
        font-weight: 600;
        color: var(--ui-text, #0f172a);
      }
      .summary {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .body-card {
        border-radius: var(--ui-radius, 0.5rem);
        padding: 0.6rem 0.8rem;
        color: var(--ui-text, #0f172a);
        line-height: 1.5;
      }
      .body-card[hidden] {
        display: none;
      }
      :host([role="user"]) .body-card {
        background: color-mix(in srgb, var(--ui-primary, #4f46e5) 8%, var(--ui-surface, #fff));
      }
      :host([role="agent"]) .body-card {
        background: var(--ui-surface, #fff);
        border: 1px solid var(--ui-border, #e2e8f0);
      }
      :host([role="system"]) .body-card {
        padding: 0 0 0 1.1rem;
        font-size: 0.8rem;
        color: var(--ui-text-muted, #64748b);
      }
      :host([variant="tool"]) .body-card,
      :host([variant="thinking"]) .body-card {
        opacity: 0.7;
        font-size: 0.8rem;
      }
      :host([variant="tool"]) .body-card {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      }
    `,
  ];

  /** Whose message this is; drives the card background/border. */
  @property({ reflect: true }) override role: ChatMessageRole = "agent";
  /** `tool`/`thinking` render dimmed and smaller, with `tool` using monospace for its body. */
  @property({ reflect: true }) variant: ChatMessageVariant = "normal";
  /** Header label, e.g. "Freddy" or "Architect". */
  @property() author = "";
  /** ISO-8601 timestamp, rendered via `relative-time` in the header. */
  @property() timestamp: string | null = null;
  /** Always-visible one-liner for `tool`/`thinking` variants (e.g. a truncated args preview). */
  @property() summary = "";
  /** Whether clicking the header/summary toggles the body slot. */
  @property({ type: Boolean }) collapsible = false;
  /** Current collapse state (reflected as an attribute). */
  @property({ type: Boolean, reflect: true }) collapsed = false;

  private _toggle() {
    if (!this.collapsible) return;
    this.collapsed = !this.collapsed;
    this.dispatchEvent(new CustomEvent("toggle", { detail: { collapsed: this.collapsed } }));
  }

  override render() {
    return html`
      <div class="header ${this.collapsible ? "clickable" : ""}" @click=${this._toggle}>
        ${this.collapsible
          ? html`<span class="chevron ${this.collapsed ? "" : "expanded"}"
              >${iconChevronRight(12)}</span
            >`
          : nothing}
        ${this.author ? html`<span class="author">${this.author}</span>` : nothing}
        ${this.timestamp ? html`<relative-time datetime=${this.timestamp}></relative-time>` : nothing}
        ${this.summary ? html`<span class="summary">${this.summary}</span>` : nothing}
      </div>
      <div class="body-card" ?hidden=${this.collapsible && this.collapsed}>
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "chat-message": ChatMessage;
  }
}
