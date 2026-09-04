import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { tokens } from "./tokens.js";

/** One rung of a {@link StepLadder} in the data-driven `items` path. */
export interface StepLadderItem {
  /** The bold step title, shown immediately after the ordinal. */
  title: string;
  /** The muted supporting line that explains the rung's fallback guidance. */
  description: string;
}

/**
 * A flat ordered ladder of fallback steps — an escalating "try this first,
 * then move to the next rung only if it does not solve it" list. Each rung
 * shows a zero-padded ordinal, a bold title, and a muted description, with a
 * hairline rule between rows.
 *
 * Feed it the `items` array for the plain data path, where each
 * {@link StepLadderItem} supplies a `title` and `description`, or slot bare
 * `<li>` steps when a rung needs links, emphasis, or other richer markup.
 * Slotted content takes precedence over `items`; with neither, nothing is
 * rendered. As with `spec-list`, richer wrapper elements are accepted too, but
 * those own their own inner markup.
 *
 * @element step-ladder
 * @slot - Optional `<li>` rungs or richer step markup; when present, they
 *   replace the `items` path.
 */
@customElement("step-ladder")
export class StepLadder extends LitElement {
  /** The rungs for the data-driven path. Ignored when the default slot has content. */
  @property({ type: Array }) items: StepLadderItem[] = [];

  /** Whether the default slot currently has assigned content. */
  @state() private _hasSlotted = false;

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
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
      }
      .ladder {
        margin: 0;
        padding: 0;
        list-style: none;
        counter-reset: rung;
      }
      .ladder.empty {
        display: none;
      }
      .rung {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem 0;
        counter-increment: rung;
      }
      .rung + .rung {
        border-top: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
      }
      .rung::before {
        content: counter(rung, decimal-leading-zero);
        flex: 0 0 auto;
        min-width: 2ch;
        color: var(--ui-primary, #4f46e5);
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-bold, 700);
        line-height: var(--ui-line-height-normal, 1.5);
        font-variant-numeric: var(--ui-numeric, normal);
      }
      .content {
        display: flex;
        flex: 1 1 auto;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.25rem 0.5rem;
        min-width: 0;
      }
      .title {
        color: var(--ui-text, #0f172a);
        font-size: var(--ui-font-size, 0.875rem);
        font-weight: var(--ui-font-weight-bold, 700);
        line-height: var(--ui-line-height-normal, 1.5);
      }
      .description {
        flex: 1 1 12rem;
        min-width: 0;
        color: var(--ui-text-muted, #64748b);
        font-size: var(--ui-font-size, 0.875rem);
        font-weight: var(--ui-font-weight-regular, 400);
        line-height: var(--ui-line-height-normal, 1.5);
        word-break: break-word;
      }
      ::slotted(li) {
        margin: 0;
        padding: 0.75rem 0;
        list-style: none;
        border-bottom: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
      }
      ::slotted(li:last-of-type) {
        border-bottom: none;
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
    this._hasSlotted = slot.assignedNodes({ flatten: true }).some(StepLadder._isContent);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // slotchange only fires after the first render, so without seeding from the
    // light DOM here an element given both items and slotted markup renders
    // both paths for its first update — visible to anything awaiting
    // updateComplete, and contrary to the documented "slot wins" contract.
    this._hasSlotted = Array.from(this.childNodes).some(StepLadder._isContent);
  }

  /** The rungs, defended against a non-array value assigned at runtime by a JS or HTML consumer. */
  private _rows(): StepLadderItem[] {
    return Array.isArray(this.items) ? this.items.filter((item): item is StepLadderItem => item != null) : [];
  }

  override render() {
    const rows = this._rows();
    const showItems = !this._hasSlotted && rows.length > 0;
    const empty = !this._hasSlotted && rows.length === 0;

    return html`
      <ol class="ladder ${empty ? "empty" : ""}">
        ${showItems
          ? repeat(
              rows,
              // Ordered ladders are display-order driven and have no intrinsic
              // item IDs, so the index is the deliberate stable key.
              (_item, index) => index,
              (item) => html`
                <li class="rung">
                  <span class="content">
                    <span class="title">${item.title}</span>
                    ${item.description
                      ? html`<span class="description">${item.description}</span>`
                      : nothing}
                  </span>
                </li>
              `,
            )
          : nothing}
        <slot @slotchange=${this._onSlotChange}></slot>
      </ol>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "step-ladder": StepLadder;
  }
}
