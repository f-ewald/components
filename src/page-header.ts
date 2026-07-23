import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * Page title block for the top of a dashboard view: an optional breadcrumb
 * trail, the page heading, and a right-aligned cluster of page-level actions.
 * It only lays these out — the breadcrumb links and action buttons are entirely
 * the consumer's, so it stays framework- and router-agnostic.
 *
 * @element page-header
 * @slot breadcrumb - Optional breadcrumb trail rendered above the heading.
 * @slot actions - Optional right-aligned page actions (e.g. a primary button).
 */
@customElement("page-header")
export class PageHeader extends LitElement {
  /** The page heading text. */
  @property() heading = "";

  /** Whether the breadcrumb slot currently has assigned content. */
  @state() private _hasBreadcrumb = false;

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
      }
      .header {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .lead {
        min-width: 0;
      }
      .breadcrumb {
        margin-bottom: 0.25rem;
        font-size: var(--ui-font-size-sm, 0.75rem);
        color: var(--ui-text-muted, #64748b);
      }
      .breadcrumb.empty {
        display: none;
      }
      .title {
        margin: 0;
        font-size: var(--ui-font-size-lg, 1rem);
        font-weight: var(--ui-font-weight-semibold, 600);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text, #0f172a);
      }
      .actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 0 0 auto;
      }
    `,
  ];

  /** Tracks whether the breadcrumb slot has content so its row can collapse when empty. */
  private _onBreadcrumbSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this._hasBreadcrumb = slot.assignedNodes({ flatten: true }).length > 0;
  }

  override render() {
    return html`
      <div class="header">
        <div class="lead">
          <div class="breadcrumb ${this._hasBreadcrumb ? "" : "empty"}">
            <slot name="breadcrumb" @slotchange=${this._onBreadcrumbSlotChange}></slot>
          </div>
          ${this.heading ? html`<h2 class="title">${this.heading}</h2>` : nothing}
        </div>
        <div class="actions"><slot name="actions"></slot></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "page-header": PageHeader;
  }
}
