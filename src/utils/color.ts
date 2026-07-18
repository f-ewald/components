/** Parses a 3- or 6-digit hex color string into 0-255 RGB channels. */
function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

/**
 * Linearly interpolates `base` toward `target` by `weightPercent`% (0-100)
 * in RGB space, returning a 6-digit hex string. Used to derive gradient
 * light/dark stops from a single base color — SVG presentation attributes
 * (`stop-color`) can't consume `color-mix()`/CSS custom properties, so this
 * computes plain hex instead (see CLAUDE.md's SVG token rule).
 */
export function mixHex(base: string, target: string, weightPercent: number): string {
  const b = parseHex(base);
  const t = parseHex(target);
  const w = Math.min(100, Math.max(0, weightPercent)) / 100;
  const mix = (a: number, c: number) => Math.round(a + (c - a) * w);
  const channels = [mix(b.r, t.r), mix(b.g, t.g), mix(b.b, t.b)];
  return `#${channels.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
