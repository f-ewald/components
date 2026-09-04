import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * A centered placeholder for an empty list, an empty panel, or a zero-result
 * search: an optional leading glyph, a heading, a supporting line (or richer
 * slotted body), and an optional call-to-action row. Purely presentational —
 * it carries no interactive state of its own and no ARIA `role`; it is a
 * region of content, not a live status. Every optional part collapses
 * completely when absent, reserving no layout space.
 *
 * @element empty-state
 * @slot icon - Optional leading glyph. The consumer supplies it (e.g. an inline SVG icon).
 * @slot - Optional rich body content, an alternative to `description`.
 * @slot actions - Optional call to action, e.g. a `ui-button`.
 */
@customElement("empty-state")
export class EmptyState extends LitElement {
  /** The primary line. */
  @property() heading = "";

  /** The supporting line under the heading. Omitted entirely when empty. */
  @property() description = "";

  /** `sm` for a small panel/sidebar, `md` (default) for a full page region. `md` matches the pre-`size` look exactly. */
  @property({ reflect: true }) size: "sm" | "md" = "md";

  /** Whether the icon slot currently has assigned content. */
  @state() private _hasIcon = false;

  /** Whether the default (body) slot currently has assigned content. */
  @state() private _hasBody = false;

  /** Whether the actions slot currently has assigned content. */
  @state() private _hasActions = false;

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
      .state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 2rem 1rem;
      }
      :host([size="sm"]) .state {
        padding: 1rem 0.75rem;
      }
      .icon {
        display: inline-flex;
        margin-bottom: 0.75rem;
        color: var(--ui-text-muted, #64748b);
      }
      :host([size="sm"]) .icon {
        margin-bottom: 0.5rem;
      }
      .heading {
        margin: 0;
        font-size: var(--ui-font-size-lg, 1rem);
        font-weight: var(--ui-font-weight-semibold, 600);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text, #0f172a);
      }
      :host([size="sm"]) .heading {
        font-size: var(--ui-font-size, 0.875rem);
      }
      .description {
        margin: 0.5rem 0 0;
        max-width: 32rem;
        font-size: var(--ui-font-size, 0.875rem);
        font-weight: var(--ui-font-weight-regular, 400);
        line-height: var(--ui-line-height-normal, 1.5);
        color: var(--ui-text-muted, #64748b);
      }
      :host([size="sm"]) .description {
        font-size: var(--ui-font-size-sm, 0.75rem);
      }
      .body {
        margin-top: 0.5rem;
        color: var(--ui-text-muted, #64748b);
      }
      .body.empty {
        display: none;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      .actions.empty {
        display: none;
      }
      .icon.empty {
        display: none;
      }
    `,
  ];

  /** Tracks whether the icon slot has content so its row can collapse when empty. */
  private _onIconSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this._hasIcon = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** Tracks whether the default body slot has content so its row can collapse when empty. */
  private _onBodySlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this._hasBody = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** Tracks whether the actions slot has content so its row can collapse when empty. */
  private _onActionsSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this._hasActions = slot.assignedNodes({ flatten: true }).length > 0;
  }

  override render() {
    return html`
      <div class="state">
        <span class="icon ${this._hasIcon ? "" : "empty"}">
          <slot name="icon" @slotchange=${this._onIconSlotChange}></slot>
        </span>
        ${this.heading ? html`<h2 class="heading">${this.heading}</h2>` : nothing}
        ${this.description ? html`<p class="description">${this.description}</p>` : nothing}
        <div class="body ${this._hasBody ? "" : "empty"}">
          <slot @slotchange=${this._onBodySlotChange}></slot>
        </div>
        <div class="actions ${this._hasActions ? "" : "empty"}">
          <slot name="actions" @slotchange=${this._onActionsSlotChange}></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "empty-state": EmptyState;
  }
}
