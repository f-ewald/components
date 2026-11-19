import { LitElement, css, html, nothing, type SVGTemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/** Presentation of one kind. `dag-graph`'s `DagNodeKind` satisfies this, so one map can drive both. */
export interface KindIconStyle {
  /** Name of the kind: the visible label with `show-label`, otherwise the icon's accessible name. */
  label?: string;
  /** Icon color (any CSS color); defaults to `--ui-primary`. */
  color?: string;
  /** Icon factory, called with `size` — e.g. one of the package's `icon*` exports. */
  icon?: (size: number) => SVGTemplateResult;
}

/**
 * Inline icon for a named kind (e.g. a service, a library, an external
 * package), looked up in a shared `kinds` map so tables, lists, and search
 * results show the same icon and color as a `dag-graph` legend. With
 * `show-label` the kind's label follows the icon as text; otherwise the
 * icon alone is exposed as an image named by the label. Renders nothing for
 * a kind missing from `kinds`.
 *
 * @element kind-icon
 */
@customElement("kind-icon")
export class KindIcon extends LitElement {
  static override styles = [
    tokens,
    css`
      :host {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        vertical-align: middle;
      }
      :host([hidden]) {
        display: none;
      }
      .icon {
        display: inline-flex;
        flex: 0 0 auto;
        line-height: 0;
        color: var(--kind-icon-color, var(--ui-primary, #4f46e5));
      }
    `,
  ];

  /** Key of the kind to show, looked up in `kinds`. */
  @property({ reflect: true }) kind = "";
  /** Presentation per kind: label, color, and icon. Shareable with `dag-graph`'s `kinds`. */
  @property({ attribute: false }) kinds: Record<string, KindIconStyle> = {};
  /** Square icon size in pixels: 14 inline, 18 standalone. */
  @property({ type: Number }) size: 14 | 18 = 14;
  /** Shows the kind's label as text after the icon. */
  @property({ type: Boolean, reflect: true, attribute: "show-label" }) showLabel = false;

  override render() {
    const style = this.kinds[this.kind];
    if (!style) return nothing;
    const label = style.label ?? "";
    const visibleLabel = this.showLabel && label;
    const named = !visibleLabel && label;
    return html`${style.icon
      ? html`<span
          class="icon"
          style=${style.color ? `--kind-icon-color: ${style.color}` : nothing}
          role=${named ? "img" : nothing}
          aria-label=${named ? label : nothing}
          aria-hidden=${named ? nothing : "true"}
          >${style.icon(this.size)}</span
        >`
      : nothing}${visibleLabel ? html`<span class="label">${label}</span>` : nothing}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-icon": KindIcon;
  }
}
