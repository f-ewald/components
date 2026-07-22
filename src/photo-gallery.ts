import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, queryAssignedElements, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
import type { GalleryItemVariant } from "./gallery-item-variant.js";
import { GalleryItem } from "./gallery-item.js";
import { iconChevronLeft, iconChevronRight } from "./icons.js";
import { tokens } from "./tokens.js";

export type PhotoGalleryObjectFit = "cover" | "contain";
export type PhotoGalleryChangeReason =
  | "autoplay"
  | "indicator"
  | "items"
  | "keyboard"
  | "next"
  | "previous"
  | "programmatic"
  | "swipe";

export interface PhotoGallerySlideChangeDetail {
  previousIndex: number;
  currentIndex: number;
  item: GalleryItem;
  reason: PhotoGalleryChangeReason;
}

const transitionDurationMs = 250;
const swipeThresholdPx = 40;
const booleanAttribute = {
  fromAttribute(value: string | null): boolean {
    return value !== null && value !== "false";
  },
};

/**
 * Responsive, accessible image carousel composed from declarative
 * `gallery-item` children.
 *
 * @element photo-gallery
 * @slot - `gallery-item` elements rendered as slides.
 * @fires slide-change - The active image changed.
 */
@customElement("photo-gallery")
export class PhotoGallery extends LitElement {
  /** Zero-based active image index. */
  @property({ type: Number, attribute: "current-index", reflect: true })
  currentIndex = 0;

  /** Autoplay interval in milliseconds. Set to zero to disable autoplay. */
  @property({ type: Number }) delay = 0;

  /** Whether previous and next buttons are shown. */
  @property({ attribute: "show-controls", converter: booleanAttribute })
  showControls = true;

  /** Whether a current/total counter is shown. */
  @property({ type: Boolean, attribute: "show-counter" })
  showCounter = false;

  /** Whether clickable slide indicators are shown. */
  @property({ type: Boolean, attribute: "show-indicators" })
  showIndicators = false;

  /** Whether autoplay includes a built-in pause/play control. */
  @property({ attribute: "show-autoplay-control", converter: booleanAttribute })
  showAutoplayControl = true;

  /** Whether autoplay is explicitly paused. */
  @property({ type: Boolean, reflect: true })
  paused = false;

  /** CSS aspect ratio used by the image viewport. */
  @property({ attribute: "aspect-ratio" })
  aspectRatio = "16 / 9";

  /** How images fit within the stable viewport. */
  @property({ attribute: "object-fit" })
  objectFit: PhotoGalleryObjectFit = "cover";

  @queryAssignedElements({ selector: "gallery-item" })
  private readonly _galleryItems!: GalleryItem[];

  @state()
  private _previousIndex: number | null = null;

  @state()
  private _itemsVersion = 0;

  private _autoplayTimer?: number;
  private _transitionTimer?: number;
  private _metadataObserver?: MutationObserver;
  private _hovered = false;
  private _focusWithin = false;
  private _nextChangeReason: PhotoGalleryChangeReason | null = null;
  private _pendingChange?: PhotoGallerySlideChangeDetail;
  private _pointerStart?: { id: number; x: number; y: number };
  private _itemsChanged = false;
  private _activeItem?: GalleryItem;
  private _renderedIndex = 0;

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
        font-size: var(--ui-font-size, 0.875rem);
      }
      .gallery {
        outline: none;
      }
      figure {
        margin: 0;
      }
      .viewport {
        position: relative;
        overflow: hidden;
        aspect-ratio: var(--photo-gallery-aspect-ratio, 16 / 9);
        border-radius: var(--ui-radius, 0.5rem);
        background: var(--ui-surface-muted, #f8fafc);
        touch-action: pan-y;
        user-select: none;
      }
      .gallery:focus-visible .viewport {
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .slides {
        display: grid;
        width: 100%;
        height: 100%;
      }
      picture {
        grid-area: 1 / 1;
        display: block;
        width: 100%;
        height: 100%;
      }
      picture img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: var(--photo-gallery-object-fit, cover);
      }
      .entering {
        z-index: 2;
        animation: gallery-fade-in 250ms ease both;
      }
      .leaving {
        z-index: 1;
        pointer-events: none;
        animation: gallery-fade-out 250ms ease both;
      }
      .arrow-controls {
        position: absolute;
        z-index: 3;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem;
        pointer-events: none;
      }
      button {
        border: 0;
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
        cursor: pointer;
      }
      button:focus-visible {
        outline: none;
        box-shadow: var(--ui-focus-ring, 0 0 0 3px rgb(79 70 229 / 0.35));
      }
      .arrow-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        padding: 0;
        color: var(--ui-on-accent, #ffffff);
        background: var(--ui-overlay, rgb(15 23 42 / 0.45));
        border-radius: 9999px;
        pointer-events: auto;
      }
      .arrow-button:hover {
        background: color-mix(in srgb, var(--ui-text, #0f172a) 70%, transparent);
      }
      figcaption {
        padding: 0.5rem 0.25rem 0;
        color: var(--ui-text-muted, #64748b);
      }
      .footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        min-height: 2rem;
        padding-top: 0.5rem;
      }
      .counter {
        color: var(--ui-text-muted, #64748b);
        font-size: var(--ui-font-size-sm, 0.75rem);
        white-space: nowrap;
      }
      .indicators {
        display: flex;
        flex: 1 1 auto;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
      }
      .indicator {
        position: relative;
        width: 2rem;
        height: 2rem;
        padding: 0;
        background: transparent;
        border-radius: 9999px;
      }
      .indicator::before {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0.625rem;
        height: 0.625rem;
        background: var(--ui-border, #e2e8f0);
        border-radius: 9999px;
        content: "";
        transform: translate(-50%, -50%);
      }
      .indicator[aria-current="true"]::before {
        background: var(--ui-primary, #4f46e5);
      }
      .autoplay-button {
        height: 2rem;
        box-sizing: border-box;
        padding: 0.25rem 0.5rem;
        color: var(--ui-text, #0f172a);
        background: var(--ui-surface-muted, #f8fafc);
        border: 1px solid var(--ui-border, #e2e8f0);
        border-radius: var(--ui-radius-sm, 0.25rem);
        font-size: var(--ui-font-size-sm, 0.75rem);
        line-height: var(--ui-line-height-tight, 1.25);
        white-space: nowrap;
      }
      .autoplay-button:hover {
        background: var(--ui-surface, #ffffff);
      }
      slot {
        display: none;
      }
      @keyframes gallery-fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes gallery-fade-out {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .entering,
        .leaving {
          animation: none;
        }
      }
    `,
  ];

  /** Starts observers and autoplay integration when the element connects. */
  override connectedCallback(): void {
    super.connectedCallback();
    this._metadataObserver ??= new MutationObserver(() => this._handleMetadataChange());
    this._metadataObserver.observe(this, {
      attributes: true,
      attributeFilter: ["alt", "caption", "media", "src", "srcset"],
      childList: true,
      subtree: true,
    });
    document.addEventListener("visibilitychange", this._handleVisibilityChange);
  }

  /** Releases timers and observers when the element disconnects. */
  override disconnectedCallback(): void {
    this._clearAutoplay();
    this._clearTransition();
    this._metadataObserver?.disconnect();
    document.removeEventListener("visibilitychange", this._handleVisibilityChange);
    super.disconnectedCallback();
  }

  /** Normalizes external index changes before rendering. */
  protected override willUpdate(changed: PropertyValues<this>): void {
    if (!changed.has("currentIndex")) return;

    const normalized = this._normalizeIndex(this.currentIndex);
    if (normalized !== this.currentIndex) {
      this.currentIndex = normalized;
    }

    const previousValue = changed.get("currentIndex");
    if (previousValue === undefined || this._galleryItems.length === 0) {
      this._nextChangeReason = null;
      return;
    }

    const previousIndex = this._normalizeIndex(Number(previousValue));
    if (previousIndex === normalized) {
      this._nextChangeReason = null;
      return;
    }

    const reason = this._nextChangeReason ?? "programmatic";
    this._previousIndex = reason === "items" ? null : previousIndex;
    this._pendingChange = {
      previousIndex,
      currentIndex: normalized,
      item: this._galleryItems[normalized],
      reason,
    };
    this._nextChangeReason = null;
  }

  /** Emits completed changes and keeps autoplay synchronized with properties. */
  protected override updated(changed: PropertyValues<this>): void {
    if (this._pendingChange) {
      this.dispatchEvent(
        new CustomEvent<PhotoGallerySlideChangeDetail>("slide-change", {
          bubbles: true,
          composed: true,
          detail: this._pendingChange,
        }),
      );
      this._pendingChange = undefined;
      this._scheduleTransitionCleanup();
    }

    if (changed.has("currentIndex") || changed.has("delay") || changed.has("paused") || this._itemsChanged) {
      this._itemsChanged = false;
      this._restartAutoplay();
    }
    this._activeItem = this._galleryItems[this.currentIndex];
    this._renderedIndex = this.currentIndex;
  }

  /** Wraps any requested index into the current item range. */
  private _normalizeIndex(index: number): number {
    const count = this._galleryItems.length;
    if (count === 0 || !Number.isFinite(index)) return 0;
    return ((Math.trunc(index) % count) + count) % count;
  }

  /** Returns responsive variants declared directly under an item. */
  private _variantsFor(item: GalleryItem): GalleryItemVariant[] {
    return Array.from(item.children).filter(
      (child): child is GalleryItemVariant => child.tagName.toLowerCase() === "gallery-item-variant",
    );
  }

  /** Changes slides through the shared state and event path. */
  private _goTo(index: number, reason: PhotoGalleryChangeReason): void {
    const normalized = this._normalizeIndex(index);
    if (this._galleryItems.length < 2 || normalized === this.currentIndex) {
      this._restartAutoplay();
      return;
    }

    this._nextChangeReason = reason;
    this.currentIndex = normalized;
  }

  /** Moves to the previous image. */
  private _showPrevious(reason: PhotoGalleryChangeReason = "previous"): void {
    this._goTo(this.currentIndex - 1, reason);
  }

  /** Moves to the next image. */
  private _showNext(reason: PhotoGalleryChangeReason = "next"): void {
    this._goTo(this.currentIndex + 1, reason);
  }

  /** Toggles explicit autoplay pause state. */
  private _togglePaused(): void {
    this.paused = !this.paused;
  }

  /** Clears and conditionally schedules the next autoplay advance. */
  private _restartAutoplay(): void {
    this._clearAutoplay();
    if (!this._canAutoplay()) return;

    this._autoplayTimer = window.setTimeout(() => {
      this._showNext("autoplay");
    }, this.delay);
  }

  /** Reports whether autoplay may currently schedule a transition. */
  private _canAutoplay(): boolean {
    return (
      this.delay > 0 &&
      this._galleryItems.length > 1 &&
      !this.paused &&
      !this._hovered &&
      !this._focusWithin &&
      !document.hidden
    );
  }

  /** Clears the pending autoplay timeout. */
  private _clearAutoplay(): void {
    if (this._autoplayTimer === undefined) return;
    window.clearTimeout(this._autoplayTimer);
    this._autoplayTimer = undefined;
  }

  /** Removes the outgoing crossfade layer after the animation completes. */
  private _scheduleTransitionCleanup(): void {
    this._clearTransition();
    this._transitionTimer = window.setTimeout(() => {
      this._previousIndex = null;
      this._transitionTimer = undefined;
    }, transitionDurationMs);
  }

  /** Clears pending transition cleanup. */
  private _clearTransition(): void {
    if (this._transitionTimer === undefined) return;
    window.clearTimeout(this._transitionTimer);
    this._transitionTimer = undefined;
  }

  /** Refreshes item metadata and clamps the active index after light-DOM changes. */
  private _handleMetadataChange(): void {
    this._itemsChanged = true;
    this._itemsVersion += 1;
    const preserveActiveItem = this.currentIndex === this._renderedIndex;
    const preservedIndex =
      preserveActiveItem && this._activeItem ? this._galleryItems.indexOf(this._activeItem) : -1;
    const normalized = preservedIndex >= 0 ? preservedIndex : this._normalizeIndex(this.currentIndex);
    if (normalized === this.currentIndex) {
      const item = this._galleryItems[normalized];
      const activeItemRemoved = Boolean(this._activeItem && !this._galleryItems.includes(this._activeItem));
      if (item && activeItemRemoved) {
        this._previousIndex = null;
        this._pendingChange = {
          previousIndex: this._renderedIndex,
          currentIndex: normalized,
          item,
          reason: "items",
        };
      }
      return;
    }
    this._nextChangeReason = "items";
    this.currentIndex = normalized;
  }

  /** Refreshes item state after the default slot changes. */
  private _handleSlotChange(): void {
    this._handleMetadataChange();
  }

  /** Temporarily pauses autoplay while the pointer is over the gallery. */
  private _handleMouseEnter(): void {
    this._hovered = true;
    this._restartAutoplay();
  }

  /** Resumes autoplay with a fresh delay after hover ends. */
  private _handleMouseLeave(): void {
    this._hovered = false;
    this._restartAutoplay();
  }

  /** Temporarily pauses autoplay while focus is inside the gallery. */
  private _handleFocusIn(): void {
    this._focusWithin = true;
    this._restartAutoplay();
  }

  /** Resumes autoplay with a fresh delay after focus leaves the gallery. */
  private _handleFocusOut(): void {
    queueMicrotask(() => {
      this._focusWithin = this.matches(":focus-within");
      this._restartAutoplay();
    });
  }

  /** Pauses or resumes scheduling when page visibility changes. */
  private readonly _handleVisibilityChange = (): void => {
    this._restartAutoplay();
  };

  /** Handles Left and Right arrow keyboard navigation. */
  private _handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      this._showPrevious("keyboard");
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      this._showNext("keyboard");
    }
  }

  /** Records the starting point of a primary pointer gesture. */
  private _handlePointerDown(event: PointerEvent): void {
    if (!event.isPrimary || event.button !== 0) return;
    if (event.composedPath().some((target) => target instanceof HTMLButtonElement)) return;
    this._pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  /** Converts a sufficiently horizontal pointer gesture into navigation. */
  private _handlePointerUp(event: PointerEvent): void {
    const start = this._pointerStart;
    this._pointerStart = undefined;
    if (!start || start.id !== event.pointerId) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < swipeThresholdPx || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    event.preventDefault();
    if (deltaX < 0) {
      this._showNext("swipe");
      return;
    }
    this._showPrevious("swipe");
  }

  /** Cancels an incomplete pointer gesture. */
  private _handlePointerCancel(): void {
    this._pointerStart = undefined;
  }

  /** Renders one responsive image layer for the crossfade stack. */
  private _renderPicture(index: number, state: "current" | "previous") {
    const item = this._galleryItems[index];
    if (!item) return nothing;

    const isPrevious = state === "previous";
    const transitionClass = this._previousIndex === null ? "" : isPrevious ? "leaving" : "entering";
    return html`
      <picture class=${transitionClass} aria-hidden=${isPrevious ? "true" : nothing}>
        ${this._variantsFor(item)
          .filter((variant) => variant.srcset)
          .map(
            (variant) =>
              html`<source media=${ifDefined(variant.media || undefined)} srcset=${variant.srcset} />`,
          )}
        <img src=${item.src} alt=${isPrevious ? "" : item.alt} draggable="false" />
      </picture>
    `;
  }

  /** Renders enabled counter, indicator, and autoplay controls. */
  private _renderFooter(itemCount: number) {
    const showIndicators = this.showIndicators && itemCount > 1;
    const showAutoplay = this.showAutoplayControl && this.delay > 0 && itemCount > 1;
    if (!this.showCounter && !showIndicators && !showAutoplay) return nothing;

    return html`
      <div class="footer">
        ${this.showCounter
          ? html`<span class="counter">${this.currentIndex + 1} / ${itemCount}</span>`
          : nothing}
        ${showIndicators
          ? html`
              <div class="indicators" role="group" aria-label="Choose image">
                ${this._galleryItems.map(
                  (_item, index) => html`
                    <button
                      class="indicator"
                      type="button"
                      aria-label="Show image ${index + 1} of ${itemCount}"
                      aria-current=${String(index === this.currentIndex)}
                      @click=${() => this._goTo(index, "indicator")}
                    ></button>
                  `,
                )}
              </div>
            `
          : nothing}
        ${showAutoplay
          ? html`
              <button
                class="autoplay-button"
                type="button"
                aria-label=${this.paused ? "Resume slideshow" : "Pause slideshow"}
                @click=${this._togglePaused}
              >
                ${this.paused ? "Play" : "Pause"}
              </button>
            `
          : nothing}
      </div>
    `;
  }

  /** Renders the active image, navigation, caption, and hidden metadata slot. */
  protected override render() {
    const itemCount = this._galleryItems.length;
    const currentItem = this._galleryItems[this.currentIndex];
    const objectFit: PhotoGalleryObjectFit = this.objectFit === "contain" ? "contain" : "cover";
    const viewportStyles = {
      "--photo-gallery-aspect-ratio": this.aspectRatio.trim() || "16 / 9",
      "--photo-gallery-object-fit": objectFit,
    };

    return html`
      <div
        class="gallery"
        role="region"
        aria-roledescription="carousel"
        aria-label="Photo gallery"
        tabindex="0"
        @keydown=${this._handleKeyDown}
        @mouseenter=${this._handleMouseEnter}
        @mouseleave=${this._handleMouseLeave}
        @focusin=${this._handleFocusIn}
        @focusout=${this._handleFocusOut}
      >
        ${currentItem
          ? html`
              <figure>
                <div
                  class="viewport"
                  style=${styleMap(viewportStyles)}
                  @pointerdown=${this._handlePointerDown}
                  @pointerup=${this._handlePointerUp}
                  @pointercancel=${this._handlePointerCancel}
                >
                  <div class="slides">
                    ${this._previousIndex === null
                      ? nothing
                      : this._renderPicture(this._previousIndex, "previous")}
                    ${this._renderPicture(this.currentIndex, "current")}
                  </div>
                  ${this.showControls && itemCount > 1
                    ? html`
                        <div class="arrow-controls">
                          <button
                            class="arrow-button previous"
                            type="button"
                            aria-label="Previous image"
                            @click=${() => this._showPrevious()}
                          >
                            ${iconChevronLeft(18)}
                          </button>
                          <button
                            class="arrow-button next"
                            type="button"
                            aria-label="Next image"
                            @click=${() => this._showNext()}
                          >
                            ${iconChevronRight(18)}
                          </button>
                        </div>
                      `
                    : nothing}
                </div>
                ${currentItem.caption ? html`<figcaption>${currentItem.caption}</figcaption>` : nothing}
              </figure>
              ${this._renderFooter(itemCount)}
            `
          : nothing}
        <slot @slotchange=${this._handleSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "photo-gallery": PhotoGallery;
  }
}
