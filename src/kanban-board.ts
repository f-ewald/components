import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { iconCalendar, iconClock, iconTag } from "./icons.js";
import { tokens } from "./tokens.js";
import "./kanban-column.js";
import "./kanban-card.js";
import "./popover-panel.js";
import "./radio-pills.js";
import "./relative-time.js";

/** One card in a column. `id` is stable identity; everything else is display data. */
export interface KanbanCardData {
  /** Stable unique identifier used as the drag/move key. */
  id: string;
  /** Ticket identifier shown in the overview and detail, e.g. `"PROJ-142"`. */
  ticket: string;
  /** Card title shown in the overview and detail. */
  title: string;
  /** Longer description shown only in the detail popover. */
  description?: string;
  /** ISO 8601 / SQLite `datetime` string shown in the detail popover. */
  createdAt?: string;
  /** ISO 8601 / SQLite `datetime` string shown in the detail popover. */
  updatedAt?: string;
}

/** One column: its `id`, header `title`, and ordered `cards`. The column is the card's state. */
export interface KanbanColumnData {
  /** Stable unique identifier, also the card's state value. */
  id: string;
  /** Column title shown in the header and the detail state selector. */
  title: string;
  /** Cards in display order. */
  cards: KanbanCardData[];
}

/** `card-move` detail: which card moved, and where from/to (`toIndex` is its final index in `toColumnId`). */
export interface KanbanCardMoveDetail {
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  toIndex: number;
}

/** `card-open` detail: the card whose detail view was opened. */
export interface KanbanCardOpenDetail {
  cardId: string;
}

interface GrabState {
  cardId: string;
  fromColumnId: string;
  originIndex: number;
  columnId: string;
  index: number;
}

interface DragState {
  cardId: string;
  fromColumnId: string;
  originIndex: number;
}

interface Indicator {
  columnId: string;
  index: number;
}

/** Duration (ms) of the warm "just moved" highlight flashed on a card after it lands. */
const HIGHLIGHT_MS = 1400;

/**
 * A configurable kanban board: a horizontally scrolling row of columns, each
 * holding cards. **A card's column is its state** — moving a card to another
 * column (by drag-and-drop, keyboard, or the detail popover's state selector)
 * changes its state, and the board emits a single `card-move` for all three.
 *
 * Data-driven: set the `columns` property to `KanbanColumnData[]`. The board
 * keeps its own working copy and mutates it optimistically on every move, so it
 * works standalone; re-assign `columns` at any time to stay controlled from a
 * store. Cards show only their ticket number and title in the overview; the
 * full detail (description, state, created/updated timestamps) opens in a
 * screen-centered `popover-panel`.
 *
 * Pointer drag-and-drop supports both cross-column moves and within-column
 * reordering with a live drop indicator (set `reorderable` false to keep only
 * cross-column moves when intra-column order isn't persisted). Keyboard parity:
 * focus a card and press Space to pick it up, arrow keys to move it (left/right
 * across columns, up/down within a column), Space to drop, or Escape to cancel;
 * Enter opens the detail. Moves are announced in a polite live region, and the
 * moved card briefly flashes a warm highlight so you can see where it landed.
 *
 * Set `manual` for a server-authoritative board (API + WebSocket/SSE): every
 * move still emits `card-move`, but the board does NOT apply it locally, so it
 * reflects only what you assign to `columns` — e.g. the change echoed back over
 * the socket. The default is optimistic local updates.
 *
 * @element kanban-board
 * @fires card-open - A card's detail view was opened; detail: { cardId }.
 * @fires card-move - A card changed column/position; detail: { cardId, fromColumnId, toColumnId, toIndex }.
 */
@customElement("kanban-board")
export class KanbanBoard extends LitElement {
  /** Columns (with their cards) to render, in display order. */
  @property({ attribute: false }) columns: KanbanColumnData[] = [];
  /** Accessible label for the board's group role. */
  @property() label = "Board";
  /**
   * Server-authoritative mode. When true, moves emit `card-move` but are not
   * applied to the board locally; it reflects only what you assign to
   * `columns` (e.g. echoed back over WebSocket/SSE), keeping the server as the
   * single source of truth. Defaults to optimistic local updates.
   */
  @property({ type: Boolean, reflect: true }) manual = false;
  /**
   * Whether cards can be reordered within a column. Defaults to true. Set false
   * when intra-column order isn't persisted (no server `rank`): drag and
   * keyboard still move cards *between* columns (appended to the target), but
   * reordering inside a column is disabled, so the UI only offers what sticks.
   */
  @property({ type: Boolean, reflect: true }) reorderable = true;

  @state() private _cols: KanbanColumnData[] = [];
  @state() private _openCardId: string | null = null;
  @state() private _drag: DragState | null = null;
  @state() private _pointer: Indicator | null = null;
  @state() private _grab: GrabState | null = null;
  @state() private _liveMessage = "";
  @state() private _highlighted = new Set<string>();

  #refocus: string | null = null;
  #pendingHighlight: string | null = null;
  #highlightTimers = new Map<string, ReturnType<typeof setTimeout>>();

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
      .board {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        overflow-x: auto;
        padding-bottom: 0.25rem;
      }
      .drop-indicator {
        height: 0.125rem;
        background: var(--ui-primary, #4f46e5);
        border-radius: 999px;
      }
      .detail {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 0.75rem;
      }
      .detail-desc {
        margin: 0;
        font-size: var(--ui-font-size, 0.875rem);
        line-height: var(--ui-line-height-normal, 1.5);
        color: var(--ui-text, #0f172a);
      }
      .detail-muted {
        color: var(--ui-text-muted, #64748b);
      }
      .detail-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .detail-label {
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-medium, 500);
        color: var(--ui-text-muted, #64748b);
      }
      .detail-meta {
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .detail-meta-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        font-size: var(--ui-font-size-sm, 0.75rem);
      }
      .detail-meta-row dt {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        color: var(--ui-text-muted, #64748b);
        font-weight: var(--ui-font-weight-medium, 500);
      }
      .detail-meta-row dt svg {
        display: inline-flex;
      }
      .detail-meta-row dd {
        margin: 0;
        color: var(--ui-text, #0f172a);
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        white-space: nowrap;
        border: 0;
      }
    `,
  ];

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has("columns")) {
      this._cols = this.columns.map((column) => ({
        id: column.id,
        title: column.title,
        cards: column.cards.map((card) => ({ ...card })),
      }));
      // In manual mode the highlight is deferred until the moved card actually
      // arrives via a `columns` reassignment (e.g. the socket echo).
      if (this.#pendingHighlight && this.#findCard(this.#pendingHighlight)) {
        this.#highlight(this.#pendingHighlight);
      }
      this.#pendingHighlight = null;
    }
  }

  protected override updated(): void {
    if (this.#refocus) {
      const card = this.renderRoot.querySelector<HTMLElement>(
        `kanban-card[data-card-id="${this.#refocus}"]`,
      );
      card?.focus();
      this.#refocus = null;
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._grab = null;
    this._drag = null;
    this._pointer = null;
    for (const timer of this.#highlightTimers.values()) clearTimeout(timer);
    this.#highlightTimers.clear();
  }

  /** Returns the card, its column, and index for a card id, or null if unknown. */
  #findCard(cardId: string): { card: KanbanCardData; column: KanbanColumnData; index: number } | null {
    for (const column of this._cols) {
      const index = column.cards.findIndex((card) => card.id === cardId);
      if (index >= 0) return { card: column.cards[index], column, index };
    }
    return null;
  }

  /** Number of cards currently in a column (0 if unknown). */
  #columnCount(columnId: string): number {
    return this._cols.find((column) => column.id === columnId)?.cards.length ?? 0;
  }

  /** Flashes the warm "just moved" highlight on a card, clearing it after HIGHLIGHT_MS. */
  #highlight(cardId: string): void {
    const existing = this.#highlightTimers.get(cardId);
    if (existing) clearTimeout(existing);
    const next = new Set(this._highlighted);
    next.add(cardId);
    this._highlighted = next;
    this.#highlightTimers.set(
      cardId,
      setTimeout(() => {
        const remaining = new Set(this._highlighted);
        remaining.delete(cardId);
        this._highlighted = remaining;
        this.#highlightTimers.delete(cardId);
      }, HIGHLIGHT_MS),
    );
  }

  /** Applies a move to the working copy and emits `card-move`. `toIndex` is the destination index after removal. */
  #move(cardId: string, fromColumnId: string, toColumnId: string, toIndex: number): void {
    const cols = this._cols.map((column) => ({ ...column, cards: [...column.cards] }));
    const from = cols.find((column) => column.id === fromColumnId);
    const to = cols.find((column) => column.id === toColumnId);
    if (!from || !to) return;
    const index = from.cards.findIndex((card) => card.id === cardId);
    if (index < 0) return;
    const [card] = from.cards.splice(index, 1);
    const target = Math.max(0, Math.min(toIndex, to.cards.length));
    to.cards.splice(target, 0, card);
    if (!this.manual) this._cols = cols;
    this.dispatchEvent(
      new CustomEvent<KanbanCardMoveDetail>("card-move", {
        detail: { cardId, fromColumnId, toColumnId, toIndex: target },
        bubbles: true,
        composed: true,
      }),
    );
    // Optimistic: highlight now (the card is already at its new position).
    // Manual: defer until the move is echoed back via `columns`.
    if (this.manual) this.#pendingHighlight = cardId;
    else this.#highlight(cardId);
  }

  /** Converts a DOM insertion index (which counts the moving card) into a destination index after removal. */
  #toDestIndex(fromColumnId: string, originIndex: number, toColumnId: string, domIndex: number): number {
    return fromColumnId === toColumnId && domIndex > originIndex ? domIndex - 1 : domIndex;
  }

  /** Computes the DOM insertion index within a column from the pointer's vertical position. */
  #pointerIndex(columnId: string, clientY: number): number {
    const cards = [
      ...this.renderRoot.querySelectorAll<HTMLElement>(`kanban-card[data-column-id="${columnId}"]`),
    ];
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return i;
    }
    return cards.length;
  }

  #onDragStart(event: DragEvent, columnId: string, cardId: string): void {
    const column = this._cols.find((entry) => entry.id === columnId);
    const originIndex = column ? column.cards.findIndex((card) => card.id === cardId) : 0;
    this._grab = null;
    this._drag = { cardId, fromColumnId: columnId, originIndex };
    this._pointer = { columnId, index: originIndex };
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      try {
        event.dataTransfer.setData("text/plain", cardId);
      } catch {
        /* some browsers disallow setData outside trusted events */
      }
    }
  }

  #onDragOver(event: DragEvent, columnId: string): void {
    if (!this._drag) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    const index = this.#pointerIndex(columnId, event.clientY);
    if (this._pointer?.columnId !== columnId || this._pointer.index !== index) {
      this._pointer = { columnId, index };
    }
  }

  #onDrop(event: DragEvent, columnId: string): void {
    if (!this._drag) return;
    event.preventDefault();
    const { cardId, fromColumnId, originIndex } = this._drag;
    this._drag = null;
    this._pointer = null;
    if (!this.reorderable) {
      // Intra-column reordering is off: ignore same-column drops, and append
      // cross-column moves to the end of the destination.
      if (columnId === fromColumnId) return;
      this.#move(cardId, fromColumnId, columnId, this.#columnCount(columnId));
      return;
    }
    const domIndex = this.#pointerIndex(columnId, event.clientY);
    const dest = this.#toDestIndex(fromColumnId, originIndex, columnId, domIndex);
    this.#move(cardId, fromColumnId, columnId, dest);
  }

  #onDragEnd(): void {
    this._drag = null;
    this._pointer = null;
  }

  #onCardKeydown(event: KeyboardEvent, columnId: string, cardId: string): void {
    const grabbing = this._grab?.cardId === cardId;
    if (event.key === "Enter") {
      if (grabbing) return;
      event.preventDefault();
      this.#openDetail(cardId);
      return;
    }
    if (event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      if (grabbing) this.#commitGrab();
      else this.#startGrab(columnId, cardId);
      return;
    }
    if (!grabbing) return;
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        this.#cancelGrab();
        break;
      case "ArrowUp":
        event.preventDefault();
        this.#grabMove(0, -1);
        break;
      case "ArrowDown":
        event.preventDefault();
        this.#grabMove(0, 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        this.#grabMove(-1, 0);
        break;
      case "ArrowRight":
        event.preventDefault();
        this.#grabMove(1, 0);
        break;
      default:
        break;
    }
  }

  #startGrab(columnId: string, cardId: string): void {
    const column = this._cols.find((entry) => entry.id === columnId);
    const index = column ? column.cards.findIndex((card) => card.id === cardId) : 0;
    this._grab = { cardId, fromColumnId: columnId, originIndex: index, columnId, index };
    this.#refocus = cardId;
    const ticket = column?.cards[index]?.ticket ?? "card";
    this.#announce(
      `Picked up ${ticket}. Use the arrow keys to move it, space to drop, or escape to cancel.`,
    );
  }

  #grabMove(columnDelta: number, indexDelta: number): void {
    const grab = this._grab;
    if (!grab) return;
    let columnIndex = this._cols.findIndex((column) => column.id === grab.columnId);
    if (columnIndex < 0) return;
    let index = grab.index;
    if (columnDelta !== 0) {
      const next = columnIndex + columnDelta;
      if (next < 0 || next >= this._cols.length) return;
      columnIndex = next;
      // With reordering off, a cross-column move lands at the end.
      index = this.reorderable
        ? Math.min(index, this._cols[columnIndex].cards.length)
        : this._cols[columnIndex].cards.length;
    } else {
      if (!this.reorderable) return; // no intra-column reordering
      const max = this._cols[columnIndex].cards.length;
      index = Math.max(0, Math.min(max, index + indexDelta));
    }
    const column = this._cols[columnIndex];
    this._grab = { ...grab, columnId: column.id, index };
    this.#refocus = grab.cardId;
    const ticket = this.#findCard(grab.cardId)?.card.ticket ?? "Card";
    this.#announce(`${ticket} moved to ${column.title}, position ${index + 1}.`);
  }

  #commitGrab(): void {
    const grab = this._grab;
    if (!grab) return;
    if (!this.reorderable && grab.columnId === grab.fromColumnId) {
      // Nothing to persist for a same-column drop when reordering is off.
      this._grab = null;
      this.#refocus = grab.cardId;
      this.#announce("Returned to its position.");
      return;
    }
    const dest = this.#toDestIndex(grab.fromColumnId, grab.originIndex, grab.columnId, grab.index);
    const column = this._cols.find((entry) => entry.id === grab.columnId);
    const ticket = this.#findCard(grab.cardId)?.card.ticket ?? "Card";
    this._grab = null;
    this.#move(grab.cardId, grab.fromColumnId, grab.columnId, dest);
    this.#refocus = grab.cardId;
    this.#announce(`${ticket} dropped in ${column?.title ?? ""}.`);
  }

  #cancelGrab(): void {
    const grab = this._grab;
    this._grab = null;
    this.#refocus = grab?.cardId ?? null;
    this.#announce("Move cancelled.");
  }

  #announce(message: string): void {
    this._liveMessage = message;
  }

  #openDetail(cardId: string): void {
    if (this._grab) return;
    this._openCardId = cardId;
    this.dispatchEvent(
      new CustomEvent<KanbanCardOpenDetail>("card-open", {
        detail: { cardId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #closeDetail(): void {
    this._openCardId = null;
  }

  #onStateChange(cardId: string, fromColumnId: string, toColumnId: string): void {
    if (!toColumnId || toColumnId === fromColumnId) return;
    const dest = this._cols.find((column) => column.id === toColumnId);
    this.#move(cardId, fromColumnId, toColumnId, dest ? dest.cards.length : 0);
  }

  #renderColumn(column: KanbanColumnData, indicator: Indicator | null, dragCardId: string | null) {
    let indicatorIndex = -1;
    if (indicator?.columnId === column.id) {
      if (this.reorderable) {
        indicatorIndex = indicator.index;
      } else {
        // Reordering off: only show an append indicator on a *different* column.
        const sourceColumnId = this._grab?.fromColumnId ?? this._drag?.fromColumnId ?? null;
        if (sourceColumnId !== null && sourceColumnId !== column.id) {
          indicatorIndex = column.cards.length;
        }
      }
    }
    return html`
      <kanban-column
        .heading=${column.title}
        .count=${column.cards.length}
        .empty=${column.cards.length === 0}
        .dragover=${this._pointer?.columnId === column.id}
        data-column-id=${column.id}
        @dragenter=${(event: DragEvent) => this.#onDragOver(event, column.id)}
        @dragover=${(event: DragEvent) => this.#onDragOver(event, column.id)}
        @drop=${(event: DragEvent) => this.#onDrop(event, column.id)}
      >
        ${repeat(
          column.cards,
          (card) => card.id,
          (card, i) => html`
            ${indicatorIndex === i
              ? html`<div class="drop-indicator" aria-hidden="true"></div>`
              : nothing}
            <kanban-card
              .ticket=${card.ticket}
              .heading=${card.title}
              data-card-id=${card.id}
              data-column-id=${column.id}
              draggable="true"
              ?dragging=${dragCardId === card.id && this._drag !== null}
              ?grabbed=${this._grab?.cardId === card.id}
              ?just-moved=${this._highlighted.has(card.id)}
              @dragstart=${(event: DragEvent) => this.#onDragStart(event, column.id, card.id)}
              @click=${() => this.#openDetail(card.id)}
              @keydown=${(event: KeyboardEvent) => this.#onCardKeydown(event, column.id, card.id)}
            ></kanban-card>
          `,
        )}
        ${indicatorIndex === column.cards.length
          ? html`<div class="drop-indicator" aria-hidden="true"></div>`
          : nothing}
      </kanban-column>
    `;
  }

  #renderDetail() {
    const open = this._openCardId ? this.#findCard(this._openCardId) : null;
    return html`
      <popover-panel
        centered
        ?open=${open !== null}
        heading=${open?.card.title ?? ""}
        @panel-close=${() => this.#closeDetail()}
      >
        ${open
          ? html`
              <div class="detail">
                ${open.card.description
                  ? html`<p class="detail-desc">${open.card.description}</p>`
                  : html`<p class="detail-desc detail-muted">No description.</p>`}
                <div class="detail-field">
                  <span class="detail-label" id="kb-state-label">State</span>
                  <radio-pills
                    aria-labelledby="kb-state-label"
                    .options=${this._cols.map((column) => ({
                      value: column.id,
                      label: column.title,
                    }))}
                    .value=${open.column.id}
                    @change=${(event: CustomEvent<{ value: string }>) =>
                      this.#onStateChange(open.card.id, open.column.id, event.detail.value)}
                  ></radio-pills>
                </div>
                <dl class="detail-meta">
                  <div class="detail-meta-row">
                    <dt><span aria-hidden="true">${iconTag(14)}</span> Ticket</dt>
                    <dd>${open.card.ticket}</dd>
                  </div>
                  ${open.card.createdAt
                    ? html`
                        <div class="detail-meta-row">
                          <dt><span aria-hidden="true">${iconCalendar(14)}</span> Created</dt>
                          <dd><relative-time datetime=${open.card.createdAt}></relative-time></dd>
                        </div>
                      `
                    : nothing}
                  ${open.card.updatedAt
                    ? html`
                        <div class="detail-meta-row">
                          <dt><span aria-hidden="true">${iconClock(14)}</span> Updated</dt>
                          <dd><relative-time datetime=${open.card.updatedAt}></relative-time></dd>
                        </div>
                      `
                    : nothing}
                </dl>
              </div>
            `
          : nothing}
      </popover-panel>
    `;
  }

  override render() {
    const indicator: Indicator | null = this._grab
      ? { columnId: this._grab.columnId, index: this._grab.index }
      : this._pointer;
    const dragCardId = this._grab?.cardId ?? this._drag?.cardId ?? null;
    return html`
      <div
        class="board"
        role="group"
        aria-label=${this.label}
        @dragend=${() => this.#onDragEnd()}
      >
        ${repeat(this._cols, (column) => column.id, (column) =>
          this.#renderColumn(column, indicator, dragCardId),
        )}
      </div>
      <div class="sr-only" role="status" aria-live="polite">${this._liveMessage}</div>
      ${this.#renderDetail()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kanban-board": KanbanBoard;
  }
}
