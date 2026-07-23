import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { iconBars3 } from "./icons.js";
import "./kbd-hint.js";
import { tokens } from "./tokens.js";

/** Fired when the built-in toggle changes the sidebar state. */
export interface SidebarToggleDetail {
  /** Desktop rail state. */
  collapsed: boolean;
  /** Mobile drawer open state. */
  mobileOpen: boolean;
}

/**
 * The dashboard page shell: a slot-based CSS-grid backbone that arranges a
 * full-height sidebar, a top bar, the main content, an optional right-hand
 * detail column, and an optional footer. It owns the responsive behavior so
 * consumers don't re-implement it — above the shared 48rem breakpoint the
 * sidebar collapses to an icon rail and the detail region is an inline column;
 * at or below it the sidebar becomes an off-canvas drawer and the detail region
 * an overlay, both dismissed by a scrim or Escape.
 *
 * Widths are tunable per instance via `--component-sidebar-width` (16rem),
 * `--component-sidebar-rail-width` (3.5rem), and `--component-topbar-height`
 * (3rem); the detail column reuses the 20rem/25rem panel widths. The main
 * content area is white by default — override it with
 * `--component-main-background`. Give the shell a height (e.g. `height: 100vh`)
 * so the sidebar and main can size and scroll.
 *
 * The built-in top-bar button toggles the sidebar, and so does pressing `[`
 * anywhere on the page (ignored while typing in a text field or with a
 * modifier held). Hovering or keyboard-focusing the toggle reveals a tooltip
 * naming the action and its `[` shortcut — the shortcut is not shown as
 * permanent chrome.
 *
 * @element app-shell
 * @slot - Main content area.
 * @slot sidebar - Full-height navigation (typically `app-sidebar`).
 * @slot topbar - Top bar content, right of the built-in toggle.
 * @slot detail - Optional right-hand detail; shown when `detail-open` is set.
 * @slot footer - Optional footer beneath the main content.
 * @fires sidebar-toggle - The built-in toggle changed the sidebar state.
 * @fires detail-close - The scrim or Escape dismissed the mobile detail overlay.
 */
@customElement("app-shell")
export class AppShell extends LitElement {
  /** Collapses the sidebar to an icon rail on desktop. */
  @property({ type: Boolean, reflect: true, attribute: "sidebar-collapsed" })
  sidebarCollapsed = false;
  /** Shows the right-hand detail region (inline column, or overlay on mobile). */
  @property({ type: Boolean, reflect: true, attribute: "detail-open" }) detailOpen = false;
  /** Detail width: `compact` (20rem) or `comfortable` (25rem). */
  @property({ attribute: "detail-width" }) detailWidth: "compact" | "comfortable" = "compact";

  /** Whether the viewport is at/below the 48rem breakpoint. */
  @state() private _mobile = false;
  /** Whether the mobile off-canvas nav drawer is open. */
  @state() private _mobileNavOpen = false;
  /** Whether the footer slot has assigned content. */
  @state() private _hasFooter = false;

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        block-size: 100%;
      }
      .shell {
        --_sidebar-w: var(--component-sidebar-width, 16rem);
        --_detail-w: 0px;
        display: grid;
        grid-template-columns: var(--_sidebar-w) minmax(0, 1fr) var(--_detail-w);
        grid-template-rows: auto minmax(0, 1fr) auto;
        grid-template-areas:
          "sidebar topbar topbar"
          "sidebar main   detail"
          "sidebar footer footer";
        block-size: 100%;
        min-height: 0;
        background: var(--ui-surface, #ffffff);
      }
      :host([sidebar-collapsed]) .shell {
        --_sidebar-w: var(--component-sidebar-rail-width, 3.5rem);
      }
      :host([detail-open]) .shell {
        --_detail-w: 20rem;
      }
      :host([detail-open][detail-width="comfortable"]) .shell {
        --_detail-w: 25rem;
      }
      .sidebar {
        grid-area: sidebar;
        min-height: 0;
        overflow: hidden;
        border-right: 1px solid var(--ui-border, #e2e8f0);
        background: var(--ui-surface, #ffffff);
      }
      .topbar {
        grid-area: topbar;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-height: var(--component-topbar-height, 3rem);
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
        background: var(--ui-surface, #ffffff);
      }
      .nav-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        width: 2rem;
        height: 2rem;
        padding: 0;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--ui-text-muted, #64748b);
        border-radius: var(--ui-radius-sm, 0.25rem);
      }
      .nav-group {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        flex: 0 0 auto;
      }
      .nav-tip {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 0.25rem;
        z-index: var(--component-layer-z, 100);
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        white-space: nowrap;
        padding: 0.25rem 0.5rem;
        border-radius: var(--ui-radius-sm, 0.25rem);
        background: var(--ui-tooltip, #0f172a);
        color: var(--ui-on-accent, #ffffff);
        box-shadow: var(--ui-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
        font-size: var(--ui-font-size-sm, 0.75rem);
        line-height: var(--ui-line-height-tight, 1.25);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 120ms ease;
      }
      .nav-toggle:hover + .nav-tip,
      .nav-toggle:focus-visible + .nav-tip {
        opacity: 1;
        visibility: visible;
      }
      .nav-toggle:hover {
        background: var(--ui-surface-muted, #f8fafc);
      }
      .nav-toggle:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .topbar-content {
        flex: 1 1 auto;
        min-width: 0;
      }
      .main {
        grid-area: main;
        min-height: 0;
        min-width: 0;
        overflow: auto;
        padding: 1rem;
        background: var(--component-main-background, var(--ui-surface, #ffffff));
      }
      .detail {
        grid-area: detail;
        display: none;
        min-height: 0;
        overflow: auto;
        border-left: 1px solid var(--ui-border, #e2e8f0);
        background: var(--ui-surface, #ffffff);
      }
      :host([detail-open]) .detail {
        display: block;
      }
      .footer {
        grid-area: footer;
        padding: 0.5rem 0.75rem;
        border-top: 1px solid var(--ui-border, #e2e8f0);
        background: var(--ui-surface, #ffffff);
      }
      .footer.empty {
        display: none;
      }
      .scrim {
        display: none;
      }
      @media (max-width: 48rem) {
        .shell {
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: auto minmax(0, 1fr) auto;
          grid-template-areas:
            "topbar"
            "main"
            "footer";
        }
        .sidebar {
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          width: var(--component-sidebar-width, 16rem);
          z-index: var(--component-layer-z, 100);
          transform: translateX(-100%);
          transition: transform 250ms ease;
        }
        .shell.nav-open .sidebar {
          transform: translateX(0);
          box-shadow: var(
            --ui-shadow-lg,
            0 20px 25px -5px rgb(0 0 0 / 0.1),
            0 8px 10px -6px rgb(0 0 0 / 0.1)
          );
        }
        .detail {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: var(--_detail-w, 20rem);
          max-width: calc(100vw - 3rem);
          z-index: var(--component-layer-z, 100);
          transform: translateX(110%);
          transition: transform 250ms ease;
        }
        :host([detail-open]) .detail {
          transform: translateX(0);
          box-shadow: var(
            --ui-shadow-lg,
            0 20px 25px -5px rgb(0 0 0 / 0.1),
            0 8px 10px -6px rgb(0 0 0 / 0.1)
          );
        }
        .scrim.show {
          display: block;
          position: fixed;
          inset: 0;
          z-index: calc(var(--component-layer-z, 100) - 1);
          background: var(--ui-overlay, rgb(15 23 42 / 0.45));
          border: none;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .sidebar,
        .detail,
        .nav-tip {
          transition: none;
        }
      }
      @media (forced-colors: active) {
        .nav-toggle:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
        .nav-tip {
          border: 1px solid CanvasText;
        }
      }
    `,
  ];

  private _mediaQuery: MediaQueryList | null = null;
  private _previousFocus: HTMLElement | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this._mediaQuery = window.matchMedia("(max-width: 48rem)");
    this._mobile = this._mediaQuery.matches;
    this._mediaQuery.addEventListener("change", this._onMediaChange);
    window.addEventListener("keydown", this._onKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._mediaQuery?.removeEventListener("change", this._onMediaChange);
    this._mediaQuery = null;
    window.removeEventListener("keydown", this._onKeydown);
  }

  /** Tracks the breakpoint and closes the mobile drawer when returning to desktop. */
  private _onMediaChange = (event: MediaQueryListEvent): void => {
    this._mobile = event.matches;
    if (!event.matches) this._mobileNavOpen = false;
  };

  /** Handles the `[` sidebar shortcut and Escape dismissal of mobile overlays. */
  private _onKeydown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) return;
    if (event.key === "Escape" && this._mobile) {
      if (this.detailOpen) {
        event.preventDefault();
        this._closeDetail();
      } else if (this._mobileNavOpen) {
        event.preventDefault();
        this._mobileNavOpen = false;
      }
      return;
    }
    if (
      event.key === "[" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !this._isEditableTarget(event)
    ) {
      event.preventDefault();
      this._toggleSidebar();
    }
  };

  /** Whether the keydown originated in a text field, so the shortcut defers to typing. */
  private _isEditableTarget(event: KeyboardEvent): boolean {
    const target = event.composedPath()[0] as HTMLElement | undefined;
    if (!target) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }

  /** Toggles the rail (desktop) or the off-canvas drawer (mobile) and announces it. */
  private _toggleSidebar(): void {
    if (this._mobile) {
      this._mobileNavOpen = !this._mobileNavOpen;
      if (this._mobileNavOpen) this._previousFocus = document.activeElement as HTMLElement | null;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
    this.dispatchEvent(
      new CustomEvent<SidebarToggleDetail>("sidebar-toggle", {
        detail: { collapsed: this.sidebarCollapsed, mobileOpen: this._mobileNavOpen },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Closes the detail overlay and notifies the consumer that owns `detail-open`. */
  private _closeDetail(): void {
    this.detailOpen = false;
    this.dispatchEvent(new CustomEvent("detail-close", { bubbles: true, composed: true }));
  }

  /** Scrim click dismisses whichever overlay is open. */
  private _onScrim(): void {
    if (this.detailOpen) this._closeDetail();
    if (this._mobileNavOpen) this._mobileNavOpen = false;
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has("sidebarCollapsed") || changed.has("_mobile")) this._syncSidebar();
    if (!changed.has("_mobileNavOpen")) return;
    if (this._mobileNavOpen) {
      this.shadowRoot?.querySelector<HTMLElement>(".sidebar")?.focus();
      return;
    }
    if (this._previousFocus?.isConnected) this._previousFocus.focus();
    this._previousFocus = null;
  }

  /**
   * Mirrors the shell's rail state onto the slotted sidebar so it hides labels
   * when collapsed on desktop, and always shows them in the mobile drawer.
   */
  private _syncSidebar(): void {
    const rail = this.sidebarCollapsed && !this._mobile;
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="sidebar"]');
    for (const element of slot?.assignedElements() ?? []) {
      element.toggleAttribute("collapsed", rail);
    }
  }

  override render() {
    const scrimActive = this._mobile && (this._mobileNavOpen || this.detailOpen);
    return html`
      <div class="shell ${this._mobileNavOpen ? "nav-open" : ""}">
        <aside class="sidebar" tabindex="-1" aria-label="Primary">
          <slot name="sidebar" @slotchange=${this._syncSidebar}></slot>
        </aside>
        <header class="topbar">
          <div class="nav-group">
            <button
              class="nav-toggle"
              type="button"
              aria-label="Toggle navigation"
              aria-keyshortcuts="["
              aria-describedby="nav-tip"
              aria-expanded=${this._mobile ? String(this._mobileNavOpen) : String(!this.sidebarCollapsed)}
              @click=${this._toggleSidebar}
            >
              ${iconBars3(18)}
            </button>
            <span class="nav-tip" id="nav-tip" role="tooltip">
              <span
                >${this._mobile
                  ? "Navigation"
                  : this.sidebarCollapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"}</span
              >
              ${this._mobile ? nothing : html`<kbd-hint keys="["></kbd-hint>`}
            </span>
          </div>
          <div class="topbar-content"><slot name="topbar"></slot></div>
        </header>
        <main class="main"><slot></slot></main>
        <aside
          class="detail"
          aria-label="Detail"
          ?inert=${!this.detailOpen}
          aria-hidden=${String(!this.detailOpen)}
        >
          <slot name="detail"></slot>
        </aside>
        <footer class="footer ${this._hasFooter ? "" : "empty"}">
          <slot name="footer" @slotchange=${this._onFooterSlotChange}></slot>
        </footer>
        <button
          class="scrim ${scrimActive ? "show" : ""}"
          type="button"
          tabindex="-1"
          aria-label="Close"
          @click=${this._onScrim}
          ?hidden=${!scrimActive}
        ></button>
      </div>
    `;
  }

  /** Collapses the footer row when nothing is slotted into it. */
  private _onFooterSlotChange(event: Event): void {
    this._hasFooter = (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-shell": AppShell;
  }
}
