import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { distanceFromBottom } from "./utils/scroll.js";
import { tokens } from "./tokens.js";

/**
 * Wraps arbitrary slotted content (e.g. `timeline-container`) and keeps it
 * scrolled to the bottom as new children are appended — but only while the
 * user is already scrolled near the bottom ("stick to bottom", a chat/log-
 * viewer convention). If the user has scrolled up to read earlier content,
 * new content does not yank the scroll position back down.
 *
 * New content is detected via a `MutationObserver`, so no cooperation from
 * whatever is slotted in is required. The host itself is the scrollable
 * region (`overflow-y: auto`) and needs a consumer-supplied bounded height to
 * have anything to scroll, e.g. `auto-scroll { height: 24rem; }`.
 *
 * @element auto-scroll
 * @slot - Content to auto-scroll.
 * @fires pinned-change - The stick-to-bottom state toggled; detail: `{ pinned }`.
 */
@customElement("auto-scroll")
export class AutoScroll extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        overflow-y: auto;
      }
    `,
  ];

  /** Pixels of tolerance from the bottom edge counted as "still at the bottom". */
  @property({ type: Number }) threshold = 24;

  @state() private _pinned = true;

  #observer?: MutationObserver;

  /** Whether the view is currently stuck to the bottom. Read-only; see `scrollToBottom()`. */
  get pinned(): boolean {
    return this._pinned;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.toggleAttribute("pinned", this._pinned);
    this.addEventListener("scroll", this.#onScroll, { passive: true });
    this.#observer ??= new MutationObserver(() => this.#onMutation());
    this.#observer.observe(this, { childList: true, subtree: true });
  }

  override disconnectedCallback(): void {
    this.removeEventListener("scroll", this.#onScroll);
    this.#observer?.disconnect();
    super.disconnectedCallback();
  }

  /** Scrolls to the bottom immediately, regardless of the current `pinned` state. */
  scrollToBottom(): void {
    this.scrollTop = this.scrollHeight;
  }

  #onScroll = (): void => {
    this.#setPinned(distanceFromBottom(this) <= this.threshold);
  };

  #onMutation(): void {
    if (!this._pinned) return;
    // Newly inserted custom elements (e.g. a slotted `timeline-entry`) may not
    // have finished their own first render yet when this microtask runs, so
    // `scrollHeight` can still reflect the pre-mutation layout; wait a frame.
    requestAnimationFrame(() => {
      if (this._pinned) this.scrollTop = this.scrollHeight;
    });
  }

  #setPinned(pinned: boolean): void {
    if (pinned === this._pinned) return;
    this._pinned = pinned;
    this.toggleAttribute("pinned", pinned);
    this.dispatchEvent(
      new CustomEvent("pinned-change", { detail: { pinned }, bubbles: true, composed: true }),
    );
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "auto-scroll": AutoScroll;
  }
}
