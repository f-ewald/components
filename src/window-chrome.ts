import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * Sticky editor/terminal-style chrome bar for the top edge of a page or panel:
 * three decorative traffic-light dots, a filename-style label, and a
 * right-aligned actions slot for controls such as a theme toggle.
 *
 * The text property is named `label` rather than `title`, matching
 * `page-header`'s text-property precedent and avoiding confusion with the
 * global HTML `title` tooltip attribute. The dots are purely decorative, are
 * hidden from assistive technology, and reuse the semantic `--ui-danger`,
 * `--ui-warning`, and `--ui-success` tokens rather than introducing
 * chrome-only colors.
 *
 * It sticks with `position: sticky; top: 0`, so callers must place it at the
 * top of the element that actually scrolls. Its `z-index: 1` is a deliberate
 * plain literal: just enough to keep the bar above in-flow content as it
 * sticks, while staying far below the shared overlay stack (dialogs/popovers
 * start at 100), so it does not participate in `utils/layer-stack.ts`.
 *
 * @element window-chrome
 * @slot actions - Optional right-aligned controls such as theme or view toggles.
 */
@customElement("window-chrome")
export class WindowChrome extends LitElement {
  /** Filename-style text shown beside the decorative dots. */
  @property() label = "";

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        position: sticky;
        top: 0;
        z-index: 1;
        box-sizing: border-box;
        border-bottom: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        background: var(--ui-surface-muted, #f8fafc);
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
      }
      .chrome {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
        padding: 0.5rem 0.75rem;
      }
      .leading {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
        flex: 1 1 auto;
      }
      .dots {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        flex: 0 0 auto;
      }
      .dot {
        width: 0.75rem;
        height: 0.75rem;
        border-radius: var(--ui-radius-circle, 50%);
        flex: 0 0 auto;
      }
      .dot.danger {
        background: var(--ui-danger, #dc2626);
      }
      .dot.warning {
        background: var(--ui-warning, #d97706);
      }
      .dot.success {
        background: var(--ui-success, #16a34a);
      }
      .label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: var(--ui-font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-regular, 400);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text-muted, #64748b);
      }
      .actions {
        display: flex;
        align-items: center;
        margin-left: auto;
        flex: 0 0 auto;
      }
      @media (forced-colors: active) {
        :host {
          border-bottom-color: CanvasText;
        }
      }
    `,
  ];

  override render() {
    return html`
      <div class="chrome">
        <div class="leading">
          <span class="dots" aria-hidden="true">
            <span class="dot danger"></span>
            <span class="dot warning"></span>
            <span class="dot success"></span>
          </span>
          ${this.label ? html`<span class="label">${this.label}</span>` : nothing}
        </div>
        <div class="actions"><slot name="actions"></slot></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "window-chrome": WindowChrome;
  }
}
