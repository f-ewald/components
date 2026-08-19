import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/** One dot on a `scroll-dots` rail. */
export interface ScrollDotItem {
  /** Accessible name for the dot's button — the section or slide title. */
  label: string;
  /** Renders the dot smaller and quieter, for a section subordinate to its neighbours. */
  muted?: boolean;
}

/** A dot, or a bare string as shorthand for `{ label }`. */
export type ScrollDotsItem = string | ScrollDotItem;

/** Fired when the user picks a dot. `detail.index` is the 0-based target. */
export interface DotSelectDetail {
  index: number;
}

/**
 * Vertical section navigator for a long scrolled page or a slide deck: one dot
 * per section, the active one drawn as an elongated rounded bar rather than a
 * dot, which is the only cue needed to read position at a glance.
 *
 * Controlled, like `pagination-nav`: it owns no scroll behavior and never
 * reads the scroll position. The consumer sets `active` and moves the page in
 * response to `dot-select` — what counts as the active section differs too much
 * between a snapped deck and an ordinary long page to bake in.
 *
 * Positioning is also the consumer's, since a rail is normally fixed into a
 * reserved gutter that only the page knows the width of.
 *
 * The dots use the same lighter-on-top gradient as `map-circle`/`map-pin`,
 * derived from a single base `color` — a rail beside a map reads as the same
 * family of marks as the pins on it.
 *
 * @element scroll-dots
 * @fires dot-select - The user picked a dot (`detail: { index }`).
 */
@customElement("scroll-dots")
export class ScrollDots extends LitElement {
  /** Dots to render, in document order. A bare string is shorthand for `{ label }`. */
  @property({ attribute: false }) items: ScrollDotsItem[] = [];

  /** 0-based index of the active dot. Out-of-range values simply match no dot. */
  @property({ type: Number }) active = 0;

  /** Base color the dot gradient is derived from. Empty uses `--ui-primary`. */
  @property() color = "";

  /** Accessible name for the rail, e.g. "Journey stops". */
  @property() label = "";

  static override styles = [
    tokens,
    css`
      /*
       * will-change promotes the rail to its own compositor layer. A rail is
       * typically fixed over the page's main content — for a map deck, over a
       * WebGL canvas — and without it the browser repaints the dots on the main
       * thread, which flickers and squares off their rounded edges whenever a
       * scroll and an animation are competing for that thread.
       */
      :host {
        display: inline-flex;
        will-change: transform;
        backface-visibility: hidden;
      }
      nav {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
      }
      button {
        width: 0.625rem;
        height: 0.625rem;
        padding: 0;
        border: none;
        border-radius: var(--ui-radius-pill, 9999px);
        /* Same lighter-on-top token gradient as map-circle/timeline-entry's
           dot; the base color is swapped via the private --_dot var. */
        background: linear-gradient(
          to bottom,
          color-mix(in srgb, var(--_dot, var(--ui-text-muted, #64748b)) 70%, #ffffff) 0%,
          color-mix(in srgb, var(--_dot, var(--ui-text-muted, #64748b)) 70%, #000000) 100%
        );
        opacity: 0.45;
        cursor: pointer;
        /*
         * Size is deliberately absent: height is a layout property, so
         * transitioning it animates on the main thread, where a concurrent
         * animation elsewhere on the page can starve it down to a couple of
         * frames and render the bar with squared-off edges. The size change
         * snaps; only the compositable properties ease.
         */
        transition: opacity 0.25s ease;
      }
      button.muted {
        width: 0.4rem;
        height: 0.4rem;
      }
      button:hover {
        opacity: 0.8;
      }
      button:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      button.active {
        height: 2.25rem;
        --_dot: var(--_color, var(--ui-primary, #4f46e5));
        opacity: 1;
      }
      @media (forced-colors: active) {
        button {
          background: GrayText;
          opacity: 1;
        }
        button.active {
          background: Highlight;
        }
        button:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        button {
          transition: none;
        }
      }
    `,
  ];

  override render() {
    const dots = this.items.map((item, index) => this._renderDot(normalize(item), index));
    return html`
      <nav
        aria-label=${this.label}
        style=${this.color === "" ? "" : `--_color: ${this.color}`}
      >
        ${dots}
      </nav>
    `;
  }

  private _renderDot(item: ScrollDotItem, index: number) {
    const isActive = index === this.active;
    const classes = [item.muted ? "muted" : "", isActive ? "active" : ""]
      .filter(Boolean)
      .join(" ");
    return html`
      <button
        type="button"
        class=${classes}
        aria-label=${item.label}
        title=${item.label}
        aria-current=${String(isActive)}
        @click=${() => this._select(index)}
      ></button>
    `;
  }

  private _select(index: number): void {
    this.dispatchEvent(
      new CustomEvent<DotSelectDetail>("dot-select", {
        detail: { index },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

function normalize(item: ScrollDotsItem): ScrollDotItem {
  return typeof item === "string" ? { label: item } : item;
}

declare global {
  interface HTMLElementTagNameMap {
    "scroll-dots": ScrollDots;
  }
}
