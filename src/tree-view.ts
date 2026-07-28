import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { iconChevronDown, iconChevronRight } from "./icons.js";
import { tokens } from "./tokens.js";

/** One tree node: a folder when `children` is set (even `[]`), a leaf otherwise. */
export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  data?: unknown;
}

/**
 * A generic, presentational tree shell: renders `nodes` recursively, one row
 * per node, with each row's content produced by `renderNode` (default: plain
 * label). Modeled on `data-table`'s headless pattern — knows nothing about
 * what a node's `data` means beyond what `renderNode` does with it.
 *
 * A node with a `children` array (even empty) is a folder: clicking or
 * activating its row toggles expand/collapse instead of firing `node-click`.
 * A node with no `children` is a leaf: clicking or activating its row fires
 * `node-click`. Folders start collapsed; set `default-expanded` to start
 * every folder expanded instead. Expansion state is otherwise managed
 * internally and untouched by later `nodes` updates, so a user's manual
 * toggles survive a data refresh.
 *
 * Set the `lines` boolean to draw classic file-tree connector guides: a
 * vertical line per continuing ancestor level and a branch elbow (`└`) or
 * tee (`├`) linking each node to its parent. Off by default (indentation only).
 *
 * @element tree-view
 * @fires node-click - A leaf row was activated; detail is `{ id, data }`.
 */
@customElement("tree-view")
export class TreeView extends LitElement {
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
        font-size: var(--ui-font-size-sm, 0.75rem);
      }
      .row {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        border-radius: var(--ui-radius-sm, 0.25rem);
        color: var(--ui-text, #0f172a);
        cursor: pointer;
      }
      .row:hover {
        background: var(--ui-surface-muted, #f8fafc);
      }
      .row:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .toggle {
        display: inline-flex;
        flex-shrink: 0;
        width: 1rem;
        height: 1rem;
        align-items: center;
        justify-content: center;
        color: var(--ui-text-muted, #64748b);
      }
      .content {
        min-width: 0;
        flex: 1;
      }
      :host([lines]) .row {
        padding-top: 0;
        padding-bottom: 0;
        min-height: 1.5rem;
      }
      .guides {
        display: flex;
        align-self: stretch;
        flex-shrink: 0;
      }
      .guide {
        position: relative;
        flex: 0 0 auto;
        width: 1rem;
      }
      .guide.v::before,
      .guide.connector::before {
        content: "";
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        border-left: 1px solid var(--ui-border, #e2e8f0);
      }
      .guide.connector.last::before {
        bottom: 50%;
      }
      .guide.connector::after {
        content: "";
        position: absolute;
        left: 50%;
        right: 0;
        top: 50%;
        border-top: 1px solid var(--ui-border, #e2e8f0);
      }
      @media (forced-colors: active) {
        .row:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: -2px;
          box-shadow: none;
        }
        .guide.v::before,
        .guide.connector::before,
        .guide.connector::after {
          border-color: CanvasText;
        }
      }
    `,
  ];

  /** Tree data; opaque to this component beyond what `renderNode` does with it. */
  @property({ attribute: false }) nodes: TreeNode[] = [];
  /** Produces a row's rendered content for `node`. Default: plain label text. */
  @property({ attribute: false }) renderNode: (node: TreeNode) => unknown = (node) => node.label;
  /** Start every folder expanded instead of the default all-collapsed. */
  @property({ type: Boolean, attribute: "default-expanded" }) defaultExpanded = false;
  /**
   * Draw classic file-tree connector guides (vertical ancestor lines plus a
   * branch elbow/tee per row) instead of indentation alone. Off by default.
   */
  @property({ type: Boolean, reflect: true }) lines = false;

  @state() private expanded = new Set<string>();
  #initializedExpansion = false;

  override willUpdate(changed: Map<string, unknown>): void {
    if (!changed.has("nodes") || this.#initializedExpansion) return;
    this.#initializedExpansion = true;
    if (!this.defaultExpanded) return;
    const all = new Set<string>();
    const collect = (list: TreeNode[]) => {
      for (const node of list) {
        if (!node.children) continue;
        all.add(node.id);
        collect(node.children);
      }
    };
    collect(this.nodes);
    this.expanded = all;
  }

  #toggle(id: string): void {
    const next = new Set(this.expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.expanded = next;
  }

  #activate(node: TreeNode): void {
    if (node.children) {
      this.#toggle(node.id);
      return;
    }
    this.dispatchEvent(
      new CustomEvent("node-click", {
        detail: { id: node.id, data: node.data },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #onKeydown(node: TreeNode, e: KeyboardEvent): void {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    this.#activate(node);
  }

  #onRowClick(node: TreeNode, e: MouseEvent): void {
    if (this.#isNestedInteractive(e.composedPath(), e.currentTarget)) return;
    this.#activate(node);
  }

  #isNestedInteractive(path: EventTarget[], row: EventTarget | null): boolean {
    const selector =
      "a, button, input, select, textarea, summary, [contenteditable], [role='button'], [role='link'], [tabindex]";
    for (const target of path) {
      if (target === row) return false;
      if (target instanceof HTMLElement && target.matches(selector)) return true;
    }
    return false;
  }

  #renderNode(
    node: TreeNode,
    depth: number,
    isLast: boolean,
    ancestorHasNext: boolean[],
  ): TemplateResult {
    const isFolder = !!node.children;
    const isOpen = isFolder && this.expanded.has(node.id);
    const guides = this.lines
      ? html`<span class="guides" aria-hidden="true">
          ${ancestorHasNext.map(
            (hasNext) => html`<span class="guide ${hasNext ? "v" : ""}"></span>`,
          )}
          <span class="guide connector ${isLast ? "last" : ""}"></span>
        </span>`
      : nothing;
    return html`
      <div
        class="row"
        role=${isFolder ? "button" : "link"}
        aria-expanded=${isFolder ? String(isOpen) : nothing}
        tabindex="0"
        style=${this.lines ? nothing : `padding-left: ${depth * 1.25}rem`}
        @click=${(e: MouseEvent) => this.#onRowClick(node, e)}
        @keydown=${(e: KeyboardEvent) => this.#onKeydown(node, e)}
      >
        ${guides}
        <span class="toggle" aria-hidden="true">
          ${isFolder ? (isOpen ? iconChevronDown(14) : iconChevronRight(14)) : nothing}
        </span>
        <span class="content">${this.renderNode(node)}</span>
      </div>
      ${isFolder && isOpen
        ? repeat(
            node.children!,
            (child) => child.id,
            (child, i) =>
              this.#renderNode(child, depth + 1, i === node.children!.length - 1, [
                ...ancestorHasNext,
                !isLast,
              ]),
          )
        : nothing}
    `;
  }

  override render() {
    return repeat(
      this.nodes,
      (node) => node.id,
      (node, i) => this.#renderNode(node, 0, i === this.nodes.length - 1, []),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tree-view": TreeView;
  }
}
