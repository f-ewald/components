import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * A horizontal divider: a thin rule that visually separates two pieces of
 * content that are not otherwise contained in a box or frame and would bleed
 * into each other. With a `label` it renders the common "───  OR  ───"
 * pattern — text centered between two line segments; without one it is a
 * single full-width rule. Exposed to assistive technology as a horizontal
 * separator, so it renders correctly with zero external CSS.
 *
 * The vertical spacing above and below is tunable per instance via
 * `--component-divider-spacing` (default `1rem`), and both the plain and
 * labeled forms reserve the same height, so toggling the label never shifts
 * surrounding layout.
 *
 * @element content-divider
 */
@customElement("content-divider")
export class ContentDivider extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .rule {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-height: calc(var(--ui-font-size-sm, 0.75rem) * var(--ui-line-height-tight, 1.25));
        padding-block: var(--component-divider-spacing, 1rem);
      }
      .line {
        flex: 1 1 auto;
        border-top: 1px solid var(--ui-border, #e2e8f0);
      }
      .label {
        flex: 0 0 auto;
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
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: var(--ui-line-height-tight, 1.25);
      }
    `,
  ];

  /** Optional centered label; empty renders a plain full-width rule. */
  @property() label = "";

  override render() {
    const hasLabel = this.label.trim().length > 0;
    return html`
      <div
        class="rule"
        role="separator"
        aria-orientation="horizontal"
        aria-label=${hasLabel ? this.label : nothing}
      >
        <span class="line"></span>
        ${hasLabel
          ? html`<span class="label" aria-hidden="true">${this.label}</span>
              <span class="line"></span>`
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "content-divider": ContentDivider;
  }
}
