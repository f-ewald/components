import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconArrowPath } from "./icons.js";
import { tokens } from "./tokens.js";

export type ButtonVariant = "primary" | "secondary" | "danger";

/**
 * Button (or link styled as one) with an optional leading icon, in three
 * visual weights. Set `href` to render an `<a>` instead of a `<button>` —
 * same styling either way — for cross-page navigation that should look like
 * an action button; a disabled/busy link stays a real `<a>` with
 * `aria-disabled` + `pointer-events: none` rather than losing its href.
 * Put the icon in the `icon` slot and the label in the default slot.
 *
 * Form-associated (`type="submit"`/`"reset"`): the actual `<button>` lives in
 * this element's shadow root, which native HTML form association does not
 * cross into from an ancestor light-DOM `<form>`. `type="submit"`/`"reset"`
 * is instead wired through `ElementInternals.form` — the same mechanism
 * `address-autocomplete` uses to associate with an ancestor form.
 *
 * @element ui-button
 * @slot icon - Optional leading icon (e.g. an inline SVG).
 * @slot - Button label.
 */
@customElement("ui-button")
export class UiButton extends LitElement {
  static formAssociated = true;

  #internals = this.attachInternals();
  static override styles = [
    tokens,
    css`
      :host {
        display: inline-flex;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        height: 2rem;
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.5rem 1rem;
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
        cursor: pointer;
        border: 1px solid transparent;
        text-decoration: none;
        box-sizing: border-box;
      }
      .btn.primary {
        background: var(--ui-primary, #4f46e5);
        color: var(--ui-on-accent, #ffffff);
      }
      .btn.primary:hover:not(:disabled) {
        background: var(--ui-primary-hover, #4338ca);
      }
      .btn.secondary {
        background: none;
        border-color: var(--ui-border, #e2e8f0);
        color: var(--ui-text, #0f172a);
      }
      .btn.secondary:hover:not(:disabled) {
        border-color: var(--ui-text-muted, #64748b);
      }
      .btn.danger {
        background: var(--ui-danger, #dc2626);
        color: var(--ui-on-accent, #ffffff);
      }
      .btn.danger:hover:not(:disabled) {
        background: var(--ui-danger-hover, #b91c1c);
      }
      .btn:disabled,
      .btn[aria-disabled="true"] {
        opacity: 0.6;
        cursor: default;
        pointer-events: none;
      }
      .btn:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .spin {
        display: inline-flex;
        animation: spin 0.8s linear infinite;
      }
      .spin[hidden] {
        display: none;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .spin {
          animation: none;
        }
      }
      @media (forced-colors: active) {
        .btn:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
        .btn:disabled,
        .btn[aria-disabled="true"] {
          color: GrayText;
          border-color: GrayText;
          opacity: 1;
        }
      }
    `,
  ];

  /** Visual weight. */
  @property() variant: ButtonVariant = "primary";
  /** Renders an `<a href="...">` instead of a `<button>` when set. */
  @property() href: string | null = null;
  /** Native button `type`. Ignored when `href` is set. */
  @property() type: "button" | "submit" | "reset" = "button";
  /** Disables the control and dims it. */
  @property({ type: Boolean }) disabled = false;
  /** Shows a spinner in place of the icon slot and disables the control. */
  @property({ type: Boolean }) busy = false;

  /** Drives submit/reset on the ancestor form via ElementInternals, since a shadow-DOM button can't do it natively. */
  private _onClick() {
    if (this.type === "submit") this.#internals.form?.requestSubmit();
    else if (this.type === "reset") this.#internals.form?.reset();
  }

  /** Suppresses navigation while a link-styled button is disabled or busy. */
  private _onLinkClick(e: MouseEvent) {
    if (!this.disabled && !this.busy) return;
    e.preventDefault();
  }

  override render() {
    const classes = `btn ${this.variant}`;
    const isDisabled = this.disabled || this.busy;
    if (this.href) {
      return html`
        <a
          class=${classes}
          href=${this.href}
          aria-disabled=${isDisabled ? "true" : "false"}
          aria-busy=${this.busy ? "true" : "false"}
          @click=${this._onLinkClick}
        >
          <span class="spin" aria-hidden="true" ?hidden=${!this.busy}>${iconArrowPath(14)}</span>
          <slot name="icon" ?hidden=${this.busy}></slot>
          <slot></slot>
        </a>
      `;
    }
    return html`
      <button
        class=${classes}
        type="button"
        ?disabled=${isDisabled}
        aria-busy=${this.busy ? "true" : "false"}
        @click=${this._onClick}
      >
        <span class="spin" aria-hidden="true" ?hidden=${!this.busy}>${iconArrowPath(14)}</span>
        <slot name="icon" ?hidden=${this.busy}></slot>
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-button": UiButton;
  }
}
