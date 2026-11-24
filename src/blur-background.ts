import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { tokens } from "./tokens.js";
import { PointerWatch, pulseScale, wanderStep, type WanderPoint } from "./utils/wander.js";

/** How the spot moves. */
export type BlurBackgroundMode = "drift" | "follow";

/** Share of the shared pulse the spot breathes with, so a soft glow doesn't pump. */
const PULSE_DEPTH = 0.5;
/** Elapsed seconds wrap here to keep the motion inputs well-conditioned. */
const TIME_WRAP = 3600;

/**
 * A decorative, soft circular glow of one color — a radial gradient that
 * fades smoothly to transparent and gently breathes. In `drift` mode it
 * wanders across the host on its own; in `follow` mode it eases toward the
 * pointer, and drifts again when the pointer leaves. It moves exactly like
 * `particle-background`'s ring.
 *
 * By default it fills the viewport behind the page at `z-index: -1` and never
 * intercepts the pointer. That only shows through when the page's background
 * is painted by `<html>` or `<body>` alone (if both paint, the body hides it)
 * and content between the two is transparent. With `contained` it fills the
 * nearest positioned ancestor instead; give that ancestor
 * `isolation: isolate` so the glow stays behind the ancestor's own content.
 *
 * Set the color with `--blur-background-color` (default `--ui-primary`),
 * the diameter with `--blur-background-size` (default `90cqmin`, 90% of the
 * host's shorter side), and the peak opacity with
 * `--blur-background-opacity` (default `0.5`). The glow follows theme
 * changes on its own, since it is plain CSS.
 *
 * Under `prefers-reduced-motion: reduce` the glow rests, still, in the
 * center. Animation pauses while the host is off-screen or the tab is hidden.
 * The glow is hidden from assistive technology.
 *
 * @element blur-background
 */
@customElement("blur-background")
export class BlurBackground extends LitElement {
  /**
   * How the glow moves: `drift` wanders on its own, `follow` eases toward the
   * pointer while it is over the host.
   */
  @property({ type: String, reflect: true })
  mode: BlurBackgroundMode = "drift";

  /** Fills the nearest positioned ancestor instead of the viewport. */
  @property({ type: Boolean, reflect: true })
  contained: boolean = false;

  @query(".spot") private _spot?: HTMLElement;

  private readonly _pointer = new PointerWatch(this);
  private _position: WanderPoint = [0.5, 0.5];
  private _time = 0;
  private _frame?: number;
  private _lastFrame?: number;
  private _onScreen = true;

  private _intersectionObserver?: IntersectionObserver;
  private _motionQuery?: MediaQueryList;

  static override styles = [
    tokens,
    css`
      :host {
        --_color: var(--blur-background-color, var(--ui-primary, #4f46e5));
        --_size: var(--blur-background-size, 90cqmin);
        display: block;
        position: fixed;
        inset: 0;
        z-index: -1;
        overflow: hidden;
        pointer-events: none;
        container-type: size;
      }

      :host([contained]) {
        position: absolute;
      }

      :host([hidden]) {
        display: none;
      }

      .spot {
        position: absolute;
        left: 0;
        top: 0;
        width: var(--_size);
        height: var(--_size);
        opacity: var(--blur-background-opacity, 0.5);
        background: radial-gradient(
          closest-side,
          var(--_color),
          color-mix(in srgb, var(--_color) 84%, transparent) 20%,
          color-mix(in srgb, var(--_color) 49%, transparent) 40%,
          color-mix(in srgb, var(--_color) 20%, transparent) 60%,
          color-mix(in srgb, var(--_color) 6%, transparent) 80%,
          transparent
        );
        transform: translate(calc(var(--_x, 0.5) * 100cqw - 50%), calc(var(--_y, 0.5) * 100cqh - 50%))
          scale(var(--_scale, 1));
        will-change: transform;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    this._motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this._motionQuery.addEventListener("change", this._restart);
    this._intersectionObserver = new IntersectionObserver(this._onIntersect, { rootMargin: "100px" });
    this._intersectionObserver.observe(this);
    document.addEventListener("visibilitychange", this._restart);
    if (this.hasUpdated) this._restart();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._motionQuery?.removeEventListener("change", this._restart);
    this._intersectionObserver?.disconnect();
    document.removeEventListener("visibilitychange", this._restart);
    this._stop();
    this._pointer.track(false);
  }

  protected override firstUpdated(): void {
    this._restart();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("mode") && changed.get("mode") !== undefined) this._restart();
  }

  override render() {
    return html`<div class="spot" part="spot" aria-hidden="true"></div>`;
  }

  private get _reducedMotion(): boolean {
    return Boolean(this._motionQuery?.matches);
  }

  private get _animating(): boolean {
    return !this._reducedMotion && !document.hidden && this._onScreen;
  }

  private readonly _onIntersect = (entries: IntersectionObserverEntry[]): void => {
    this._onScreen = entries.some((entry) => entry.isIntersecting);
    this._restart();
  };

  /** Animates while visible and allowed to move; rests in the center under reduced motion. */
  private readonly _restart = (): void => {
    this._stop();
    this._pointer.track(this.mode === "follow" && this._animating);
    if (this._reducedMotion) {
      this._position = [0.5, 0.5];
      this._place(1);
    }
    if (this._animating) this._frame = window.requestAnimationFrame(this._tick);
  };

  private _stop(): void {
    this._lastFrame = undefined;
    if (this._frame === undefined) return;
    window.cancelAnimationFrame(this._frame);
    this._frame = undefined;
  }

  private readonly _tick = (now: number): void => {
    const dt = this._lastFrame === undefined ? 0 : Math.min(0.1, (now - this._lastFrame) / 1000);
    this._lastFrame = now;
    this._time = (this._time + dt) % TIME_WRAP;
    const pointer = this.mode === "follow" ? this._pointer.target() : undefined;
    this._position = wanderStep(this._position, this._time, dt, pointer);
    this._place(pulseScale(this._time, PULSE_DEPTH));
    this._frame = window.requestAnimationFrame(this._tick);
  };

  /** Moves the glow to the current position at `scale`. */
  private _place(scale: number): void {
    const style = this._spot?.style;
    if (!style) return;
    style.setProperty("--_x", this._position[0].toFixed(4));
    style.setProperty("--_y", this._position[1].toFixed(4));
    style.setProperty("--_scale", scale.toFixed(4));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "blur-background": BlurBackground;
  }
}
