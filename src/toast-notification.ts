import { LitElement, css, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { iconX } from "./icons.js";
import { tokens } from "./tokens.js";

export type ToastVariant = "error" | "info" | "success";

interface ToastOptions {
  /** Visual style; also selects the accent color. Defaults to "info". */
  variant?: ToastVariant;
  /** Auto-dismiss delay in ms. Pass 0 to require a manual close. Defaults to 5000. */
  duration?: number;
}

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

const DEFAULT_DURATION_MS = 5000;

/**
 * Fixed-position stack of dismissible notifications, anchored top-right
 * (top-full-width on mobile). Not wired to any app state yet — callers add
 * toasts imperatively via the `show()` method on a live element reference,
 * e.g. `document.querySelector('toast-notification')?.show('Offline', { variant: 'error' })`,
 * or via the `notifySuccess`/`notifyError`/`notifyInfo` module-level helpers
 * exported from this file. Each toast auto-dismisses after `duration` ms and
 * can also be dismissed via its ✕ button. Appears/disappears instantly — no
 * slide/fade transitions.
 *
 * @element toast-notification
 */
@customElement("toast-notification")
export class ToastNotification extends LitElement {
  @state() private _toasts: Toast[] = [];

  private _nextId = 0;
  private _timers = new Map<number, ReturnType<typeof setTimeout>>();

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
        max-width: 360px;
        pointer-events: none;
      }
      .toast {
        pointer-events: auto;
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        border-radius: var(--ui-radius, 0.5rem);
        padding: 0.625rem 0.75rem;
        box-shadow: var(
          --ui-shadow-lg,
          0 20px 25px -5px rgb(0 0 0 / 0.1),
          0 8px 10px -6px rgb(0 0 0 / 0.1)
        );
        font-family: var(--ui-font, ui-sans-serif, system-ui, sans-serif);
        font-size: var(--ui-font-size, 0.875rem);
        line-height: 1.4;
        color: #fff;
        background: var(--ui-text, #0f172a);
      }
      .toast.error {
        background: var(--ui-danger, #dc2626);
      }
      .toast.success {
        background: var(--ui-success, #16a34a);
      }
      .toast.info {
        background: var(--ui-primary, #4f46e5);
      }
      .message {
        flex: 1 1 auto;
        word-break: break-word;
      }
      .close {
        flex: 0 0 auto;
        background: none;
        border: none;
        padding: 2px;
        margin: -2px -2px -2px 0;
        color: inherit;
        opacity: 0.8;
        cursor: pointer;
        line-height: 0;
        border-radius: var(--ui-radius-sm, 0.25rem);
      }
      .close:hover {
        opacity: 1;
        background: rgb(255 255 255 / 0.15);
      }
      @media (max-width: 768px) {
        :host {
          top: 0.75rem;
          right: 0.75rem;
          left: 0.75rem;
          max-width: none;
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
    this._toasts = [...this._toasts, { id, message, variant }];
    if (duration > 0) {
      this._timers.set(
        id,
        setTimeout(() => this.dismiss(id), duration),
      );
    }
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
    this._toasts = this._toasts.filter((t) => t.id !== id);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    for (const timer of this._timers.values()) clearTimeout(timer);
    this._timers.clear();
  }

  override render() {
    if (this._toasts.length === 0) return nothing;
    return html`
      ${this._toasts.map(
        (t) => html`
          <div class="toast ${t.variant}" role="status">
            <span class="message">${t.message}</span>
            <button class="close" aria-label="Dismiss notification" @click=${() => this.dismiss(t.id)}>
              ${iconX(14)}
            </button>
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
export function notifyError(message: string) {
  getToast()?.show(message, { variant: "error" });
}

/** Shows a success toast. */
export function notifySuccess(message: string) {
  getToast()?.show(message, { variant: "success" });
}

/** Shows an info toast. */
export function notifyInfo(message: string) {
  getToast()?.show(message, { variant: "info" });
}
