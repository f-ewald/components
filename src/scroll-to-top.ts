import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { iconChevronUp } from "./icons.js";
import { distanceFromTop, scrollToEdge } from "./utils/scroll.js";
import { tokens } from "./tokens.js";

/**
 * Overlay button that appears once the page (or a given `target` container)
 * has scrolled more than `threshold` pixels away from the top edge, and
 * scrolls back to the top on click.
 *
 * With no `target` (default), the button is `position: fixed` to the
 * viewport. When `target` is set, the button switches to `position:
 * absolute` and expects to be placed as a descendant of a `position:
 * relative` (or otherwise positioned) ancestor that establishes the visual
 * bounds to float within — typically `target` itself, given `overflow-y:
 * auto; position: relative`, so the button stays pinned to that container's
 * own visible corner as its content scrolls, rather than floating over the
 * whole page.
 *
 * The control is styled as a standard secondary button (ui-button's
 * `secondary` variant: 2rem tall, `--ui-radius-sm` corners, the
 * `--ui-button-secondary-*` background/border tokens, so a gradient theme
 * carries over) rather than a pill, layered over an opaque `--ui-surface`
 * base and an elevation shadow, since it floats above scrolled content.
 *
 * @element scroll-to-top
 * @fires scroll-to-top-triggered - The button was clicked, just before
 *   scrolling; detail: `{ target }`.
 */
@customElement("scroll-to-top")
export class ScrollToTop extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        position: fixed;
        bottom: 0.75rem;
        right: 0.75rem;
        z-index: 40;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition:
          opacity 150ms ease,
          visibility 0s linear 150ms;
      }
      :host([contained]) {
        position: absolute;
      }
      :host([visible]) {
        opacity: 1;
        visibility: visible;
        transition:
          opacity 150ms ease,
          visibility 0s linear 0s;
      }
      button {
        pointer-events: auto;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        height: 2rem;
        box-sizing: border-box;
        padding: 0.5rem 1rem;
        color: var(--ui-text, #0f172a);
        /* ui-button's secondary variant, over an opaque --ui-surface base: a
           floating control can't let scrolled content show through the way a
           secondary button's transparent flat background does. */
        background:
          var(--ui-button-secondary-background, none),
          var(--ui-surface, #ffffff);
        border: var(--ui-border-width, 1px) solid var(--ui-button-secondary-border, var(--ui-border, #e2e8f0));
        border-radius: var(--ui-radius-sm, 0.25rem);
        box-shadow:
          var(--ui-button-highlight, 0 0 0 0 transparent),
          var(--ui-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
        cursor: pointer;
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
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: var(--ui-line-height-tight, 1.25);
        white-space: nowrap;
      }
      button:hover {
        background:
          var(--ui-button-secondary-background-hover, none),
          var(--ui-surface-muted, #f8fafc);
        border-color: var(--ui-button-secondary-border-hover, var(--ui-text-muted, #64748b));
      }
      button:active {
        background:
          var(--ui-button-secondary-background-active, var(--ui-button-secondary-background, none)),
          var(--ui-surface-muted, #f8fafc);
        box-shadow: var(--ui-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
      }
      button:focus-visible {
        outline: none;
        box-shadow:
          var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35)),
          var(--ui-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
      }
      @media (prefers-reduced-motion: reduce) {
        :host {
          transition: none;
        }
        :host([visible]) {
          transition: none;
        }
      }
      @media (forced-colors: active) {
        button:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
      }
    `,
  ];

  /** Scrollable container to control; `null` (default) scrolls `window`. */
  @property({ attribute: false }) target: HTMLElement | null = null;
  /** Pixels scrolled away from the top before the button appears. */
  @property({ type: Number }) threshold = 200;
  /** Visible button text, and its accessible name. */
  @property() label = "Scroll to top";

  @state() private _visible = false;

  #listenedTo: HTMLElement | Window | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.#subscribe();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#unsubscribe();
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has("target")) {
      this.toggleAttribute("contained", this.target !== null);
      // Resubscribing here (not in `updated()`) lets `#onScroll()`'s
      // `_visible` write fold into the update already in progress instead of
      // scheduling a new one. Guarded against the initial update, where
      // `target` is always in `changed` too, but `connectedCallback` already
      // subscribed to it.
      if (this.#listenedTo !== (this.target ?? window)) this.#subscribe();
    }
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has("_visible")) this.toggleAttribute("visible", this._visible);
  }

  #subscribe(): void {
    this.#unsubscribe();
    this.#listenedTo = this.target ?? window;
    this.#listenedTo.addEventListener("scroll", this.#onScroll, { passive: true });
    this.#onScroll();
  }

  #unsubscribe(): void {
    this.#listenedTo?.removeEventListener("scroll", this.#onScroll);
    this.#listenedTo = null;
  }

  #onScroll = (): void => {
    this._visible = distanceFromTop(this.target ?? window) > this.threshold;
  };

  #onClick(): void {
    const target = this.target ?? window;
    this.dispatchEvent(
      new CustomEvent("scroll-to-top-triggered", { detail: { target }, bubbles: true, composed: true }),
    );
    scrollToEdge(target, "top");
  }

  override render() {
    return html`
      <button type="button" @click=${() => this.#onClick()}>
        ${iconChevronUp(14)}
        <span>${this.label}</span>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "scroll-to-top": ScrollToTop;
  }
}
