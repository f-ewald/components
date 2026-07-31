import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * Page title block for the top of a dashboard view: an optional breadcrumb
 * trail, the page heading with a right-aligned cluster of page-level actions
 * beside it, and an optional description of what the page is for underneath.
 * The actions sit in the title row rather than beside the whole block, so a
 * longer or wrapping description never moves them. It only lays these out —
 * the breadcrumb links and action buttons are entirely the consumer's, so it
 * stays framework- and router-agnostic.
 *
 * @element page-header
 * @slot breadcrumb - Optional breadcrumb trail rendered above the heading.
 * @slot actions - Optional right-aligned page actions (e.g. a primary button).
 */
@customElement("page-header")
export class PageHeader extends LitElement {
  /** The page heading text. */
  @property() heading = "";

  /** Optional supporting line under the heading, explaining what the page does. */
  @property() description = "";

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
        display: block;
      }
      /* The actions sit in the title row, not beside the whole block: they act
         on what the title names, so their position must not move when the
         description wraps to another line or is absent entirely. */
      .title-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
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
        min-width: 0;
        font-size: var(--ui-font-size-lg, 1rem);
        font-weight: var(--ui-font-weight-semibold, 600);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text, #0f172a);
      }
      .description {
        margin: 0.25rem 0 0;
        max-width: 48rem;
        font-size: var(--ui-font-size, 0.875rem);
        font-weight: var(--ui-font-weight-regular, 400);
        line-height: var(--ui-line-height-normal, 1.5);
        color: var(--ui-text-muted, #64748b);
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
        <div class="breadcrumb ${this._hasBreadcrumb ? "" : "empty"}">
          <slot name="breadcrumb" @slotchange=${this._onBreadcrumbSlotChange}></slot>
        </div>
        <div class="title-row">
          ${this.heading ? html`<h2 class="title">${this.heading}</h2>` : nothing}
          <div class="actions"><slot name="actions"></slot></div>
        </div>
        ${this.description ? html`<p class="description">${this.description}</p>` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "page-header": PageHeader;
  }
}
