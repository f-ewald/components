/**
 * Returns the perceptual luminance of each color stop in a computed two-stop
 * linear gradient.
 */
export function parseGradientLuminances(gradient: string): [number, number] {
  const stops = [
    ...gradient.matchAll(
      /(?:color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)|rgb\((\d+), ?(\d+), ?(\d+))/g,
    ),
  ];
  if (stops.length !== 2) {
    throw new Error(`Expected exactly two gradient stops, got ${stops.length}: ${gradient}`);
  }
  return stops.map(([, r1, g1, b1, r2, g2, b2]) => {
    const [r, g, b] =
      r1 !== undefined
        ? [Number(r1), Number(g1), Number(b1)]
        : [Number(r2) / 255, Number(g2) / 255, Number(b2) / 255];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }) as [number, number];
}
