import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * Collapsible navigation sidebar for the `app-shell` sidebar slot. It is
 * deliberately presentational and router-agnostic: the consumer supplies the
 * nav items as plain `<a>`/`<button>` elements (each an icon followed by a
 * label), optional `<p>` group headings, and marks the active item with
 * `aria-current="page"`. The sidebar styles them, tracks hover/active/focus,
 * and — in collapsed "rail" mode — centers the icons and hides the labels.
 *
 * Rail mode is driven by the `collapsed` attribute (the parent `app-shell`
 * toggles it). Labels are hidden by the inherited `--app-sidebar-label` custom
 * property, so each label element should read it, e.g.
 * `<span style="display: var(--app-sidebar-label, inline)">Reports</span>`;
 * keep an `aria-label` on the item so its accessible name survives collapse.
 * The sidebar fills the width and height of its container — `app-shell` owns
 * the actual rail/expanded width.
 *
 * @element app-sidebar
 * @slot - Navigation items: `<a>`/`<button>` links and optional `<p>` headings.
 * @slot header - Optional brand pinned to the top: a small logo plus a name.
 *   Wrap the name in a `--app-sidebar-label` element so rail mode shows only the
 *   logo, centered in line with the nav icons.
 * @slot footer - Optional account/settings area pinned to the bottom.
 */
@customElement("app-sidebar")
export class AppSidebar extends LitElement {
  /** Collapses the sidebar to an icon rail (centers icons, hides labels). */
  @property({ type: Boolean, reflect: true }) collapsed = false;

  /** Whether the header slot has assigned content. */
  @state() private _hasHeader = false;
  /** Whether the footer slot has assigned content. */
  @state() private _hasFooter = false;

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        height: 100%;
        --app-sidebar-label: inline;
      }
      :host([collapsed]) {
        --app-sidebar-label: none;
      }
      .sidebar {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        background: var(--ui-surface, #ffffff);
        color: var(--ui-text, #0f172a);
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
      .brand {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        padding: 0.75rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
      }
      .foot {
        flex: 0 0 auto;
        padding: 0.75rem;
        border-top: 1px solid var(--ui-border, #e2e8f0);
      }
      .brand.empty,
      .foot.empty {
        display: none;
      }
      .nav {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.5rem;
      }
      ::slotted(a),
      ::slotted(button) {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        box-sizing: border-box;
        padding: 0.5rem;
        border: none;
        border-radius: var(--ui-radius-sm, 0.25rem);
        background: none;
        color: var(--ui-text, #0f172a);
        text-align: left;
        text-decoration: none;
        white-space: nowrap;
        cursor: pointer;
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: var(--ui-line-height-tight, 1.25);
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
      ::slotted(a:hover),
      ::slotted(button:hover) {
        background: var(--ui-surface-muted, #f8fafc);
      }
      ::slotted(a[aria-current]),
      ::slotted(button[aria-current]) {
        background: var(--ui-surface-muted, #f8fafc);
        color: var(--ui-primary, #4f46e5);
        font-weight: var(--ui-font-weight-semibold, 600);
      }
      ::slotted(a:focus-visible),
      ::slotted(button:focus-visible) {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      ::slotted(p) {
        margin: 0;
        padding: 0.5rem 0.5rem 0.25rem;
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-semibold, 600);
        line-height: var(--ui-line-height-tight, 1.25);
        text-transform: uppercase;
        letter-spacing: var(--ui-tracking-wide, 0.04em);
        color: var(--ui-text-muted, #64748b);
      }
      :host([collapsed]) ::slotted(a),
      :host([collapsed]) ::slotted(button) {
        justify-content: center;
      }
      :host([collapsed]) ::slotted(p) {
        display: none;
      }
      :host([collapsed]) .brand {
        justify-content: center;
        padding-left: 0.5rem;
        padding-right: 0.5rem;
      }
      @media (forced-colors: active) {
        ::slotted(a:focus-visible),
        ::slotted(button:focus-visible) {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
      }
    `,
  ];

  /** Collapses the header row when nothing is slotted into it. */
  private _onHeaderSlotChange(event: Event): void {
    this._hasHeader = (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  }

  /** Collapses the footer row when nothing is slotted into it. */
  private _onFooterSlotChange(event: Event): void {
    this._hasFooter = (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  }

  override render() {
    return html`
      <div class="sidebar">
        <div class="brand ${this._hasHeader ? "" : "empty"}">
          <slot name="header" @slotchange=${this._onHeaderSlotChange}></slot>
        </div>
        <nav class="nav" aria-label="Sidebar">
          <slot></slot>
        </nav>
        <div class="foot ${this._hasFooter ? "" : "empty"}">
          <slot name="footer" @slotchange=${this._onFooterSlotChange}></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-sidebar": AppSidebar;
  }
}
