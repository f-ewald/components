import { LitElement, css, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { tokens } from "./tokens.js";
import "./form-actions.js";
import "./kbd-hint.js";
import "./ui-button.js";

/**
 * GitHub/Slack-style comment composer: a one-line text field that expands
 * into a multi-line textarea with a bottom-right Cancel/Submit footer
 * (`form-actions`) as soon as it's focused or clicked. Submitting fires
 * `submit` with the trimmed value, then clears the field and collapses back
 * to one line — it's meant for posting one comment at a time, not editing a
 * persistent value in place (see `editable-text` for that). Canceling (the
 * Cancel button or `Escape`) discards the draft and collapses without
 * firing `submit`. Clicking away (blur) does neither — the composer stays
 * expanded until the user explicitly submits or cancels. `Cmd`/`Ctrl`+`Enter`
 * submits from the textarea, matching `editable-text`'s multiline shortcut —
 * the Submit button always shows a `kbd-hint` for it, so the shortcut is
 * discoverable rather than a hidden power-user feature. Calling the standard
 * `.focus()` method expands the composer (if collapsed) and focuses its
 * field, for an ancestor that wants to drive it programmatically.
 * Purely token-styled (no bespoke colors), so it's themeable via the same
 * `--ui-*` custom properties as every other value-entry field.
 *
 * @element comment-composer
 * @fires submit - User submitted a non-empty comment; detail: `{ value: string }`.
 * @fires cancel - User discarded the draft via the Cancel button or `Escape`.
 */
@customElement("comment-composer")
export class CommentComposer extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .shell {
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        background: var(--ui-surface, #ffffff);
      }
      .shell.expanded {
        border-radius: var(--ui-radius, 0.5rem);
      }
      input,
      textarea {
        display: block;
        box-sizing: border-box;
        width: 100%;
        border: 0;
        background: none;
        color: var(--ui-text, #0f172a);
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
        padding: 0.5rem 0.75rem;
        outline: none;
      }
      textarea {
        resize: none;
      }
      input:focus-visible,
      .shell:not(.expanded):focus-within {
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
        border-radius: var(--ui-radius-sm, 0.25rem);
      }
      textarea:focus-visible {
        outline: none;
      }
      .footer {
        display: flex;
        justify-content: flex-end;
        padding: 0.5rem 0.75rem 0.75rem;
      }
      input:disabled,
      textarea:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
      @media (forced-colors: active) {
        .shell:not(.expanded):focus-within {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
      }
    `,
  ];

  /** Committed value shown in the collapsed one-line field. */
  @property() value = "";
  /** Placeholder text shown when empty. */
  @property() placeholder = "Add a comment…";
  /** Accessible name applied to the input/textarea. */
  @property() label = "Comment";
  /** Visible row count once expanded. */
  @property({ type: Number }) rows = 4;
  /** Label for the primary submit button. */
  @property({ attribute: "submit-label" }) submitLabel = "Submit";
  /** Label for the secondary cancel button. */
  @property({ attribute: "cancel-label" }) cancelLabel = "Cancel";
  /** Disables the field entirely. */
  @property({ type: Boolean }) disabled = false;

  @state() private _expanded = false;
  @state() private _draft = "";

  @query("textarea") private _textarea?: HTMLTextAreaElement;

  private _expand(): void {
    if (this.disabled || this._expanded) return;
    this._draft = this.value;
    this._expanded = true;
  }

  /**
   * Expands the composer (if collapsed) and focuses its field, so an
   * ancestor can drive it programmatically — e.g. a "reply" affordance
   * elsewhere on the page that should land the user in this composer
   * already expanded, not just visually scrolled to a one-line input.
   * A no-op while `disabled`. Expanding re-renders asynchronously; the
   * actual focus happens in `updated()` once the textarea exists.
   */
  override focus(options?: FocusOptions): void {
    if (this.disabled) return;
    if (!this._expanded) {
      this._expand();
      return;
    }
    this._textarea?.focus(options);
  }

  private _onInput(e: Event): void {
    this._draft = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  private _cancel(): void {
    this._draft = this.value;
    this._expanded = false;
    this.dispatchEvent(new CustomEvent("cancel", { bubbles: true, composed: true }));
  }

  private _submit(): void {
    const trimmed = this._draft.trim();
    if (trimmed === "") return;
    this.value = "";
    this._draft = "";
    this._expanded = false;
    this.dispatchEvent(
      new CustomEvent("submit", { detail: { value: trimmed }, bubbles: true, composed: true }),
    );
  }

  private _onKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      e.preventDefault();
      this._cancel();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      this._submit();
    }
  }

  protected override updated(changed: Map<string, unknown>): void {
    if (changed.has("_expanded") && this._expanded) {
      const field = this._textarea;
      if (!field) return;
      field.focus();
      const end = field.value.length;
      field.setSelectionRange(end, end);
    }
  }

  override render() {
    const canSubmit = this._draft.trim() !== "";
    return html`
      <div class="shell ${this._expanded ? "expanded" : ""}">
        ${this._expanded
          ? html`
              <textarea
                rows=${this.rows}
                .value=${this._draft}
                placeholder=${this.placeholder}
                aria-label=${this.label}
                ?disabled=${this.disabled}
                @input=${this._onInput}
                @keydown=${this._onKeydown}
              ></textarea>
              <div class="footer">
                <form-actions>
                  <ui-button
                    slot="secondary"
                    variant="secondary"
                    size="sm"
                    @click=${this._cancel}
                    >${this.cancelLabel}</ui-button
                  >
                  <ui-button
                    slot="primary"
                    variant="primary"
                    size="sm"
                    ?disabled=${!canSubmit}
                    @click=${this._submit}
                    >${this.submitLabel} <kbd-hint keys="Mod+Enter"></kbd-hint
                  ></ui-button>
                </form-actions>
              </div>
            `
          : html`
              <input
                type="text"
                .value=${this.value}
                placeholder=${this.placeholder}
                aria-label=${this.label}
                ?disabled=${this.disabled}
                @focus=${this._expand}
                @click=${this._expand}
              />
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "comment-composer": CommentComposer;
  }
}
