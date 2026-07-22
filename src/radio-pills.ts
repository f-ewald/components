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
        gap: 0.5rem;
      }
      .pill {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-height: 2rem;
        box-sizing: border-box;
        padding: 0.25rem 0.5rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: 999px;
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
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text, #0f172a);
      }
      .pill:has(input:checked) {
        border-color: var(--ui-primary, #4f46e5);
        background: var(--ui-surface-muted, #f8fafc);
      }
      .pill input {
        width: 1rem;
        height: 1rem;
        accent-color: var(--ui-primary, #4f46e5);
        cursor: pointer;
        margin: 0;
      }
      .pill:has(input:focus-visible) {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .pill:has(input:disabled) {
        cursor: not-allowed;
        opacity: 0.6;
      }
      .pill:has(input:disabled) input {
        cursor: not-allowed;
      }
      @media (forced-colors: active) {
        .pill:has(input:focus-visible) {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
        .pill:has(input:checked) {
          border-color: Highlight;
        }
        .pill:has(input:disabled) {
          color: GrayText;
          opacity: 1;
        }
      }
    `,
  ];

  /** Options to render, one pill each. */
  @property({ attribute: false }) options: RadioPillOption[] = [];
  /** Currently selected value. */
  @property() value = "";
  /** Disables every native radio in the group. */
  @property({ type: Boolean }) disabled = false;

  readonly #name = `radio-pills-${++instanceCount}`;

  private _onChange(value: string) {
    if (this.disabled) return;
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
                ?disabled=${this.disabled}
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
