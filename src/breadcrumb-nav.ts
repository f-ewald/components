import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconChevronRight, iconEllipsisHorizontal } from "./icons.js";
import { tokens } from "./tokens.js";

/** A single crumb in the trail. */
export interface BreadcrumbItem {
  /** Visible text for the crumb. */
  label: string;
  /**
   * Destination the crumb links to. Omit for a non-interactive crumb rendered
   * as plain text. Ignored on the last item, which is always the current page.
   */
  href?: string;
}

/** Detail for the `breadcrumb-navigate` event. */
export interface BreadcrumbNavigateDetail {
  /** The activated crumb. */
  item: BreadcrumbItem;
  /** Its index within `items`. */
  index: number;
}

/**
 * A breadcrumb trail: a `<nav aria-label="Breadcrumb">` wrapping an ordered
 * list, with chevron separators and the current page rendered as plain,
 * non-interactive text. Designed to drop into `page-header`'s `breadcrumb`
 * slot, but usable on its own anywhere a trail is needed.
 *
 * The last `items` entry is always treated as the current page: it renders as
 * text with `aria-current="page"` even if it carries an `href`. Middle entries
 * without an `href` render as plain text too; only middle entries with an
 * `href` are real anchors.
 *
 * When `max-visible` is greater than zero and the trail is longer than that,
 * the middle collapses behind an overflow button that always keeps the first
 * and current crumbs visible; activating it toggles `expanded` to reveal the
 * hidden crumbs in place.
 *
 * @element breadcrumb-nav
 * @fires breadcrumb-navigate - A crumb link was activated; `detail` is
 *   `{ item: BreadcrumbItem; index: number }`. This is an additional
 *   notification hook only — the anchor's native navigation is never
 *   prevented, so crumbs stay real, middle-clickable, right-clickable links.
 */
@customElement("breadcrumb-nav")
export class BreadcrumbNav extends LitElement {
  /**
   * The crumbs, root first. The last entry is the current page and is rendered
   * as non-interactive text with `aria-current="page"`.
   */
  @property({ type: Array }) items: BreadcrumbItem[] = [];

  /**
   * When greater than zero and the trail has more items than this, collapse the
   * middle of the trail behind an overflow button (the first and current crumbs
   * always stay visible). `0` (the default) never collapses.
   *
   * A collapsed trail always occupies three positions — first crumb, overflow
   * button, current page — so values below `3` are raised to `3`. Collapsing a
   * shorter trail would spend a button to hide one crumb, or none at all.
   */
  @property({ type: Number, attribute: "max-visible" }) maxVisible = 0;

  /** Whether a collapsed trail is currently expanded to show its hidden crumbs. */
  @property({ type: Boolean, reflect: true }) expanded = false;

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
      .trail {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.25rem;
        margin: 0;
        padding: 0;
        list-style: none;
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-regular, 400);
        line-height: var(--ui-line-height-tight, 1.25);
      }
      .crumb-item {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }
      .sep {
        display: inline-flex;
        line-height: var(--ui-line-height-glyph, 1);
        color: var(--ui-text-muted, #64748b);
      }
      .crumb {
        color: var(--ui-text-muted, #64748b);
        text-decoration: none;
        border-radius: var(--ui-radius-sm, 0.25rem);
        transition: color 150ms ease;
      }
      .crumb:hover,
      .crumb:focus-visible {
        color: var(--ui-text, #0f172a);
      }
      .crumb:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .static {
        color: var(--ui-text-muted, #64748b);
      }
      .current {
        color: var(--ui-text, #0f172a);
        font-weight: var(--ui-font-weight-medium, 500);
      }
      .overflow {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        padding: 0;
        appearance: none;
        background: none;
        border: none;
        border-radius: var(--ui-radius-sm, 0.25rem);
        color: var(--ui-text-muted, #64748b);
        cursor: pointer;
        transition: color 150ms ease;
      }
      .overflow:hover {
        color: var(--ui-text, #0f172a);
      }
      .overflow:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      @media (prefers-reduced-motion: reduce) {
        .crumb,
        .overflow {
          transition: none;
        }
      }
      @media (forced-colors: active) {
        .crumb:focus-visible,
        .overflow:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
      }
    `,
  ];

  /** Toggles a collapsed trail between collapsed and expanded. */
  private _toggle(): void {
    this.expanded = !this.expanded;
  }

  /** The crumbs, defended against a non-array value assigned at runtime by a JS or HTML consumer. */
  private _crumbs(): BreadcrumbItem[] {
    return Array.isArray(this.items) ? this.items : [];
  }

  /**
   * How many crumbs may show before the middle collapses, or `0` for never.
   * Floored at 3, since a collapsed trail always renders first + overflow +
   * current.
   */
  private _limit(): number {
    const limit = Math.trunc(this.maxVisible);
    return limit > 0 ? Math.max(3, limit) : 0;
  }

  /** Whether the trail is long enough for the overflow button to earn its place. */
  private _collapsible(): boolean {
    const limit = this._limit();
    return limit > 0 && this._crumbs().length > limit;
  }

  override willUpdate(): void {
    const root = this.renderRoot as ShadowRoot | null;
    this._overflowHadFocus = root?.activeElement?.classList.contains("overflow") ?? false;
    // A trail that stops being collapsible (its items shrank, or max-visible
    // grew) must not keep a reflected expanded attribute describing a
    // disclosure that no longer exists.
    if (this.expanded && !this._collapsible()) this.expanded = false;
  }

  override updated(): void {
    // The overflow button is the only focusable node that can vanish mid-update.
    // Without this, replacing items while it holds focus drops focus to
    // document.body and strands a keyboard user at the top of the page.
    if (!this._overflowHadFocus) return;
    this._overflowHadFocus = false;
    if (this.renderRoot.querySelector(".overflow")) return;
    this.renderRoot.querySelector<HTMLElement>("nav")?.focus();
  }

  /** Whether the overflow button held focus when the current update began. */
  private _overflowHadFocus = false;

  /** Dispatches `breadcrumb-navigate` without preventing native navigation. */
  private _onNavigate(item: BreadcrumbItem, index: number): void {
    this.dispatchEvent(
      new CustomEvent<BreadcrumbNavigateDetail>("breadcrumb-navigate", {
        detail: { item, index },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _crumbNode(item: BreadcrumbItem, index: number, lastIndex: number): TemplateResult {
    if (index === lastIndex) {
      return html`<span class="current" aria-current="page">${item.label}</span>`;
    }
    if (item.href) {
      return html`<a
        class="crumb"
        href=${item.href}
        @click=${() => this._onNavigate(item, index)}
        >${item.label}</a
      >`;
    }
    return html`<span class="static">${item.label}</span>`;
  }

  private _overflowNode(hiddenCount: number): TemplateResult {
    const label = this.expanded ? "Hide breadcrumbs" : `Show ${hiddenCount} hidden breadcrumbs`;
    return html`<button
      type="button"
      class="overflow"
      aria-expanded=${this.expanded ? "true" : "false"}
      aria-controls="trail"
      aria-label=${label}
      @click=${this._toggle}
    >
      ${iconEllipsisHorizontal(18)}
    </button>`;
  }

  override render() {
    const items = this._crumbs();
    // An empty trail renders nothing at all rather than an empty landmark: a
    // named but contentless nav is pure noise in the accessibility tree.
    if (items.length === 0) return nothing;
    const lastIndex = items.length - 1;
    const collapsible = this._collapsible();

    const nodes: TemplateResult[] = [];
    if (collapsible) {
      nodes.push(this._crumbNode(items[0], 0, lastIndex));
      nodes.push(this._overflowNode(items.length - 2));
      if (this.expanded) {
        for (let i = 1; i < lastIndex; i++) {
          nodes.push(this._crumbNode(items[i], i, lastIndex));
        }
      }
      nodes.push(this._crumbNode(items[lastIndex], lastIndex, lastIndex));
    } else {
      items.forEach((item, i) => nodes.push(this._crumbNode(item, i, lastIndex)));
    }

    return html`
      <nav aria-label="Breadcrumb" tabindex="-1">
        <ol class="trail" id="trail">
          ${nodes.map(
            (node, i) => html`
              <li class="crumb-item">
                ${i > 0
                  ? html`<span class="sep" aria-hidden="true">${iconChevronRight(14)}</span>`
                  : nothing}
                ${node}
              </li>
            `,
          )}
        </ol>
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "breadcrumb-nav": BreadcrumbNav;
  }
}
