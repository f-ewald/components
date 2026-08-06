import { LitElement, css, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import {
  iconCheckCircle,
  iconExclamationCircle,
  iconExclamationTriangle,
  iconInfo,
  iconX,
} from "./icons.js";
import { tokens } from "./tokens.js";

export type ToastVariant = "error" | "info" | "success" | "warning";

interface ToastOptions {
  /** Visual style; also selects the accent color. Defaults to "info". */
  variant?: ToastVariant;
  /** Auto-dismiss delay in ms. Pass 0 to require a manual close. Defaults to 5000. */
  duration?: number;
  /**
   * Optional secondary line shown beneath the headline in smaller, non-bold
   * type. Omit for a single-line toast.
   */
  description?: string;
}

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  description?: string;
  /** Configured auto-dismiss delay in ms; 0 means manual dismiss only (no countdown). */
  duration: number;
  /** Timestamp (`Date.now()`-based) this toast will auto-dismiss at, while the countdown is running. */
  endTime: number;
  /** Milliseconds remaining, frozen at the instant hover/focus paused the countdown. */
  remaining: number;
  /** Whether hover or focus has paused the countdown. */
  paused: boolean;
}

const DEFAULT_DURATION_MS = 5000;
/** Radius of the countdown ring's SVG circle — used to derive its circumference. */
const RING_RADIUS = 9;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * Fixed-position stack of dismissible notifications, anchored top-right
 * (top-full-width on mobile). Every toast shares one fixed width so entries
 * never appear narrower or wider than one another. Not wired to any app state
 * yet — callers add toasts imperatively via the `show()` method on a live
 * element reference,
 * e.g. `document.querySelector('toast-notification')?.show('Offline', { variant: 'error' })`,
 * or via the `notifySuccess`/`notifyError`/`notifyInfo` module-level helpers
 * exported from this file. The first argument is the required bold headline; an
 * optional `description` renders a smaller, non-bold second line. Each variant
 * leads with a matching status icon (success → check, error → exclamation
 * circle, info → information circle, warning → exclamation triangle). Each toast
 * auto-dismisses after `duration` ms and can also be dismissed via its ✕
 * button. Appears/disappears instantly — no slide/fade transitions.
 *
 * A toast with `duration > 0` replaces its ✕ button with a countdown: a
 * number of seconds remaining inside a ring that fills in clockwise over
 * `duration`. Hovering or keyboard-focusing the toast swaps the countdown
 * back for the ✕ and pauses the countdown (both the visual ring/number and
 * the underlying auto-dismiss timer) — the toast won't disappear while
 * someone's reading it or has tabbed to its close button — resuming from
 * where it left off once the pointer/focus leaves. A `duration: 0` toast has
 * no countdown to show, so its ✕ is always visible, exactly as before.
 *
 * Each variant's background reads a dedicated `--ui-toast-*-background` hook
 * (`success`/`error`/`info`/`warning`), which defaults to the flat
 * `--ui-success`/`--ui-danger`/`--ui-info`/`--ui-warning` tokens unchanged —
 * so those stay the single source of truth for every other component. A
 * consumer can override just these toast-specific tokens with a
 * `linear-gradient(...)` to opt every toast into a gradient look without
 * touching component markup — `gradientTokenValues` in `tokens.ts` ships
 * exactly this, wired up via `data-theme="gradient"` (see `tokens.css`'s
 * "Gradient theme" section), the same mechanism `ui-button` uses.
 * `--ui-toast-highlight` (a glossy top-edge box-shadow, layered onto the
 * existing elevation shadow) and `--ui-toast-text-shadow` (legibility
 * against the gradient's lighter stop) round out the effect, mirroring
 * `ui-button`'s `--ui-button-highlight`/`--ui-button-text-shadow`.
 *
 * @element toast-notification
 */
@customElement("toast-notification")
export class ToastNotification extends LitElement {
  @state() private _toasts: Toast[] = [];

  private _nextId = 0;
  private _timers = new Map<number, ReturnType<typeof setTimeout>>();
  /** Per-toast hover/focus tracking, so leaving one doesn't resume while the other still applies. */
  private _interaction = new Map<number, { hovered: boolean; focusWithin: boolean }>();
  /** Ticks while any toast has a running countdown, purely to refresh the displayed seconds. */
  private _tickTimer: ReturnType<typeof setInterval> | null = null;

  static override styles = [
    tokens,
    css`
      :host {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 200;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 22.5rem;
        pointer-events: none;
      }
      .toast {
        pointer-events: auto;
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        border-radius: var(--ui-radius, 0.5rem);
        padding: 0.75rem;
        box-shadow: var(
            --ui-shadow-lg,
            0 20px 25px -5px rgb(0 0 0 / 0.1),
            0 8px 10px -6px rgb(0 0 0 / 0.1)
          ), var(--ui-toast-highlight, 0 0 0 0 transparent);
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
        font-size: var(--ui-font-size, 0.875rem);
        line-height: var(--ui-line-height-normal, 1.5);
        color: var(--ui-on-accent, #ffffff);
        background: var(--ui-text, #0f172a);
        text-shadow: var(--ui-toast-text-shadow, none);
      }
      .toast.error {
        background: var(--ui-toast-error-background, var(--ui-danger, #dc2626));
      }
      .toast.success {
        background: var(--ui-toast-success-background, var(--ui-success, #16a34a));
      }
      .toast.info {
        background: var(--ui-toast-info-background, var(--ui-info, #0ea5e9));
      }
      .toast.warning {
        background: var(--ui-toast-warning-background, var(--ui-warning, #d97706));
      }
      .icon {
        flex: 0 0 auto;
        margin-top: 0.125rem;
        line-height: var(--ui-line-height-glyph, 1);
      }
      .content {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .message {
        font-weight: var(--ui-font-weight-semibold, 600);
        word-break: break-word;
      }
      .description {
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-regular, 400);
        line-height: var(--ui-line-height-normal, 1.5);
        word-break: break-word;
      }
      /* .countdown and .close are stacked exactly on top of one another (both
         inset:0 inside this fixed-size box) rather than swapped via
         display:none, so toggling between them never shifts layout. */
      .actions {
        position: relative;
        flex: 0 0 auto;
        width: 2rem;
        height: 2rem;
        margin: -0.25rem -0.25rem -0.25rem 0;
      }
      .countdown {
        position: absolute;
        inset: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      .ring {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }
      .ring-track {
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        opacity: 0.3;
      }
      .ring-progress {
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        transform-origin: 50% 50%;
        transform: rotate(-90deg);
        stroke-dasharray: ${RING_CIRCUMFERENCE};
        stroke-dashoffset: ${RING_CIRCUMFERENCE};
        animation-name: toast-ring-fill;
        animation-duration: var(--toast-duration, 5000ms);
        animation-timing-function: linear;
        animation-fill-mode: forwards;
      }
      .toast.has-countdown:hover .ring-progress,
      .toast.has-countdown:focus-within .ring-progress {
        animation-play-state: paused;
      }
      @keyframes toast-ring-fill {
        to {
          stroke-dashoffset: 0;
        }
      }
      .countdown-number {
        position: relative;
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-semibold, 600);
        font-variant-numeric: tabular-nums;
        line-height: var(--ui-line-height-glyph, 1);
      }
      .close {
        position: absolute;
        inset: 0;
        width: 2rem;
        height: 2rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        padding: 0;
        color: inherit;
        opacity: 0.8;
        cursor: pointer;
        line-height: var(--ui-line-height-glyph, 1);
        border-radius: var(--ui-radius-sm, 0.25rem);
      }
      /* Only hide the ✕ behind the countdown when there IS a countdown — a
         duration:0 toast has no .countdown sibling and keeps the ✕ always
         visible, unchanged from before this feature existed. */
      .toast.has-countdown .close {
        opacity: 0;
      }
      .toast.has-countdown:hover .close,
      .toast.has-countdown:focus-within .close {
        opacity: 1;
      }
      .toast.has-countdown:hover .countdown,
      .toast.has-countdown:focus-within .countdown {
        visibility: hidden;
      }
      .close:hover {
        opacity: 1;
        background: var(--ui-hover-overlay, rgb(255 255 255 / 0.32));
      }
      .close:focus-visible {
        outline: none;
        opacity: 1;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      @media (prefers-reduced-motion: reduce) {
        .ring-progress {
          animation: none;
        }
      }
      @media (forced-colors: active) {
        .toast {
          border: 1px solid CanvasText;
          forced-color-adjust: auto;
        }
        .close:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
      }
      @media (max-width: 48rem) {
        :host {
          top: 0.75rem;
          right: 0.75rem;
          left: 0.75rem;
          width: auto;
        }
      }
    `,
  ];

  /**
   * Queues a toast for display.
   * @param message Text to show.
   * @param options Variant + auto-dismiss duration (see {@link ToastOptions}).
   * @returns The toast's id — pass to `dismiss()` to remove it early.
   */
  show(message: string, options: ToastOptions = {}): number {
    const id = this._nextId++;
    const variant = options.variant ?? "info";
    const duration = options.duration ?? DEFAULT_DURATION_MS;
    const toast: Toast = {
      id,
      message,
      variant,
      description: options.description,
      duration,
      endTime: duration > 0 ? Date.now() + duration : 0,
      remaining: duration,
      paused: false,
    };
    this._toasts = [...this._toasts, toast];
    if (duration > 0) this._scheduleTimer(id, duration);
    this._syncTicking();
    return id;
  }

  /**
   * Removes a toast immediately, cancelling its pending auto-dismiss timer if any.
   * @param id The id returned by `show()`.
   */
  dismiss(id: number) {
    const timer = this._timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this._timers.delete(id);
    }
    this._interaction.delete(id);
    this._toasts = this._toasts.filter((t) => t.id !== id);
    this._syncTicking();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    for (const timer of this._timers.values()) clearTimeout(timer);
    this._timers.clear();
    if (this._tickTimer) clearInterval(this._tickTimer);
    this._tickTimer = null;
  }

  /** Schedules (or reschedules) the real auto-dismiss timeout for a toast. */
  private _scheduleTimer(id: number, ms: number): void {
    this._timers.set(
      id,
      setTimeout(() => this.dismiss(id), ms),
    );
  }

  /** Freezes a toast's countdown at its current remaining time. */
  private _pause(id: number): void {
    const index = this._toasts.findIndex((t) => t.id === id);
    if (index === -1) return;
    const toast = this._toasts[index];
    if (toast.duration === 0 || toast.paused) return;
    const timer = this._timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this._timers.delete(id);
    }
    const remaining = Math.max(0, toast.endTime - Date.now());
    const next = [...this._toasts];
    next[index] = { ...toast, paused: true, remaining };
    this._toasts = next;
    this._syncTicking();
  }

  /** Resumes a paused toast's countdown for whatever time was remaining. */
  private _resume(id: number): void {
    const index = this._toasts.findIndex((t) => t.id === id);
    if (index === -1) return;
    const toast = this._toasts[index];
    if (toast.duration === 0 || !toast.paused) return;
    this._scheduleTimer(id, toast.remaining);
    const next = [...this._toasts];
    next[index] = { ...toast, paused: false, endTime: Date.now() + toast.remaining };
    this._toasts = next;
    this._syncTicking();
  }

  /** Starts or stops the shared display-only tick, matching whether any countdown is actually running. */
  private _syncTicking(): void {
    const needsTicking = this._toasts.some((t) => t.duration > 0 && !t.paused);
    if (needsTicking && !this._tickTimer) {
      this._tickTimer = setInterval(() => this.requestUpdate(), 250);
    } else if (!needsTicking && this._tickTimer) {
      clearInterval(this._tickTimer);
      this._tickTimer = null;
    }
  }

  /** Reads (creating if absent) a toast's hover/focus tracking record. */
  private _interactionState(id: number): { hovered: boolean; focusWithin: boolean } {
    let state = this._interaction.get(id);
    if (!state) {
      state = { hovered: false, focusWithin: false };
      this._interaction.set(id, state);
    }
    return state;
  }

  private _onMouseEnter(id: number): void {
    this._interactionState(id).hovered = true;
    this._pause(id);
  }

  private _onMouseLeave(id: number): void {
    const state = this._interactionState(id);
    state.hovered = false;
    if (!state.focusWithin) this._resume(id);
  }

  private _onFocusIn(id: number): void {
    this._interactionState(id).focusWithin = true;
    this._pause(id);
  }

  /** Rechecks focus-within on a microtask, since focusout fires before the new focus target settles. */
  private _onFocusOut(id: number, event: FocusEvent): void {
    const el = event.currentTarget as HTMLElement;
    queueMicrotask(() => {
      const state = this._interactionState(id);
      state.focusWithin = el.matches(":focus-within");
      if (!state.hovered && !state.focusWithin) this._resume(id);
    });
  }

  /** Whole seconds remaining until auto-dismiss, for the countdown number. */
  private _secondsLeft(t: Toast): number {
    const ms = t.paused ? t.remaining : Math.max(0, t.endTime - Date.now());
    return Math.max(0, Math.ceil(ms / 1000));
  }

  /**
   * Returns the decorative status icon for a variant, sized as a standalone
   * 18px glyph to match the dismiss button.
   * @param variant The toast variant.
   */
  private _variantIcon(variant: ToastVariant) {
    switch (variant) {
      case "success":
        return iconCheckCircle(18);
      case "error":
        return iconExclamationCircle(18);
      case "warning":
        return iconExclamationTriangle(18);
      default:
        return iconInfo(18);
    }
  }

  override render() {
    if (this._toasts.length === 0) return nothing;
    return html`
      ${this._toasts.map(
        (t) => html`
          <div
            class="toast ${t.variant} ${t.duration > 0 ? "has-countdown" : ""}"
            role=${t.variant === "error" ? "alert" : "status"}
            aria-atomic="true"
            @mouseenter=${() => this._onMouseEnter(t.id)}
            @mouseleave=${() => this._onMouseLeave(t.id)}
            @focusin=${() => this._onFocusIn(t.id)}
            @focusout=${(e: FocusEvent) => this._onFocusOut(t.id, e)}
          >
            <span class="icon" aria-hidden="true">${this._variantIcon(t.variant)}</span>
            <div class="content">
              <span class="message">${t.message}</span>
              ${t.description ? html`<span class="description">${t.description}</span>` : nothing}
            </div>
            <div class="actions">
              ${t.duration > 0
                ? html`
                    <div class="countdown" aria-hidden="true" style="--toast-duration: ${t.duration}ms">
                      <svg class="ring" viewBox="0 0 24 24">
                        <circle class="ring-track" cx="12" cy="12" r=${RING_RADIUS}></circle>
                        <circle class="ring-progress" cx="12" cy="12" r=${RING_RADIUS}></circle>
                      </svg>
                      <span class="countdown-number">${this._secondsLeft(t)}</span>
                    </div>
                  `
                : nothing}
              <button class="close" aria-label="Dismiss notification" @click=${() => this.dismiss(t.id)}>
                <span aria-hidden="true">${iconX(18)}</span>
              </button>
            </div>
          </div>
        `,
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "toast-notification": ToastNotification;
  }
}

function getToast(): ToastNotification | null {
  return document.querySelector("toast-notification");
}

/** Shows an error toast. Use for connection/network failures, not validation errors. */
export function notifyError(message: string, description?: string) {
  getToast()?.show(message, { variant: "error", description });
}

/** Shows a success toast. */
export function notifySuccess(message: string, description?: string) {
  getToast()?.show(message, { variant: "success", description });
}

/** Shows an info toast. */
export function notifyInfo(message: string, description?: string) {
  getToast()?.show(message, { variant: "info", description });
}

/** Shows a warning toast. */
export function notifyWarning(message: string, description?: string) {
  getToast()?.show(message, { variant: "warning", description });
}
