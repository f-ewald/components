import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { iconUserCircle } from "./icons.js";
import { tokens } from "./tokens.js";

/**
 * Circular avatar. Shows `src` when it loads successfully; falls back to the
 * first letter of `name` (uppercased) if `src` is unset or fails to load
 * (e.g. an expired OAuth profile-photo URL); falls back further to a generic
 * person icon if `name` is also unset. A broken image never leaves a blank
 * circle.
 *
 * @element user-avatar
 */
@customElement("user-avatar")
export class UserAvatar extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: inline-flex;
      }
      .avatar {
        border-radius: 50%;
        /* Match map-circle's 30% white/black vertical depth without tinting images. */
        background: linear-gradient(
          to bottom,
          color-mix(in srgb, var(--ui-primary, #4f46e5) 70%, #ffffff) 0%,
          color-mix(in srgb, var(--ui-primary, #4f46e5) 70%, #000000) 100%
        );
        color: var(--ui-on-accent, #ffffff);
        text-shadow: 0 1px 2px rgb(0 0 0 / 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
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
        font-weight: var(--ui-font-weight-semibold, 600);
        overflow: hidden;
        flex: 0 0 auto;
      }
      img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }
    `,
  ];

  /** Image URL to show. Falls back to initials/icon if unset or it fails to load. */
  @property() src: string | null = null;
  /** Source string for the fallback initial (e.g. a display name or email) — first character, uppercased. */
  @property() name: string | null = null;
  /** Diameter in CSS pixels, or a preset name (`xs`=18, `sm`=24, `md`=32, `lg`=48). */
  @property() size: string | number = 32;

  @state() private _imgError = false;

  private static readonly SIZE_PRESETS: Record<string, number> = {
    xs: 18,
    sm: 24,
    md: 32,
    lg: 48,
  };

  /** Resolves the `size` property (number or preset name) to a pixel diameter. */
  private resolveSize(): number {
    const numeric = Number(this.size);
    if (!Number.isNaN(numeric)) return numeric;
    return UserAvatar.SIZE_PRESETS[String(this.size)] ?? 32;
  }

  protected override willUpdate(changed: Map<string, unknown>) {
    if (changed.has("src")) this._imgError = false;
  }

  override render() {
    const size = this.resolveSize();
    const dim = `${size}px`;
    const showImage = !!this.src && !this._imgError;
    const initial = this.name?.trim()[0]?.toUpperCase();
    return html`
      <span class="avatar" style="width:${dim};height:${dim};font-size:${size * 0.42}px">
        ${showImage
          ? html`<img
              src=${this.src!}
              alt=""
              referrerpolicy="no-referrer"
              @error=${() => (this._imgError = true)}
            />`
          : initial || iconUserCircle(Math.round(size * 0.65))}
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "user-avatar": UserAvatar;
  }
}
