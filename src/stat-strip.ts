import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { tokens } from "./tokens.js";

/** One stat highlight in a strip. */
export interface StatStripItem {
  /** Large figure rendered verbatim, e.g. `"54%"` or `"1.2M"`. */
  value: string;
  /** Short caption rendered beneath the figure, e.g. `"less code"`. */
  label: string;
}

/**
 * A headless, presentational strip of headline stats — one large figure plus
 * one muted caption per `items` entry, wrapping across lines on narrow
 * viewports. Unlike `stat-meter`, this component does not compute percentages
 * or render a fill bar: callers pass preformatted figure strings as-is and
 * `stat-strip` only lays them out for marketing, benchmark, or dashboard
 * summary rows.
 *
 * @element stat-strip
 */
@customElement("stat-strip")
export class StatStrip extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: block;
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

      .strip {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 1rem 1.5rem;
        margin: 0;
        padding: 0;
      }

      .item {
        display: flex;
        flex: 1 1 8rem;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 8rem;
      }

      .value {
        order: -1;
        margin: 0;
        color: var(--ui-primary, #4f46e5);
        /* The lg title tier, same as calendar-month/popover-panel/slide-panel's
           most prominent text — the shared scale is never themed for size, so
           this stays the largest available step rather than a literal. */
        font-size: var(--ui-font-size-lg, 1rem);
        font-weight: var(--ui-font-weight-bold, 700);
        line-height: var(--ui-line-height-tight, 1.25);
        font-variant-numeric: var(--ui-numeric, normal);
        white-space: nowrap;
      }

      .label {
        margin: 0;
        color: var(--ui-text-muted, #64748b);
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-medium, 500);
        letter-spacing: var(--ui-tracking-wide, 0.04em);
        line-height: var(--ui-line-height-tight, 1.25);
        text-transform: var(--ui-label-transform, none);
      }
    `,
  ];

  /** Stats rendered in display order; each item is shown as a large figure with a caption beneath it. */
  @property({ type: Array }) items: StatStripItem[] = [];

  override render() {
    if (this.items.length === 0) return nothing;

    return html`
      <dl class="strip">
        ${repeat(
          this.items,
          // Stat strips are short presentational rows with no intrinsic item IDs;
          // keying by index deliberately preserves caller-supplied display order.
          (_item, index) => index,
          (item) => html`
            <div class="item">
              <dt class="label">${item.label}</dt>
              <dd class="value">${item.value}</dd>
            </div>
          `,
        )}
      </dl>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "stat-strip": StatStrip;
  }
}
