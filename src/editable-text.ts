import { LitElement, css, html, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * Jira/GitHub-style click-to-edit text: a display span that turns into an
 * `<input>` (or auto-growing `<textarea>` when `multiline`) on click. The
 * input/textarea inherits the host's font, so a title wrapped in an `<h1>`
 * edits at title size.
 *
 * @element editable-text
 * @fires change - Fired with `{ value: string }` when the committed value differs from the previous one.
 */
@customElement("editable-text")
export class EditableText extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        font-family: inherit;
        font-size: inherit;
        font-weight: inherit;
        line-height: inherit;
      }
      .display {
        display: block;
        width: 100%;
        box-sizing: border-box;
        border: 0;
        color: inherit;
        background: transparent;
        font: inherit;
        line-height: inherit;
        text-align: inherit;
        cursor: text;
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.25rem;
        margin: -0.25rem;
      }
      .display.multiline {
        /* Inactive multiline text is flush; the active textarea keeps its editor inset. */
        white-space: pre-wrap;
        padding: 0;
        margin: 0;
      }
      .display:hover:not(:disabled) {
        background: var(--ui-surface-muted, #f8fafc);
      }
      .display.empty {
        color: var(--ui-text-muted, #64748b);
      }
      .display:disabled {
        cursor: inherit;
        opacity: 0.6;
      }
      .display:disabled:hover {
        background: none;
      }
      .display:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      input,
      textarea {
        display: block;
        width: 100%;
        box-sizing: border-box;
        font: inherit;
        color: inherit;
        background: var(--ui-surface, #ffffff);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        padding: 0.25rem;
        margin: -0.25rem;
        outline: none;
      }
      input:focus-visible,
      textarea:focus-visible {
        border-color: var(--ui-primary, #4f46e5);
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      textarea {
        resize: none;
        overflow: hidden;
      }
      @media (forced-colors: active) {
        .display:focus-visible,
        input:focus-visible,
        textarea:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
        .display:disabled {
          color: GrayText;
          opacity: 1;
        }
      }
    `,
  ];

  /** Current text. */
  @property() value = "";
  /** `false` renders an `<input>`, `true` an auto-growing `<textarea>`. */
  @property({ type: Boolean }) multiline = false;
  /** Muted placeholder text shown when `value` is empty, and as the input's placeholder. */
  @property() placeholder = "";
  /** Disables entering edit mode. */
  @property({ type: Boolean }) readonly = false;
  /** `aria-label` applied to the input/textarea. */
  @property() label = "";

  @state() private _editing = false;
  @state() private _draft = "";

  @query("input, textarea") private _field?: HTMLInputElement | HTMLTextAreaElement;

  /** Enters edit mode, seeding the draft from the current value. */
  private _startEdit() {
    if (this.readonly) return;
    this._draft = this.value;
    this._editing = true;
  }

  /** Commits the draft (reverting an empty single-line commit) and exits edit mode.
   *
   * Guarded on `_editing`: removing the focused input/textarea from the DOM
   * (which happens as soon as `_editing` flips to false) makes the browser
   * fire a native `blur` on it, re-invoking this handler a second time after
   * a cancel already ran — the guard makes that second call a no-op instead
   * of re-committing the stale draft.
   */
  private _commit() {
    if (!this._editing) return;
    const next = this._draft;
    this._editing = false;
    if (!this.multiline && next.trim() === "") return;
    if (next === this.value) return;
    this.value = next;
    this.dispatchEvent(new CustomEvent("change", { detail: { value: next } }));
  }

  /** Discards the draft and exits edit mode without committing. */
  private _cancel() {
    this._editing = false;
  }

  private _onInput(e: Event) {
    this._draft = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
    if (this.multiline) this._resize();
  }

  private _onSingleLineKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      this._commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      this._cancel();
    }
  }

  private _onMultilineKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      this._cancel();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      this._commit();
    }
  }

  /** Grows the textarea's height to fit its content. */
  private _resize() {
    const field = this._field;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  }

  protected override updated(changed: Map<string, unknown>) {
    if (changed.has("_editing") && this._editing) {
      const field = this._field;
      if (!field) return;
      field.focus();
      const end = field.value.length;
      field.setSelectionRange(end, end);
      if (this.multiline) this._resize();
    }
  }

  override render() {
    if (this._editing) {
      return this.multiline
        ? html`<textarea
            rows="3"
            .value=${this._draft}
            placeholder=${this.placeholder}
            aria-label=${this.label || nothing}
            @input=${this._onInput}
            @keydown=${this._onMultilineKeydown}
            @blur=${this._commit}
          ></textarea>`
        : html`<input
            type="text"
            .value=${this._draft}
            placeholder=${this.placeholder}
            aria-label=${this.label || nothing}
            @input=${this._onInput}
            @keydown=${this._onSingleLineKeydown}
            @blur=${this._commit}
          />`;
    }

    const isEmpty = this.value.trim() === "";
    const classes = `display ${this.multiline ? "multiline" : ""} ${isEmpty ? "empty" : ""} ${this.readonly ? "readonly" : ""}`;
    return html`<button
      type="button"
      class=${classes}
      ?disabled=${this.readonly}
      @click=${this._startEdit}
    >${isEmpty ? this.placeholder : this.value}</button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "editable-text": EditableText;
  }
}
