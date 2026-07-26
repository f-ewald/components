import type { TemplateResult } from "lit";
import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { tokens } from "./tokens.js";

export interface ButtonGroupOption {
  value: string;
  label: string;
  /** Optional pre-rendered icon template displayed before the label. */
  icon?: TemplateResult;
}

let instanceCount = 0;

/**
 * Single-select segmented control — a strip of buttons joined into one
 * shared-border shape, for a small, persistent set of mutually exclusive
 * choices (a view switcher, a theme picker) where the *currently selected*
 * option should read as visually "pressed," not just checked. For many
 * short, individually pill-shaped choices, use `radio-pills` instead. Wraps
 * native radio inputs for keyboard/a11y and fires `change` rather than
 * relying on form submission.
 *
 * @element button-group
 * @fires change - A segment was selected; detail: { value }.
 */
@customElement("button-group")
export class ButtonGroup extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: inline-block;
      }
      .group {
        display: flex;
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        overflow: hidden;
      }
      .segment {
        position: relative;
        display: flex;
        flex: 1 1 auto;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        height: 2rem;
        box-sizing: border-box;
        padding: 0.5rem 0.75rem;
        border-left: 1px solid var(--ui-border, #e2e8f0);
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
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text, #0f172a);
        white-space: nowrap;
      }
      .segment:first-child {
        border-left: none;
        border-top-left-radius: var(--ui-radius-sm, 0.25rem);
        border-bottom-left-radius: var(--ui-radius-sm, 0.25rem);
      }
      .segment:last-child {
        border-top-right-radius: var(--ui-radius-sm, 0.25rem);
        border-bottom-right-radius: var(--ui-radius-sm, 0.25rem);
      }
      .segment:has(input:checked) {
        background: var(--ui-primary, #4f46e5);
        color: var(--ui-on-accent, #ffffff);
      }
      .segment:not(:has(input:checked)):hover {
        background: var(--ui-surface-muted, #f8fafc);
      }
      .segment input {
        /* Fills the whole segment (not visually-hidden-offscreen) so a real
           click anywhere in the segment — including a test driver clicking
           the input by its accessible role — lands on the input itself,
           not just via native <label> click delegation. */
        position: absolute;
        inset: 0;
        margin: 0;
        opacity: 0;
        cursor: pointer;
      }
      /* Clipped by the group's own overflow:hidden unless promoted above its
         neighbors — the focus ring needs a stacking context of its own. */
      .segment:has(input:focus-visible) {
        z-index: 1;
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .segment:has(input:disabled) {
        cursor: not-allowed;
        opacity: 0.6;
      }
      @media (forced-colors: active) {
        .segment:has(input:focus-visible) {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
        .segment:has(input:checked) {
          background: Highlight;
          color: HighlightText;
        }
        .segment:has(input:disabled) {
          color: GrayText;
          opacity: 1;
        }
      }
    `,
  ];

  /** Options to render, one segment each. */
  @property({ attribute: false }) options: ButtonGroupOption[] = [];
  /** Currently selected value. */
  @property() value = "";
  /** Disables every native radio in the group. */
  @property({ type: Boolean }) disabled = false;

  readonly #name = `button-group-${++instanceCount}`;

  private _onChange(value: string) {
    if (this.disabled) return;
    this.value = value;
    this.dispatchEvent(
      new CustomEvent("change", { detail: { value }, bubbles: true, composed: true }),
    );
  }

  override render() {
    return html`
      <div class="group">
        ${repeat(
          this.options,
          (opt) => opt.value,
          (opt) => html`
            <label class="segment">
              <input
                type="radio"
                name=${this.#name}
                ?checked=${this.value === opt.value}
                ?disabled=${this.disabled}
                @change=${() => this._onChange(opt.value)}
              />
              ${opt.icon ?? nothing}
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
    "button-group": ButtonGroup;
  }
}
