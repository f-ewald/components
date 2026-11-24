/**
 * Motion shared by the decorative backgrounds (`particle-background`,
 * `blur-background`): a focus point that wanders on its own or eases toward
 * the pointer, in 0–1 units of the host's box with y pointing down.
 */

/** How a background's focus point moves. */
export type WanderMode = "drift" | "follow";

/** A position in 0–1 units of the host's box. */
export type WanderPoint = [number, number];

/** Easing rates (per second) toward the drift path and toward the pointer. */
const DRIFT_RATE = 0.8;
const FOLLOW_RATE = 2.4;

/** A smooth, never-repeating path across the middle of the host. */
export function driftTarget(time: number): WanderPoint {
  return [
    0.5 + 0.3 * Math.sin(time * 0.21) + 0.1 * Math.sin(time * 0.53 + 1.7),
    0.5 + 0.25 * Math.sin(time * 0.17 + 0.6) + 0.1 * Math.cos(time * 0.41),
  ];
}

/**
 * Advances `from` by `dt` seconds: toward `pointer` when given, otherwise
 * toward the drift path at `time`.
 */
export function wanderStep(from: WanderPoint, time: number, dt: number, pointer?: WanderPoint): WanderPoint {
  const target = pointer ?? driftTarget(time);
  const k = 1 - Math.exp(-dt * (pointer ? FOLLOW_RATE : DRIFT_RATE));
  return [from[0] + (target[0] - from[0]) * k, from[1] + (target[1] - from[1]) * k];
}

/** Mean focus radius, in units of the host's shorter side. */
const MEAN_RADIUS = 0.36;

/** The focus radius at `time`, in units of the host's shorter side; breathes around its mean. */
export function pulseRadius(time: number): number {
  return MEAN_RADIUS + Math.sin(time) * 0.06 + Math.cos(time * 3) * 0.04;
}

/** The same breathing as a scale factor around 1, with `depth` scaling its amplitude. */
export function pulseScale(time: number, depth = 1): number {
  return 1 + depth * (pulseRadius(time) / MEAN_RADIUS - 1);
}

/** Tracks the pointer anywhere in the window and reports it relative to a host. */
export class PointerWatch {
  private _point?: { x: number; y: number };

  constructor(private readonly _host: Element) {}

  /** Starts or stops listening; stopping forgets the pointer. */
  track(on: boolean): void {
    if (on) {
      window.addEventListener("pointermove", this._onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", this._onLeave);
      return;
    }
    window.removeEventListener("pointermove", this._onMove);
    document.documentElement.removeEventListener("pointerleave", this._onLeave);
    this._point = undefined;
  }

  /** The pointer in 0–1 host units, or `undefined` when it is outside the host. */
  target(): WanderPoint | undefined {
    if (!this._point) return undefined;
    const { left, top, width, height } = this._host.getBoundingClientRect();
    if (width === 0 || height === 0) return undefined;
    const x = (this._point.x - left) / width;
    const y = (this._point.y - top) / height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return undefined;
    return [x, y];
  }

  private readonly _onMove = (event: PointerEvent): void => {
    this._point = { x: event.clientX, y: event.clientY };
  };

  private readonly _onLeave = (): void => {
    this._point = undefined;
  };
}
