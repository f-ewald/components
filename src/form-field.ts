import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

let instanceCount = 0;

/**
 * Per-field wrapper for a form control: label, slotted control, and an
 * optional hint or error message, in one consistent unit repeated across a
 * form. Purely presentational — composes whatever control is slotted
 * (`form-select`, `multi-select`, `autocomplete-input`, `ui-checkbox`, etc.)
 * without intercepting its events or value.
 *
 * The label wraps the default slot for a best-effort visual/click
 * association only: every existing value-entry control encapsulates its
 * real `<input>` inside its own shadow DOM, so there is no light-DOM `id` a
 * `for` attribute could target from outside, and this component cannot set
 * `aria-describedby`/`aria-invalid` on an arbitrary slotted control's
 * shadow-encapsulated input for the same reason. The error message uses
 * `role="alert"` as the practical accessibility mitigation instead of true
 * `aria-describedby` association.
 *
 * @element form-field
 * @slot - The wrapped form control.
 */
@customElement("form-field")
export class FormField extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .control-label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .label-text {
        display: flex;
        align-items: baseline;
        gap: 0.25rem;
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
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text, #0f172a);
      }
      .required-mark {
        color: var(--ui-danger, #dc2626);
      }
      .message {
        font-size: var(--ui-font-size-xs, 0.6875rem);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text-muted, #64748b);
      }
      .message.error {
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
    `,
  ];

  /** Field label text. */
  @property() label = "";
  /** Optional helper text shown below the control when there's no `error`. */
  @property() hint = "";
  /** Optional error text; replaces the `hint` display when non-empty. */
  @property() error = "";
  /** Shows a required indicator next to the label. */
  @property({ type: Boolean }) required = false;

  readonly #messageId = `form-field-message-${++instanceCount}`;

  override render() {
    const message = this.error || this.hint;
    return html`
      <div class="field">
        <label class="control-label">
          ${this.label
            ? html`<span class="label-text">
                <span>${this.label}</span>
                ${this.required
                  ? html`<span class="required-mark" aria-hidden="true">*</span
                      ><span class="sr-only"> (required)</span>`
                  : nothing}
              </span>`
            : nothing}
          <slot></slot>
        </label>
        ${message
          ? html`<span id=${this.#messageId} class="message ${this.error ? "error" : ""}" role=${this.error ? "alert" : nothing}
              >${message}</span
            >`
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "form-field": FormField;
  }
}
