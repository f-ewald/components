import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * A form-associated numeric range slider, usable standalone or inside a
 * native `<form>`. Wraps a native `<input type="range">` (kept for its free
 * keyboard, drag, and screen-reader support) restyled to match this
 * package's track/fill visual language (`stat-meter`, `percent-bar-chart`)
 * instead of the browser-default appearance. Purely a value control — no
 * built-in label; wrap in `form-field` for a labeled field, or render a
 * value readout next to it (see the playground example), matching
 * `autocomplete-input`/`form-select`.
 *
 * @element range-slider
 * @fires input - Fires continuously while dragging/typing; detail: `{ value }`.
 * @fires change - Fires once the value is committed (drag released, arrow
 *   key released); detail: `{ value }`.
 */
@customElement("range-slider")
export class RangeSlider extends LitElement {
  static formAssociated = true;

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 2rem;
        margin: 0;
        background: transparent;
        cursor: pointer;
      }
      input[type="range"]:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
      /* Track */
      input[type="range"]::-webkit-slider-runnable-track {
        height: 0.375rem;
        border-radius: var(--ui-radius-pill, 9999px);
        /* A hard-stop background gradient used as a two-tone fill trick —
           its color-stops can't themselves hold a gradient value, so this
           reads --ui-button-accent (a solid stand-in), not
           --ui-button-background directly. */
        background: linear-gradient(
          to right,
          var(--ui-button-accent, var(--ui-primary, #4f46e5)) 0%,
          var(--ui-button-accent, var(--ui-primary, #4f46e5)) var(--range-percent, 0%),
          var(--ui-surface-muted, #f8fafc) var(--range-percent, 0%),
          var(--ui-surface-muted, #f8fafc) 100%
        );
      }
      input[type="range"]::-moz-range-track {
        height: 0.375rem;
        border-radius: var(--ui-radius-pill, 9999px);
        background: var(--ui-surface-muted, #f8fafc);
      }
      input[type="range"]::-moz-range-progress {
        height: 0.375rem;
        border-radius: var(--ui-radius-pill, 9999px);
        background: var(--ui-button-accent, var(--ui-primary, #4f46e5));
      }
      /* Thumb */
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 1rem;
        height: 1rem;
        /* WebKit centers the thumb on the input's full 2rem box, not the
           thinner custom track — nudge it up to align with the track.
           A transform offset (not margin) so it isn't a spacing-grid value. */
        transform: translateY(-0.3125rem);
        border-radius: var(--ui-radius-circle, 50%);
        background: var(--ui-button-background, var(--ui-primary, #4f46e5));
        border: 2px solid var(--ui-surface, #ffffff);
        box-shadow: 0 1px 2px rgb(0 0 0 / 0.2), var(--ui-button-highlight, 0 0 0 0 transparent);
      }
      input[type="range"]::-moz-range-thumb {
        width: 1rem;
        height: 1rem;
        border-radius: var(--ui-radius-circle, 50%);
        background: var(--ui-button-background, var(--ui-primary, #4f46e5));
        border: 2px solid var(--ui-surface, #ffffff);
        box-shadow: 0 1px 2px rgb(0 0 0 / 0.2), var(--ui-button-highlight, 0 0 0 0 transparent);
      }
      input[type="range"]:disabled::-webkit-slider-thumb {
        background: var(--ui-text-muted, #64748b);
      }
      input[type="range"]:disabled::-moz-range-thumb {
        background: var(--ui-text-muted, #64748b);
      }
      input[type="range"]:focus-visible {
        outline: none;
      }
      input[type="range"]:focus-visible::-webkit-slider-thumb {
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      input[type="range"]:focus-visible::-moz-range-thumb {
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      @media (prefers-reduced-motion: no-preference) {
        input[type="range"]::-webkit-slider-thumb {
          transition: box-shadow 120ms ease;
        }
        input[type="range"]::-moz-range-thumb {
          transition: box-shadow 120ms ease;
        }
      }
      @media (forced-colors: active) {
        input[type="range"]::-webkit-slider-runnable-track {
          background: Canvas;
          border: 1px solid CanvasText;
        }
        input[type="range"]::-webkit-slider-thumb {
          background: Highlight;
          border-color: Canvas;
        }
        input[type="range"]:focus-visible::-webkit-slider-thumb {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
      }
    `,
  ];

  /** Minimum value. */
  @property({ type: Number }) min = 0;
  /** Maximum value. */
  @property({ type: Number }) max = 100;
  /** Step increment. */
  @property({ type: Number }) step = 1;
  /** Current value. */
  @property({ type: Number }) value = 0;
  /** Disables interaction; merged with an ancestor `<fieldset disabled>`. */
  @property({ type: Boolean }) disabled = false;
  /** Form field name. */
  @property() name = "";

  @state() private _formDisabled = false;

  #internals = this.attachInternals();
  #defaultValue = 0;

  /** Whether the host or an ancestor fieldset currently disables the control. */
  get #isDisabled(): boolean {
    return this.disabled || this._formDisabled;
  }

  get #percent(): number {
    const range = this.max - this.min || 1;
    return ((this.value - this.min) / range) * 100;
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (!this.hasUpdated) this.#defaultValue = this.value;
    if (changed.has("value")) this.#internals.setFormValue(String(this.value));
  }

  /** Resets to the value present at first render, per the form contract. */
  formResetCallback(): void {
    this.value = this.#defaultValue;
  }

  /** Mirrors an ancestor fieldset's disabled state. */
  formDisabledCallback(disabled: boolean): void {
    this._formDisabled = disabled;
  }

  /** Restores the value from saved form state (bfcache/autofill). */
  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state !== "string") return;
    const parsed = Number(state);
    if (!Number.isNaN(parsed)) this.value = parsed;
  }

  // The native input's own "input"/"change" events are composed (cross the
  // shadow boundary) — stop them so only our re-dispatched CustomEvent
  // (carrying `detail.value`) reaches consumers, matching text-area.ts's fix
  // for the same issue. Otherwise the native event bubbles out afterwards
  // too, re-invoking the same listener with a plain Event whose `detail` is
  // undefined, crashing consumer code that reads `e.detail.value`.
  #onInput(e: Event): void {
    e.stopPropagation();
    const input = e.target as HTMLInputElement;
    this.value = Number(input.value);
    this.dispatchEvent(new CustomEvent("input", { detail: { value: this.value }, bubbles: true, composed: true }));
  }

  #onChange(e: Event): void {
    e.stopPropagation();
    const input = e.target as HTMLInputElement;
    this.value = Number(input.value);
    this.dispatchEvent(new CustomEvent("change", { detail: { value: this.value }, bubbles: true, composed: true }));
  }

  override render() {
    return html`
      <input
        type="range"
        style=${`--range-percent: ${this.#percent}%`}
        min=${this.min}
        max=${this.max}
        step=${this.step}
        .value=${String(this.value)}
        ?disabled=${this.#isDisabled}
        @input=${(e: Event) => this.#onInput(e)}
        @change=${(e: Event) => this.#onChange(e)}
      />
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "range-slider": RangeSlider;
  }
}
