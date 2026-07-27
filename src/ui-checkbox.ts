import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ref } from "lit/directives/ref.js";
import { tokens } from "./tokens.js";

/**
 * A form-associated boolean checkbox, usable standalone or inside a native
 * `<form>`. Submits `name=on` when checked (matching native
 * `<input type="checkbox">` semantics) and participates fully in form
 * `reset()`, ancestor `<fieldset disabled>`, and `required` validity.
 *
 * Renders a native `<input type="checkbox">` wrapped in a `<label>`, styled
 * via `:has()` on the wrapping label (matching `radio-pills`/`radio-cards`)
 * rather than styling the native input directly; the checkbox itself renders
 * at `1rem`, matching the existing radio-input convention.
 *
 * @element ui-checkbox
 * @fires change - The checkbox was toggled by the user, in either direction;
 *   detail: `{ checked }`. Programmatic `checked` assignments do not fire it.
 */
@customElement("ui-checkbox")
export class UiCheckbox extends LitElement {
  static formAssociated = true;

  static override styles = [
    tokens,
    css`
      :host {
        display: inline-block;
      }
      .checkbox {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        min-height: 2rem;
        cursor: pointer;
        font-family: var(--ui-font, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
        font-size: var(--ui-font-size-sm, 0.75rem);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text, #0f172a);
      }
      .checkbox input {
        width: 1rem;
        height: 1rem;
        margin: 0;
        accent-color: var(--ui-primary, #4f46e5);
        cursor: pointer;
      }
      .checkbox:has(input:focus-visible) {
        outline: none;
      }
      .checkbox:has(input:focus-visible) input {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
        border-radius: var(--ui-radius-sm, 0.25rem);
      }
      .checkbox:has(input:disabled) {
        cursor: not-allowed;
        opacity: 0.6;
      }
      .checkbox:has(input:disabled) input {
        cursor: not-allowed;
      }
      .required-mark {
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
      @media (forced-colors: active) {
        .checkbox:has(input:focus-visible) input {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
        .checkbox:has(input:disabled) {
          color: GrayText;
          opacity: 1;
        }
      }
    `,
  ];

  /** Whether the box is checked. */
  @property({ type: Boolean }) checked = false;
  /** Visual "partial selection" state; cleared on the next user interaction. */
  @property({ type: Boolean }) indeterminate = false;
  /** Disables interaction; merged with an ancestor `<fieldset disabled>`. */
  @property({ type: Boolean }) disabled = false;
  /** Marks the control invalid via `ElementInternals` while unchecked. */
  @property({ type: Boolean }) required = false;
  /** Form field name; submitted as `name=on` only while checked. */
  @property() name = "";
  /** Visible label text rendered next to the box. */
  @property() label = "";

  @state() private _formDisabled = false;

  #internals = this.attachInternals();
  #defaultChecked = false;
  #inputEl: HTMLInputElement | null = null;

  /** Whether the host or an ancestor fieldset currently disables the control. */
  get #isDisabled(): boolean {
    return this.disabled || this._formDisabled;
  }

  protected override willUpdate(_changed: PropertyValues): void {
    if (!this.hasUpdated) this.#defaultChecked = this.checked;
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has("checked") || changed.has("name")) this.#syncFormValue();
    if (changed.has("checked") || changed.has("required") || changed.has("disabled") || changed.has("_formDisabled")) {
      this.#syncValidity();
    }
    if (changed.has("indeterminate") && this.#inputEl) {
      this.#inputEl.indeterminate = this.indeterminate;
    }
  }

  /** Restores the checked state captured at first render, per the form contract. */
  formResetCallback(): void {
    this.checked = this.#defaultChecked;
    this.indeterminate = false;
  }

  /** Mirrors an ancestor fieldset's disabled state. */
  formDisabledCallback(disabled: boolean): void {
    this._formDisabled = disabled;
  }

  /** Restores the checked state from saved form state (bfcache/autofill). */
  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state !== "string") return;
    this.checked = state === "on";
  }

  #syncFormValue(): void {
    if (!this.name || !this.checked) {
      this.#internals.setFormValue(null);
      return;
    }
    this.#internals.setFormValue("on");
  }

  #syncValidity(): void {
    if (this.#isDisabled) {
      this.#internals.setValidity({});
      return;
    }
    if (this.required && !this.checked) {
      this.#internals.setValidity(
        { valueMissing: true },
        "Please check this box to continue.",
        this.#inputEl ?? undefined,
      );
    } else {
      this.#internals.setValidity({});
    }
  }

  #onChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.checked = input.checked;
    this.indeterminate = false;
    this.dispatchEvent(
      new CustomEvent("change", { detail: { checked: this.checked }, bubbles: true, composed: true }),
    );
  }

  #onInputRef = (el: Element | undefined): void => {
    this.#inputEl = (el as HTMLInputElement | undefined) ?? null;
    if (this.#inputEl) this.#inputEl.indeterminate = this.indeterminate;
  };

  override render() {
    return html`
      <label class="checkbox">
        <input
          ${ref(this.#onInputRef)}
          type="checkbox"
          .checked=${this.checked}
          ?disabled=${this.#isDisabled}
          ?required=${this.required}
          @change=${(e: Event) => this.#onChange(e)}
        />
        <span
          >${this.label}${this.required
            ? html`<span class="required-mark" aria-hidden="true"> *</span><span class="sr-only">
                  (required)</span
                >`
            : ""}</span
        >
      </label>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-checkbox": UiCheckbox;
  }
}
