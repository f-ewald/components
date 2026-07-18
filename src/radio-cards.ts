import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { tokens } from "./tokens.js";

export interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
}

let instanceCount = 0;

/**
 * Single-select group of full-width cards, each with a label and optional
 * description — for a handful of meaningfully different choices where the
 * description matters. For many short, same-shaped options (a color swatch,
 * a basemap style), use `radio-pills` instead. Wraps native radio inputs for
 * keyboard/a11y and fires `change` rather than relying on form submission.
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
        gap: 0.6rem;
        flex-wrap: wrap;
      }
      .card {
        flex: 1 1 180px;
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.6rem 0.7rem;
        cursor: pointer;
        font-family: var(--ui-font, ui-sans-serif, system-ui, sans-serif);
        font-size: var(--ui-font-size-sm, 0.75rem);
      }
      .card:has(input:checked) {
        border-color: var(--ui-primary, #4f46e5);
        background: var(--ui-surface-muted, #f8fafc);
      }
      .card input {
        width: auto;
        margin-top: 0.15rem;
        accent-color: var(--ui-primary, #4f46e5);
        cursor: pointer;
      }
      .card-label {
        font-weight: 600;
        color: var(--ui-text, #0f172a);
      }
      .card-description {
        display: block;
        color: var(--ui-text-muted, #64748b);
        font-weight: 400;
      }
    `,
  ];

  /** Options to render, one card each. */
  @property({ attribute: false }) options: RadioCardOption[] = [];
  /** Currently selected value. */
  @property() value = "";

  readonly #name = `radio-cards-${++instanceCount}`;

  private _onChange(value: string) {
    this.value = value;
    this.dispatchEvent(new CustomEvent("change", { detail: { value }, bubbles: true, composed: true }));
  }

  override render() {
    return html`
      <div class="options">
        ${repeat(
          this.options,
          (opt) => opt.value,
          (opt) => html`
            <label class="card">
              <input
                type="radio"
                name=${this.#name}
                ?checked=${this.value === opt.value}
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
