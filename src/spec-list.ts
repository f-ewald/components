import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/** One key/value row of a {@link SpecList} in the data-driven `items` path. */
export interface SpecListItem {
  /** The attribute name, shown as the muted, wide-tracked key. */
  label: string;
  /** The attribute value, shown against the key. */
  value: string;
}

/**
 * A key/value specification sheet — the "spec sheet" block on a product page:
 * an uppercase, muted, wide-tracked key column against a value column,
 * separated by hairline rules. It describes ONE record's attributes, which is
 * what sets it apart from `data-table` (many records, many columns, sorting);
 * `spec-list` is not tabular and renders a real `<dl>`/`<dt>`/`<dd>` structure.
 *
 * Feed it the `items` array for the plain data path, or slot your own
 * `<div><dt>…</dt><dd>…</dd></div>` groups when a value needs a link, a
 * `status-pill`, or other markup. Slotted content takes precedence over
 * `items`; with neither, nothing is rendered.
 *
 * @element spec-list
 * @slot - Optional `<div><dt>…</dt><dd>…</dd></div>` groups for values that
 *   need custom markup; when present, they replace the `items` path.
 */
@customElement("spec-list")
export class SpecList extends LitElement {
  /** The key/value rows for the data-driven path. Ignored when the default slot has content. */
  @property({ type: Array }) items: SpecListItem[] = [];

  /**
   * `auto` is the two-column grid that collapses to stacked below `48rem`;
   * `stacked` forces the stacked form at every width.
   */
  @property({ reflect: true }) layout: "auto" | "stacked" = "auto";

  /** Whether to draw a hairline rule between rows; `false` for a dense inline listing. */
  @property({ type: Boolean, reflect: true }) dividers = true;

  /** Optional accessible caption rendered above the list; no element or reserved space when empty. */
  @property() caption = "";

  /** Whether the default slot currently has assigned content. */
  @state() private _hasSlotted = false;

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
      .caption {
        margin: 0 0 0.5rem;
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-medium, 500);
        letter-spacing: var(--ui-tracking-wide, 0.04em);
        text-transform: var(--ui-label-transform, none);
        color: var(--ui-text-muted, #64748b);
      }
      .list {
        margin: 0;
      }
      .list.empty {
        display: none;
      }
      /* Both the data-driven rows and the slotted div groups are laid out as
         the same two-column grid so the two paths line up identically. */
      .row,
      ::slotted(*) {
        display: grid;
        grid-template-columns: 11rem minmax(0, 1fr);
        column-gap: 0.75rem;
        padding: 0.5rem 0;
      }
      :host([dividers]) .row,
      :host([dividers]) ::slotted(*) {
        border-bottom: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
      }
      :host([dividers]) .row:last-of-type,
      :host([dividers]) ::slotted(*:last-of-type) {
        border-bottom: none;
      }
      .row dt {
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-medium, 500);
        letter-spacing: var(--ui-tracking-wide, 0.04em);
        text-transform: var(--ui-label-transform, none);
        line-height: var(--ui-line-height-normal, 1.5);
        color: var(--ui-text-muted, #64748b);
      }
      .row dd {
        margin: 0;
        min-width: 0;
        font-size: var(--ui-font-size, 0.875rem);
        line-height: var(--ui-line-height-normal, 1.5);
        color: var(--ui-text, #0f172a);
        word-break: break-word;
      }
      :host([layout="stacked"]) .row,
      :host([layout="stacked"]) ::slotted(*) {
        grid-template-columns: minmax(0, 1fr);
        row-gap: 0.25rem;
      }
      @media (max-width: 48rem) {
        :host([layout="auto"]) .row,
        :host([layout="auto"]) ::slotted(*) {
          grid-template-columns: minmax(0, 1fr);
          row-gap: 0.25rem;
        }
      }
    `,
  ];

  /** Tracks whether the default slot has content so slotted markup can take precedence over `items`. */
  private _onSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this._hasSlotted = slot.assignedNodes({ flatten: true }).some((node) => {
      return node.nodeType === Node.ELEMENT_NODE || (node.textContent ?? "").trim().length > 0;
    });
  }

  override render() {
    const showItems = !this._hasSlotted && this.items.length > 0;
    const empty = !this._hasSlotted && this.items.length === 0;
    return html`
      ${this.caption ? html`<div class="caption" id="caption">${this.caption}</div>` : nothing}
      <dl
        class="list ${empty ? "empty" : ""}"
        aria-labelledby=${this.caption ? "caption" : nothing}
      >
        ${showItems
          ? this.items.map(
              (item) => html`
                <div class="row">
                  <dt>${item.label}</dt>
                  <dd>${item.value}</dd>
                </div>
              `,
            )
          : nothing}
        <slot @slotchange=${this._onSlotChange}></slot>
      </dl>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "spec-list": SpecList;
  }
}
