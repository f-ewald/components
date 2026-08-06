import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { iconBars3 } from "./icons.js";
import "./kbd-hint.js";
import { tokens } from "./tokens.js";

/** Fired when the built-in toggle changes the sidebar state. */
export interface SidebarToggleDetail {
  /** Whether the sidebar is now open. */
  open: boolean;
}

/**
 * The dashboard page shell: a slot-based CSS-grid backbone that arranges a
 * top bar, the main content, an optional right-hand detail column, an
 * optional footer, and a sidebar. The top bar always spans the shell's full
 * width, in every sidebar state.
 *
 * The sidebar's visibility, width, and layout mode are three independent
 * properties:
 * - `sidebar-open` (default closed) — whether it's shown at all.
 * - `sidebar-width`: `"full"` (16rem, icons + labels, the default) or
 *   `"icon"` (3.5rem rail, icons only — drives the slotted `app-sidebar`'s
 *   own `collapsed` attribute).
 * - `sidebar-mode`: `"overlay"` (the default) floats the sidebar above the
 *   shell's own content with a higher z-index, covering part of the top
 *   bar's corner and whatever content sits beneath it, without ever
 *   resizing or reflowing `main`/`footer`. `"push"` instead reserves a real
 *   grid column beside `main`/`footer` (which resize to make room) — the
 *   top bar still spans full width above it either way.
 *
 * Below the shared 48rem breakpoint the sidebar always behaves as a
 * full-width, modal, scrim/Escape-dismissible drawer regardless of
 * `sidebar-mode`/`sidebar-width` — those two properties only affect the
 * desktop presentation. Above 48rem, an `overlay`-mode sidebar is a
 * non-modal panel (no dimming scrim, no Escape-dismiss, since it reads as
 * an ordinary always-interactive panel rather than a blocking dialog); a
 * `push`-mode sidebar is even more clearly non-modal, since it never
 * covers anything.
 *
 * The right-hand detail column is unaffected by any of the above: it still
 * reserves an inline grid column on desktop and becomes a dismissible
 * overlay (scrim/Escape) on mobile.
 *
 * Widths are tunable per instance via `--component-sidebar-width` (16rem),
 * `--component-sidebar-rail-width` (3.5rem), and `--component-topbar-height`
 * (3rem); the detail column reuses the 20rem/25rem panel widths. The main
 * content area is white by default — override it with
 * `--component-main-background`. Give the shell a height (e.g. `height:
 * 100vh`) so the sidebar and main can size and scroll.
 *
 * Hovering or keyboard-focusing the toggle reveals a tooltip naming the
 * action and its `[` shortcut — the shortcut is not shown as permanent
 * chrome.
 *
 * @element app-shell
 * @slot - Main content area.
 * @slot sidebar - Sidebar navigation (typically `app-sidebar`).
 * @slot topbar - Top bar content, right of the built-in toggle.
 * @slot detail - Optional right-hand detail; shown when `detail-open` is set.
 * @slot footer - Optional footer beneath the main content.
 * @fires sidebar-toggle - The built-in toggle changed the sidebar state.
 * @fires detail-close - The scrim or Escape dismissed the mobile detail overlay.
 */
@customElement("app-shell")
export class AppShell extends LitElement {
  /** Whether the sidebar is open. Closed by default at every breakpoint. */
  @property({ type: Boolean, reflect: true, attribute: "sidebar-open" }) sidebarOpen = false;
  /** `"overlay"` (default) floats the sidebar above content; `"push"` reserves a grid column instead. */
  @property({ reflect: true, attribute: "sidebar-mode" }) sidebarMode: "overlay" | "push" = "overlay";
  /** Sidebar width when open: `"full"` (16rem, icons + labels) or `"icon"` (3.5rem rail, icons only). */
  @property({ reflect: true, attribute: "sidebar-width" }) sidebarWidth: "full" | "icon" = "full";
  /** Shows the right-hand detail region (inline column, or overlay on mobile). */
  @property({ type: Boolean, reflect: true, attribute: "detail-open" }) detailOpen = false;
  /** Detail width: `compact` (20rem) or `comfortable` (25rem). */
  @property({ attribute: "detail-width" }) detailWidth: "compact" | "comfortable" = "compact";

  /** Whether the viewport is at/below the 48rem breakpoint. */
  @state() private _mobile = false;
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
        --_sidebar-w: 0px;
        --_detail-w: 0px;
        display: grid;
        grid-template-columns: var(--_sidebar-w) minmax(0, 1fr) var(--_detail-w);
        grid-template-rows: auto minmax(0, 1fr) auto;
        grid-template-areas:
          "topbar topbar topbar"
          "sidebar main   detail"
          "sidebar footer footer";
        position: relative;
        block-size: 100%;
        min-height: 0;
        background: var(--ui-surface, #ffffff);
      }
      :host([detail-open]) .shell {
        --_detail-w: 20rem;
      }
      :host([detail-open][detail-width="comfortable"]) .shell {
        --_detail-w: 25rem;
      }
      /* Push mode reserves a real grid column, sized only while open — the
         column width doesn't animate (custom properties feeding a grid
         track don't transition smoothly without @property registration),
         so push mode's open/close is an instant snap, unlike overlay
         mode's sliding transform. */
      :host([sidebar-mode="push"][sidebar-open]) .shell {
        --_sidebar-w: var(--component-sidebar-width, 16rem);
      }
      :host([sidebar-mode="push"][sidebar-open][sidebar-width="icon"]) .shell {
        --_sidebar-w: var(--component-sidebar-rail-width, 3.5rem);
      }
      .sidebar {
        /* No grid-area here: an absolutely-positioned grid item's inset
           properties resolve against its OWN grid area's box, not the
           whole grid container, once grid-area is set — even with
           explicit (non-auto) insets. Overlay mode must stay anchored to
           the whole .shell (to overlap the topbar row), so grid-area is
           assigned only in push mode below, where the sidebar is a real,
           in-flow grid item instead of an absolutely-positioned one. */
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: var(--component-sidebar-width, 16rem);
        z-index: 40;
        overflow: hidden;
        border-right: 1px solid var(--ui-border, #e2e8f0);
        background: var(--ui-surface, #ffffff);
        transform: translateX(-100%);
        transition: transform 150ms ease;
      }
      :host([sidebar-open]) .sidebar {
        transform: translateX(0);
      }
      :host([sidebar-open]:not([sidebar-mode="push"])) .sidebar {
        box-shadow: var(
          --ui-shadow-lg,
          0 20px 25px -5px rgb(0 0 0 / 0.1),
          0 8px 10px -6px rgb(0 0 0 / 0.1)
        );
      }
      :host([sidebar-width="icon"]) .sidebar {
        width: var(--component-sidebar-rail-width, 3.5rem);
      }
      :host([sidebar-mode="push"]) .sidebar {
        grid-area: sidebar;
        position: static;
        width: 100%;
        transform: none;
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
        /* Deliberately no z-index here: an explicit z-index on a CSS grid
           item creates a stacking context, which would trap .nav-toggle
           below .sidebar once an overlay-mode sidebar opens and covers this
           corner. See CLAUDE.md before adding one. */
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
        z-index: 41;
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
        z-index: 10;
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
          grid-template-columns: minmax(0, 1fr) var(--_detail-w);
          grid-template-areas:
            "topbar topbar"
            "main   detail"
            "footer footer";
        }
        /* Mobile is always a full-screen, position:absolute overlay drawer,
           regardless of sidebar-mode/sidebar-width — those two properties
           only affect the desktop presentation. */
        .sidebar,
        :host([sidebar-mode="push"]) .sidebar {
          position: absolute;
          width: 100%;
        }
        .detail {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: var(--_detail-w, 20rem);
          max-width: calc(100vw - 3rem);
          z-index: 40;
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
          position: absolute;
          inset: 0;
          z-index: 39;
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

  /** Tracks the breakpoint the sidebar's width and modality depend on. */
  private _onMediaChange = (event: MediaQueryListEvent): void => {
    this._mobile = event.matches;
  };

  /** Handles the `[` sidebar shortcut and Escape dismissal of mobile overlays. */
  private _onKeydown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) return;
    if (event.key === "Escape" && this._mobile) {
      if (this.detailOpen) {
        event.preventDefault();
        this._closeDetail();
      } else if (this.sidebarOpen) {
        event.preventDefault();
        this.sidebarOpen = false;
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

  /** Toggles the sidebar and announces it. */
  private _toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    if (this._mobile && this.sidebarOpen) {
      this._previousFocus = document.activeElement as HTMLElement | null;
    }
    this.dispatchEvent(
      new CustomEvent<SidebarToggleDetail>("sidebar-toggle", {
        detail: { open: this.sidebarOpen },
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
    if (this.sidebarOpen) this.sidebarOpen = false;
  }

  /** Mirrors `sidebar-width` onto the slotted sidebar's `collapsed` (icon rail) attribute. */
  private _syncSidebarWidth(): void {
    const icon = this.sidebarWidth === "icon";
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="sidebar"]');
    for (const element of slot?.assignedElements() ?? []) {
      element.toggleAttribute("collapsed", icon);
    }
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has("sidebarWidth")) this._syncSidebarWidth();
    if (!changed.has("sidebarOpen") || !this._mobile) return;
    if (this.sidebarOpen) {
      this.shadowRoot?.querySelector<HTMLElement>(".sidebar")?.focus();
      return;
    }
    if (this._previousFocus?.isConnected) this._previousFocus.focus();
    this._previousFocus = null;
  }

  override render() {
    const scrimActive = this._mobile && (this.sidebarOpen || this.detailOpen);
    return html`
      <div class="shell">
        <aside
          class="sidebar"
          tabindex="-1"
          aria-label="Primary"
          ?inert=${!this.sidebarOpen}
          aria-hidden=${String(!this.sidebarOpen)}
        >
          <slot name="sidebar" @slotchange=${this._syncSidebarWidth}></slot>
        </aside>
        <header class="topbar">
          <div class="nav-group">
            <button
              class="nav-toggle"
              type="button"
              aria-label="Toggle navigation"
              aria-keyshortcuts="["
              aria-describedby="nav-tip"
              aria-expanded=${String(this.sidebarOpen)}
              @click=${this._toggleSidebar}
            >
              ${iconBars3(18)}
            </button>
            <span class="nav-tip" id="nav-tip" role="tooltip">
              <span>${this.sidebarOpen ? "Hide navigation" : "Show navigation"}</span>
              <kbd-hint keys="["></kbd-hint>
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
