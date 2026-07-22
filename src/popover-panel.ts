import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconX } from "./icons.js";
import { tokens } from "./tokens.js";
import {
  activateLayer,
  claimEscape,
  deactivateLayer,
  isTopLayer,
} from "./utils/layer-stack.js";

/**
 * Generic anchored popover shell: a floating card positioned relative to its
 * nearest `position: relative` ancestor (place it next to its trigger button
 * inside such a wrapper), as opposed to `slide-panel`'s fixed screen-edge
 * drawer. Closes on outside click or Escape. Header chrome and close button
 * match `slide-panel`'s API (`heading`, `panel-close`) so either can be
 * swapped in for the other with no consumer-side changes beyond the wrapper.
 *
 * Set `centered` to render as a screen-centered modal with a translucent
 * backdrop instead of the default anchored placement.
 *
 * @element popover-panel
 * @fires panel-close - User clicked the close (✕) button, pressed Escape, or clicked outside/the backdrop.
 * @slot title - Overrides the plain `heading` text with custom markup.
 * @slot actions - Extra header controls (e.g. an icon+label link) rendered between the title and the close button.
 * @slot - Popover body content.
 */
@customElement("popover-panel")
export class PopoverPanel extends LitElement {
  /** Whether the popover is currently visible. */
  @property({ type: Boolean, reflect: true }) open = false;
  /** Title text shown in the popover header. */
  @property() heading = "";
  /** Render as a screen-centered modal with a backdrop instead of anchored placement. */
  @property({ type: Boolean, reflect: true }) centered = false;

  static override styles = [
    tokens,
    css`
      :host {
        display: none;
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        z-index: var(--component-layer-z, 20);
      }
      :host([open]) {
        display: block;
      }
      :host([centered][open]) {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--ui-overlay, rgb(15 23 42 / 0.45));
        z-index: var(--component-layer-z, 30);
      }
      :host([centered]) .panel {
        width: 25rem;
      }
      .panel {
        width: 20rem;
        max-width: calc(100vw - 2rem);
        background: var(--ui-surface, #ffffff);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius, 0.5rem);
        box-shadow: var(--ui-shadow-lg, 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1));
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem;
        border-bottom: 1px solid var(--ui-border, #e2e8f0);
        flex: 0 0 auto;
      }
      .panel-title {
        font-weight: var(--ui-font-weight-semibold, 600);
        font-size: var(--ui-font-size-lg, 1rem);
        line-height: var(--ui-line-height-tight, 1.25);
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
        color: var(--ui-text, #0f172a);
        flex: 1 1 auto;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        padding-right: 0.5rem;
      }
      .panel-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 0 0 auto;
        margin-right: 0.25rem;
      }
      .close-btn {
        background: none;
        border: none;
        cursor: pointer;
        width: 2rem;
        height: 2rem;
        padding: 0;
        color: var(--ui-text-muted, #64748b);
        border-radius: var(--ui-radius-sm, 0.25rem);
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .close-btn:hover {
        background: var(--ui-surface-muted, #f8fafc);
      }
      .close-btn:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      @media (forced-colors: active) {
        .close-btn:focus-visible {
          outline: 2px solid CanvasText;
          outline-offset: 2px;
          box-shadow: none;
        }
      }
    `,
  ];

  #modalActive = false;
  #previousFocus: HTMLElement | null = null;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("mousedown", this.#onWindowMousedown, true);
    window.removeEventListener("keydown", this.#onWindowKeydown);
    document.removeEventListener("focusin", this.#onDocumentFocusIn, true);
    deactivateLayer(this);
    if (this.#previousFocus?.isConnected) this.#previousFocus.focus();
    this.#previousFocus = null;
    this.#modalActive = false;
    this.open = false;
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has("open")) {
      if (this.open) {
        activateLayer(this);
        window.addEventListener("mousedown", this.#onWindowMousedown, true);
        window.addEventListener("keydown", this.#onWindowKeydown);
      } else {
        deactivateLayer(this);
        window.removeEventListener("mousedown", this.#onWindowMousedown, true);
        window.removeEventListener("keydown", this.#onWindowKeydown);
      }
    }

    const shouldBeModal = this.open && this.centered;
    if (shouldBeModal && !this.#modalActive) {
      this.#modalActive = true;
      this.#previousFocus = document.activeElement as HTMLElement | null;
      document.addEventListener("focusin", this.#onDocumentFocusIn, true);
      this.#focusInitial();
    } else if (!shouldBeModal && this.#modalActive) {
      this.#modalActive = false;
      document.removeEventListener("focusin", this.#onDocumentFocusIn, true);
      if (this.#previousFocus?.isConnected) this.#previousFocus.focus();
      this.#previousFocus = null;
    }
  }

  #onWindowMousedown = (e: MouseEvent): void => {
    if (!isTopLayer(this)) return;
    // In centered mode the host itself renders the backdrop, so a mousedown
    // landing directly on the host (not on .panel or its content) is a
    // backdrop click and must close like an outside click would.
    if (this.centered && e.target === this) {
      this.#close();
      return;
    }
    if (!e.composedPath().includes(this)) this.#close();
  };

  #onWindowKeydown = (e: KeyboardEvent): void => {
    if (!isTopLayer(this)) return;
    if (claimEscape(this, e)) {
      this.#close();
      return;
    }
    if (!this.centered || e.key !== "Tab") return;

    const focusable = this.#getFocusableElements();
    if (focusable.length === 0) {
      e.preventDefault();
      this.#focusInitial();
      return;
    }
    const active = (this.shadowRoot?.activeElement ?? document.activeElement) as HTMLElement | null;
    const index = focusable.indexOf(active as HTMLElement);
    if (e.shiftKey && index <= 0) {
      e.preventDefault();
      focusable.at(-1)?.focus();
    } else if (!e.shiftKey && index === focusable.length - 1) {
      e.preventDefault();
      focusable[0]?.focus();
    }
  };

  #onDocumentFocusIn = (event: FocusEvent): void => {
    if (!this.#modalActive || !isTopLayer(this) || event.composedPath().includes(this)) return;
    this.#focusInitial();
  };

  #getFocusableElements(): HTMLElement[] {
    const selector =
      "a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])";
    const focusableInSlot = (slotSelector: string): HTMLElement[] => {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>(slotSelector);
      return (slot?.assignedElements({ flatten: true }) ?? []).flatMap((element) => [
        ...(element instanceof HTMLElement && element.matches(selector) ? [element] : []),
        ...Array.from(element.querySelectorAll<HTMLElement>(selector)),
      ]);
    };
    const close = this.shadowRoot?.querySelector<HTMLElement>(".close-btn");
    return [
      ...focusableInSlot('slot[name="title"]'),
      ...focusableInSlot('slot[name="actions"]'),
      ...(close ? [close] : []),
      ...focusableInSlot("slot:not([name])"),
    ].filter((element) => !element.hasAttribute("hidden"));
  }

  #focusInitial(): void {
    const autofocus = this.querySelector<HTMLElement>("[autofocus]");
    const close = this.shadowRoot?.querySelector<HTMLElement>(".close-btn");
    const panel = this.shadowRoot?.querySelector<HTMLElement>(".panel");
    (autofocus ?? close ?? this.#getFocusableElements()[0] ?? panel)?.focus();
  }

  #close(): void {
    this.dispatchEvent(new CustomEvent("panel-close", { bubbles: true, composed: true }));
  }

  override render() {
    const explicitLabel = this.getAttribute("aria-label");
    return html`
      <div
        class="panel"
        role="dialog"
        aria-modal=${this.centered ? "true" : nothing}
        aria-label=${explicitLabel ?? nothing}
        aria-labelledby=${explicitLabel ? nothing : "popover-title"}
        tabindex="-1"
      >
        <div class="panel-header">
          <span id="popover-title" class="panel-title">
            <slot name="title">${this.heading || (this.centered ? "Dialog" : "Popover")}</slot>
          </span>
          <span class="panel-actions"><slot name="actions"></slot></span>
          <button class="close-btn" aria-label="Close popover" @click=${() => this.#close()}>
            <span aria-hidden="true">${iconX(18)}</span>
          </button>
        </div>
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "popover-panel": PopoverPanel;
  }
}
