import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { tokens } from "./tokens.js";

let instanceCount = 0;

/** Preferred side of the trigger; the tooltip flips when that side lacks room. */
export type UiTooltipPlacement = "top" | "bottom";

/** Space kept between the trigger, the tooltip, and the viewport edges, in pixels. */
const GAP = 6;
const EDGE = 4;
/** Grace period that lets the pointer cross from the trigger onto the tooltip. */
const HIDE_DELAY = 100;

const FOCUSABLE =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [contenteditable], [tabindex]:not([tabindex='-1'])";

/** Whether `root` is or contains a focusable element, looking inside open shadow roots. */
function containsFocusable(root: Element | ShadowRoot): boolean {
  if (root instanceof Element && root.matches(FOCUSABLE)) return true;
  if (root.querySelector(FOCUSABLE)) return true;
  const hosts = root instanceof Element ? [root, ...root.querySelectorAll("*")] : [...root.querySelectorAll("*")];
  return hosts.some((el) => el.shadowRoot !== null && containsFocusable(el.shadowRoot));
}

/**
 * Hover and focus tooltip for its default-slot trigger. The `content` slot
 * holds the tooltip body — plain text or rich markup such as a list. It
 * appears after `show-delay` on hover and at once on keyboard focus, stays
 * open while the pointer is over the tooltip itself, and closes on Escape,
 * blur, or when the pointer leaves. It renders in the top layer, so
 * scrolling or `overflow: hidden` ancestors never clip it.
 *
 * The trigger is described by the content (`aria-describedby`). A trigger
 * with nothing focusable inside (e.g. plain text) makes the tooltip host
 * focusable so keyboard users can reach the description too. ARIA references
 * can't cross shadow roots, so when the trigger is a custom element whose
 * focusable control lives in its own shadow root, screen readers won't
 * announce the description on focus; prefer a native trigger such as
 * `<button>` when that matters.
 *
 * @element ui-tooltip
 * @slot - The trigger the tooltip describes.
 * @slot content - The tooltip body.
 * @csspart tooltip - The floating tooltip surface.
 */
@customElement("ui-tooltip")
export class UiTooltip extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: inline-block;
      }
      :host(:focus-visible) {
        outline: none;
        border-radius: var(--ui-radius-sm, 0.25rem);
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .tooltip {
        position: fixed;
        inset: auto;
        margin: 0;
        box-sizing: border-box;
        max-width: min(20rem, calc(100vw - 0.5rem));
        padding: 0.25rem 0.5rem;
        border: 0;
        border-radius: var(--ui-radius-sm, 0.25rem);
        background: var(--ui-tooltip, #0f172a);
        color: var(--ui-tooltip-text, #ffffff);
        box-shadow: var(--ui-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
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
        font-weight: var(--ui-font-weight-regular, 400);
        line-height: var(--ui-line-height-tight, 1.25);
        text-align: start;
        overflow-wrap: anywhere;
      }
      @media (forced-colors: active) {
        :host(:focus-visible) {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
        .tooltip {
          border: 1px solid CanvasText;
          background: Canvas;
          color: CanvasText;
        }
      }
    `,
  ];

  /** Preferred side of the trigger; flips to the other side when this one lacks room. */
  @property({ reflect: true }) placement: UiTooltipPlacement = "top";
  /** Hover delay in milliseconds before the tooltip appears; keyboard focus shows it at once. */
  @property({ type: Number, attribute: "show-delay" }) showDelay = 300;
  /** Suppresses the tooltip and closes it if open. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  @state() private _open = false;

  @query(".tooltip") private _tooltip!: HTMLElement;

  #showTimer: ReturnType<typeof setTimeout> | null = null;
  #hideTimer: ReturnType<typeof setTimeout> | null = null;
  #describedTarget: HTMLElement | null = null;
  #describedId: string | null = null;
  #content: HTMLElement | null = null;
  #madeFocusable = false;
  readonly #contentId = `ui-tooltip-content-${++instanceCount}`;

  constructor() {
    super();
    this.addEventListener("pointerenter", () => this.#scheduleShow(this.showDelay));
    this.addEventListener("pointerleave", () => this.#scheduleHide(HIDE_DELAY, ":focus-within"));
    this.addEventListener("focusin", () => this.#scheduleShow(0));
    this.addEventListener("focusout", () => this.#scheduleHide(0, ":hover"));
  }

  /** Whether the tooltip is currently showing. */
  get open(): boolean {
    return this._open;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#clearTimers();
    this.#setOpen(false);
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("disabled") && this.disabled) {
      this.#clearTimers();
      this.#setOpen(false);
    }
  }

  protected override updated(changed: PropertyValues): void {
    if (!changed.has("_open")) return;
    if (this._open) {
      this._tooltip.showPopover();
      this.#position();
      return;
    }
    if (this._tooltip.matches(":popover-open")) this._tooltip.hidePopover();
  }

  #scheduleShow(delay: number): void {
    if (this.disabled || !this.#content) return;
    this.#clearTimers();
    if (this._open) return;
    if (delay <= 0) {
      this.#setOpen(true);
      return;
    }
    this.#showTimer = setTimeout(() => this.#setOpen(true), delay);
  }

  /** Hides after `delay` unless the host still matches `keepOpenWhile` (still hovered or focused). */
  #scheduleHide(delay: number, keepOpenWhile: string): void {
    this.#clearTimers();
    if (!this._open) return;
    const hide = () => {
      if (!this.matches(keepOpenWhile)) this.#setOpen(false);
    };
    if (delay <= 0) {
      hide();
      return;
    }
    this.#hideTimer = setTimeout(hide, delay);
  }

  #clearTimers(): void {
    if (this.#showTimer) clearTimeout(this.#showTimer);
    if (this.#hideTimer) clearTimeout(this.#hideTimer);
    this.#showTimer = null;
    this.#hideTimer = null;
  }

  #setOpen(open: boolean): void {
    if (this._open === open) return;
    this._open = open;
    if (open) {
      document.addEventListener("keydown", this.#onDocumentKeydown, true);
      window.addEventListener("scroll", this.#onViewportChange, true);
      window.addEventListener("resize", this.#onViewportChange);
      return;
    }
    document.removeEventListener("keydown", this.#onDocumentKeydown, true);
    window.removeEventListener("scroll", this.#onViewportChange, true);
    window.removeEventListener("resize", this.#onViewportChange);
  }

  /** Escape closes the tooltip without dismissing anything else (WCAG 1.4.13). */
  #onDocumentKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || !this._open) return;
    event.preventDefault();
    event.stopPropagation();
    this.#clearTimers();
    this.#setOpen(false);
  };

  #onViewportChange = (): void => {
    if (this._open) this.#position();
  };

  /** Places the tooltip beside the host, flipping sides and clamping it inside the viewport. */
  #position(): void {
    const anchor = this.getBoundingClientRect();
    const tip = this._tooltip.getBoundingClientRect();
    const above = anchor.top - GAP - tip.height;
    const below = anchor.bottom + GAP;
    const fitsAbove = above >= EDGE;
    const fitsBelow = below + tip.height <= window.innerHeight - EDGE;
    const top =
      this.placement === "top" ? (fitsAbove || !fitsBelow ? above : below) : fitsBelow || !fitsAbove ? below : above;
    const centered = anchor.left + anchor.width / 2 - tip.width / 2;
    const left = Math.min(Math.max(centered, EDGE), Math.max(EDGE, window.innerWidth - EDGE - tip.width));
    this._tooltip.style.top = `${Math.round(top)}px`;
    this._tooltip.style.left = `${Math.round(left)}px`;
    this._tooltip.dataset.side = top === above ? "top" : "bottom";
  }

  async #onTriggerSlotChange(event: Event): Promise<void> {
    const slot = event.target as HTMLSlotElement;
    const trigger = slot.assignedElements()[0] as (HTMLElement & { updateComplete?: Promise<unknown> }) | undefined;
    // A Lit trigger renders its (possibly focusable) shadow content after it is slotted.
    await trigger?.updateComplete;
    if (trigger !== slot.assignedElements()[0]) return;
    const target = trigger && containsFocusable(trigger) ? trigger : this;
    this.#updateFocusability(target === this);
    this.#describe(target);
  }

  #onContentSlotChange(event: Event): void {
    const content = (event.target as HTMLSlotElement).assignedElements()[0] as HTMLElement | undefined;
    this.#content = content ?? null;
    if (content && !content.id) content.id = this.#contentId;
    if (!content) this.#setOpen(false);
    this.#describe(this.#describedTarget);
  }

  /** Points the trigger's `aria-describedby` at the content, replacing this tooltip's previous reference. */
  #describe(target: HTMLElement | null): void {
    if (this.#describedTarget && this.#describedId) {
      this.#setDescribedBy(this.#describedTarget, this.#describedIds(this.#describedTarget));
    }
    this.#describedTarget = target;
    this.#describedId = this.#content?.id ?? null;
    if (!target || !this.#describedId) return;
    this.#setDescribedBy(target, [...this.#describedIds(target), this.#describedId]);
  }

  /** The target's `aria-describedby` ids, minus the one this tooltip added. */
  #describedIds(target: HTMLElement): string[] {
    return (target.getAttribute("aria-describedby") ?? "")
      .split(/\s+/)
      .filter((value) => value && value !== this.#describedId);
  }

  #setDescribedBy(target: HTMLElement, ids: string[]): void {
    if (ids.length) target.setAttribute("aria-describedby", ids.join(" "));
    else target.removeAttribute("aria-describedby");
  }

  #updateFocusability(needed: boolean): void {
    if (needed && !this.hasAttribute("tabindex")) {
      this.tabIndex = 0;
      this.#madeFocusable = true;
      return;
    }
    if (!needed && this.#madeFocusable) {
      this.removeAttribute("tabindex");
      this.#madeFocusable = false;
    }
  }

  override render() {
    return html`
      <slot @slotchange=${this.#onTriggerSlotChange}></slot>
      <div class="tooltip" part="tooltip" role="tooltip" popover="manual">
        <slot name="content" @slotchange=${this.#onContentSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-tooltip": UiTooltip;
  }
}
