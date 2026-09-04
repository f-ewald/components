import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "./tokens.js";
import {
  formFieldControl,
  type FormFieldControlConfig,
} from "./utils/form-field-control.js";

let instanceCount = 0;

/**
 * Plain multi-line text field — a thin, tokenized wrapper around a native
 * `<textarea>`, styled to match the other value-entry form fields
 * (autocomplete-input, form-select, ...). Not a rich editor; use `readonly`
 * to display pre-formatted text (e.g. an error message) that the user can
 * still select and copy, typically paired with `<copy-link-button>`.
 * Supports `form-field`'s opt-in floating-label mode when slotted inside it.
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

  @state() private _formFieldConfig: FormFieldControlConfig | null = null;

  readonly #textareaId = `text-area-field-${++instanceCount}`;

  /**
   * Applies or clears label configuration supplied by a wrapping `form-field`.
   * @private
   */
  [formFieldControl](config: FormFieldControlConfig | null): void {
    this._formFieldConfig = config;
  }

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .field-shell {
        position: relative;
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
        font-size: var(--ui-font-size, 0.875rem);
        line-height: var(--ui-line-height-normal, 1.5);
        color: var(--ui-text, #0f172a);
        background: var(--ui-surface, #ffffff);
        padding: 0.5rem 0.75rem;
        border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        resize: vertical;
      }
      .floating-label {
        position: absolute;
        top: 0.25rem;
        left: 0.75rem;
        right: 0.75rem;
        z-index: 1;
        display: flex;
        align-items: baseline;
        gap: 0.25rem;
        overflow: hidden;
        color: var(--ui-text-muted, #64748b);
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
        font-weight: var(--ui-font-weight-regular, 400);
        line-height: var(--ui-line-height-tight, 1.25);
        white-space: nowrap;
        text-overflow: ellipsis;
        cursor: text;
        transition:
          top 150ms ease,
          font-size 150ms ease;
      }
      .field-shell.floating textarea {
        min-height: 3rem;
        padding-top: 1.5rem;
      }
      .field-shell.floating.has-value .floating-label,
      .field-shell.floating:focus-within .floating-label {
        top: 0.25rem;
        font-size: var(--ui-font-size-xs, 0.6875rem);
      }
      .field-shell.floating:not(.has-value):not(:focus-within) textarea::placeholder {
        opacity: 0;
      }
      .field-shell.disabled .floating-label {
        cursor: not-allowed;
        opacity: 0.6;
      }
      .required-mark {
        flex: 0 0 auto;
        color: var(--ui-danger, #dc2626);
      }
      .sr-only {
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
        .field-shell.disabled .floating-label {
          color: GrayText;
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .floating-label {
          transition: none;
        }
      }
    `,
  ];

  private _onInput(e: Event): void {
    // The native textarea's own "input" event is composed (crosses the shadow
    // boundary) — stop it so only our re-dispatched CustomEvent (carrying
    // `detail.value`) reaches consumers. Otherwise the native event bubbles
    // out afterwards too, re-invoking the same "input" listener with a plain
    // UIEvent whose `detail` defaults to 0, clobbering consumer state.
    e.stopPropagation();
    this.value = (e.target as HTMLTextAreaElement).value;
    this.dispatchEvent(
      new CustomEvent("input", { detail: { value: this.value }, bubbles: true, composed: true }),
    );
  }

  private _onChange(e: Event): void {
    e.stopPropagation();
    this.value = (e.target as HTMLTextAreaElement).value;
    this.dispatchEvent(
      new CustomEvent("change", { detail: { value: this.value }, bubbles: true, composed: true }),
    );
  }

  override render() {
    const floating =
      Boolean(this._formFieldConfig?.floating) && Boolean(this._formFieldConfig?.label);
    return html`
      <div
        class="field-shell ${floating ? "floating" : ""} ${this.value
          ? "has-value"
          : ""} ${this.disabled ? "disabled" : ""}"
      >
        ${floating
          ? html`
              <label class="floating-label" for=${this.#textareaId}>
                <span>${this._formFieldConfig!.label}</span>
                ${this._formFieldConfig!.required
                  ? html`
                      <span class="required-mark" aria-hidden="true">*</span>
                      <span class="sr-only"> (required)</span>
                    `
                  : nothing}
              </label>
            `
          : nothing}
        <textarea
          id=${this.#textareaId}
          .value=${this.value}
          rows=${this.rows}
          placeholder=${this.placeholder}
          ?readonly=${this.readonly}
          ?disabled=${this.disabled}
          @input=${this._onInput}
          @change=${this._onChange}
        ></textarea>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "text-area": TextArea;
  }
}
