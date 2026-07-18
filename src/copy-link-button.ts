import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconLink } from "./icons.js";
import { notifyError, notifySuccess } from "./toast-notification.js";
import { tokens } from "./tokens.js";

/**
 * Small icon button that copies `value` to the clipboard and shows a toast
 * on success/failure (if a `<toast-notification>` element is present), and
 * always dispatches a `copy-success`/`copy-error` CustomEvent so consumers
 * without a toast element can react. Defaults to the current page URL if
 * `value` is unset.
 *
 * @element copy-link-button
 * @fires copy-success - The value was copied to the clipboard.
 * @fires copy-error - Copying to the clipboard failed.
 */
@customElement("copy-link-button")
export class CopyLinkButton extends LitElement {
  /** Text to copy. Defaults to `window.location.href` at click time. */
  @property() value = "";
  /** Accessible label / tooltip text. */
  @property() label = "Copy link";

  static override styles = [
    tokens,
    css`
      :host {
        display: inline-flex;
      }
      button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--ui-text-muted, #64748b);
        border-radius: var(--ui-radius-sm, 0.25rem);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      button:hover {
        background: var(--ui-surface-muted, #f8fafc);
        color: var(--ui-text, #0f172a);
      }
    `,
  ];

  private async _onClick() {
    const text = this.value || window.location.href;
    try {
      await navigator.clipboard.writeText(text);
      notifySuccess("Link copied to clipboard");
      this.dispatchEvent(new CustomEvent("copy-success", { bubbles: true, composed: true }));
    } catch {
      notifyError("Couldn't copy the link");
      this.dispatchEvent(new CustomEvent("copy-error", { bubbles: true, composed: true }));
    }
  }

  override render() {
    return html`
      <button type="button" aria-label=${this.label} title=${this.label} @click=${this._onClick}>
        ${iconLink(16)}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "copy-link-button": CopyLinkButton;
  }
}
