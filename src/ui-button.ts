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
 * `primary`/`danger` backgrounds read `--ui-button-background`/
 * `--ui-button-danger-background` (and their `-hover`/`-active`
 * counterparts), which default to the flat `--ui-primary`/`--ui-danger`
 * tokens unchanged — so `--ui-primary`/`--ui-danger` stay the single source
 * of truth for every other component. A consumer can override just these
 * button-specific tokens with a `linear-gradient(...)` to opt every
 * `ui-button` into a gradient look without touching component markup —
 * `gradientTokenValues` in `tokens.ts` ships exactly this, wired up via
 * `data-theme="gradient"` (see `tokens.css`'s "Gradient theme" section) —
 * pairing it with `--ui-button-border`/`--ui-button-danger-border` (default
 * `transparent`) for a defining edge a shade darker than the gradient's dark
 * stop, and setting the `-active` variant's stops in reverse for a
 * pressed/"indented" look while the button is held down. `secondary`'s
 * background/border read the equivalent `--ui-button-secondary-*` tokens
 * (shared with `confirm-dialog`'s Cancel button), defaulting to today's
 * transparent/bordered look, so it can be themed into a matching (e.g.
 * white-to-gray) gradient too.
 *
 * `ai` is an orthogonal modifier rather than a fourth variant: it leaves the
 * variant's fill (flat or gradient-themed) untouched and only adds an
 * animated multi-hue ring *outside* the button box — a crisp masked edge
 * plus a blurred bloom behind it that fades out to transparent, so the ring
 * melts into the page instead of ending on a hard line. Both layers are
 * masked into a donut, so nothing is ever painted over the background or
 * label. The ring's four stops are the `--ui-ai-1`…`--ui-ai-4` tokens. It
 * sweeps slowly at rest, faster on hover and while `busy`, holds still while
 * disabled or under `prefers-reduced-motion`, and drops the bloom for a
 * solid `CanvasText` ring in forced-colors mode. The bloom reaches about
 * `0.5rem` past the control, so give an AI button that much clearance from
 * its neighbors and avoid `overflow: hidden` ancestors that would clip it.
 *
 * Do not combine `ai` with `pill` under the gradient theme
 * (`data-theme="gradient"`). That theme defines a button through a darker
 * `--ui-button-border` edge plus a glossy top highlight; a pill's
 * fully-rounded silhouette runs flush against the ring around its entire
 * outline, so that border and gloss read as the inner edge of the rainbow
 * rather than as the button's own shape, and the vertical gradient fill
 * stops reading as a gradient at all. Use `ai` with the default
 * `--ui-radius-sm` corners there, and keep `ai` + `pill` for the flat theme.
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
        background: var(--ui-button-background, var(--ui-primary, #4f46e5));
        border-color: var(--ui-button-border, transparent);
        color: var(--ui-on-accent, #ffffff);
        box-shadow: var(--ui-button-highlight, 0 0 0 0 transparent);
        text-shadow: var(--ui-button-text-shadow, none);
      }
      .btn.primary:hover:not(:disabled) {
        background: var(--ui-button-background-hover, var(--ui-primary-hover, #4338ca));
      }
      .btn.primary:active:not(:disabled) {
        background: var(--ui-button-background-active, var(--ui-button-background, var(--ui-primary, #4f46e5)));
        box-shadow: none;
      }
      .btn.secondary {
        background: var(--ui-button-secondary-background, none);
        border-color: var(--ui-button-secondary-border, var(--ui-border, #e2e8f0));
        color: var(--ui-text, #0f172a);
        box-shadow: var(--ui-button-highlight, 0 0 0 0 transparent);
      }
      .btn.secondary:hover:not(:disabled) {
        background: var(--ui-button-secondary-background-hover, none);
        border-color: var(--ui-button-secondary-border-hover, var(--ui-text-muted, #64748b));
      }
      .btn.secondary:active:not(:disabled) {
        background: var(--ui-button-secondary-background-active, var(--ui-button-secondary-background, none));
        box-shadow: none;
      }
      .btn.danger {
        background: var(--ui-button-danger-background, var(--ui-danger, #dc2626));
        border-color: var(--ui-button-danger-border, transparent);
        color: var(--ui-on-accent, #ffffff);
        box-shadow: var(--ui-button-highlight, 0 0 0 0 transparent);
        text-shadow: var(--ui-button-text-shadow, none);
      }
      .btn.danger:hover:not(:disabled) {
        background: var(--ui-button-danger-background-hover, var(--ui-danger-hover, #b91c1c));
      }
      .btn.danger:active:not(:disabled) {
        background: var(--ui-button-danger-background-active, var(--ui-button-danger-background, var(--ui-danger, #dc2626)));
        box-shadow: none;
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
      .btn.primary:focus-visible:not(:active),
      .btn.danger:focus-visible:not(:active),
      .btn.secondary:focus-visible:not(:active) {
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35)), var(--ui-button-highlight, 0 0 0 0 transparent);
      }
      .btn.sm {
        height: 1.5rem;
        padding: 0.25rem 0.5rem;
        font-size: var(--ui-font-size-xs, 0.6875rem);
      }
      .btn.pill {
        border-radius: 999px;
      }
      .btn.ai {
        position: relative;
        --ai-sweep: linear-gradient(
          90deg,
          var(--ui-ai-1, #38bdf8),
          var(--ui-ai-2, #6366f1),
          var(--ui-ai-3, #d946ef),
          var(--ui-ai-4, #fbbf24),
          var(--ui-ai-1, #38bdf8)
        );
      }
      /* Two layers, both masked into a donut (everything except the content
         box) so the fill underneath — flat, gradient-themed, or transparent
         secondary — is never painted over: ::before is a blurred bloom that
         fades out to transparent, ::after the crisp edge on top of it. The
         gradient tile is 1.5x the box so most of the hue range is visible at
         once, and one cycle shifts it by exactly one tile, for a seamless
         loop. */
      .btn.ai::before,
      .btn.ai::after {
        content: "";
        position: absolute;
        background: var(--ai-sweep);
        background-size: 150% 100%;
        -webkit-mask:
          linear-gradient(#000 0 0) content-box,
          linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask:
          linear-gradient(#000 0 0) content-box,
          linear-gradient(#000 0 0);
        mask-composite: exclude;
        animation: ai-sweep 4s linear infinite;
        pointer-events: none;
      }
      /* The transparent border is headroom: a mask layer is clipped to the
         border box, so without it the blur's outward spread — the fade —
         would be cut off square again. */
      .btn.ai::before {
        inset: -1rem;
        border: 0.75rem solid transparent;
        padding: 0.25rem;
        border-radius: calc(var(--ui-radius-sm, 0.25rem) + 1rem);
        background-clip: padding-box;
        filter: blur(0.3125rem);
        opacity: 0.6;
      }
      .btn.ai::after {
        inset: -0.125rem;
        padding: 0.125rem;
        border-radius: calc(var(--ui-radius-sm, 0.25rem) + 0.125rem);
      }
      .btn.ai.pill::before,
      .btn.ai.pill::after {
        border-radius: 999px;
      }
      .btn.ai:hover::before,
      .btn.ai:hover::after {
        animation-duration: 1.5s;
      }
      /* A busy AI button keeps sweeping (and speeds up) — the ring reads as
         "working"; a plainly disabled one holds still. */
      .btn.ai[aria-busy="true"]::before,
      .btn.ai[aria-busy="true"]::after {
        animation-duration: 1.5s;
      }
      .btn.ai:disabled:not([aria-busy="true"])::before,
      .btn.ai:disabled:not([aria-busy="true"])::after,
      .btn.ai[aria-disabled="true"]:not([aria-busy="true"])::before,
      .btn.ai[aria-disabled="true"]:not([aria-busy="true"])::after {
        animation: none;
      }
      @keyframes ai-sweep {
        to {
          background-position: 300% 0;
        }
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
        .btn.ai::before,
        .btn.ai::after,
        .btn.ai:hover::before,
        .btn.ai:hover::after,
        .btn.ai[aria-busy="true"]::before,
        .btn.ai[aria-busy="true"]::after {
          animation: none;
        }
      }
      @media (forced-colors: active) {
        /* Gradients carry no meaning once colors are forced — drop the bloom
           and keep a solid system-colored ring so the AI affordance survives. */
        .btn.ai::before {
          display: none;
        }
        .btn.ai::after {
          background: CanvasText;
          animation: none;
        }
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
  /** Size — `sm` reduces height/padding/font-size one step below the default. */
  @property() size: "sm" | "md" = "md";
  /** Renders fully rounded (pill-shaped) corners instead of the default `--ui-radius-sm`. */
  @property({ type: Boolean }) pill = false;
  /** Draws the animated multi-hue "AI" ring (crisp edge plus a bloom fading out to transparent) around the button, on top of whatever variant/theme it already uses. */
  @property({ type: Boolean, reflect: true }) ai = false;
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
    const classes = `btn ${this.variant} ${this.size}${this.pill ? " pill" : ""}${this.ai ? " ai" : ""}`;
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
