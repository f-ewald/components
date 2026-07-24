import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * Plain multi-line text field — a thin, tokenized wrapper around a native
 * `<textarea>`, styled to match the other value-entry form fields
 * (autocomplete-input, form-select, ...). Not a rich editor; use `readonly`
 * to display pre-formatted text (e.g. an error message) that the user can
 * still select and copy, typically paired with `<copy-link-button>`.
 *
 * @element text-area
 * @fires input - Fires on every keystroke; detail: { value: string }.
 * @fires change - Native change semantics (on blur, if the value changed); detail: { value: string }.
 */
@customElement("text-area")
export class TextArea extends LitElement {
  /** Current text content. */
  @property() value = "";
  /** Visible row count (native `<textarea rows>`). */
  @property({ type: Number }) rows = 4;
  /** Placeholder text shown when empty. */
  @property() placeholder = "";
  /** When true, the value can be selected/copied but not edited. */
  @property({ type: Boolean }) readonly = false;
  /** Disables the field entirely (no interaction, dimmed). */
  @property({ type: Boolean }) disabled = false;

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      textarea {
        display: block;
        box-sizing: border-box;
        width: 100%;
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
        line-height: var(--ui-line-height-normal, 1.5);
        color: var(--ui-text, #0f172a);
        background: var(--ui-surface, #ffffff);
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        resize: vertical;
      }
      textarea:read-only {
        background: var(--ui-surface-muted, #f8fafc);
      }
      textarea:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
      textarea:focus-visible {
        outline: none;
        border-color: var(--ui-primary, #4f46e5);
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      @media (forced-colors: active) {
        textarea:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
        textarea:disabled {
          color: GrayText;
          opacity: 1;
        }
      }
    `,
  ];

  private _onInput(e: Event): void {
    this.value = (e.target as HTMLTextAreaElement).value;
    this.dispatchEvent(
      new CustomEvent("input", { detail: { value: this.value }, bubbles: true, composed: true }),
    );
  }

  private _onChange(e: Event): void {
    this.value = (e.target as HTMLTextAreaElement).value;
    this.dispatchEvent(
      new CustomEvent("change", { detail: { value: this.value }, bubbles: true, composed: true }),
    );
  }

  override render() {
    return html`
      <textarea
        .value=${this.value}
        rows=${this.rows}
        placeholder=${this.placeholder}
        ?readonly=${this.readonly}
        ?disabled=${this.disabled}
        @input=${this._onInput}
        @change=${this._onChange}
      ></textarea>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "text-area": TextArea;
  }
}
