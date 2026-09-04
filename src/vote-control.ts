import { LitElement, css, html, nothing } from "lit";
import type { PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconChevronDown, iconChevronUp } from "./icons.js";
import { tokens } from "./tokens.js";

/**
 * An up/down vote widget with a live score readout — the "vote an entry up or
 * down toward a promotion threshold" pattern from a public register site,
 * where one member casts a single vote that can be changed or withdrawn at any
 * time. Two native `<button>`s flank a score; the button matching the user's
 * own cast `vote` reads as pressed (`aria-pressed`), and clicking it again
 * withdraws the vote. Set an optional `target` to render a thin progress meter
 * toward the promotion threshold beneath (vertical) or beside (horizontal) the
 * buttons.
 *
 * @element vote-control
 * @fires vote-change - The user cast, switched, or withdrew their vote;
 *   detail: { vote: "up" | "down" | null, value: number }.
 */
@customElement("vote-control")
export class VoteControl extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: inline-block;
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
      .control {
        display: inline-flex;
        box-sizing: border-box;
        border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius, 0.5rem);
        background: var(--ui-surface, #ffffff);
      }
      /* Vertical (default): stacked box — up, score, down, optional meter. */
      :host([orientation="vertical"]) .control {
        flex-direction: column;
        align-items: stretch;
        padding: 0.25rem;
        gap: 0.25rem;
      }
      /* Horizontal: wide inline row — up, score, down, optional meter beside. */
      :host([orientation="horizontal"]) .control {
        flex-direction: row;
        align-items: center;
        padding: 0.25rem 0.5rem;
        gap: 0.5rem;
      }
      .buttons {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
      }
      :host([orientation="vertical"]) .buttons {
        flex-direction: column;
      }
      :host([orientation="horizontal"]) .buttons {
        flex-direction: row;
      }
      .vote-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        padding: 0;
        box-sizing: border-box;
        border: none;
        border-radius: var(--ui-radius-sm, 0.25rem);
        background: none;
        color: var(--ui-text-muted, #64748b);
        cursor: pointer;
      }
      .vote-btn:hover:not(:disabled) {
        background: var(--ui-surface-muted, #f8fafc);
        color: var(--ui-text, #0f172a);
      }
      .vote-btn.up[aria-pressed="true"] {
        color: var(--ui-success, #16a34a);
        background: var(--ui-surface-muted, #f8fafc);
      }
      .vote-btn.down[aria-pressed="true"] {
        color: var(--ui-danger, #dc2626);
        background: var(--ui-surface-muted, #f8fafc);
      }
      .vote-btn:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      .vote-btn:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .score {
        min-width: 2rem;
        text-align: center;
        font-size: var(--ui-font-size-lg, 1rem);
        font-weight: var(--ui-font-weight-semibold, 600);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text, #0f172a);
        font-variant-numeric: var(--ui-numeric, normal);
      }
      .meter {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      :host([orientation="horizontal"]) .meter {
        min-width: 4rem;
      }
      .track {
        display: block;
        width: 100%;
        height: 0.25rem;
        border-radius: var(--ui-radius-pill, 9999px);
        background: var(--ui-surface-muted, #f8fafc);
        overflow: hidden;
      }
      .fill {
        display: block;
        height: 100%;
        background: var(--ui-button-accent, var(--ui-primary, #4f46e5));
        transition: width 200ms ease;
      }
      .caption {
        font-size: var(--ui-font-size-xs, 0.6875rem);
        font-weight: var(--ui-font-weight-medium, 500);
        letter-spacing: var(--ui-tracking-wide, 0.04em);
        line-height: var(--ui-line-height-tight, 1.25);
        text-transform: var(--ui-label-transform, none);
        color: var(--ui-text-muted, #64748b);
        font-variant-numeric: var(--ui-numeric, normal);
        text-align: center;
        white-space: nowrap;
      }
      @media (prefers-reduced-motion: no-preference) {
        .score.bump {
          animation: vote-bump 220ms ease;
        }
        @keyframes vote-bump {
          0% {
            transform: scale(1);
          }
          40% {
            transform: scale(1.25);
          }
          100% {
            transform: scale(1);
          }
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .fill {
          transition: none;
        }
      }
      @media (forced-colors: active) {
        .control {
          border: 1px solid CanvasText;
        }
        .vote-btn:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
        .vote-btn[aria-pressed="true"] {
          outline: 2px solid Highlight;
        }
        .vote-btn:disabled {
          color: GrayText;
          opacity: 1;
        }
        .track {
          border: 1px solid CanvasText;
        }
        .fill {
          background: Highlight;
        }
      }
    `,
  ];

  /** The current net score shown between the buttons. */
  @property({ type: Number, reflect: true }) value = 0;

  /** This user's own cast vote, or `null` if they have not voted. Reflected so CSS can style the pressed button. */
  @property({ reflect: true }) vote: "up" | "down" | null = null;

  /** Disables both buttons and dims the control. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Layout — `vertical` is the compact stacked box (default); `horizontal` is the wide inline variant. */
  @property({ reflect: true }) orientation: "vertical" | "horizontal" = "vertical";

  /** Promotion threshold. When > 0, a thin progress meter toward it renders; when 0 (default) no meter renders and no space is reserved for it. */
  @property({ type: Number }) target = 0;

  /** Accessible label naming the vote group. */
  @property() label = "Vote";

  override updated(changed: PropertyValues<this>) {
    if (changed.has("value") && changed.get("value") !== undefined) {
      this.#restartBump();
    }
  }

  #restartBump() {
    const score = this.renderRoot?.querySelector<HTMLElement>(".score");
    if (!score) return;
    score.classList.remove("bump");
    // Force a reflow so removing/re-adding the class restarts the animation.
    void score.offsetWidth;
    score.classList.add("bump");
  }

  #cast(dir: "up" | "down") {
    if (this.disabled) return;
    const previous = this.vote;
    const nextVote = previous === dir ? null : dir;
    const contribution = (v: "up" | "down" | null) => (v === "up" ? 1 : v === "down" ? -1 : 0);
    const delta = contribution(nextVote) - contribution(previous);
    this.vote = nextVote;
    this.value += delta;
    this.dispatchEvent(
      new CustomEvent("vote-change", {
        detail: { vote: this.vote, value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    const showMeter = this.target > 0;
    // The meter's ARIA value is clamped to its own min/max: a score can go
    // negative or overshoot the target, but exposing that raw number would
    // contradict the clamped fill and break the valuemin <= valuenow <=
    // valuemax relationship. The real score stays in aria-valuetext.
    const clamped = showMeter ? Math.min(this.target, Math.max(0, this.value)) : 0;
    const progress = showMeter ? (clamped / this.target) * 100 : 0;
    return html`
      <div class="control" role="group" aria-label=${this.label}>
        <div class="buttons">
          <button
            type="button"
            class="vote-btn up"
            aria-label="Vote up"
            aria-pressed=${this.vote === "up" ? "true" : "false"}
            ?disabled=${this.disabled}
            @click=${() => this.#cast("up")}
          >
            ${iconChevronUp(18)}
          </button>
          <span class="score" aria-live="polite" aria-atomic="true">${this.value}</span>
          <button
            type="button"
            class="vote-btn down"
            aria-label="Vote down"
            aria-pressed=${this.vote === "down" ? "true" : "false"}
            ?disabled=${this.disabled}
            @click=${() => this.#cast("down")}
          >
            ${iconChevronDown(18)}
          </button>
        </div>
        ${showMeter
          ? html`
              <div class="meter">
                <span
                  class="track"
                  role="progressbar"
                  aria-label="Progress toward promotion"
                  aria-valuenow=${clamped}
                  aria-valuemin="0"
                  aria-valuemax=${this.target}
                  aria-valuetext="${this.value} of ${this.target}"
                >
                  <span class="fill" style=${`width: ${progress}%`}></span>
                </span>
                <span class="caption">${this.value} / ${this.target}</span>
              </div>
            `
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "vote-control": VoteControl;
  }
}
