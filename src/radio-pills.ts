import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { tokens } from "./tokens.js";

export interface RadioPillOption {
  value: string;
  label: string;
}

let instanceCount = 0;

/**
 * Single-select group of compact pill-shaped options — for many short,
 * same-shaped choices (a basemap style, a unit toggle). For a handful of
 * choices where a description matters, use `radio-cards` instead. Wraps
 * native radio inputs for keyboard/a11y and fires `change` rather than
 * relying on form submission.
 *
 * @element radio-pills
 * @fires change - A pill was selected; detail: { value }.
 */
@customElement("radio-pills")
export class RadioPills extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .options {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .pill {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.3rem 0.6rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 999px;
        cursor: pointer;
        font-family: var(--ui-font, ui-sans-serif, system-ui, sans-serif);
        font-size: var(--ui-font-size-sm, 0.75rem);
        color: var(--ui-text, #0f172a);
      }
      .pill:has(input:checked) {
        border-color: var(--ui-primary, #4f46e5);
        background: var(--ui-surface-muted, #f8fafc);
      }
      .pill input {
        width: 0.85rem;
        height: 0.85rem;
        accent-color: var(--ui-primary, #4f46e5);
        cursor: pointer;
        margin: 0;
      }
    `,
  ];

  /** Options to render, one pill each. */
  @property({ attribute: false }) options: RadioPillOption[] = [];
  /** Currently selected value. */
  @property() value = "";

  readonly #name = `radio-pills-${++instanceCount}`;

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
            <label class="pill">
              <input
                type="radio"
                name=${this.#name}
                ?checked=${this.value === opt.value}
                @change=${() => this._onChange(opt.value)}
              />
              <span>${opt.label}</span>
            </label>
          `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "radio-pills": RadioPills;
  }
}
