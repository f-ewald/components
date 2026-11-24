import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { tokens } from "./tokens.js";

/** Progress gap between one floating character starting to lift and the next. */
const STAGGER = 0.08;
/** Each floating character lifts this share of the next one's height. */
const LIFT_FALLOFF = 0.38;
/** Tilt of the last character, in degrees; earlier ones tilt less, alternating. */
const MAX_TILT = 3;
/** Window for detecting a jump in scroll progress, and the hold before floating up. */
const JUMP_WINDOW_MS = 150;
const JUMP_THRESHOLD = 0.5;
const JUMP_PAUSE_MS = 300;
const JUMP_LIFT_MS = 1400;
/** Share of the remaining distance closed per 60 Hz frame while following scroll. */
const FOLLOW_RATE = 0.08;

const easeOutSine = (t: number): number => Math.sin((t * Math.PI) / 2);
const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;
const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Splits text into user-perceived characters, so emoji and accents stay whole. */
function graphemes(text: string): string[] {
  if (typeof Intl.Segmenter !== "function") return Array.from(text);
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return Array.from(segmenter.segment(text), (part) => part.segment);
}

/**
 * How far the host has scrolled into view: `0` until a fifth of it is above
 * the viewport's bottom edge, `1` once all of it is.
 */
function scrollProgress(element: Element): number {
  const rect = element.getBoundingClientRect();
  if (rect.height === 0) return 0;
  const entered = window.innerHeight - (rect.top + rect.height * 0.2);
  return clamp01(entered / (rect.height * 0.8));
}

/**
 * Text whose last few characters float up and away as it scrolls into view,
 * then bob gently in place, as though gravity let go of the end of the word.
 * The lift follows the scroll position smoothly; a sudden jump (a page load
 * with the text already visible, or a fast scroll) holds for a moment, then
 * floats the characters up over about a second and a half. Scrolling back
 * down below the text lets them settle again.
 *
 * The text is the element's own text content, rendered in the surrounding
 * font and color — wrap it in a heading to size it. Each floating character
 * lifts further than the one before it (the last by `lift`), tilting
 * slightly about its bottom edge. Assistive technology reads the text as one
 * word. Under `prefers-reduced-motion: reduce` the characters sit in their
 * floated positions without animating.
 *
 * @element floating-text
 */
@customElement("floating-text")
export class FloatingText extends LitElement {
  /** How many trailing characters float away. */
  @property({ type: Number, attribute: "float-count" })
  floatCount: number = 3;

  /** How far the last character rises when fully floated, in `em`. */
  @property({ type: Number })
  lift: number = 0.45;

  @state() private _text = "";
  @state() private _inView = false;

  private _current = 0;
  private _target = 0;
  private _lastTarget = 0;
  private _history: Array<{ time: number; progress: number }> = [];
  private _holdUntil = 0;
  private _entryHold = false;
  private _liftUntil = 0;
  private _liftFrom = 0;
  private _frame?: number;
  private _lastFrame?: number;
  private _textObserver?: MutationObserver;
  private _intersectionObserver?: IntersectionObserver;
  private _motionQuery?: MediaQueryList;

  static override styles = [
    tokens,
    css`
      :host {
        display: inline-block;
      }

      :host([hidden]) {
        display: none;
      }

      .word {
        display: inline-block;
        white-space: pre-wrap;
      }

      .float {
        display: inline-block;
        transform-origin: 50% 100%;
      }

      .bob {
        display: inline-block;
        transform-origin: 50% 100%;
        animation: bob var(--_bob-duration) ease-in-out var(--_bob-delay) infinite alternate;
      }

      .word:not(.in-view) .bob {
        animation-play-state: paused;
      }

      @keyframes bob {
        to {
          transform: translateY(var(--_bob-rise)) rotate(var(--_bob-tilt));
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .bob {
          animation: none;
        }
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    this._readText();
    this._textObserver = new MutationObserver(this._readText);
    this._textObserver.observe(this, { characterData: true, childList: true, subtree: true });
    this._motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this._motionQuery.addEventListener("change", this._onMotionChange);
    this._intersectionObserver = new IntersectionObserver(this._onIntersect);
    this._intersectionObserver.observe(this);
    this._onMotionChange();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._textObserver?.disconnect();
    this._intersectionObserver?.disconnect();
    this._motionQuery?.removeEventListener("change", this._onMotionChange);
    this._listen(false);
    this._stop();
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has("_text") || changed.has("floatCount") || changed.has("lift")) {
      this._applyProgress();
    }
  }

  override render() {
    const chars = graphemes(this._text);
    const count = Math.min(chars.length, Math.max(0, Math.floor(this.floatCount) || 0));
    const grounded = chars.slice(0, chars.length - count).join("");
    const floating = chars.slice(chars.length - count);
    return html`<span class="sr-only">${this._text}</span><span
        class="word ${this._inView ? "in-view" : ""}"
        aria-hidden="true"
        >${grounded || nothing}${floating.map((char, i) => this._renderFloating(char, i))}</span
      >`;
  }

  /** One floating character; `index` counts from the first floating one. */
  private _renderFloating(char: string, index: number) {
    const bob = styleMap({
      "--_bob-duration": `${2.2 + index * 0.5}s`,
      "--_bob-delay": `${index * 0.35}s`,
      "--_bob-rise": `${-0.02 - index * 0.01}em`,
      "--_bob-tilt": `${index % 2 ? 1.5 : -1.5}deg`,
    });
    return html`<span class="float"><span class="bob" style=${bob}>${char}</span></span>`;
  }

  private readonly _readText = (): void => {
    this._text = (this.textContent ?? "").replace(/\s+/g, " ").trim();
  };

  private get _reducedMotion(): boolean {
    return this._motionQuery?.matches ?? false;
  }

  private readonly _onMotionChange = (): void => {
    this._stop();
    if (this._reducedMotion) {
      this._listen(false);
      this._current = this._target = 1;
      this._applyProgress();
      return;
    }
    this._current = 0;
    this._lastTarget = 0;
    this._listen(this._inView);
    this._onScroll();
  };

  private readonly _onIntersect = (entries: IntersectionObserverEntry[]): void => {
    this._inView = entries.some((entry) => entry.isIntersecting);
    if (this._reducedMotion) return;
    this._listen(this._inView);
    this._onScroll();
  };

  private _listen(on: boolean): void {
    if (on) {
      window.addEventListener("scroll", this._onScroll, { passive: true });
      window.addEventListener("resize", this._onScroll, { passive: true });
      return;
    }
    window.removeEventListener("scroll", this._onScroll);
    window.removeEventListener("resize", this._onScroll);
  }

  /**
   * Records the new scroll progress. A large jump schedules a held, timed
   * float; the first movement off zero waits one jump window to tell the two
   * apart.
   */
  private readonly _onScroll = (): void => {
    if (this._reducedMotion) return;
    const now = performance.now();
    const target = scrollProgress(this);
    this._history = this._history.filter((entry) => now - entry.time <= JUMP_WINDOW_MS);
    const recentLow = Math.min(target, this._lastTarget, ...this._history.map((e) => e.progress));
    this._history.push({ time: now, progress: target });
    const leavingZero = this._lastTarget === 0 && target > 0 && this._current < 0.01;
    this._lastTarget = target;
    this._target = target;
    if (leavingZero) {
      this._holdUntil = now + JUMP_WINDOW_MS;
      this._entryHold = true;
    }
    const canJump = this._entryHold || now >= this._holdUntil;
    if (canJump && target - recentLow > JUMP_THRESHOLD && target > this._current + 0.05) {
      this._entryHold = false;
      this._holdUntil = now + JUMP_PAUSE_MS;
      this._liftUntil = this._holdUntil + JUMP_LIFT_MS;
      this._liftFrom = this._current;
    }
    this._frame ??= window.requestAnimationFrame(this._tick);
  };

  private _stop(): void {
    if (this._frame !== undefined) window.cancelAnimationFrame(this._frame);
    this._frame = undefined;
    this._lastFrame = undefined;
  }

  private readonly _tick = (now: number): void => {
    const frames = this._lastFrame === undefined ? 1 : (now - this._lastFrame) / (1000 / 60);
    this._lastFrame = now;
    this._frame = window.requestAnimationFrame(this._tick);
    if (now < this._holdUntil) return;
    this._entryHold = false;
    if (now < this._liftUntil) {
      const t = (now - this._holdUntil) / JUMP_LIFT_MS;
      this._current = this._liftFrom + (this._target - this._liftFrom) * easeInOutSine(t);
    } else {
      this._current += (this._target - this._current) * (1 - (1 - FOLLOW_RATE) ** frames);
      if (Math.abs(this._target - this._current) < 0.001) {
        this._current = this._target;
        this._stop();
      }
    }
    this._applyProgress();
  };

  /** Positions every floating character for the current overall progress. */
  private _applyProgress(): void {
    const floats = this.renderRoot.querySelectorAll<HTMLElement>(".float");
    const count = floats.length;
    const lift = Number.isFinite(this.lift) ? this.lift : 0.45;
    floats.forEach((el, i) => {
      const fromEnd = count - 1 - i;
      const start = STAGGER * i;
      const local = easeOutSine(clamp01((this._current - start) / (1 - start)));
      const share = LIFT_FALLOFF ** fromEnd;
      const tilt = (fromEnd % 2 ? -MAX_TILT : MAX_TILT) * Math.sqrt(share);
      const nudge = fromEnd === 0 ? -0.01 : 0;
      el.style.transform =
        `translate(${nudge * local}em, ${-lift * share * local}em) rotate(${tilt * local}deg)`;
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "floating-text": FloatingText;
  }
}
