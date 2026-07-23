import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconTag } from "./icons.js";
import { tokens } from "./tokens.js";

/**
 * A single kanban card's compact overview: its ticket number and title only.
 * Purely presentational and metadata-only — it is created and driven by
 * `kanban-board`, which owns drag-and-drop, selection, and the richer detail
 * view (description, state, and timestamps live in the board's popover, not
 * here). The board sets `draggable`, toggles the `dragging`/`grabbed`
 * attributes for pointer and keyboard moves, and binds the open/keyboard
 * handlers; focus is delegated to the inner control so the board can move
 * keyboard focus to a card after a move.
 *
 * @element kanban-card
 */
@customElement("kanban-card")
export class KanbanCard extends LitElement {
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  /** Ticket identifier shown before the title, e.g. `"PROJ-142"`. */
  @property() ticket = "";
  /** Card title shown in the overview. */
  @property() heading = "";

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .card {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        width: 100%;
        box-sizing: border-box;
        padding: 0.5rem 0.75rem;
        background: var(--ui-surface, #ffffff);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius, 0.5rem);
        cursor: grab;
        text-align: left;
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
        transition:
          box-shadow 150ms ease,
          border-color 150ms ease;
      }
      .card:hover {
        border-color: var(--ui-text-muted, #64748b);
        box-shadow: var(
          --ui-shadow,
          0 4px 6px -1px rgb(0 0 0 / 0.1),
          0 2px 4px -2px rgb(0 0 0 / 0.1)
        );
      }
      .card:active {
        cursor: grabbing;
      }
      .card:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .ticket {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: var(--ui-font-size-sm, 0.75rem);
        font-weight: var(--ui-font-weight-medium, 500);
        color: var(--ui-text-muted, #64748b);
      }
      .ticket-icon {
        display: inline-flex;
        line-height: 0;
      }
      .title {
        font-size: var(--ui-font-size, 0.875rem);
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text, #0f172a);
      }
      :host([dragging]) .card {
        opacity: 0.5;
        cursor: grabbing;
      }
      :host([grabbed]) .card {
        cursor: grabbing;
        border-color: var(--ui-primary, #4f46e5);
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      @keyframes kb-just-moved {
        0%,
        25% {
          background-color: var(--ui-highlight, #fde68a);
        }
        100% {
          background-color: var(--ui-surface, #ffffff);
        }
      }
      :host([just-moved]) .card {
        animation: kb-just-moved 1400ms ease-out;
      }
      @media (forced-colors: active) {
        .card:focus-visible,
        :host([grabbed]) .card {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .card {
          transition: none;
        }
        :host([just-moved]) .card {
          animation: none;
          background-color: var(--ui-highlight, #fde68a);
        }
      }
    `,
  ];

  override render() {
    const label = this.ticket ? `${this.ticket}: ${this.heading}` : this.heading;
    return html`
      <div class="card" role="button" tabindex="0" aria-label=${label}>
        <span class="ticket">
          <span class="ticket-icon" aria-hidden="true">${iconTag(14)}</span>
          ${this.ticket}
        </span>
        <span class="title">${this.heading}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kanban-card": KanbanCard;
  }
}
