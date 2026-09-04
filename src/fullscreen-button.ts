import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { iconArrowsPointingIn, iconArrowsPointingOut } from "./icons.js";
import { tokens } from "./tokens.js";

/** Fired after the fullscreen state changes. `detail.active` is the new state. */
export interface FullscreenChangeDetail {
  active: boolean;
}

const ICON_SIZE = 18;

/**
 * Vendor-prefixed Fullscreen API members still needed by Safari, which has no
 * unprefixed support on the document.
 */
interface WebkitDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

interface WebkitElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

/**
 * Toggles fullscreen presentation of the page, or of a given `target` element.
 *
 * The icon and accessible name track the *actual* fullscreen state rather than
 * this button's own clicks, because fullscreen can be left without touching it
 * — Escape, or the browser's own chrome — which would otherwise leave the
 * button showing the wrong affordance.
 *
 * The control is styled as a square icon-sized `ui-button` `secondary` variant
 * (2rem, `--ui-radius-sm` corners, the `--ui-button-secondary-*` background and
 * border tokens, so a gradient theme carries over) layered over an opaque
 * `--ui-surface` base and an elevation shadow, since it normally floats above
 * the content it expands.
 *
 * @element fullscreen-button
 * @fires fullscreen-change - The fullscreen state changed, from this button or
 *   otherwise (`detail: { active }`).
 */
@customElement("fullscreen-button")
export class FullscreenButton extends LitElement {
  /** Element to present fullscreen; `null` (default) presents the whole page. */
  @property({ attribute: false }) target: HTMLElement | null = null;

  /** Accessible name while not fullscreen. */
  @property({ attribute: "enter-label" }) enterLabel = "Enter full screen";

  /** Accessible name while fullscreen. */
  @property({ attribute: "exit-label" }) exitLabel = "Exit full screen";

  @state() private _active = false;

  static override styles = [
    tokens,
    css`
      :host {
        display: inline-flex;
      }
      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 2rem;
        height: 2rem;
        padding: 0;
        color: var(--ui-text, #0f172a);
        /* ui-button's secondary variant, over an opaque --ui-surface base: a
           floating control can't let the content behind it show through the
           way a secondary button's transparent flat background does. */
        background:
          var(--ui-button-secondary-background, none),
          var(--ui-surface, #ffffff);
        border: var(--ui-border-width, 1px) solid var(--ui-button-secondary-border, var(--ui-border, #e2e8f0));
        border-radius: var(--ui-radius-sm, 0.25rem);
        box-shadow:
          var(--ui-button-highlight, 0 0 0 0 transparent),
          var(--ui-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
        cursor: pointer;
        line-height: var(--ui-line-height-glyph, 1);
      }
      button:hover {
        background:
          var(--ui-button-secondary-background-hover, none),
          var(--ui-surface-muted, #f8fafc);
        border-color: var(--ui-button-secondary-border-hover, var(--ui-text-muted, #64748b));
      }
      button:active {
        background:
          var(--ui-button-secondary-background-active, var(--ui-button-secondary-background, none)),
          var(--ui-surface-muted, #f8fafc);
        box-shadow: var(--ui-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
      }
      button:focus-visible {
        outline: none;
        box-shadow:
          var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35)),
          var(--ui-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
      }
      @media (forced-colors: active) {
        button:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("fullscreenchange", this.#onChange);
    document.addEventListener("webkitfullscreenchange", this.#onChange);
    this._active = isFullscreen();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("fullscreenchange", this.#onChange);
    document.removeEventListener("webkitfullscreenchange", this.#onChange);
  }

  override render() {
    const label = this._active ? this.exitLabel : this.enterLabel;
    return html`
      <button type="button" aria-label=${label} title=${label} @click=${this.#toggle}>
        ${this._active ? iconArrowsPointingIn(ICON_SIZE) : iconArrowsPointingOut(ICON_SIZE)}
      </button>
    `;
  }

  #onChange = (): void => {
    this._active = isFullscreen();
    this.dispatchEvent(
      new CustomEvent<FullscreenChangeDetail>("fullscreen-change", {
        detail: { active: this._active },
        bubbles: true,
        composed: true,
      }),
    );
  };

  /**
   * Rejections are swallowed: browsers refuse the request outside a user
   * gesture or under a permissions policy, and there is nothing useful to tell
   * the user about it.
   */
  #toggle = async (): Promise<void> => {
    const doc = document as WebkitDocument;
    try {
      if (isFullscreen()) {
        await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
        return;
      }
      const element = (this.target ?? document.documentElement) as WebkitElement;
      await (element.requestFullscreen?.() ?? element.webkitRequestFullscreen?.());
    } catch {
      // Ignored — see doc comment.
    }
  };
}

/** Whether any element is currently presented fullscreen. */
function isFullscreen(): boolean {
  const doc = document as WebkitDocument;
  return Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement);
}

declare global {
  interface HTMLElementTagNameMap {
    "fullscreen-button": FullscreenButton;
  }
}
