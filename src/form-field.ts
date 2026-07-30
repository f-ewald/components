import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import {
  customElement,
  property,
  queryAssignedElements,
  state,
} from "lit/decorators.js";
import { tokens } from "./tokens.js";
import {
  formFieldControl,
  supportsFormFieldControl,
  type FormFieldControl,
} from "./utils/form-field-control.js";

let instanceCount = 0;
const NATIVE_TEXT_INPUT_TYPES = new Set([
  "date",
  "datetime-local",
  "email",
  "month",
  "number",
  "password",
  "search",
  "tel",
  "text",
  "time",
  "url",
  "week",
]);

/**
 * Per-field wrapper for a form control: label, slotted control, and an
 * optional hint or error message, in one consistent unit repeated across a
 * form. Purely presentational — composes whatever control is slotted
 * (`form-select`, `multi-select`, `autocomplete-input`, `ui-checkbox`, etc.)
 * without intercepting its events or value.
 *
 * Set `floating-label` for supported text controls (`input`, `textarea`,
 * `autocomplete-input`, `address-autocomplete`, and `text-area`). The label
 * then rests inside an empty field and moves to a smaller top-left position
 * while focused or non-empty. Other controls keep the external label.
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
      .control-label.floating-native {
        position: relative;
        display: block;
        border-radius: var(--ui-radius-sm, 0.25rem);
        background: var(--ui-surface, #ffffff);
        box-shadow: inset 0 0 0 1px var(--ui-border, #e2e8f0);
      }
      .control-label.floating-native:focus-within {
        box-shadow:
          inset 0 0 0 1px var(--ui-primary, #4f46e5),
          var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .control-label.floating-native .label-text {
        position: absolute;
        top: 50%;
        left: 0.75rem;
        right: 0.75rem;
        z-index: 1;
        overflow: hidden;
        transform: translateY(-50%);
        color: var(--ui-text-muted, #64748b);
        font-weight: var(--ui-font-weight-regular, 400);
        white-space: nowrap;
        text-overflow: ellipsis;
        cursor: text;
        transition:
          top 150ms ease,
          transform 150ms ease,
          font-size 150ms ease;
      }
      .control-label.floating-native.multiline .label-text {
        top: 0.5rem;
        transform: none;
      }
      .control-label.floating-native.has-value .label-text,
      .control-label.floating-native:focus-within .label-text {
        top: 0.25rem;
        transform: none;
        font-size: var(--ui-font-size-xs, 0.6875rem);
      }
      .control-label.floating-native ::slotted(input),
      .control-label.floating-native ::slotted(textarea) {
        display: block;
        box-sizing: border-box;
        width: 100%;
        min-height: 3rem;
        margin: 0;
        padding: 1.25rem 0.75rem 0.25rem;
        border: 0;
        border-radius: var(--ui-radius-sm, 0.25rem);
        color: var(--ui-text, #0f172a);
        background: transparent;
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
      }
      .control-label.floating-native ::slotted(input) {
        height: 3rem;
      }
      .control-label.floating-native ::slotted(textarea) {
        padding-bottom: 0.5rem;
        resize: vertical;
      }
      .control-label.floating-native ::slotted(input:focus-visible),
      .control-label.floating-native ::slotted(textarea:focus-visible) {
        outline: none;
      }
      .control-label.floating-native ::slotted(input:disabled),
      .control-label.floating-native ::slotted(textarea:disabled) {
        cursor: not-allowed;
        opacity: 0.6;
      }
      .control-label.floating-native:has(:disabled) .label-text {
        cursor: not-allowed;
        opacity: 0.6;
      }
      .control-label.floating-native ::slotted(input:-webkit-autofill) {
        animation: form-field-autofill 0.001s;
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
      @media (prefers-reduced-motion: reduce) {
        .control-label.floating-native .label-text {
          transition: none;
        }
      }
      @keyframes form-field-autofill {
        from {
          opacity: 1;
        }
        to {
          opacity: 1;
        }
      }
      @media (forced-colors: active) {
        .control-label.floating-native {
          border: 1px solid CanvasText;
          box-shadow: none;
        }
        .control-label.floating-native:focus-within {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
        .control-label.floating-native ::slotted(input:disabled),
        .control-label.floating-native ::slotted(textarea:disabled),
        .control-label.floating-native:has(:disabled) .label-text {
          color: GrayText;
          opacity: 1;
        }
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
  /** Moves labels inside supported text controls until they receive focus or content. */
  @property({ type: Boolean, reflect: true, attribute: "floating-label" })
  floatingLabel = false;

  @queryAssignedElements()
  private readonly _assignedElements!: HTMLElement[];

  @state() private _floatingKind: "delegated" | "native" | null = null;
  @state() private _nativeHasValue = false;

  readonly #messageId = `form-field-message-${++instanceCount}`;
  #configuredControls = new Set<FormFieldControl>();
  #resetForm: HTMLFormElement | null = null;
  #placeholderControl: HTMLInputElement | HTMLTextAreaElement | null = null;
  #placeholder = "";
  #accessibleNameControl: HTMLInputElement | HTMLTextAreaElement | null = null;
  #accessibleName: string | null = null;
  #nativeEventControl: HTMLInputElement | HTMLTextAreaElement | null = null;
  #nativeFocused = false;
  readonly #onNativeValueChange = () => this._onControlValueChange();
  readonly #onNativeFocus = () => this._onControlFocusIn();
  readonly #onNativeBlur = () => this._onControlFocusOut();
  readonly #onNativeAnimation = (event: Event) => {
    if (event instanceof AnimationEvent) this._onNativeAnimationStart(event);
  };
  readonly #onFormReset = () => {
    window.setTimeout(() => {
      this.#updateNativeValue();
      this.#syncNativePlaceholder();
    });
  };

  /** Synchronizes label configuration after the component first renders. */
  protected override firstUpdated(): void {
    this.#syncControls();
  }

  /** Resynchronizes delegated controls when public label configuration changes. */
  protected override updated(changed: PropertyValues<this>): void {
    if (
      changed.has("label") ||
      changed.has("required") ||
      changed.has("floatingLabel")
    ) {
      this.#syncControls();
    }
  }

  /** Removes delegated configuration and form listeners when disconnected. */
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const control of this.#configuredControls) control[formFieldControl](null);
    this.#configuredControls.clear();
    this.#bindNativePlaceholder(null);
    this.#bindNativeAccessibleName(null);
    this.#bindNativeEvents(null);
    this.#bindResetForm(null);
  }

  /** Handles assigned-control changes and updates the floating-label strategy. */
  private _onSlotChange(): void {
    this.#syncControls();
  }

  /** Tracks native input/textarea content after user edits. */
  private _onControlValueChange(): void {
    if (this._floatingKind !== "native") return;
    this.#updateNativeValue();
    this.#syncNativePlaceholder();
  }

  /** Reveals the native placeholder once focus floats the label. */
  private _onControlFocusIn(): void {
    if (this._floatingKind !== "native") return;
    this.#nativeFocused = true;
    this.#syncNativePlaceholder();
  }

  /** Hides the native placeholder again when an empty field loses focus. */
  private _onControlFocusOut(): void {
    if (this._floatingKind !== "native") return;
    this.#nativeFocused = false;
    this.#syncNativePlaceholder();
  }

  /** Focuses a native control when its shadow-rendered floating label is clicked. */
  private _onControlLabelClick(event: MouseEvent): void {
    if (this._floatingKind !== "native") return;
    const control = this.#nativeControl();
    if (!control || event.composedPath().includes(control)) return;
    control.focus();
  }

  /** Synchronizes native value state when WebKit applies autofill without input events. */
  private _onNativeAnimationStart(event: AnimationEvent): void {
    if (
      this._floatingKind !== "native" ||
      event.animationName !== "form-field-autofill"
    ) {
      return;
    }
    this.#updateNativeValue();
    this.#syncNativePlaceholder();
  }

  /** Finds the sole assigned native text control, if present. */
  #nativeControl(): HTMLInputElement | HTMLTextAreaElement | null {
    if (this._assignedElements?.length !== 1) return null;
    const [element] = this._assignedElements;
    if (element instanceof HTMLTextAreaElement) return element;
    if (!(element instanceof HTMLInputElement)) return null;
    return NATIVE_TEXT_INPUT_TYPES.has(element.type) ? element : null;
  }

  /** Pushes current label configuration into a supported slotted control. */
  #syncControls(): void {
    const assigned = this._assignedElements ?? [];
    const delegated =
      this.floatingLabel &&
      Boolean(this.label) &&
      assigned.length === 1 &&
      supportsFormFieldControl(assigned[0])
        ? assigned[0]
        : null;
    const native =
      this.floatingLabel && Boolean(this.label) && !delegated
        ? this.#nativeControl()
        : null;
    const nextConfigured = new Set<FormFieldControl>();

    if (delegated) {
      delegated[formFieldControl]({
        label: this.label,
        required: this.required,
        floating: true,
      });
      nextConfigured.add(delegated);
    }
    for (const control of this.#configuredControls) {
      if (!nextConfigured.has(control)) control[formFieldControl](null);
    }
    this.#configuredControls = nextConfigured;

    this._floatingKind = delegated ? "delegated" : native ? "native" : null;
    this.#updateNativeValue();
    this.#bindNativePlaceholder(native);
    this.#bindNativeAccessibleName(native);
    this.#bindNativeEvents(native);
    this.#bindResetForm(native?.form ?? null);
  }

  /** Updates whether a native control currently contains a value. */
  #updateNativeValue(): void {
    this._nativeHasValue = Boolean(this.#nativeControl()?.value);
  }

  /** Preserves the consumer placeholder while floating mode temporarily hides it. */
  #bindNativePlaceholder(
    control: HTMLInputElement | HTMLTextAreaElement | null,
  ): void {
    if (control === this.#placeholderControl) {
      this.#syncNativePlaceholder();
      return;
    }
    if (this.#placeholderControl) this.#placeholderControl.placeholder = this.#placeholder;
    this.#placeholderControl = control;
    this.#placeholder = control?.placeholder ?? "";
    this.#nativeFocused = control === document.activeElement;
    this.#syncNativePlaceholder();
  }

  /** Applies the correct placeholder for the native label's focus/value state. */
  #syncNativePlaceholder(): void {
    if (!this.#placeholderControl) return;
    this.#placeholderControl.placeholder =
      this.#nativeFocused || this._nativeHasValue ? this.#placeholder : "";
  }

  /** Applies a shadow-boundary-safe accessible name and restores any prior value. */
  #bindNativeAccessibleName(
    control: HTMLInputElement | HTMLTextAreaElement | null,
  ): void {
    if (control !== this.#accessibleNameControl) {
      if (this.#accessibleNameControl) {
        if (this.#accessibleName == null) {
          this.#accessibleNameControl.removeAttribute("aria-label");
        } else {
          this.#accessibleNameControl.setAttribute("aria-label", this.#accessibleName);
        }
      }
      this.#accessibleNameControl = control;
      this.#accessibleName = control?.getAttribute("aria-label") ?? null;
    }
    if (!control) return;
    control.setAttribute(
      "aria-label",
      this.required ? `${this.label} (required)` : this.label,
    );
  }

  /** Moves native field listeners directly between assigned controls. */
  #bindNativeEvents(control: HTMLInputElement | HTMLTextAreaElement | null): void {
    if (control === this.#nativeEventControl) return;
    this.#nativeEventControl?.removeEventListener("input", this.#onNativeValueChange);
    this.#nativeEventControl?.removeEventListener("change", this.#onNativeValueChange);
    this.#nativeEventControl?.removeEventListener("focus", this.#onNativeFocus);
    this.#nativeEventControl?.removeEventListener("blur", this.#onNativeBlur);
    this.#nativeEventControl?.removeEventListener(
      "animationstart",
      this.#onNativeAnimation,
    );
    this.#nativeEventControl = control;
    this.#nativeEventControl?.addEventListener("input", this.#onNativeValueChange);
    this.#nativeEventControl?.addEventListener("change", this.#onNativeValueChange);
    this.#nativeEventControl?.addEventListener("focus", this.#onNativeFocus);
    this.#nativeEventControl?.addEventListener("blur", this.#onNativeBlur);
    this.#nativeEventControl?.addEventListener(
      "animationstart",
      this.#onNativeAnimation,
    );
  }

  /** Moves the reset listener to the native control's current owner form. */
  #bindResetForm(form: HTMLFormElement | null): void {
    if (form === this.#resetForm) return;
    this.#resetForm?.removeEventListener("reset", this.#onFormReset);
    this.#resetForm = form;
    this.#resetForm?.addEventListener("reset", this.#onFormReset);
  }

  override render() {
    const message = this.error || this.hint;
    const delegatedFloating = this._floatingKind === "delegated";
    const nativeFloating = this._floatingKind === "native";
    const nativeMultiline =
      nativeFloating && this.#nativeControl() instanceof HTMLTextAreaElement;
    return html`
      <div class="field">
        <label
          class="control-label ${nativeFloating ? "floating-native" : ""} ${nativeMultiline
            ? "multiline"
            : ""} ${this._nativeHasValue ? "has-value" : ""}"
          @click=${this._onControlLabelClick}
        >
          ${this.label && !delegatedFloating
            ? html`<span class="label-text">
                <span>${this.label}</span>
                ${this.required
                  ? html`<span class="required-mark" aria-hidden="true">*</span
                      ><span class="sr-only"> (required)</span>`
                  : nothing}
              </span>`
            : nothing}
          <slot @slotchange=${this._onSlotChange}></slot>
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
