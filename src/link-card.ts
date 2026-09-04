import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/** Reachability state for the optional corner status dot. `""` renders no dot. */
export type LinkCardStatus = "up" | "down" | "checking" | "";

const STATUS_LABEL: Record<Exclude<LinkCardStatus, "">, string> = {
  up: "Reachable",
  down: "Unreachable",
  checking: "Checking…",
};

/**
 * A single linked-resource tile — logo (or an initial-letter fallback),
 * heading, optional description, and an optional reachability status dot.
 * Renders as a real `<a>` (opening in a new tab) when `href` is set, or a
 * non-interactive `<div>` otherwise. Meant to be laid out inside
 * `card-grid`, mirroring how `gallery-item` pairs with `photo-gallery`.
 *
 * @element link-card
 */
@customElement("link-card")
export class LinkCard extends LitElement {
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
      .card {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        height: 100%;
        box-sizing: border-box;
        padding: 1.5rem;
        border: var(--ui-border-width, 1px) solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius, 0.5rem);
        background: var(--ui-surface, #ffffff);
        color: inherit;
        text-decoration: none;
        transition:
          border-color 150ms ease,
          box-shadow 150ms ease,
          transform 150ms ease;
      }
      a.card {
        cursor: pointer;
      }
      .card:hover {
        border-color: var(--ui-text-muted, #64748b);
        box-shadow: var(--ui-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
        transform: translateY(-0.0625rem);
      }
      .card:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .status {
        position: absolute;
        top: 1.25rem;
        right: 1.25rem;
        width: 0.5rem;
        height: 0.5rem;
        border-radius: var(--ui-radius-pill, 9999px);
        background: var(--ui-text-muted, #64748b);
      }
      .status--up {
        background: var(--ui-success, #16a34a);
      }
      .status--down {
        background: var(--ui-danger, #dc2626);
      }
      .logo {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: var(--ui-radius, 0.5rem);
        background: var(--ui-surface-muted, #f8fafc);
        overflow: hidden;
      }
      .logo img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .initial {
        font-size: var(--ui-font-size-lg, 1rem);
        font-weight: var(--ui-font-weight-semibold, 600);
        color: var(--ui-text-muted, #64748b);
      }
      .heading {
        font-size: var(--ui-font-size-lg, 1rem);
        font-weight: var(--ui-font-weight-semibold, 600);
        line-height: var(--ui-line-height-tight, 1.25);
        color: var(--ui-text, #0f172a);
      }
      .description {
        font-size: var(--ui-font-size, 0.875rem);
        line-height: var(--ui-line-height-normal, 1.5);
        color: var(--ui-text-muted, #64748b);
      }
      @media (forced-colors: active) {
        .card:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .card {
          transition: none;
        }
      }
    `,
  ];

  /** Card title. */
  @property() heading = "";
  /** Optional supporting text shown below the heading. */
  @property() description = "";
  /** Destination URL. When set, the card renders as a link (opened in a new tab); when unset, a non-interactive tile. */
  @property() href = "";
  /** Logo image URL. Falls back to the first letter of `heading` if unset or it fails to load. */
  @property() logo = "";
  /** Reachability state for the corner status dot. `""` (default) renders no dot. */
  @property() status: LinkCardStatus = "";

  @state() private _imgError = false;

  protected override willUpdate(changed: Map<string, unknown>) {
    if (changed.has("logo")) this._imgError = false;
  }

  override render() {
    const showImage = !!this.logo && !this._imgError;
    const initial = this.heading.trim().charAt(0).toUpperCase();
    const body = html`
      ${this.status
        ? html`<span
            class="status status--${this.status}"
            role="img"
            title=${STATUS_LABEL[this.status]}
            aria-label=${STATUS_LABEL[this.status]}
          ></span>`
        : nothing}
      <span class="logo">
        ${showImage
          ? html`<img src=${this.logo} alt="" @error=${() => (this._imgError = true)} />`
          : html`<span class="initial" aria-hidden="true">${initial}</span>`}
      </span>
      <span class="heading">${this.heading}</span>
      ${this.description ? html`<span class="description">${this.description}</span>` : nothing}
    `;
    return this.href
      ? html`<a class="card" href=${this.href} target="_blank" rel="noopener noreferrer">${body}</a>`
      : html`<div class="card">${body}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "link-card": LinkCard;
  }
}
