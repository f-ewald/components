import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/**
 * "Skip to main content" bypass link — the package's first pure
 * accessibility-utility component. It renders a real `<a>` that stays
 * visually hidden (but in the focus order) until it receives keyboard focus,
 * then pins itself to the top-left of the viewport as a solid, high-contrast
 * block so a keyboard or screen-reader user can jump straight past repeated
 * page chrome to the main content.
 *
 * Activating it moves focus into the target as well as scrolling to it: a
 * plain fragment link only moves focus when the target is already focusable,
 * so this applies `tabindex="-1"` to the target on demand rather than making
 * every consumer remember to. Native navigation is never prevented, so the
 * hash still updates.
 *
 * Place it as the very first focusable element on the page, before the app
 * chrome, and point `href` at the `id` of the main content region.
 *
 * @element skip-link
 * @slot - Optional custom link wording, overriding `label`.
 */
@customElement("skip-link")
export class SkipLink extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: contents;
      }
      /* Hidden at rest with the shared .sr-only clip technique — never
         display:none / visibility:hidden, which would pull the link out of
         the focus order and defeat the entire purpose. Clipped, it stays
         focusable, so Tab reaches it and reveals it.

         Pinned with position: fixed, not absolute. An absolutely positioned
         link resolves its insets against the nearest positioned ancestor, so
         dropping the component inside any position: relative container — which
         app-shell's own .shell is — would park the revealed link at that
         container's corner instead of the viewport's, and an overflow: hidden
         ancestor would clip it away entirely. */
      .link {
        position: fixed;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        white-space: nowrap;
        border: 0;
        top: 0.25rem;
        left: 0.25rem;
        /* Above app-shell's own chrome (.sidebar/.detail/.scrim at 40/40/39)
           so it paints over the top bar when revealed — but a deliberate
           literal below the shared layer stack's base of 100, and it does NOT
           call activateLayer/deactivateLayer. A skip link must never float
           above an open modal-dialog/confirm-dialog/popover-panel/slide-panel
           (all >= 100): that would be a focus escape hatch out of a modal's
           trap, a real bug. 50 sits cleanly in the gap between the shell
           chrome and any real overlay. */
        z-index: 50;
        box-sizing: border-box;
        background: var(--ui-text, #0f172a);
        color: var(--ui-on-accent, #ffffff);
        border-radius: var(--ui-radius-sm, 0.25rem);
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
        font-weight: var(--ui-font-weight-medium, 500);
        line-height: var(--ui-line-height-tight, 1.25);
        text-decoration: none;
        box-shadow: var(--ui-shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
      }
      /* Both :focus and :focus-visible: the link is only ever reached by
         keyboard, so revealing it on plain focus is correct here. The visible
         padding lives here rather than on .link, because box-sizing:
         border-box would otherwise floor the clipped 1x1 box at the size of
         its own padding box, leaving an invisible 32px hit target parked over
         the page content. */
      .link:focus,
      .link:focus-visible {
        width: auto;
        height: auto;
        margin: 0;
        overflow: visible;
        clip: auto;
        clip-path: none;
        padding-top: 0.5rem;
        padding-right: 1rem;
        padding-bottom: 0.5rem;
        padding-left: 1rem;
      }
      .link:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      @media (forced-colors: active) {
        .link {
          background: Canvas;
          color: CanvasText;
          border: 1px solid CanvasText;
        }
        .link:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
      }
    `,
  ];

  /** The in-page target the link jumps to (the `id` of the main content region). */
  @property() href = "#main";

  /** Fallback link wording used when nothing is slotted. */
  @property() label = "Skip to main content";

  /** Whether the default slot holds real wording, as opposed to the whitespace ordinary formatting leaves behind. */
  @state() private _hasSlotted = false;

  /**
   * Moves focus to the fragment target, in addition to the native scroll.
   *
   * A plain in-page anchor only moves focus when its target is already
   * focusable, so pointing a skip link at an ordinary `<main id="main">`
   * scrolls the page but strands the keyboard user's focus back at the top —
   * the classic way a skip link silently does nothing. Rather than requiring
   * every consumer to remember `tabindex="-1"`, this applies it to the target
   * on demand. Navigation is never prevented, so the hash still updates.
   */
  #focusTarget(): void {
    const id = this.href.startsWith("#") ? this.href.slice(1) : "";
    if (!id) return;
    const root = this.getRootNode() as Document | ShadowRoot;
    const target = root.getElementById?.(id) ?? document.getElementById(id);
    if (!target) return;
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus();
  }

  /** Tracks whether the slot holds substantive wording, so whitespace can't strip the link's accessible name. */
  #onSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this._hasSlotted = slot
      .assignedNodes({ flatten: true })
      .some((node) => node.nodeType === Node.ELEMENT_NODE || (node.textContent ?? "").trim().length > 0);
  }

  override render() {
    return html`<a class="link" href=${this.href} @click=${this.#focusTarget}
      ><slot @slotchange=${this.#onSlotChange}></slot>${this._hasSlotted ? nothing : this.label}</a
    >`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "skip-link": SkipLink;
  }
}
