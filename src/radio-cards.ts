import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";
import { tokens } from "./tokens.js";

export interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
  /** In `layout="mixed"`, forces this card onto its own full-width row. */
  fullWidth?: boolean;
}

let instanceCount = 0;

/**
 * Single-select group of full-width cards, each with a label and optional
 * description — for a handful of meaningfully different choices where the
 * description matters. For many short, same-shaped options (a color swatch,
 * a basemap style), use `radio-pills` instead. Wraps native radio inputs for
 * keyboard/a11y and fires `change` rather than relying on form submission.
 *
 * An unchecked card is treated as `ui-button`'s secondary variant: it reads
 * the same `--ui-button-secondary-background`/`-hover` and
 * `-border`/`-hover` tokens, so a gradient theme applies to a card exactly
 * like it does to any button. The selected card's border/radio dot instead
 * read `--ui-button-accent` (a solid stand-in, since `border-color`/
 * `accent-color` can't render a gradient), and its background reads the
 * shared `--ui-button-secondary-surface-muted` plus `--ui-button-highlight`,
 * so a gradient theme tints it consistently with `button-group`/
 * `pagination-nav`'s equivalents. That shared value is tuned for small
 * controls, so a card — with far more area — blends it 45% toward
 * `--ui-surface` rather than taking a second token: the tint stays the same
 * hue and gradient, just lighter on light themes (and correspondingly
 * deeper on dark ones) than on a button.
 *
 * `layout` controls how cards flow ("mixed" wraps with per-option
 * `fullWidth` rows, "vertical" stacks one per row, "horizontal" stays
 * side-by-side at every width). `hideInput` visually hides the radio dot via
 * the same `sr-only` clip pattern as `ui-checkbox` — the native input stays
 * in the DOM for keyboard/a11y, and the card's own border/tint carries the
 * selected state instead.
 *
 * @element radio-cards
 * @fires change - A card was selected; detail: { value }.
 */
@customElement("radio-cards")
export class RadioCards extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .options {
        display: flex;
        gap: 0.5rem;
      }
      .options.mixed {
        flex-wrap: wrap;
      }
      .options.mixed .card {
        flex: 1 1 11.25rem;
      }
      .options.mixed .card.full {
        flex: 1 0 100%;
      }
      .options.vertical {
        flex-direction: column;
      }
      .options.vertical .card {
        flex: 0 0 auto;
      }
      .options.horizontal {
        flex-wrap: nowrap;
      }
      .options.horizontal .card {
        flex: 1 1 0;
        min-width: 0;
      }
      .card {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        box-sizing: border-box;
        /* Opaque base under the transparent-by-default secondary token, so an
           unchecked card is a solid card rather than a bordered hole in the
           page. See ui-button's secondary variant. */
        background:
          var(--ui-button-secondary-background, none),
          var(--ui-surface, #ffffff);
        border: var(--ui-border-width, 1px) solid var(--ui-button-secondary-border, var(--ui-border, #e2e8f0));
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.5rem 0.75rem;
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
      }
      /* Unchecked cards are treated as ui-button's secondary variant (same
         resting/hover gradient tokens), so a gradient theme applies here the
         same way it does to every button — a card is not a special case. */
      .card:hover:not(:has(input:disabled)):not(:has(input:checked)) {
        background:
          var(--ui-button-secondary-background-hover, none),
          var(--ui-surface, #ffffff);
        border-color: var(--ui-button-secondary-border-hover, var(--ui-text-muted, #64748b));
      }
      /* Same single muted-surface variable as button-group/pagination-nav,
         but blended toward the card's own surface: that value is tuned for a
         small control, and across a card's much larger area it reads too
         heavy. Mixing with --ui-surface (rather than plain white) keeps the
         adjustment theme-correct — it lightens on light themes and deepens
         on dark ones. Written with the background shorthand (not
         background-image) so it stays valid whether the variable resolves to
         a gradient or a flat color. */
      .card:has(input:checked) {
        border-color: var(--ui-button-accent, var(--ui-primary, #4f46e5));
        background:
          linear-gradient(
            color-mix(in srgb, var(--ui-surface, #ffffff) 45%, transparent),
            color-mix(in srgb, var(--ui-surface, #ffffff) 45%, transparent)
          ),
          var(--ui-button-secondary-surface-muted, var(--ui-surface-muted, #f8fafc));
        box-shadow: var(--ui-button-highlight, 0 0 0 0 transparent);
      }
      .card input {
        width: 1rem;
        height: 1rem;
        margin-top: 0.25rem;
        accent-color: var(--ui-button-accent, var(--ui-primary, #4f46e5));
        cursor: pointer;
      }
      .card-label {
        font-weight: var(--ui-font-weight-semibold, 600);
        color: var(--ui-text, #0f172a);
      }
      .card-description {
        display: block;
        color: var(--ui-text-muted, #64748b);
        font-weight: var(--ui-font-weight-regular, 400);
      }
      .card:has(input:focus-visible) {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .card:has(input:checked):has(input:focus-visible) {
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35)), var(--ui-button-highlight, 0 0 0 0 transparent);
      }
      .card:has(input:disabled) {
        cursor: not-allowed;
        opacity: 0.6;
      }
      .card:has(input:disabled) input {
        cursor: not-allowed;
      }
      .card input.sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        white-space: nowrap;
        border: 0;
      }
      @media (forced-colors: active) {
        .card:has(input:focus-visible) {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
        .card:has(input:checked) {
          border-color: Highlight;
        }
        .card:has(input:disabled) {
          color: GrayText;
          opacity: 1;
        }
        .card:has(input:disabled) .card-label,
        .card:has(input:disabled) .card-description {
          color: GrayText;
        }
      }
    `,
  ];

  /** Options to render, one card each. */
  @property({ attribute: false }) options: RadioCardOption[] = [];
  /** Currently selected value. */
  @property() value = "";
  /** Disables every native radio in the group. */
  @property({ type: Boolean }) disabled = false;
  /**
   * How the cards flow.
   * - "mixed" (default): cards wrap onto as many rows as fit; options marked
   *   `fullWidth` take a row of their own.
   * - "vertical": one full-width card per row, never side by side.
   * - "horizontal": every card on one row, equal widths, no wrapping.
   */
  @property() layout: "vertical" | "horizontal" | "mixed" = "mixed";
  /** Visually hides the radio dot; the card's own border/tint carries the selected state. */
  @property({ type: Boolean, attribute: "hide-input" }) hideInput = false;

  readonly #name = `radio-cards-${++instanceCount}`;

  private _onChange(value: string) {
    if (this.disabled) return;
    this.value = value;
    this.dispatchEvent(new CustomEvent("change", { detail: { value }, bubbles: true, composed: true }));
  }

  override render() {
    return html`
      <div class="options ${this.layout}">
        ${repeat(
          this.options,
          (opt) => opt.value,
          (opt) => html`
            <label class=${classMap({ card: true, full: this.layout === "mixed" && !!opt.fullWidth })}>
              <input
                type="radio"
                class=${classMap({ "sr-only": this.hideInput })}
                name=${this.#name}
                .checked=${this.value === opt.value}
                ?disabled=${this.disabled}
                @change=${() => this._onChange(opt.value)}
              />
              <span>
                <span class="card-label">${opt.label}</span>
                ${opt.description ? html`<span class="card-description">${opt.description}</span>` : nothing}
              </span>
            </label>
          `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "radio-cards": RadioCards;
  }
}
