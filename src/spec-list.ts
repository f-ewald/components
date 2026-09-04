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
 * a muted, wide-tracked key column against a value column, separated by
 * hairline rules (and uppercased under themes that set
 * `--ui-label-transform`). It describes ONE record's attributes, which is
 * what sets it apart from `data-table` (many records, many columns, sorting);
 * `spec-list` is not tabular and renders a real `<dl>`/`<dt>`/`<dd>` structure.
 *
 * Feed it the `items` array for the plain data path, or slot bare `<dt>`/`<dd>`
 * pairs when a value needs a link, a `status-pill`, or other markup — slotted
 * pairs inherit the component's own key/value styling, so no page CSS is
 * needed. A `<div>` wrapping a pair is also accepted as a full-width grouping
 * row, but `::slotted()` cannot reach inside it, so those `dt`/`dd` stay the
 * consumer's to style. Slotted content takes precedence over `items`; with
 * neither, nothing is rendered.
 *
 * @element spec-list
 * @slot - Optional `<dt>`/`<dd>` pairs for values that need custom markup;
 *   when present, they replace the `items` path.
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
      /* The dl itself is the two-column grid, so a slotted dt/dd pair is a
         direct slottable and can be styled by this stylesheet. Nesting each
         pair in a wrapper element instead would put the dt/dd a level deeper
         than ::slotted() can reach, leaving slotted keys and values entirely
         unstyled — including the dd's 40px UA margin and the min-width: 0 that
         keeps a long value from overflowing the grid column. */
      .list {
        margin: 0;
        display: grid;
        grid-template-columns: 11rem minmax(0, 1fr);
      }
      .list.empty {
        display: none;
      }
      dt,
      ::slotted(dt) {
        /* The column gap is padding on the key rather than column-gap, so a
           divider draws as one unbroken rule across both columns. */
        padding: 0.5rem 0.75rem 0.5rem 0;
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-medium, 500);
        letter-spacing: var(--ui-tracking-wide, 0.04em);
        text-transform: var(--ui-label-transform, none);
        line-height: var(--ui-line-height-normal, 1.5);
        color: var(--ui-text-muted, #64748b);
      }
      dd,
      ::slotted(dd) {
        margin: 0;
        min-width: 0;
        padding: 0.5rem 0;
        font-size: var(--ui-font-size, 0.875rem);
        line-height: var(--ui-line-height-normal, 1.5);
        color: var(--ui-text, #0f172a);
        word-break: break-word;
      }
      :host([dividers]) dt,
      :host([dividers]) dd,
      :host([dividers]) ::slotted(dt),
      :host([dividers]) ::slotted(dd) {
        border-bottom: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
      }
      :host([dividers]) dt:last-of-type,
      :host([dividers]) dd:last-of-type,
      :host([dividers]) ::slotted(dt:last-of-type),
      :host([dividers]) ::slotted(dd:last-of-type) {
        border-bottom: none;
      }
      /* A slotted wrapper element still groups a pair, but this stylesheet
         cannot reach the dt/dd inside it — the consumer styles those. */
      ::slotted(div) {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: 11rem minmax(0, 1fr);
        column-gap: 0.75rem;
        padding: 0.5rem 0;
      }
      :host([dividers]) ::slotted(div) {
        border-bottom: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
      }
      :host([dividers]) ::slotted(div:last-of-type) {
        border-bottom: none;
      }
      /* Stacked: one column, and the rule sits under the value only, since the
         key and value are now two rows of one logical row. */
      :host([layout="stacked"]) .list,
      :host([layout="stacked"]) ::slotted(div) {
        grid-template-columns: minmax(0, 1fr);
      }
      :host([layout="stacked"]) dt,
      :host([layout="stacked"]) ::slotted(dt) {
        padding: 0.5rem 0 0;
        border-bottom: none;
      }
      :host([layout="stacked"]) dd,
      :host([layout="stacked"]) ::slotted(dd) {
        padding: 0.25rem 0 0.5rem;
      }
      @media (max-width: 48rem) {
        :host([layout="auto"]) .list,
        :host([layout="auto"]) ::slotted(div) {
          grid-template-columns: minmax(0, 1fr);
        }
        :host([layout="auto"]) dt,
        :host([layout="auto"]) ::slotted(dt) {
          padding: 0.5rem 0 0;
          border-bottom: none;
        }
        :host([layout="auto"]) dd,
        :host([layout="auto"]) ::slotted(dd) {
          padding: 0.25rem 0 0.5rem;
        }
      }
    `,
  ];

  /** Whether a slot node is real content, ignoring the whitespace ordinary indented markup leaves between children. */
  private static _isContent(node: Node): boolean {
    return node.nodeType === Node.ELEMENT_NODE || (node.textContent ?? "").trim().length > 0;
  }

  /** Tracks whether the default slot has content so slotted markup can take precedence over `items`. */
  private _onSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this._hasSlotted = slot.assignedNodes({ flatten: true }).some(SpecList._isContent);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // slotchange only fires after the first render, so without seeding from the
    // light DOM here an element given both items and slotted markup renders
    // both paths for its first update — visible to anything awaiting
    // updateComplete, and contrary to the documented "slot wins" contract.
    this._hasSlotted = Array.from(this.childNodes).some(SpecList._isContent);
  }

  /** The rows, defended against a non-array value assigned at runtime by a JS or HTML consumer. */
  private _rows(): SpecListItem[] {
    return Array.isArray(this.items) ? this.items.filter((item) => item != null) : [];
  }

  override render() {
    const rows = this._rows();
    const showItems = !this._hasSlotted && rows.length > 0;
    const empty = !this._hasSlotted && rows.length === 0;
    return html`
      ${this.caption ? html`<div class="caption" id="caption">${this.caption}</div>` : nothing}
      <dl
        class="list ${empty ? "empty" : ""}"
        aria-labelledby=${this.caption ? "caption" : nothing}
      >
        ${showItems
          ? rows.map((item) => html`<dt>${item.label}</dt><dd>${item.value}</dd>`)
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
