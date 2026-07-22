import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "./tokens.js";

/** Platform mode used to render modifier keys. */
export type KbdPlatform = "auto" | "mac" | "other";

/** Visual and spoken representations of one shortcut key. */
interface KeyRender {
  label: string;
  name: string;
}

/**
 * Detects macOS via User-Agent Client Hints when available, with legacy
 * navigator fields as fallbacks.
 */
function detectMac(): boolean {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof navigator === "undefined"
  ) {
    return false;
  }
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const source = nav.userAgentData?.platform || nav.platform || nav.userAgent || "";
  return /mac/i.test(source);
}

/**
 * Maps one case-insensitive shortcut token to its visual keycap and spoken
 * name. Unknown tokens remain literal; single letters are uppercased.
 */
function keyLabel(raw: string, mac: boolean): KeyRender {
  switch (raw.trim().toLowerCase()) {
    case "mod":
      return mac ? { label: "⌘", name: "Command" } : { label: "Ctrl", name: "Control" };
    case "cmd":
    case "command":
      return mac ? { label: "⌘", name: "Command" } : { label: "Cmd", name: "Command" };
    case "meta":
      return mac ? { label: "⌘", name: "Command" } : { label: "Meta", name: "Meta" };
    case "super":
      return mac ? { label: "⌘", name: "Command" } : { label: "Super", name: "Super" };
    case "win":
    case "windows":
      return { label: "Win", name: "Windows" };
    case "ctrl":
    case "control":
      return mac ? { label: "⌃", name: "Control" } : { label: "Ctrl", name: "Control" };
    case "alt":
    case "opt":
    case "option":
      return mac ? { label: "⌥", name: "Option" } : { label: "Alt", name: "Alt" };
    case "shift":
      return mac ? { label: "⇧", name: "Shift" } : { label: "Shift", name: "Shift" };
    case "enter":
    case "return":
      return { label: "⏎", name: "Enter" };
    case "tab":
      return { label: "⇥", name: "Tab" };
    case "backspace":
      return { label: "⌫", name: "Backspace" };
    case "delete":
    case "del":
      return { label: "⌦", name: "Delete" };
    case "esc":
    case "escape":
      return { label: "Esc", name: "Escape" };
    case "space":
    case "spacebar":
      return { label: "Space", name: "Space" };
    case "up":
    case "arrowup":
      return { label: "↑", name: "Up arrow" };
    case "down":
    case "arrowdown":
      return { label: "↓", name: "Down arrow" };
    case "left":
    case "arrowleft":
      return { label: "←", name: "Left arrow" };
    case "right":
    case "arrowright":
      return { label: "→", name: "Right arrow" };
    case "pageup":
      return { label: "PgUp", name: "Page Up" };
    case "pagedown":
      return { label: "PgDn", name: "Page Down" };
    default: {
      const token = raw.trim();
      const label = token.length === 1 ? token.toUpperCase() : token;
      return { label, name: label };
    }
  }
}

/**
 * Renders a keyboard shortcut as one boxed keycap per `+`-separated token.
 * Modifier keys are platform-aware: `Mod` becomes Command on macOS and
 * Control elsewhere. Keycaps derive their presentation from `currentColor`,
 * so the hint works inside neutral and accent-colored controls.
 *
 * @element kbd-hint
 */
@customElement("kbd-hint")
export class KbdHint extends LitElement {
  /** Shortcut as case-insensitive, `+`-separated tokens, e.g. `"Mod+Enter"`. */
  @property() keys = "";

  /** Platform override; `auto` detects macOS from the browser. */
  @property() platform: KbdPlatform = "auto";

  static override styles = [
    tokens,
    css`
      :host {
        display: inline-flex;
        vertical-align: middle;
      }
      .wrap {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }
      kbd {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        min-width: 1.25em;
        height: 1.5em;
        padding: 0 0.25rem;
        color: currentColor;
        background: color-mix(in srgb, currentColor 14%, transparent);
        border: 1px solid color-mix(in srgb, currentColor 38%, transparent);
        border-radius: var(--ui-radius-sm, 0.25rem);
        font-family: var(
          --ui-font-mono,
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          monospace
        );
        font-size: var(--ui-font-size-xs, 0.6875rem);
        line-height: 1;
      }
    `,
  ];

  /** Whether modifier aliases should use macOS glyphs. */
  private get isMac(): boolean {
    if (this.platform === "mac") return true;
    if (this.platform === "other") return false;
    return detectMac();
  }

  /** Parses the shortcut into visual/spoken key descriptors. */
  private get parsedKeys(): KeyRender[] {
    const mac = this.isMac;
    return (this.keys ?? "")
      .split("+")
      .map((token) => token.trim())
      .filter(Boolean)
      .map((token) => keyLabel(token, mac));
  }

  /** Renders nothing for an empty shortcut, otherwise an accessible keycap group. */
  override render() {
    const parsedKeys = this.parsedKeys;
    if (parsedKeys.length === 0) return html``;
    const label = parsedKeys.map((key) => key.name).join(" ");
    return html`
      <span class="wrap" role="img" aria-label=${label}>
        ${parsedKeys.map((key) => html`<kbd aria-hidden="true">${key.label}</kbd>`)}
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "kbd-hint": KbdHint;
  }
}
